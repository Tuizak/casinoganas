import React, { useState } from "react";
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

const DiceDuel = () => {
  const { user } = useAuth();
  const [rolling, setRolling] = useState(false);
  const [playerRoll, setPlayerRoll] = useState<number | null>(null);
  const [dealerRoll, setDealerRoll] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const spinAnim = new Animated.Value(0);

  const rollDice = async () => {
    if (!user || rolling) return;
    setRolling(true);
    setResult(null);

    const bet = 100;
    const balanceData = await getUserBalance(user.id);
    let currentBalance = balanceData.balance;

    if (currentBalance < bet) {
      Alert.alert("Saldo insuficiente", "Recarga tus créditos para seguir jugando.");
      setRolling(false);
      return;
    }

    Animated.sequence([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const player = Math.floor(Math.random() * 6) + 1;
    const dealer = Math.floor(Math.random() * 6) + 1;

    setPlayerRoll(player);
    setDealerRoll(dealer);

    let winAmount = 0;
    let message = "";

    if (player > dealer) {
      winAmount = 200;
      message = "🎉 ¡Ganaste $200!";
    } else if (player === dealer) {
      winAmount = 100;
      message = "🤝 Empate. Recuperas tu apuesta.";
    } else {
      message = "😢 Perdiste esta ronda.";
    }

    const newBalance = currentBalance + winAmount - bet;
    await updateUserBalance(user.id, newBalance, bet, winAmount);
    setResult(message);
    setRolling(false);
  };

  return (
    <LinearGradient colors={["#0a0a0a", "#1a1a1a", "#000"]} style={styles.container}>
      <Text style={styles.title}>🎲 Dice Duel</Text>

      <Animated.View
        style={[
          styles.diceContainer,
          {
            transform: [
              {
                rotate: spinAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.label}>Tú</Text>
            <Image
              source={require("../../../assets/dice.png")}
              style={[
                styles.dice,
                { opacity: playerRoll ? 1 : 0.4 },
              ]}
            />
            <Text style={styles.value}>{playerRoll ?? "-"}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Dealer</Text>
            <Image
              source={require("../../../assets/dice.png")}
              style={[
                styles.dice,
                { opacity: dealerRoll ? 1 : 0.4 },
              ]}
            />
            <Text style={styles.value}>{dealerRoll ?? "-"}</Text>
          </View>
        </View>
      </Animated.View>

      <TouchableOpacity
        style={[styles.button, rolling && { opacity: 0.5 }]}
        onPress={rollDice}
        disabled={rolling}
      >
        <Ionicons name="refresh" size={22} color="#000" />
        <Text style={styles.buttonText}>Lanzar Dados</Text>
      </TouchableOpacity>

      {result && <Text style={styles.result}>{result}</Text>}
    </LinearGradient>
  );
};

export default DiceDuel;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 28,
    color: "#FFD700",
    fontWeight: "700",
    marginBottom: 30,
  },
  diceContainer: {
    marginBottom: 40,
  },
  row: {
    flexDirection: "row",
    gap: 40,
  },
  card: {
    alignItems: "center",
  },
  label: {
    color: "#ccc",
    marginBottom: 8,
    fontSize: 16,
  },
  dice: {
    width: 80,
    height: 80,
    tintColor: "#FFD700",
    marginBottom: 8,
  },
  value: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  result: {
    fontSize: 18,
    color: "#fff",
    marginTop: 25,
    textAlign: "center",
  },
});
