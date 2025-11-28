import React, { useState, useRef, useEffect } from "react";
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

// Valores
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const BASE_STEP = 10;

// =============================
// FUNCIONES
// =============================
const getRandomCard = () => {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const value = RANKS[Math.floor(Math.random() * RANKS.length)];
  return { suit, value };
};

const getRankValue = (v) => {
  if (v === "A") return 1;
  if (v === "J") return 11;
  if (v === "Q") return 12;
  if (v === "K") return 13;
  return parseInt(v, 10);
};

const getSuitColor = (suit) => {
  if (suit === "♥" || suit === "♦") return "#ff5252";
  return "#ffffff";
};

// =============================
// COMPONENTE PRINCIPAL
// =============================
const DragonTigerScreen = () => {
  const [credits, setCredits] = useState(500);

  const [dragonBet, setDragonBet] = useState(0);
  const [tigerBet, setTigerBet] = useState(0);
  const [tieBet, setTieBet] = useState(0);

  const [dragonCard, setDragonCard] = useState(null);
  const [tigerCard, setTigerCard] = useState(null);

  const [resultText, setResultText] = useState("Coloca tus apuestas y reparte las cartas.");
  const [phase, setPhase] = useState("betting");

  const totalBet = dragonBet + tigerBet + tieBet;

  // =============================
  // Animaciones PRO
  // =============================
  const dragonFlip = useRef(new Animated.Value(0)).current;
  const tigerFlip = useRef(new Animated.Value(0)).current;
  const messageFade = useRef(new Animated.Value(1)).current;

  const triggerFlip = (anim) => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  };

  const fadeMessage = () => {
    Animated.sequence([
      Animated.timing(messageFade, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      Animated.timing(messageFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // =============================
  // Apuestas
  // =============================
  const handleAddBet = (target) => {
    if (phase === "reveal") return;

    if (credits < BASE_STEP) {
      Alert.alert("Sin créditos", `Necesitas ${BASE_STEP} CR`);
      return;
    }

    setCredits((c) => c - BASE_STEP);
    if (target === "dragon") setDragonBet((v) => v + BASE_STEP);
    if (target === "tiger") setTigerBet((v) => v + BASE_STEP);
    if (target === "tie") setTieBet((v) => v + BASE_STEP);
  };

  const handleClearBets = () => {
    if (phase === "reveal") return;

    const refund = totalBet;
    if (refund > 0) {
      setCredits((c) => c + refund);
      setDragonBet(0);
      setTigerBet(0);
      setTieBet(0);
      setResultText("Apuestas limpiadas.");
    }
  };

  // =============================
  // Repartir
  // =============================
  const handleDeal = () => {
    if (phase === "reveal") {
      // Nueva ronda
      setPhase("betting");
      setDragonCard(null);
      setTigerCard(null);
      setDragonBet(0);
      setTigerBet(0);
      setTieBet(0);
      setResultText("Coloca tus apuestas y reparte las cartas.");
      return;
    }

    if (totalBet <= 0) {
      return Alert.alert("Sin apuesta", "Apuesta a Dragon, Tiger o Tie.");
    }

    const d = getRandomCard();
    const t = getRandomCard();

    setDragonCard(d);
    setTigerCard(t);

    // Animaciones de flip
    triggerFlip(dragonFlip);
    triggerFlip(tigerFlip);
    fadeMessage();

    const dv = getRankValue(d.value);
    const tv = getRankValue(t.value);

    let txt = "";
    let winnings = 0;

    if (dv > tv) {
      txt = "🐉 Dragon gana";
      winnings += dragonBet * 2;
    } else if (tv > dv) {
      txt = "🐯 Tiger gana";
      winnings += tigerBet * 2;
    } else {
      txt = "⚖️ Empate";
      winnings += tieBet * 9;
      winnings += dragonBet + tigerBet;
    }

    if (winnings > 0) {
      setCredits((c) => c + winnings);
      setResultText(`${txt}\nGanaste ${winnings} CR`);
    } else {
      setResultText(`${txt}\nNo hubo premios`);
    }

    setPhase("reveal");
  };

  // =============================
  // Render carta PRO con animación
  // =============================
  const renderAnimatedCard = (card, label, anim, colors) => {
    const rotateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: ["90deg", "0deg"],
    });

    return (
      <View style={styles.cardColumn}>
        <Text style={[styles.cardLabel, { color: colors[1] }]}>{label}</Text>

        <Animated.View style={{ transform: [{ rotateY }] }}>
          <LinearGradient colors={colors} style={styles.cardGlow}>
            <View style={styles.card}>
              {card ? (
                <>
                  <Text style={styles.cardValue}>{card.value}</Text>
                  <Text style={[styles.cardSuit, { color: getSuitColor(card.suit) }]}>
                    {card.suit}
                  </Text>
                </>
              ) : (
                <Text style={styles.cardPlaceholder}>?</Text>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#050816", "#12032d", "#2b1055"]} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Dragon Tiger NG</Text>
        <Text style={styles.subtitle}>Apuesta a la carta más alta</Text>
        <Text style={styles.credits}>Créditos: {credits}</Text>
      </View>

      {/* CARTAS */}
      <View style={styles.cardsRow}>
        {renderAnimatedCard(dragonCard, "DRAGON", dragonFlip, ["#ff9100", "#ff3d00"])}
        <LinearGradient colors={["#ff4081", "#ff9100"]} style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </LinearGradient>
        {renderAnimatedCard(tigerCard, "TIGER", tigerFlip, ["#00e5ff", "#2979ff"])}
      </View>

      {/* MENSAJE */}
      <Animated.View style={[styles.messageBox, { opacity: messageFade }]}>
        <Text style={styles.message}>{resultText}</Text>
      </Animated.View>

      {/* APUESTAS */}
      <View style={styles.betsRow}>
        <TouchableOpacity onPress={() => handleAddBet("dragon")} style={styles.betButton}>
          <LinearGradient colors={["#ff9100", "#ff3d00"]} style={styles.betGradient}>
            <Text style={styles.betLabel}>Dragon</Text>
            <Text style={styles.betValue}>{dragonBet} CR</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleAddBet("tie")} style={styles.betButton}>
          <LinearGradient colors={["#8e24aa", "#d81b60"]} style={styles.betGradient}>
            <Text style={styles.betLabel}>Tie</Text>
            <Text style={styles.betValue}>{tieBet} CR</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleAddBet("tiger")} style={styles.betButton}>
          <LinearGradient colors={["#00e5ff", "#2979ff"]} style={styles.betGradient}>
            <Text style={styles.betLabel}>Tiger</Text>
            <Text style={styles.betValue}>{tigerBet} CR</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* BOTÓN */}
      <TouchableOpacity onPress={handleDeal} style={styles.mainButton}>
        <LinearGradient
          colors={["#ffd700", "#ff9100"]}
          style={styles.mainButtonGradient}
        >
          <Ionicons
            name={phase === "betting" ? "play" : "refresh"}
            size={20}
            color="#000"
          />
          <Text style={styles.mainButtonText}>
            {phase === "betting"
              ? totalBet > 0
                ? `Repartir (${totalBet} CR)`
                : "Repartir cartas"
              : "Nueva ronda"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default DragonTigerScreen;

// =============================
// ESTILOS
// =============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 50,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
  },
  subtitle: {
    fontSize: 12,
    color: "#cfd8dc",
    marginTop: 4,
  },
  credits: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: "#ffd600",
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardColumn: {
    flex: 1,
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardGlow: {
    padding: 5,
    borderRadius: 16,
  },
  card: {
    width: 95,
    height: 130,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#000",
  },
  cardSuit: {
    fontSize: 24,
    marginTop: 4,
  },
  cardPlaceholder: {
    fontSize: 34,
    fontWeight: "900",
    color: "rgba(0,0,0,0.12)",
  },
  vsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
  messageBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  message: {
    color: "#fff",
    textAlign: "center",
  },
  betsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  betButton: {
    flex: 1,
  },
  betGradient: {
    paddingVertical: 14,
    borderRadius: 14,
  },
  betLabel: {
    textAlign: "center",
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  betValue: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  mainButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  mainButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  mainButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#000",
  },
});
