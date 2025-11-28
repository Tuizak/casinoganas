import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const CoinToss = () => {
  const { user } = useAuth();
  const [flipping, setFlipping] = useState(false);
  const [side, setSide] = useState<"heads" | "tails" | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCoin = async () => {
    if (flipping || !user) return;
    setFlipping(true);
    setResult(null);

    const bet = 50;
    const balanceData = await getUserBalance(user.id);
    let currentBalance = balanceData.balance;

    if (currentBalance < bet) {
      Alert.alert("Saldo insuficiente", "Recarga créditos para jugar.");
      setFlipping(false);
      return;
    }

    const random = Math.random();
    const outcome = random < 0.5 ? "heads" : "tails";
    const win = outcome === "heads"; // cara = ganas
    const reward = win ? 100 : 0;

    Animated.sequence([
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setSide(outcome);
      const newBalance = currentBalance + (reward - bet);
      await updateUserBalance(user.id, newBalance, bet, reward);
      setResult(win ? "🎉 ¡Ganaste $100!" : "😢 Perdiste esta vez");
      setFlipping(false);
    });
  };

  const rotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
      <Text style={styles.title}>🪙 Coin Toss</Text>

      <Animated.View
        style={[
          styles.coin,
          {
            transform: [{ rotateY: rotation }],
          },
        ]}
      >
        <Image
          source={
            side === "tails"
              ? require("../../../assets/tails.png")
              : require("../../../assets/heads.png")
          }
          style={styles.coinImage}
        />
      </Animated.View>

      <TouchableOpacity
        style={[styles.button, flipping && { opacity: 0.6 }]}
        onPress={flipCoin}
        disabled={flipping}
      >
        <Ionicons name="refresh" size={22} color="#000" />
        <Text style={styles.buttonText}>Lanzar Moneda</Text>
      </TouchableOpacity>

      {result && <Text style={styles.result}>{result}</Text>}
    </LinearGradient>
  );
};

export default CoinToss;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 26,
    color: "#FFD700",
    fontWeight: "700",
    marginBottom: 20,
  },
  coin: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  coinImage: {
    width: 100,
    height: 100,
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
