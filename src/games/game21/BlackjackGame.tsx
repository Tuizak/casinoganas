import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const suits = ["♠️", "♥️", "♦️", "♣️"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function getCardValue(value: string) {
  if (["J", "Q", "K"].includes(value)) return 10;
  if (value === "A") return 11;
  return parseInt(value, 10);
}

const BlackjackGame = () => {
  const [deck, setDeck] = useState(createDeck());
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);

  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(100);

  const [gameOver, setGameOver] = useState(true);
  const [message, setMessage] = useState("Configura tu apuesta y presiona JUGAR");
  const [showDealerCards, setShowDealerCards] = useState(false);

  // ANIMACIONES NATIVAS
  const flipAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [glowWinner, setGlowWinner] = useState(false);

  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const flipDealerCard = () => {
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const calculateTotal = (cards) => {
    let total = 0;
    let aces = 0;

    for (const card of cards) {
      total += getCardValue(card.value);
      if (card.value === "A") aces++;
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  };

  const startGame = () => {
    if (bet > balance) {
      Alert.alert("Fondos insuficientes", "Baja tu apuesta.");
      return;
    }

    const newDeck = createDeck();
    const player = [newDeck.pop(), newDeck.pop()];
    const dealer = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayerCards(player);
    setDealerCards(dealer);

    const pTotal = calculateTotal(player);
    setPlayerTotal(pTotal);
    setDealerTotal(calculateTotal(dealer));

    flipAnim.setValue(0);
    setGlowWinner(false);
    setShowDealerCards(false);
    setGameOver(false);
    setBalance((prev) => prev - bet);
    setMessage("Tu turno ✨ ¿Pedir o plantarte?");

    // BLACKJACK NATURAL
    if (pTotal === 21) {
      setMessage("🔥 BLACKJACK NATURAL — Pagado 3:2");
      setBalance((b) => b + bet * 2.5);
      setGlowWinner(true);
      setGameOver(true);
      return;
    }
  };

  const hit = () => {
    if (gameOver) return;

    const newDeck = [...deck];
    const newCard = newDeck.pop();
    if (!newCard) return;

    const newHand = [...playerCards, newCard];
    const total = calculateTotal(newHand);

    setDeck(newDeck);
    setPlayerCards(newHand);
    setPlayerTotal(total);

    if (total > 21) {
      setMessage("💀 Te pasaste de 21");
      shake();
      endRound("dealer");
    }
  };

  const stand = () => {
    if (gameOver) return;

    setShowDealerCards(true);
    flipDealerCard();
    setMessage("Turno del dealer 🎲");

    let dealerHand = [...dealerCards];
    let total = calculateTotal(dealerHand);

    const tempDeck = [...deck];
    while (total < 17 && tempDeck.length > 0) {
      const newCard = tempDeck.pop();
      dealerHand.push(newCard);
      total = calculateTotal(dealerHand);
    }

    setDeck(tempDeck);
    setDealerCards(dealerHand);
    setDealerTotal(total);

    setTimeout(() => {
      if (total > 21) endRound("player");
      else if (total > playerTotal) endRound("dealer");
      else if (total < playerTotal) endRound("player");
      else endRound("draw");
    }, 800);
  };

  const endRound = (winner) => {
    setGameOver(true);

    if (winner === "player") {
      setGlowWinner(true);
      setBalance((b) => b + bet * 2);
      setMessage("🏆 ¡Ganaste la mano!");
    } else if (winner === "dealer") {
      shake();
      setMessage("😢 El dealer gana esta vez.");
    } else {
      setBalance((b) => b + bet);
      setMessage("🤝 Empate, recuperas tu apuesta.");
    }
  };

  const doubleDown = () => {
    if (balance < bet) {
      Alert.alert("Sin créditos", "No puedes doblar tu apuesta.");
      return;
    }
    setBet((b) => b * 2);
    hit();
    setTimeout(stand, 600);
  };

  const changeBet = (delta) => {
    if (!gameOver) return;

    setBet((prev) => {
      let next = prev + delta;
      if (next < 10) next = 10;
      if (next > balance) next = balance;
      return next;
    });
  };

  const renderCard = (card, i, type) => {
    const isRed = card.suit === "♥️" || card.suit === "♦️";
    const colors = type === "dealer" ? ["#f7b733", "#fc4a1a"] : ["#6a11cb", "#2575fc"];

    return (
      <View key={i} style={[styles.cardContainer, glowWinner && type === "player" && styles.glow]}>
        <LinearGradient colors={colors} style={styles.card}>
          <Text style={styles.cardValue}>{card.value}</Text>
          <Text style={[styles.cardSuit, { color: isRed ? "#ffb3b3" : "#cfe9ff" }]}>
            {card.suit}
          </Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#050815", "#12032f", "#050815"]} style={styles.screen}>
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Blackjack Royale</Text>

          <LinearGradient colors={["#ffd700", "#ff9100"]} style={styles.balanceBox}>
            <Ionicons name="wallet" size={20} color="#000" />
            <Text style={styles.balanceValue}>{balance}</Text>
          </LinearGradient>
        </View>

        {/* APUESTA */}
        <View style={styles.betPanel}>
          <Text style={styles.betLabel}>Apuesta actual</Text>
          <View style={styles.betRow}>
            <TouchableOpacity style={styles.betBtn} onPress={() => changeBet(-10)}>
              <Text style={styles.betBtnText}>-10</Text>
            </TouchableOpacity>

            <LinearGradient colors={["#8e24aa", "#3949ab"]} style={styles.betValueBox}>
              <Ionicons name="pricetag" size={18} color="#ffd54f" />
              <Text style={styles.betValueText}>{bet} CR</Text>
            </LinearGradient>

            <TouchableOpacity style={styles.betBtn} onPress={() => changeBet(10)}>
              <Text style={styles.betBtnText}>+10</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MESA */}
        <LinearGradient colors={["#005c3a", "#003b26"]} style={styles.table}>
          {/* Dealer */}
          <View style={styles.section}>
            <Text style={styles.handTitle}>
              👑 Dealer — Total: {showDealerCards ? dealerTotal : "?"}
            </Text>
            <View style={styles.cardsRow}>
              {dealerCards.map((card, i) =>
                showDealerCards || i === 0 ? (
                  <Animated.View
                    key={i}
                    style={{
                      transform: [
                        {
                          rotateY: flipAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    {renderCard(card, i, "dealer")}
                  </Animated.View>
                ) : (
                  renderCard({ value: "?", suit: "?" }, i, "dealer")
                )
              )}
            </View>
          </View>

          {/* Jugador */}
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.handTitle}>💎 Tú — Total: {playerTotal}</Text>

            <View style={styles.cardsRow}>
              {playerCards.map((card, i) => renderCard(card, i, "player"))}
            </View>
          </View>
        </LinearGradient>

        {/* MENSAJE */}
        <View style={styles.messageBox}>
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* BOTONES */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.mainBtn} onPress={startGame}>
            <LinearGradient colors={["#ffea00", "#ff9800"]} style={styles.mainBtnGradient}>
              <Ionicons name="play" size={22} color="#000" />
              <Text style={[styles.mainBtnText, { color: "#000" }]}>JUGAR / REPARTIR</Text>
            </LinearGradient>
          </TouchableOpacity>

          {!gameOver && (
            <View style={styles.secondaryRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={hit}>
                <LinearGradient colors={["#00b09b", "#96c93d"]} style={styles.secondaryGradient}>
                  <Ionicons name="hand-right" size={20} color="#fff" />
                  <Text style={styles.secondaryText}>Pedir</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={stand}>
                <LinearGradient colors={["#ff416c", "#ff4b2b"]} style={styles.secondaryGradient}>
                  <Ionicons name="stop-circle" size={20} color="#fff" />
                  <Text style={styles.secondaryText}>Plantarse</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={doubleDown}>
                <LinearGradient colors={["#ffe600", "#ffba00"]} style={styles.secondaryGradient}>
                  <Ionicons name="flash" size={20} color="#000" />
                  <Text style={[styles.secondaryText, { color: "#000", fontWeight: "900" }]}>
                    Doblar
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>

      <Text style={styles.footer}>Créditos virtuales. Juego recreativo.</Text>
    </LinearGradient>
  );
};

export default BlackjackGame;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffd700",
  },
  balanceBox: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  balanceValue: {
    color: "#000",
    fontWeight: "900",
    marginLeft: 6,
  },

  betPanel: { marginBottom: 10 },
  betLabel: { color: "#cfd8dc", marginBottom: 4 },
  betRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  betBtn: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 40,
    alignItems: "center",
  },
  betBtnText: { color: "#fff", fontWeight: "900" },
  betValueBox: {
    flex: 2,
    padding: 10,
    borderRadius: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  betValueText: { color: "#fff", fontWeight: "900" },

  table: {
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  section: { marginBottom: 10 },
  handTitle: {
    color: "#fff",
    fontWeight: "800",
    marginBottom: 5,
  },
  cardsRow: { flexDirection: "row", justifyContent: "center", gap: 12 },

  card: {
    width: width * 0.18,
    height: width * 0.26,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    shadowColor: "#ffe066",
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 15,
  },
  cardValue: { fontSize: 22, fontWeight: "900", color: "#fff" },
  cardSuit: { fontSize: 20, marginTop: 4 },

  messageBox: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  message: { color: "#fff", textAlign: "center" },

  actions: { marginBottom: 12 },
  mainBtn: { borderRadius: 22, overflow: "hidden", marginBottom: 8 },
  mainBtnGradient: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  mainBtnText: { fontWeight: "900", letterSpacing: 1 },

  secondaryRow: { flexDirection: "row", gap: 8 },
  secondaryBtn: { flex: 1, borderRadius: 20, overflow: "hidden" },
  secondaryGradient: {
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryText: { color: "#fff", fontWeight: "800" },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#9e9e9e",
    marginBottom: 5,
  },
});
