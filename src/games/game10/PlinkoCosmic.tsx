import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

// Parámetros optimizados para mejor visualización
const ROWS = 12;
const PIN_RADIUS = 4;
const PIN_SPACING = 28;
const ROW_SPACING = 35;
const BALL_SIZE = 16;
const BOARD_START_Y = 120;

// Multiplicadores clásicos Plinko
const multipliers = [0.2, 0.5, 1, 2, 5, 10, 26, 130, 1000, 130, 26, 10, 5, 2, 1, 0.5, 0.2];

export default function PlinkoCosmic() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(10);
  const [falling, setFalling] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<number | null>(null);
  const [showBall, setShowBall] = useState(false);

  const ballY = useRef(new Animated.Value(0)).current;
  const ballX = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(1)).current;

  // Cargar balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return;
      try {
        const data = await getUserBalance(user.id);
        setBalance(Number(data.balance || 0));
      } catch (e) {
        console.log("Error balance:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [user?.id]);

  // Función de caída mejorada con física más realista
  const dropBall = async () => {
    if (falling || balance < bet) {
      Alert.alert("⚠️", "No tienes créditos suficientes o ya hay una bola cayendo.");
      return;
    }

    setFalling(true);
    setShowBall(true);
    setResult(null);

    const newBalance = balance - bet;
    setBalance(newBalance);

    // Haptic inicial
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const animations: Animated.CompositeAnimation[] = [];
    const stepDuration = turbo ? 50 : 120;

    // Calcular el centro del tablero
    const boardCenterX = width / 2;

    // Posición inicial (arriba del tablero)
    let currentX = boardCenterX;
    ballX.setValue(currentX);
    ballY.setValue(BOARD_START_Y - 40);

    // Animación de entrada
    animations.push(
      Animated.parallel([
        Animated.timing(ballY, {
          toValue: BOARD_START_Y,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(ballScale, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(ballScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Calcular la posición de cada fila
    for (let row = 0; row < ROWS; row++) {
      // Determinar dirección (izquierda o derecha)
      const direction = Math.random() < 0.5 ? -1 : 1;

      // Mover medio espacio en la dirección elegida
      currentX += direction * (PIN_SPACING / 2);

      // Limitar a los bordes del tablero
      const minX = boardCenterX - (ROWS * PIN_SPACING) / 2;
      const maxX = boardCenterX + (ROWS * PIN_SPACING) / 2;
      currentX = Math.max(minX, Math.min(maxX, currentX));

      const targetY = BOARD_START_Y + (row + 1) * ROW_SPACING;

      // Animación de caída con rebote
      animations.push(
        Animated.parallel([
          Animated.spring(ballX, {
            toValue: currentX,
            velocity: turbo ? 10 : 5,
            tension: turbo ? 80 : 50,
            friction: turbo ? 8 : 6,
            useNativeDriver: true,
          }),
          Animated.timing(ballY, {
            toValue: targetY,
            duration: stepDuration,
            useNativeDriver: true,
          }),
          // Pequeño rebote en cada pin
          Animated.sequence([
            Animated.timing(ballScale, {
              toValue: 0.9,
              duration: stepDuration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(ballScale, {
              toValue: 1,
              duration: stepDuration / 2,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Haptic en cada rebote (solo si no es turbo)
      if (!turbo && row % 2 === 0) {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, (row + 1) * stepDuration);
      }
    }

    // Ejecutar todas las animaciones
    Animated.sequence(animations).start(async () => {
      // Calcular en qué slot cayó basado en la posición X final
      const boardStart = width / 2 - (multipliers.length * (width / multipliers.length)) / 2;
      const slotWidth = width / multipliers.length;
      const relativeX = currentX - boardStart;
      let slotIndex = Math.floor(relativeX / slotWidth);

      // Asegurar que el índice esté dentro del rango
      slotIndex = Math.max(0, Math.min(multipliers.length - 1, slotIndex));

      const multiplier = multipliers[slotIndex];
      const win = bet * multiplier;

      // Haptic final según resultado
      Haptics.notificationAsync(
        multiplier >= 10
          ? Haptics.NotificationFeedbackType.Success
          : multiplier >= 2
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Error
      );

      // Animación final de la bola
      Animated.sequence([
        Animated.timing(ballScale, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(ballScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Mostrar resultado (✅ setTimeout ahora es async para permitir await)
      setTimeout(async () => {
        if (multiplier >= 10) {
          Alert.alert("🎉 ¡GANASTE GRANDE!", `Caíste en ${multiplier}x y ganaste $${win.toFixed(2)}`);
        } else if (multiplier > 1) {
          Alert.alert("✨ ¡Ganaste!", `Caíste en ${multiplier}x y ganaste $${win.toFixed(2)}`);
        } else {
          Alert.alert("😢 Mala suerte", `Caíste en ${multiplier}x. ¡Intenta de nuevo!`);
        }

        const updatedBalance = newBalance + win;
        setBalance(updatedBalance);

        try {
          await updateUserBalance(user.id, updatedBalance, bet, win, {
            game: "PlinkoCosmic",
            result: `${multiplier}x`,
          });
        } catch (e) {
          console.log("Error supabase:", e);
        }

        setResult(multiplier);
        setShowBall(false);
        setFalling(false);
        ballScale.setValue(1);
      }, 300);
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="planet" size={60} color="#A55EEA" />
        <Text style={styles.loadingText}>Cargando universo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#1a0a2e", "#16213e", "#0a0a0a"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#A55EEA" />
        </TouchableOpacity>
        <Text style={styles.title}>🎯 Plinko Cósmico</Text>
        <TouchableOpacity
          onPress={() => setTurbo(!turbo)}
          style={[styles.turboButton, turbo && styles.turboActive]}
        >
          <Ionicons
            name={turbo ? "rocket" : "rocket-outline"}
            size={24}
            color={turbo ? "#000" : "#A55EEA"}
          />
        </TouchableOpacity>
      </View>

      {/* Balance y último resultado */}
      <View style={styles.infoContainer}>
        <View style={styles.balanceBox}>
          <Ionicons name="wallet" size={20} color="#FFD700" />
          <Text style={styles.balanceText}>${balance.toFixed(2)}</Text>
        </View>
        {result !== null && (
          <View style={[styles.resultBox, result >= 10 && styles.resultBoxWin]}>
            <Text style={styles.resultText}>
              Último: {result}x {result >= 10 ? "🎉" : result >= 2 ? "✨" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Tablero */}
      <View style={styles.board}>
        {/* Pines en forma de pirámide */}
        {Array.from({ length: ROWS }).map((_, rowIndex) => {
          const pinsInRow = rowIndex + 3;
          const totalRowWidth = (pinsInRow - 1) * PIN_SPACING;
          const rowOffset = width / 2 - totalRowWidth / 2;

          return (
            <View
              key={rowIndex}
              style={[
                styles.pinRow,
                {
                  top: BOARD_START_Y + rowIndex * ROW_SPACING,
                  left: rowOffset,
                },
              ]}
            >
              {Array.from({ length: pinsInRow }).map((_, pinIndex) => (
                <View
                  key={pinIndex}
                  style={[
                    styles.pin,
                    { marginHorizontal: PIN_SPACING / 2 - PIN_RADIUS },
                  ]}
                />
              ))}
            </View>
          );
        })}

        {/* Bola animada */}
        {showBall && (
          <Animated.View
            style={[
              styles.ball,
              {
                transform: [
                  { translateX: ballX },
                  { translateY: ballY },
                  { scale: ballScale },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#FFF", "#FFD700", "#FFF"]}
              style={styles.ballGradient}
            />
          </Animated.View>
        )}

        {/* Slots multiplicadores */}
        <View style={styles.slotsContainer}>
          {multipliers.map((m, i) => (
            <LinearGradient
              key={i}
              colors={
                m >= 130
                  ? ["#FFD700", "#FFA500"]
                  : m >= 26
                  ? ["#FF6B6B", "#FF4757"]
                  : m >= 10
                  ? ["#00C3FF", "#0099CC"]
                  : m >= 2
                  ? ["#A55EEA", "#7B3FA0"]
                  : ["#2d3436", "#1a1a1a"]
              }
              style={[styles.slot, result === m && styles.slotActive]}
            >
              <Text style={[styles.slotText, m < 1 && styles.slotTextLow]}>
                {m}x
              </Text>
            </LinearGradient>
          ))}
        </View>
      </View>

      {/* Controles de apuesta */}
      <View style={styles.betSection}>
        <Text style={styles.betLabel}>Apuesta</Text>
        <View style={styles.betControls}>
          <TouchableOpacity
            style={styles.betButton}
            onPress={() => setBet(Math.max(10, bet - 10))}
          >
            <Ionicons name="remove" size={24} color="#A55EEA" />
          </TouchableOpacity>
          <View style={styles.betDisplay}>
            <Text style={styles.betText}>${bet}</Text>
          </View>
          <TouchableOpacity
            style={styles.betButton}
            onPress={() => setBet(Math.min(balance, bet + 10))}
          >
            <Ionicons name="add" size={24} color="#A55EEA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón principal */}
      <TouchableOpacity
        disabled={falling}
        onPress={dropBall}
        activeOpacity={0.8}
        style={styles.playButton}
      >
        <LinearGradient
          colors={falling ? ["#666", "#444"] : ["#A55EEA", "#8854D0"]}
          style={styles.playGradient}
        >
          <Ionicons
            name={falling ? "hourglass" : "play"}
            size={24}
            color="#FFF"
          />
          <Text style={styles.playText}>
            {falling ? "CAYENDO..." : "SOLTAR BOLA"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    color: "#A55EEA",
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 50,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: "#A55EEA",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  turboButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(165,94,234,0.1)",
  },
  turboActive: {
    backgroundColor: "#FFD700",
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    marginBottom: 10,
  },
  balanceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(165,94,234,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(165,94,234,0.3)",
  },
  balanceText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 18,
  },
  resultBox: {
    backgroundColor: "rgba(165,94,234,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(165,94,234,0.3)",
  },
  resultBoxWin: {
    backgroundColor: "rgba(255,215,0,0.2)",
    borderColor: "rgba(255,215,0,0.5)",
  },
  resultText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  board: {
    flex: 1,
    position: "relative",
  },
  pinRow: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
  },
  pin: {
    width: PIN_RADIUS * 2,
    height: PIN_RADIUS * 2,
    borderRadius: PIN_RADIUS,
    backgroundColor: "#A55EEA",
    shadowColor: "#A55EEA",
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
  ball: {
    position: "absolute",
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    left: -BALL_SIZE / 2,
    top: -BALL_SIZE / 2,
    shadowColor: "#FFD700",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  ballGradient: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
  },
  slotsContainer: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    width: width,
    paddingHorizontal: 10,
  },
  slot: {
    width: (width - 40) / multipliers.length,
    height: 50,
    borderRadius: 8,
    marginHorizontal: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  slotActive: {
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  slotText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 11,
  },
  slotTextLow: {
    color: "#888",
  },
  betSection: {
    alignItems: "center",
    marginBottom: 15,
  },
  betLabel: {
    color: "#A55EEA",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  betControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  betButton: {
    backgroundColor: "rgba(165,94,234,0.15)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(165,94,234,0.3)",
  },
  betDisplay: {
    backgroundColor: "rgba(165,94,234,0.2)",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(165,94,234,0.4)",
    minWidth: 120,
    alignItems: "center",
  },
  betText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  playButton: {
    alignItems: "center",
    marginBottom: 40,
    marginHorizontal: 20,
  },
  playGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    shadowColor: "#A55EEA",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  playText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
});
