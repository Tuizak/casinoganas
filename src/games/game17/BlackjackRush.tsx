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
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const BlackjackRush = () => {
  const { user } = useAuth();
  const [playerCards, setPlayerCards] = useState<number[]>([]);
  const [dealerCards, setDealerCards] = useState<number[]>([]);
  const [balance, setBalance] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const drawCard = () => Math.floor(Math.random() * 10) + 1;

  const calculateTotal = (cards: number[]) =>
    cards.reduce((sum, val) => sum + val, 0);

  const startGame = async () => {
    if (!user) return;
    if (playing) return;

    const bet = 100;
    const balanceData = await getUserBalance(user.id);
    let currentBalance = balanceData.balance;

    if (currentBalance < bet) {
      Alert.alert("Saldo insuficiente", "Recarga tus créditos para jugar.");
      return;
    }

    setPlaying(true);
    setResult(null);

    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];
    setPlayerCards(player);
    setDealerCards(dealer);
    setBalance(currentBalance - bet);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const stand = async () => {
    let playerTotal = calculateTotal(playerCards);
    let dealerTotal = calculateTotal(dealerCards);

    while (dealerTotal < 17) {
      dealerTotal += drawCard();
    }

    let winAmount = 0;
    let message = "";

    if (playerTotal > 21) {
      message = "💥 Te pasaste de 21, pierdes.";
    } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
      winAmount = 200;
      message = "🎉 ¡Ganaste $200!";
    } else if (playerTotal === dealerTotal) {
      winAmount = 100;
      message = "🤝 Empate. Recuperas tu apuesta.";
    } else {
      message = "😢 El dealer gana esta vez.";
    }

    const newBalance = balance + winAmount;
    await updateUserBalance(user.id, newBalance, 100, winAmount);
    setBalance(newBalance);
    setResult(message);
    setPlaying(false);
  };

  const hit = () => {
    const newCards = [...playerCards, drawCard()];
    setPlayerCards(newCards);

    if (calculateTotal(newCards) > 21) {
      setResult("💥 Te pasaste de 21, pierdes.");
      setPlaying(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0a0a0a", "#1a1a1a", "#000"]}
      style={styles.container}
    >
      <Text style={styles.title}>🃏 Blackjack Rush</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dealer</Text>
        <Text style={styles.cards}>{dealerCards.join("  ") || "--"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jugador</Text>
        <Text style={styles.cards}>{playerCards.join("  ") || "--"}</Text>
      </View>

      {!playing ? (
        <TouchableOpacity style={styles.playButton} onPress={startGame}>
          <Ionicons name="play" size={22} color="#000" />
          <Text style={styles.playText}>Jugar</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#FFD700" }]}
            onPress={hit}
          >
            <Text style={styles.actionText}>Pedir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
            onPress={stand}
          >
            <Text style={styles.actionText}>Plantarse</Text>
          </TouchableOpacity>
        </View>
      )}

      {result && <Text style={styles.result}>{result}</Text>}
    </LinearGradient>
  );
};

export default BlackjackRush;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 28,
    color: "#FFD700",
    fontWeight: "700",
    marginBottom: 20,
  },
  section: {
    marginVertical: 15,
    alignItems: "center",
  },
  sectionTitle: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 8,
  },
  cards: {
    fontSize: 24,
    color: "#fff",
    letterSpacing: 4,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 30,
    gap: 8,
  },
  playText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 30,
  },
  actionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  actionText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  result: {
    marginTop: 40,
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});
