import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ROWS = 3;
const COLS = 5;
const TOTAL_CELLS = ROWS * COLS;
const BOMBS = 3;

type ResultType = "idle" | "playing" | "win" | "lose";

export default function GhostLineGame({ navigation, route }: any) {
  const [credits, setCredits] = useState<number>(
    route.params?.credits !== undefined ? Number(route.params.credits) : 200
  );

  const [bet, setBet] = useState<number>(10);
  const [inRound, setInRound] = useState<boolean>(false);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [bombs, setBombs] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>(
    Array(TOTAL_CELLS).fill(false)
  );
  const [safeRevealed, setSafeRevealed] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [result, setResult] = useState<ResultType>("idle");

  // Animaciones
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cellAnims = useRef(
    Array.from({ length: TOTAL_CELLS }, () => new Animated.Value(1))
  ).current;

  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    
    // Animación de flotación
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de brillo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulso para multiplicador
    if (inRound) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [inRound]);

  const generateBombs = (): number[] => {
    const set = new Set<number>();
    while (set.size < BOMBS) {
      const idx = Math.floor(Math.random() * TOTAL_CELLS);
      set.add(idx);
    }
    return Array.from(set);
  };

  const resetBoard = () => {
    setBombs([]);
    setRevealed(Array(TOTAL_CELLS).fill(false));
    setSafeRevealed(0);
    setMultiplier(1);
    setResult("idle");
    setCurrentBet(0);
    setInRound(false);
  };

  const startRound = () => {
    if (inRound) {
      Alert.alert(
        "🎮 Ronda en curso",
        "Debes terminar la ronda actual primero"
      );
      return;
    }

    if (bet <= 0) {
      Alert.alert("❌ Apuesta inválida", "La apuesta debe ser mayor a 0");
      return;
    }

    if (bet > credits) {
      Alert.alert(
        "💰 Créditos insuficientes",
        "No tienes suficientes créditos para esa apuesta"
      );
      return;
    }

    const newBombs = generateBombs();

    setCredits((prev) => prev - bet);
    setBombs(newBombs);
    setRevealed(Array(TOTAL_CELLS).fill(false));
    setSafeRevealed(0);
    setMultiplier(1);
    setCurrentBet(bet);
    setInRound(true);
    setResult("playing");

    // Resetear animaciones de celdas
    cellAnims.forEach((anim) => anim.setValue(1));
  };

  const animateCell = (index: number) => {
    Animated.sequence([
      Animated.timing(cellAnims[index], {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cellAnims[index], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCellPress = (index: number) => {
    if (!inRound) return;
    if (revealed[index]) return;

    animateCell(index);

    const isBomb = bombs.includes(index);
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (isBomb) {
      setResult("lose");
      setInRound(false);
      const bombsRevealed = [...newRevealed];
      bombs.forEach((b) => {
        bombsRevealed[b] = true;
      });
      setRevealed(bombsRevealed);
      setTimeout(() => {
        Alert.alert("💥 ¡BOOM!", "Encontraste una bomba. Perdiste tu apuesta.");
      }, 300);
      return;
    }

    const newSafe = safeRevealed + 1;
    setSafeRevealed(newSafe);

    const newMultiplier = Number((1 + newSafe * 0.35).toFixed(2));
    setMultiplier(newMultiplier);

    if (newSafe >= TOTAL_CELLS - BOMBS) {
      handleCashout(true);
    }
  };

  const handleCashout = (auto = false) => {
    if (!inRound || currentBet <= 0) return;

    const winAmount = Math.floor(currentBet * multiplier);

    setCredits((prev) => prev + winAmount);
    setResult("win");
    setInRound(false);

    if (!auto) {
      setTimeout(() => {
        Alert.alert(
          "🎉 ¡Cobro exitoso!",
          `Apuesta: $${currentBet}\nMultiplicador: x${multiplier}\nGanancia: $${winAmount}`
        );
      }, 200);
    }
  };

  const handleAdjustBet = (amount: number) => {
    if (inRound) return;
    setBet((prev) => {
      const next = prev + amount;
      if (next < 5) return 5;
      if (next > credits) return credits || 5;
      return next;
    });
  };

  const setBetAmount = (amount: number) => {
    if (inRound) return;
    if (amount > credits) {
      setBet(credits);
    } else {
      setBet(amount);
    }
  };

  const goBack = () => {
    if (inRound) {
      Alert.alert(
        "⚠️ Ronda activa",
        "¿Quieres salir? Perderás tu apuesta actual.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Salir",
            style: "destructive",
            onPress: () => {
              resetBoard();
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const potentialCashout =
    inRound && currentBet > 0 ? Math.floor(currentBet * multiplier) : 0;

  const CELL_SIZE = (SCREEN_WIDTH - 80) / COLS;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0f", "#151520", "#1a1a2e"]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <LinearGradient
              colors={["#ff6b35", "#f7931e"]}
              style={styles.backGradient}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.balanceContainer,
              {
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#ffd700", "#ffed4e"]}
              style={styles.balanceGradient}
            >
              <Ionicons name="wallet" size={20} color="#1a1a2e" />
              <Text style={styles.balanceText}>{credits}</Text>
            </LinearGradient>
          </Animated.View>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() =>
              Alert.alert(
                "ℹ️ Cómo jugar",
                "• Configura tu apuesta\n• Destapa casillas sin bombas\n• Cada casilla segura aumenta el multiplicador (+0.35x)\n• Cobra cuando quieras\n• Hay 3 bombas ocultas en 15 casillas\n\n¡Buena suerte! 🍀"
              )
            }
          >
            <LinearGradient
              colors={["#4a90e2", "#357abd"]}
              style={styles.infoGradient}
            >
              <Ionicons name="information-circle" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Título */}
        <Animated.View
          style={[
            styles.titleSection,
            {
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.02],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.gameTitle}>💣 GHOST LINE</Text>
          <Text style={styles.gameSubtitle}>Juego de Bombas</Text>
        </Animated.View>

        {/* Estado del juego */}
        <View style={styles.statusSection}>
          {inRound ? (
            <LinearGradient
              colors={["#1e293b", "#334155"]}
              style={styles.statusCard}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>APUESTA</Text>
                  <Text style={styles.statValue}>${currentBet}</Text>
                </View>

                <Animated.View
                  style={[
                    styles.statItem,
                    styles.multiplierBox,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Text style={styles.statLabel}>MULTIPLICADOR</Text>
                  <Text style={[styles.statValue, styles.multiplierText]}>
                    x{multiplier}
                  </Text>
                </Animated.View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>SEGURAS</Text>
                  <Text style={styles.statValue}>
                    {safeRevealed}/{TOTAL_CELLS - BOMBS}
                  </Text>
                </View>
              </View>

              <View style={styles.potentialWinBox}>
                <Text style={styles.potentialLabel}>PUEDES GANAR</Text>
                <Text style={styles.potentialValue}>${potentialCashout}</Text>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={["#1e293b", "#334155"]}
              style={styles.statusCard}
            >
              <View style={styles.idleState}>
                {result === "win" && (
                  <>
                    <Text style={styles.resultEmoji}>🎉</Text>
                    <Text style={styles.resultTitle}>¡GANASTE!</Text>
                  </>
                )}
                {result === "lose" && (
                  <>
                    <Text style={styles.resultEmoji}>💥</Text>
                    <Text style={styles.resultTitle}>BOMBA</Text>
                  </>
                )}
                {result === "idle" && (
                  <>
                    <Text style={styles.resultEmoji}>🎮</Text>
                    <Text style={styles.resultTitle}>LISTO PARA JUGAR</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Controles de apuesta */}
        {!inRound && (
          <View style={styles.betSection}>
            <Text style={styles.betTitle}>APUESTA</Text>

            {/* Presets */}
            <View style={styles.presetRow}>
              {[10, 25, 50, 100].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.presetButton}
                  onPress={() => setBetAmount(amount)}
                >
                  <LinearGradient
                    colors={
                      bet === amount
                        ? ["#ff6b35", "#f7931e"]
                        : ["#2d3748", "#1a202c"]
                    }
                    style={styles.presetGradient}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        bet === amount && styles.presetTextActive,
                      ]}
                    >
                      ${amount}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Control manual */}
            <View style={styles.betControls}>
              <TouchableOpacity
                style={styles.betAdjust}
                onPress={() => handleAdjustBet(-10)}
              >
                <LinearGradient
                  colors={["#2d3748", "#1a202c"]}
                  style={styles.betAdjustGrad}
                >
                  <Text style={styles.betAdjustText}>-10</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.betAdjust}
                onPress={() => handleAdjustBet(-5)}
              >
                <LinearGradient
                  colors={["#2d3748", "#1a202c"]}
                  style={styles.betAdjustGrad}
                >
                  <Text style={styles.betAdjustText}>-5</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.betDisplayBox}>
                <LinearGradient
                  colors={["#ff6b35", "#f7931e"]}
                  style={styles.betDisplayGrad}
                >
                  <Text style={styles.betDisplayText}>${bet}</Text>
                </LinearGradient>
              </View>

              <TouchableOpacity
                style={styles.betAdjust}
                onPress={() => handleAdjustBet(5)}
              >
                <LinearGradient
                  colors={["#2d3748", "#1a202c"]}
                  style={styles.betAdjustGrad}
                >
                  <Text style={styles.betAdjustText}>+5</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.betAdjust}
                onPress={() => handleAdjustBet(10)}
              >
                <LinearGradient
                  colors={["#2d3748", "#1a202c"]}
                  style={styles.betAdjustGrad}
                >
                  <Text style={styles.betAdjustText}>+10</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Grid de bombas */}
        <View style={styles.gridSection}>
          <Text style={styles.gridTitle}>
            {BOMBS} BOMBAS OCULTAS EN {TOTAL_CELLS} CASILLAS
          </Text>
          <View style={[styles.grid, { width: COLS * (CELL_SIZE + 8) }]}>
            {Array.from({ length: TOTAL_CELLS }).map((_, index) => {
              const isBomb = bombs.includes(index);
              const isRevealed = revealed[index];

              let cellColors = ["#2d3748", "#1a202c"];
              let cellContent = (
                <Text style={styles.cellQuestion}>?</Text>
              );

              if (isRevealed && isBomb) {
                cellColors = ["#dc2626", "#991b1b"];
                cellContent = <Text style={styles.cellEmoji}>💣</Text>;
              } else if (isRevealed && !isBomb) {
                cellColors = ["#10b981", "#059669"];
                cellContent = <Text style={styles.cellEmoji}>✨</Text>;
              }

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.cellWrapper,
                    { transform: [{ scale: cellAnims[index] }] },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
                    onPress={() => handleCellPress(index)}
                    disabled={!inRound || isRevealed}
                    activeOpacity={0.7}
                  >
                    <LinearGradient colors={cellColors} style={styles.cellGradient}>
                      {cellContent}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Botón principal */}
        <View style={styles.actionSection}>
          {!inRound ? (
            <TouchableOpacity
              style={styles.mainButton}
              onPress={startRound}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                style={styles.mainButtonGrad}
              >
                <Ionicons name="play" size={28} color="#fff" />
                <Text style={styles.mainButtonText}>INICIAR RONDA</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.mainButton,
                safeRevealed === 0 && styles.mainButtonDisabled,
              ]}
              onPress={() => handleCashout(false)}
              disabled={safeRevealed === 0}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  safeRevealed === 0
                    ? ["#4b5563", "#374151"]
                    : ["#fbbf24", "#f59e0b"]
                }
                style={styles.mainButtonGrad}
              >
                <Ionicons name="cash" size={28} color="#fff" />
                <Text style={styles.mainButtonText}>
                  COBRAR ${potentialCashout}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
  },
  backGradient: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceContainer: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
  },
  balanceGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  balanceText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1a1a2e",
  },
  infoButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
  },
  infoGradient: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 2,
    textShadowColor: "rgba(255,255,255,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  gameSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 4,
  },
  statusSection: {
    marginBottom: 20,
  },
  statusCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  multiplierBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "900",
  },
  multiplierText: {
    color: "#10b981",
  },
  potentialWinBox: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  potentialLabel: {
    fontSize: 11,
    color: "#fbbf24",
    fontWeight: "700",
    marginBottom: 4,
  },
  potentialValue: {
    fontSize: 28,
    color: "#fbbf24",
    fontWeight: "900",
  },
  idleState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 1,
  },
  betSection: {
    marginBottom: 20,
  },
  betTitle: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 2,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
  },
  presetGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  presetText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "800",
  },
  presetTextActive: {
    color: "#fff",
  },
  betControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  betAdjust: {
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
  },
  betAdjustGrad: {
    width: 50,
    paddingVertical: 12,
    alignItems: "center",
  },
  betAdjustText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "800",
  },
  betDisplayBox: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
  },
  betDisplayGrad: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  betDisplayText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "900",
  },
  gridSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  gridTitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 16,
  },
  cellWrapper: {
    borderRadius: 12,
  },
  cell: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
  },
  cellGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cellQuestion: {
    fontSize: 32,
    color: "#475569",
    fontWeight: "900",
  },
  cellEmoji: {
    fontSize: 36,
  },
  actionSection: {
    marginBottom: 30,
  },
  mainButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
  },
  mainButtonDisabled: {
    opacity: 0.5,
  },
  mainButtonGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
  },
  mainButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 1,
  },
});