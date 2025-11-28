import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateBalance } from "../../Apis/supabase";

type Segment = {
  label: string;
  multiplier: number;
  color: string;
  probabilityWeight: number;
};

const BET_AMOUNT = 20; // apuesta fija por giro

const SEGMENTS: Segment[] = [
  { label: "x0", multiplier: 0, color: "#FF5252", probabilityWeight: 25 },
  { label: "x0.5", multiplier: 0.5, color: "#FF9800", probabilityWeight: 20 },
  { label: "x1", multiplier: 1, color: "#FFC107", probabilityWeight: 18 },
  { label: "x2", multiplier: 2, color: "#4CAF50", probabilityWeight: 15 },
  { label: "x3", multiplier: 3, color: "#29B6F6", probabilityWeight: 10 },
  { label: "x5", multiplier: 5, color: "#AB47BC", probabilityWeight: 7 },
  { label: "x10", multiplier: 10, color: "#FFD700", probabilityWeight: 5 },
];

const LuckyWheel = () => {
  const { user } = useAuth();
  const [spinAnim] = useState(new Animated.Value(0));
  const [spinning, setSpinning] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [lastMultiplier, setLastMultiplier] = useState<number | null>(null);

  const sliceAngle = 360 / SEGMENTS.length;

  const pickWeightedIndex = () => {
    const totalWeight = SEGMENTS.reduce(
      (sum, seg) => sum + seg.probabilityWeight,
      0
    );
    const rnd = Math.random() * totalWeight;
    let acc = 0;
    for (let i = 0; i < SEGMENTS.length; i++) {
      acc += SEGMENTS[i].probabilityWeight;
      if (rnd <= acc) return i;
    }
    return SEGMENTS.length - 1;
  };

  const handleSpin = async () => {
    if (spinning) return;
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión para jugar.");
      return;
    }

    try {
      setSpinning(true);
      setResultText(null);

      // 1. Leer saldo actual
      const balanceData = await getUserBalance(user.id);
      const currentBalance = Number(balanceData.balance || 0);

      if (currentBalance < BET_AMOUNT) {
        Alert.alert(
          "Saldo insuficiente",
          `Necesitas al menos $${BET_AMOUNT} para jugar.`
        );
        setSpinning(false);
        return;
      }

      // 2. Elegir segmento ganador (no siempre ganas)
      const winnerIndex = pickWeightedIndex();
      const winnerSegment = SEGMENTS[winnerIndex];
      const winAmount = BET_AMOUNT * winnerSegment.multiplier;
      const netChange = winAmount - BET_AMOUNT;
      const newBalance = currentBalance + netChange;

      setLastMultiplier(winnerSegment.multiplier);

      // 3. Animación de la ruleta
      const randomExtraSpins = 4 + Math.floor(Math.random() * 3); // 4–6 vueltas
      const targetRotation =
        randomExtraSpins * 360 + winnerIndex * sliceAngle + sliceAngle / 2;

      Animated.timing(spinAnim, {
        toValue: targetRotation,
        duration: 4000,
        useNativeDriver: true,
      }).start(async () => {
        // 4. Actualizar saldo en Supabase
        await updateBalance(user.id, newBalance);

        if (winnerSegment.multiplier === 0) {
          setResultText(`Perdiste la apuesta de $${BET_AMOUNT} 😢`);
        } else {
          setResultText(
            `¡x${winnerSegment.multiplier.toFixed(
              1
            )}! Ganaste $${winAmount.toFixed(2)} 🎉`
          );
        }

        setSpinning(false);
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Ocurrió un problema al girar la ruleta.");
      setSpinning(false);
    }
  };

  return (
    <LinearGradient colors={["#050505", "#101018"]} style={styles.container}>
      <Text style={styles.title}>Lucky Wheel 🎡</Text>
      <Text style={styles.subtitle}>
        Apuesta fija: ${BET_AMOUNT}. Obtén un multiplicador.
      </Text>

      {/* Puntero fijo arriba */}
      <View style={styles.pointerContainer}>
        <View style={styles.pointer} />
      </View>

      {/* Ruleta */}
      <Animated.View
        style={[
          styles.wheel,
          {
            transform: [
              {
                rotate: spinAnim.interpolate({
                  inputRange: [0, 360],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          },
        ]}
      >
        {SEGMENTS.map((seg, index) => {
          const rotate = index * sliceAngle;
          return (
            <View
              key={index}
              style={[
                styles.segment,
                {
                  transform: [{ rotate: `${rotate}deg` }],
                },
              ]}
            >
              <View
                style={[
                  styles.segmentLabelContainer,
                  { backgroundColor: seg.color },
                ]}
              >
                <Text style={styles.segmentLabel}>{seg.label}</Text>
              </View>
            </View>
          );
        })}
      </Animated.View>

      {/* Botón */}
      <TouchableOpacity
        style={[styles.button, spinning && { opacity: 0.6 }]}
        onPress={handleSpin}
        disabled={spinning}
      >
        <Ionicons name="refresh" size={22} color="#000" />
        <Text style={styles.buttonText}>
          {spinning ? "Girando..." : "Girar"}
        </Text>
      </TouchableOpacity>

      {/* Resultado */}
      {resultText && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{resultText}</Text>
          {lastMultiplier !== null && (
            <Text style={styles.resultSubText}>
              Recuerda: no siempre se gana, es solo entretenimiento. 🎲
            </Text>
          )}
        </View>
      )}
    </LinearGradient>
  );
};

export default LuckyWheel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 26,
    color: "#FFD700",
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#AAAAAA",
    marginBottom: 32,
  },
  pointerContainer: {
    position: "absolute",
    top: 130,
    zIndex: 5,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFD700",
  },
  wheel: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 40,
  },
  segment: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  segmentLabelContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  segmentLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  buttonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  resultBox: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultText: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
  },
  resultSubText: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
    textAlign: "center",
  },
});
