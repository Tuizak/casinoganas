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

const CardFlipCasino = () => {
  const { user } = useAuth();
  const [flipped, setFlipped] = useState(false);
  const [card, setCard] = useState<"heart" | "spade" | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [playing, setPlaying] = useState(false);

  const flipCard = async () => {
    if (playing || !user) return;
    setPlaying(true);
    setResult(null);
    setFlipped(false);

    const bet = 50;
    const balanceData = await getUserBalance(user.id);
    let currentBalance = balanceData.balance;

    if (currentBalance < bet) {
      Alert.alert("Saldo insuficiente", "Recarga tus créditos para jugar.");
      setPlaying(false);
      return;
    }

    // Animación de flip
    Animated.sequence([
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      const isWin = Math.random() < 0.5; // 50% de probabilidad
      const cardType = isWin ? "heart" : "spade";
      setCard(cardType);
      setFlipped(true);

      const reward = isWin ? 120 : 0;
      const newBalance = currentBalance + (reward - bet);

      await updateUserBalance(user.id, newBalance, bet, reward);
      setResult(
        isWin ? "❤️ ¡Carta ganadora! +$120" : "♠️ Carta perdedora, suerte la próxima."
      );
      setPlaying(false);
    });
  };

  const rotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
      <Text style={styles.title}>🃏 CardFlip Casino</Text>

      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ rotateY: rotation }],
          },
        ]}
      >
        {flipped ? (
          <Image
            source={
              card === "heart"
                ? require("../../../assets/card_heart.png")
                : require("../../../assets/card_spade.png")
            }
            style={styles.cardImage}
          />
        ) : (
          <Image
            source={require("../../../assets/card_back.png")}
            style={styles.cardImage}
          />
        )}
      </Animated.View>

      <TouchableOpacity
        style={[styles.button, playing && { opacity: 0.5 }]}
        onPress={flipCard}
        disabled={playing}
      >
        <Ionicons name="refresh" size={22} color="#000" />
        <Text style={styles.buttonText}>Girar Carta</Text>
      </TouchableOpacity>

      {result && <Text style={styles.result}>{result}</Text>}
    </LinearGradient>
  );
};

export default CardFlipCasino;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 26,
    color: "#FFD700",
    fontWeight: "700",
    marginBottom: 30,
  },
  cardContainer: {
    width: 180,
    height: 260,
    backgroundColor: "#222",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  cardImage: {
    width: 160,
    height: 230,
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
