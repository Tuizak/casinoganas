import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const { width, height } = Dimensions.get("window");

// 🌌 SÍMBOLOS CÓSMICOS con multiplicadores
const SYMBOLS = [
  { emoji: "🌌", multiplier: 10 },
  { emoji: "💎", multiplier: 8 },
  { emoji: "⭐", multiplier: 6 },
  { emoji: "🍀", multiplier: 5 },
  { emoji: "🎁", multiplier: 4 },
  { emoji: "🔔", multiplier: 3 },
  { emoji: "🍒", multiplier: 2 },
  { emoji: "🍋", multiplier: 2 },
  { emoji: "🍇", multiplier: 3 },
];

// 🌠 Partículas flotantes de fondo
const StarField = () => {
  const stars = Array.from({ length: 40 }, (_, i) => {
    const fadeAnim = useRef(new Animated.Value(Math.random())).current;
    
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.2,
            duration: 1000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    return (
      <Animated.View
        key={i}
        style={[
          styles.star,
          {
            left: Math.random() * width,
            top: Math.random() * height,
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            opacity: fadeAnim,
          },
        ]}
      />
    );
  });

  return <View style={StyleSheet.absoluteFillObject}>{stars}</View>;
};

// 🎮 Reel individual animado
const CosmicReel = ({ symbol, spinning, isWinning }: any) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [currentSymbol, setCurrentSymbol] = useState(symbol);

  useEffect(() => {
    if (spinning) {
      const interval = setInterval(() => {
        setCurrentSymbol(
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].emoji
        );
      }, 80);

      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ).start();

      return () => clearInterval(interval);
    } else {
      spinAnim.setValue(0);
      setCurrentSymbol(symbol);
    }
  }, [spinning, symbol]);

  useEffect(() => {
    if (isWinning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isWinning]);

  const translateY = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const scale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <Animated.View style={[styles.reelCell, { transform: [{ scale }] }]}>
      <LinearGradient
        colors={
          isWinning
            ? ["#FFD700", "#FFA500", "#FF8C00"]
            : ["#3a0ca3", "#4361ee", "#7209b7"]
        }
        style={styles.cellGradient}
      >
        {/* Efecto de luz interior */}
        <View style={[styles.innerGlow, { opacity: isWinning ? 0.6 : 0.3 }]} />
        
        <Animated.Text
          style={[
            styles.symbolText,
            { transform: [{ translateY }] },
          ]}
        >
          {currentSymbol}
        </Animated.Text>

        {/* Border glow para ganadores */}
        {isWinning && (
          <View style={styles.winGlowBorder} />
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// 📊 HUD / STATS con animación
const StatBox = ({ icon, label, value, color }: any) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.statBox, { transform: [{ scale: pulseAnim }] }]}>
      <LinearGradient colors={[color, color + "CC"]} style={styles.statGradient}>
        <Ionicons name={icon} size={20} color="#fff" />
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function CosmicSpin() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(50);
  const [lines, setLines] = useState(5);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<string[][]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [jackpot, setJackpot] = useState(false);
  const [winningPositions, setWinningPositions] = useState(new Set<string>());
  const [loading, setLoading] = useState(true);

  const winAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const jackpotAnim = useRef(new Animated.Value(0)).current;

  // 🧩 Cargar balance real y generar reels iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (user?.id) {
          const data = await getUserBalance(user.id);
          setBalance(data?.balance || 0);
        }
      } catch (e) {
        console.log("Error al cargar balance:", e);
        Alert.alert("Error", "No se pudo cargar tu balance");
      } finally {
        // Generar reels iniciales
        const initialReels = Array(5)
          .fill(null)
          .map(() =>
            Array(3)
              .fill(null)
              .map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].emoji)
          );
        setReels(initialReels);
        setLoading(false);
      }
    };
    loadInitialData();
  }, [user]);

  // 🎲 Lógica principal
  const handleSpin = async () => {
    const totalBet = bet * lines;

    if (spinning) return;
    if (balance < totalBet) {
      Alert.alert("🚀 Sin Combustible", "No tienes suficientes CosmicCoins para lanzar.");
      return;
    }

    setSpinning(true);
    const newBalance = balance - totalBet;
    setBalance(newBalance);
    setShowWin(false);
    setJackpot(false);
    setWinningPositions(new Set());

    // Animación del botón
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Generar nuevos reels
    setTimeout(async () => {
      const newReels = Array(5)
        .fill(null)
        .map(() =>
          Array(3)
            .fill(null)
            .map(
              () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].emoji
            )
        );
      setReels(newReels);
      setSpinning(false);

      const { win, isJackpot, positions } = calculateWin(newReels, bet, lines);

      if (win > 0) {
        setWinAmount(win);
        setBalance(newBalance + win);
        setShowWin(true);
        setWinningPositions(positions);
        
        if (isJackpot) {
          setJackpot(true);
          Animated.loop(
            Animated.timing(jackpotAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            { iterations: 3 }
          ).start();
        }

        Animated.sequence([
          Animated.spring(winAnim, { 
            toValue: 1, 
            friction: 5,
            tension: 40,
            useNativeDriver: true 
          }),
          Animated.delay(2800),
          Animated.timing(winAnim, { 
            toValue: 0, 
            duration: 400, 
            useNativeDriver: true 
          }),
        ]).start(() => {
          setShowWin(false);
          setWinningPositions(new Set());
        });
      }

      // Actualizar balance en Supabase
      try {
        if (user?.id) {
          await updateUserBalance(user.id, newBalance + win, totalBet, win, {
            reels: newReels,
            lines,
          });
        }
      } catch (e) {
        console.log("Error actualizando balance:", e);
      }
    }, 2000);
  };

  // 🚀 Lógica de ganancias
  const calculateWin = (reels: string[][], bet: number, lines: number) => {
    let totalWin = 0;
    let jackpot = false;
    const positions = new Set<string>();

    const paylines = [
      [1, 1, 1, 1, 1], // central
      [0, 0, 0, 0, 0], // superior
      [2, 2, 2, 2, 2], // inferior
      [0, 1, 2, 1, 0], // V
      [2, 1, 0, 1, 2], // ^
    ].slice(0, lines);

    paylines.forEach((line) => {
      const symbols = line.map((row, col) => reels[col][row]);
      const first = symbols[0];
      const count = symbols.filter((s) => s === first).length;

      if (count >= 3) {
        line.forEach((row, col) => {
          if (symbols[col] === first && count >= 3) {
            positions.add(`${col}-${row}`);
          }
        });
      }

      const symObj = SYMBOLS.find((s) => s.emoji === first);
      if (count >= 3 && symObj) {
        totalWin += bet * symObj.multiplier * (count / 3);
      }

      if (count === 5 && first === "🌌") jackpot = true;
    });

    if (jackpot) totalWin += bet * 100;

    return { win: Math.round(totalWin), isJackpot: jackpot, positions };
  };

  const changeBet = (amount: number) => {
    if (spinning) return;
    const newBet = Math.max(50, Math.min(bet + amount, 5000));
    setBet(newBet);
  };

  const jackpotOpacity = jackpotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.4, 0],
  });

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#0b0033", "#1a0052", "#240046", "#3c096c", "#10002b"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Cargando CosmicSpin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fondo galáctico con gradientes */}
      <LinearGradient
        colors={["#0b0033", "#1a0052", "#240046", "#3c096c", "#10002b"]}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Capa de nebulosa */}
      <View style={styles.nebula} />
      
      {/* Estrellas animadas */}
      <StarField />

      {/* Efecto Supernova Jackpot */}
      {jackpot && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFillObject, 
            { opacity: jackpotOpacity }
          ]}
        >
          <LinearGradient
            colors={["#FFD700", "#FFA500", "#FF8C00", "transparent"]}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}

      {/* HEADER */}
      <View style={styles.header}>
        <StatBox
          icon="planet"
          label="GALACTIC COINS"
          value={`$${balance.toLocaleString()}`}
          color="#FFD700"
        />
        <StatBox
          icon="flame"
          label="BET"
          value={`$${bet}`}
          color="#FF6B00"
        />
        <StatBox
          icon="star"
          label="LINES"
          value={lines}
          color="#03A9F4"
        />
      </View>

      {/* WIN BANNER */}
      {showWin && (
        <Animated.View
          style={[
            styles.winBanner,
            {
              opacity: winAnim,
              transform: [
                {
                  scale: winAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
                {
                  translateY: winAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#FFD700", "#FF9800", "#FFD700"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.winGradient}
          >
            <Text style={styles.winTitle}>
              {jackpot ? "🌌 COSMIC JACKPOT 🌌" : "✨ YOU WIN! ✨"}
            </Text>
            <Text style={styles.winAmount}>+${winAmount.toLocaleString()}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* REELS */}
      <View style={styles.slotContainer}>
        {/* Línea central dorada */}
        <View style={styles.centerLine} />
        
        <View style={styles.reelsRow}>
          {reels.map((reel, i) => (
            <View key={i} style={styles.reelColumn}>
              {reel.map((symbol, j) => (
                <CosmicReel
                  key={`${i}-${j}`}
                  symbol={symbol}
                  spinning={spinning}
                  isWinning={winningPositions.has(`${i}-${j}`)}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* CONTROLES */}
      <View style={styles.controls}>
        {/* Bet Controls */}
        <View style={styles.betControls}>
          <TouchableOpacity 
            onPress={() => changeBet(-50)} 
            disabled={spinning || bet <= 50}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={spinning || bet <= 50 ? ["#666", "#444"] : ["#FF5252", "#D32F2F"]}
              style={styles.betButton}
            >
              <Ionicons name="remove-circle" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.betDisplay}>
            <LinearGradient
              colors={["#7209b7", "#560bad", "#3c096c"]}
              style={styles.betDisplayGradient}
            >
              <Text style={styles.betValue}>${bet}</Text>
              <Text style={styles.betSubtext}>por línea</Text>
            </LinearGradient>
          </View>

          <TouchableOpacity 
            onPress={() => changeBet(50)} 
            disabled={spinning || bet >= 5000}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={spinning || bet >= 5000 ? ["#666", "#444"] : ["#4CAF50", "#388E3C"]}
              style={styles.betButton}
            >
              <Ionicons name="add-circle" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Total Bet Info */}
        <View style={styles.totalBetContainer}>
          <Text style={styles.totalBetLabel}>APUESTA TOTAL:</Text>
          <Text style={styles.totalBetValue}>${(bet * lines).toLocaleString()}</Text>
        </View>

        {/* Spin Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.spinButton}
            onPress={handleSpin}
            disabled={spinning || balance < bet * lines}
          >
            <LinearGradient
              colors={
                spinning || balance < bet * lines
                  ? ["#666", "#444", "#333"]
                  : ["#4CAF50", "#45A049", "#66BB6A", "#4CAF50"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.spinGradient}
            >
              {/* Anillo exterior giratorio */}
              {!spinning && balance >= bet * lines && (
                <View style={styles.spinRing} />
              )}
              
              <Ionicons
                name={spinning ? "sync" : "rocket"}
                size={48}
                color="#fff"
                style={spinning ? { transform: [{ rotate: "45deg" }] } : {}}
              />
              <Text style={styles.spinText}>
                {spinning ? "SPINNING..." : "LAUNCH"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// 🎨 ESTILOS PREMIUM
const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFD700",
  },
  nebula: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    opacity: 0.3,
  },
  star: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 50,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    paddingHorizontal: 10,
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#7209b7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  statGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  statContent: { flex: 1 },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.5,
  },
  winBanner: {
    position: "absolute",
    top: height * 0.25,
    alignSelf: "center",
    zIndex: 1000,
    elevation: 20,
  },
  winGradient: {
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  winTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  winAmount: {
    fontSize: 40,
    fontWeight: "900",
    color: "#fff",
    marginTop: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  slotContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  reelsRow: {
    flexDirection: "row",
    gap: 10,
  },
  reelColumn: {
    gap: 10,
  },
  reelCell: {
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#7209b7",
    elevation: 8,
    shadowColor: "#7209b7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  cellGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    opacity: 0.1,
  },
  symbolText: {
    fontSize: 42,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  winGlowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: "#FFD700",
    borderRadius: 14,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  centerLine: {
    position: "absolute",
    height: 4,
    backgroundColor: "#FFD700",
    opacity: 0.7,
    left: 0,
    right: 0,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  controls: {
    paddingBottom: 30,
    paddingHorizontal: 20,
    gap: 16,
    alignItems: "center",
  },
  betControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  betButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  betDisplay: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#7209b7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  betDisplayGradient: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: "#a855f7",
    alignItems: "center",
  },
  betValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  betSubtext: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  totalBetContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  totalBetLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
  },
  totalBetValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFD700",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spinButton: {
    borderRadius: 60,
    overflow: "hidden",
    elevation: 15,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  spinGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 50,
    gap: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  spinRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
  },
  spinText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
});