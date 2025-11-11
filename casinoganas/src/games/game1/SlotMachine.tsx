import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const { width } = Dimensions.get("window");

const symbols = ["🍒", "🍋", "🍉", "⭐", "💎", "7️⃣"];

const payouts = {
  "💎": 100,
  "7️⃣": 75,
  "⭐": 50,
  "🍉": 30,
  "🍋": 20,
  "🍒": 10,
};

export default function SlotMachine({ navigation }: any) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [bet, setBet] = useState<number>(10);
  const [result, setResult] = useState<string[]>(["🍒", "🍋", "🍉"]);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [loading, setLoading] = useState(true);

  const [totalWins, setTotalWins] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [biggestWin, setBiggestWin] = useState(0);

  const reelAnim = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const flashAnim = useRef(new Animated.Value(0)).current;
  const winAnim = useRef(new Animated.Value(0)).current;
  const coinsAnim = useRef(new Animated.Value(0)).current;

  // 🟡 Cargar balance real desde Supabase
  useEffect(() => {
    const loadBalance = async () => {
      if (!user?.id) return;
      try {
        const data = await getUserBalance(user.id);
        setCredits(Number(data.balance || 0));
        setTotalWins(data.total_winnings || 0);
        setGamesPlayed(data.total_games_played || 0);
        setBiggestWin(data.biggest_win || 0);
      } catch (err) {
        console.error("Error al cargar balance:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBalance();

    const unsubscribe = navigation.addListener("focus", loadBalance);
    return unsubscribe;
  }, [user?.id, navigation]);

  // 🎞️ Animaciones
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const flashOpacity = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const coinsScale = coinsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });
  const coinsOpacity = coinsAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });
  const scaleWin = winAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const spinReel = (index: number, finalSymbol: string) => {
    return new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(reelAnim[index], {
          toValue: -100 * 15,
          duration: 1000 + index * 200,
          useNativeDriver: true,
        }),
        Animated.timing(reelAnim[index], {
          toValue: -100 * symbols.indexOf(finalSymbol),
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });
  };

  const animateCoins = () => {
    Animated.sequence([
      Animated.timing(coinsAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(coinsAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const spinAll = async () => {
    if (spinning || credits < bet) {
      if (credits < bet) {
        Alert.alert(
          "Sin Créditos",
          "No tienes suficientes créditos. ¿Deseas recargar?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Recargar", onPress: () => navigation.navigate("Home") },
          ]
        );
      }
      return;
    }

    setSpinning(true);
    const newCredits = credits - bet;
    setCredits(newCredits);
    setLastWin(0);
    setGamesPlayed((prev) => prev + 1);

    const finalResults = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    await Promise.all([
      spinReel(0, finalResults[0]),
      spinReel(1, finalResults[1]),
      spinReel(2, finalResults[2]),
    ]);

    setResult(finalResults);
    await checkWin(finalResults, newCredits);
    setSpinning(false);
  };

  const checkWin = async (finalResults: string[], currentBalance: number) => {
    let winAmount = 0;

    if (finalResults[0] === finalResults[1] && finalResults[1] === finalResults[2]) {
      const symbol = finalResults[0];
      winAmount = (payouts[symbol as keyof typeof payouts] || 5) * bet;
      Animated.sequence([
        Animated.timing(winAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(winAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
      if (winAmount >= 500) Alert.alert("🎉 ¡JACKPOT! 🎉", `¡Ganaste $${winAmount}!`);
    } else if (
      finalResults[0] === finalResults[1] ||
      finalResults[1] === finalResults[2] ||
      finalResults[0] === finalResults[2]
    ) {
      winAmount = bet * 2;
    }

    const newBalance = currentBalance + winAmount;
    setCredits(newBalance);
    setLastWin(winAmount);
    if (winAmount > 0) animateCoins();

    // 🟣 Guardar resultado en Supabase (balance + historial + estadísticas)
    try {
      await updateUserBalance(user.id, newBalance, bet, winAmount, {
        result: finalResults.join(" "),
      });
    } catch (error) {
      console.error("Error guardando juego:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Animated.View style={{ opacity: flashAnim }}>
          <Ionicons name="game-controller" size={60} color="#FFD700" />
          <Text style={styles.loadingText}>Cargando tu balance...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <LinearGradient
        colors={["#0a0a0a", "#1a0a2e", "#16213e"]}
        style={styles.gradientBg}
      >
        <View style={styles.container}>
          {/* Botón de regreso premium */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.1)"]}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={24} color="#FFD700" />
              <Text style={styles.backButtonText}>Volver</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Header con estadísticas mejorado */}
          <View style={styles.header}>
            <View style={styles.statsContainer}>
              <LinearGradient
                colors={["rgba(255, 215, 0, 0.2)", "rgba(255, 165, 0, 0.1)"]}
                style={styles.statsGradient}
              >
                <View style={styles.statsIconBg}>
                  <Ionicons name="wallet" size={22} color="#FFD700" />
                </View>
                <Text style={styles.statsLabel}>Balance</Text>
                <Text style={styles.statsValue}>${credits}</Text>
              </LinearGradient>
            </View>

            <View style={styles.statsContainer}>
              <LinearGradient
                colors={["rgba(78, 204, 163, 0.2)", "rgba(52, 211, 153, 0.1)"]}
                style={styles.statsGradient}
              >
                <View style={[styles.statsIconBg, { backgroundColor: "rgba(78, 204, 163, 0.2)" }]}>
                  <Ionicons name="trophy" size={22} color="#4ecca3" />
                </View>
                <Text style={styles.statsLabel}>Ganancias</Text>
                <Text style={[styles.statsValue, { color: "#4ecca3" }]}>${totalWins}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Título animado */}
          <Animated.View style={[styles.titleContainer, { opacity: flashOpacity }]}>
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FFD700"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            >
              <Text style={styles.title}>🎰 SLOT MACHINE 🎰</Text>
            </LinearGradient>
          </Animated.View>

          {/* Máquina de slots premium */}
          <View style={styles.slotMachineContainer}>
            <LinearGradient
              colors={["#1a1a2e", "#16213e", "#0f3460"]}
              style={styles.slotMachineGradient}
            >
              {/* Borde superior decorativo */}
              <View style={styles.slotMachineTop}>
                <LinearGradient
                  colors={["#FFD700", "#FFA500"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.slotMachineTopGradient}
                />
              </View>

              {/* Pantalla de resultados */}
              <View style={styles.reelsContainer}>
                {result.map((symbol, index) => (
                  <View key={index} style={styles.reelWrapper}>
                    <View style={styles.reelViewport}>
                      <Animated.View
                        style={[
                          styles.reelStrip,
                          {
                            transform: [{ translateY: reelAnim[index] }],
                          },
                        ]}
                      >
                        {/* Renderizar múltiples copias de símbolos para el efecto de giro */}
                        {[...Array(20)].map((_, i) => (
                          <View key={i} style={styles.symbolSlot}>
                            <Text style={styles.symbol}>
                              {symbols[i % symbols.length]}
                            </Text>
                          </View>
                        ))}
                      </Animated.View>
                    </View>
                    
                    {/* Borde decorativo del reel */}
                    <View style={styles.reelBorder}>
                      <LinearGradient
                        colors={["rgba(255, 215, 0, 0.3)", "rgba(255, 165, 0, 0.1)"]}
                        style={styles.reelBorderGradient}
                      />
                    </View>
                    
                    {/* Animación de ganancia */}
                    {lastWin > 0 && (
                      <Animated.View
                        style={[
                          styles.winGlow,
                          {
                            opacity: winAnim,
                          },
                        ]}
                      />
                    )}
                  </View>
                ))}
              </View>

              {/* Línea de pago */}
              <View style={styles.paylineWrapper}>
                <View style={styles.payline} />
                <View style={[styles.payline, styles.paylineGlow]} />
              </View>

              {/* Indicador de última ganancia */}
              {lastWin > 0 && (
                <Animated.View
                  style={[
                    styles.winIndicator,
                    {
                      opacity: coinsOpacity,
                      transform: [{ scale: coinsScale }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["#4ecca3", "#34d399"]}
                    style={styles.winIndicatorGradient}
                  >
                    <Ionicons name="trophy" size={24} color="#FFF" />
                    <Text style={styles.winText}>+${lastWin}</Text>
                  </LinearGradient>
                </Animated.View>
              )}
            </LinearGradient>
          </View>

          {/* Controles de apuesta */}
          <View style={styles.betContainer}>
            <Text style={styles.betLabel}>Apuesta Actual</Text>
            <View style={styles.betControls}>
              <TouchableOpacity
                style={styles.betButton}
                onPress={() => setBet(Math.max(10, bet - 10))}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["rgba(255, 215, 0, 0.2)", "rgba(255, 165, 0, 0.1)"]}
                  style={styles.betButtonGradient}
                >
                  <Ionicons name="remove" size={24} color="#FFD700" />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.betDisplay}>
                <LinearGradient
                  colors={["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.05)"]}
                  style={styles.betDisplayGradient}
                >
                  <Text style={styles.betAmount}>${bet}</Text>
                </LinearGradient>
              </View>

              <TouchableOpacity
                style={styles.betButton}
                onPress={() => setBet(Math.min(credits, bet + 10))}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["rgba(255, 215, 0, 0.2)", "rgba(255, 165, 0, 0.1)"]}
                  style={styles.betButtonGradient}
                >
                  <Ionicons name="add" size={24} color="#FFD700" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Apuestas rápidas */}
            <View style={styles.quickBetsContainer}>
              <Text style={styles.quickBetsLabel}>Apuesta Rápida:</Text>
              <View style={styles.quickBetsRow}>
                {[10, 25, 50, 100].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickBetButton}
                    onPress={() => setBet(Math.min(credits, amount))}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        bet === amount
                          ? ["#FFD700", "#FFA500"]
                          : ["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.05)"]
                      }
                      style={styles.quickBetGradient}
                    >
                      <Text
                        style={[
                          styles.quickBetText,
                          { color: bet === amount ? "#0a0a0a" : "#FFD700" },
                        ]}
                      >
                        ${amount}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Botón de SPIN principal */}
          <TouchableOpacity
            style={styles.spinButton}
            onPress={spinAll}
            disabled={spinning}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                spinning
                  ? ["#666", "#444"]
                  : ["#e60073", "#c8005f", "#aa004d"]
              }
              style={styles.spinGradient}
            >
              <View style={styles.spinShine} />
              <View style={styles.spinContent}>
                {spinning ? (
                  <>
                    <Animated.View style={{ transform: [{ rotate: "360deg" }] }}>
                      <Ionicons name="reload" size={32} color="#FFF" />
                    </Animated.View>
                    <Text style={styles.spinText}>Girando...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="play-circle" size={32} color="#FFF" />
                    <Text style={styles.spinText}>GIRAR</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tabla de pagos */}
          <View style={styles.payoutContainer}>
            <Text style={styles.payoutTitle}>💰 Tabla de Pagos</Text>
            <View style={styles.payoutGrid}>
              {Object.entries(payouts).map(([symbol, multiplier]) => (
                <View key={symbol} style={styles.payoutItem}>
                  <LinearGradient
                    colors={["rgba(255, 215, 0, 0.1)", "rgba(255, 165, 0, 0.05)"]}
                    style={styles.payoutItemGradient}
                  >
                    <Text style={styles.payoutSymbol}>{symbol} {symbol} {symbol}</Text>
                    <Text style={styles.payoutValue}>x{multiplier}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>

          {/* Estadísticas adicionales */}
          <View style={styles.additionalStats}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["rgba(139, 92, 246, 0.15)", "rgba(124, 58, 237, 0.05)"]}
                style={styles.statCardGradient}
              >
                <Ionicons name="game-controller" size={20} color="#8B5CF6" />
                <Text style={styles.statCardLabel}>Juegos</Text>
                <Text style={styles.statCardValue}>{gamesPlayed}</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={["rgba(251, 146, 60, 0.15)", "rgba(249, 115, 22, 0.05)"]}
                style={styles.statCardGradient}
              >
                <Ionicons name="flash" size={20} color="#FB923C" />
                <Text style={styles.statCardLabel}>Mayor Premio</Text>
                <Text style={styles.statCardValue}>${biggestWin}</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  gradientBg: {
    flex: 1,
    minHeight: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  loadingText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    borderRadius: 12,
  },
  backButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 110,
    marginBottom: 20,
    gap: 12,
  },
  statsContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statsGradient: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 16,
  },
  statsIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginTop: 4,
  },
  statsValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFD700",
    marginTop: 4,
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  titleGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0a0a0a",
    textAlign: "center",
    letterSpacing: 1,
  },
  slotMachineContainer: {
    width: width - 40,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  slotMachineGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
    borderRadius: 24,
    position: "relative",
  },
  slotMachineTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  slotMachineTopGradient: {
    flex: 1,
  },
  reelsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
    paddingHorizontal: 10,
  },
  reelWrapper: {
    width: 90,
    height: 100,
    position: "relative",
  },
  reelViewport: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(10, 10, 30, 0.8)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255, 215, 0, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  reelStrip: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
  },
  symbolSlot: {
    width: 90,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  symbol: {
    fontSize: 56,
    textAlign: "center",
  },
  reelBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: "hidden",
    pointerEvents: "none",
  },
  reelBorderGradient: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  winGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: "rgba(255, 215, 0, 0.4)",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  symbolContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  symbolDisplay: {
    fontSize: 56,
    textAlign: "center",
  },
  paylineWrapper: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 4,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    marginTop: -2,
  },
  payline: {
    position: "absolute",
    width: "85%",
    height: 4,
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  paylineGlow: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
    backgroundColor: "rgba(255, 215, 0, 0.6)",
  },
  winIndicator: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
  },
  winIndicatorGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: 20,
  },
  winText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFF",
  },
  betContainer: {
    width: "100%",
    marginBottom: 20,
  },
  betLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  betControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  betButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  betButtonGradient: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    borderRadius: 12,
  },
  betDisplay: {
    borderRadius: 16,
    overflow: "hidden",
  },
  betDisplayGradient: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.4)",
    borderRadius: 16,
  },
  betAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFD700",
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quickBetsContainer: {
    width: "100%",
  },
  quickBetsLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  quickBetsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  quickBetButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  quickBetGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    borderRadius: 12,
  },
  quickBetText: {
    fontSize: 14,
    fontWeight: "700",
  },
  spinButton: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#e60073",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  spinGradient: {
    position: "relative",
  },
  spinShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  spinContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  spinText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
  },
  payoutContainer: {
    width: "100%",
    marginBottom: 20,
  },
  payoutTitle: {
    fontSize: 18,
    color: "#FFD700",
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
    textShadowColor: "rgba(255, 215, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  payoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  payoutItem: {
    width: (width - 60) / 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  payoutItemGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 14,
  },
  payoutSymbol: {
    fontSize: 20,
    marginBottom: 6,
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4ecca3",
    textShadowColor: "rgba(78, 204, 163, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  additionalStats: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statCardGradient: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
  },
  statCardLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 4,
  },
});