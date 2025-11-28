import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const icons = [
  require("../../../assets/gema1.png"),
  require("../../../assets/gema2.png"),
  require("../../../assets/gema3.png"),
  require("../../../assets/gema4.png"),
  require("../../../assets/gema5.png"),
];

const SlotRoyale3D = () => {
  const { user } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([0, 1, 2]);
  const [result, setResult] = useState<string | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const spin = async () => {
    if (spinning || !user) return;
    setSpinning(true);
    setResult(null);

    const bet = 100;
    const balanceData = await getUserBalance(user.id);
    let currentBalance = balanceData.balance;

    if (currentBalance < bet) {
      Alert.alert("Saldo insuficiente", "Recarga créditos para seguir jugando.");
      setSpinning(false);
      return;
    }

    Animated.sequence([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const newReels = [
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5),
    ];
    setReels(newReels);

    // Ganar si los 3 son iguales o dos iguales consecutivos
    let reward = 0;
    if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) reward = 500;
    else if (newReels[0] === newReels[1] || newReels[1] === newReels[2]) reward = 150;

    const winAmount = reward - bet;
    const newBalance = currentBalance + winAmount;

    setTimeout(async () => {
      await updateUserBalance(user.id, newBalance, bet, reward);
      if (reward > 0) setResult(`🎉 ¡Ganaste $${reward}!`);
      else setResult("😢 No hubo suerte esta vez");
      setSpinning(false);
    }, 800);
  };

  return (
    <LinearGradient colors={["#0a0a0a", "#1a1a1a", "#000"]} style={styles.container}>
      <Text style={styles.title}>🎰 Slot Royale 3D</Text>

      <Animated.View
        style={[
          styles.slotContainer,
          {
            transform: [
              {
                rotateX: spinAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          },
        ]}
      >
        {reels.map((i, idx) => (
          <Image key={idx} source={icons[i]} style={styles.icon} />
        ))}
      </Animated.View>

      <TouchableOpacity
        style={[styles.button, spinning && { opacity: 0.5 }]}
        onPress={spin}
        disabled={spinning}
      >
        <Ionicons name="refresh" size={22} color="#000" />
        <Text style={styles.buttonText}>Girar</Text>
      </TouchableOpacity>

      {result && <Text style={styles.result}>{result}</Text>}
    </LinearGradient>
  );
};

export default SlotRoyale3D;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 26,
    color: "#FFD700",
    fontWeight: "700",
    marginBottom: 30,
  },
  slotContainer: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderWidth: 3,
    borderColor: "#FFD700",
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
  },
  icon: {
    width: 80,
    height: 80,
    marginHorizontal: 6,
    resizeMode: "contain",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
  },
  result: {
    fontSize: 18,
    color: "#fff",
    marginTop: 25,
    textAlign: "center",
  },
});
