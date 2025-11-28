import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// No usamos expo-av, no usamos sonidos ✔️

// Dimensiones
const { width } = Dimensions.get("window");

// Valores
const VALUES = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const SUITS = ["♠","♥","♦","♣"];
const ANTE_BASE = 50;

// ===========================
// CREAR BARAJA
// ===========================
const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      const rankMap = {
        "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
        "7": 7, "8": 8, "9": 9, "10": 10,
        J: 11, Q: 12, K: 13, A: 14,
      };
      deck.push({ value, suit, rank: rankMap[value] });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

// ===========================
// EVALUAR MANO
// ===========================
const evaluateHand = (cards) => {
  const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
  const isA23 = ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 14;
  const straightNormal = ranks[0] + 1 === ranks[1] && ranks[1] + 1 === ranks[2];
  const isStraight = isA23 || straightNormal;

  const isThreeKind = ranks[0] === ranks[1] && ranks[1] === ranks[2];
  const isPair =
    (ranks[0] === ranks[1] && ranks[1] !== ranks[2]) ||
    (ranks[1] === ranks[2] && ranks[0] !== ranks[1]);

  let score = 0;
  let rankName = "high-card";
  let tiebreak = [];

  if (isStraight && isFlush) {
    score = 5;
    rankName = "straight-flush";
    tiebreak = isA23 ? [3,2,1] : [...ranks].reverse();
  } else if (isThreeKind) {
    score = 4;
    rankName = "three-kind";
    tiebreak = [ranks[0]];
  } else if (isStraight) {
    score = 3;
    rankName = "straight";
    tiebreak = isA23 ? [3,2,1] : [...ranks].reverse();
  } else if (isFlush) {
    score = 2;
    rankName = "flush";
    tiebreak = [...ranks].reverse();
  } else if (isPair) {
    score = 1;
    rankName = "pair";
    const pairRank = ranks[0] === ranks[1] ? ranks[0] : ranks[1];
    const kicker = ranks[0] === ranks[1] ? ranks[2] : ranks[0];
    tiebreak = [pairRank, kicker];
  } else {
    score = 0;
    rankName = "high-card";
    tiebreak = [...ranks].reverse();
  }

  return { score, rankName, tiebreak };
};

// ===========================
// COMPARAR JUGADOR VS DEALER
// ===========================
const compareHands = (player, dealer) => {
  if (player.score > dealer.score) return "player";
  if (player.score < dealer.score) return "dealer";

  for (let i = 0; i < player.tiebreak.length; i++) {
    const p = player.tiebreak[i];
    const d = dealer.tiebreak[i];
    if (p > d) return "player";
    if (p < d) return "dealer";
  }

  return "tie";
};

const getRankLabel = (rank) => {
  switch (rank) {
    case "straight-flush": return "Escalera de color";
    case "three-kind": return "Trío";
    case "straight": return "Escalera";
    case "flush": return "Color";
    case "pair": return "Par";
    default: return "Carta alta";
  }
};

// ===========================
// COMPONENTE PRINCIPAL
// ===========================
const ThreeCardPokerUltra = () => {

  const [deck, setDeck] = useState(createDeck());
  const [credits, setCredits] = useState(2000);
  const [ante, setAnte] = useState(ANTE_BASE);

  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);

  const [phase, setPhase] = useState("idle");
  const [showDealer, setShowDealer] = useState(false);
  const [message, setMessage] = useState("Presiona REPARTIR para comenzar.");
  const [lastResult, setLastResult] = useState(null);

  const [playerEval, setPlayerEval] = useState(null);
  const [dealerEval, setDealerEval] = useState(null);

  const dealerFade = useRef(new Animated.Value(0)).current;

  const animateDealerReveal = () => {
    Animated.timing(dealerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Sonido deshabilitado SIN romper nada
  const play = async () => {};

  // ===========================
  // REPARTIR
  // ===========================
  const dealCards = () => {
    if (credits < ante) {
      return Alert.alert("Créditos insuficientes", "No tienes suficientes créditos.");
    }

    let newDeck = deck.length < 12 ? createDeck() : [...deck];

    const player = [newDeck.pop(), newDeck.pop(), newDeck.pop()];
    const dealer = [newDeck.pop(), newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayerCards(player);
    setDealerCards(dealer);

    setPlayerEval(evaluateHand(player));
    setDealerEval(null);

    setCredits((c) => c - ante);
    setPhase("dealt");
    setShowDealer(false);
    dealerFade.setValue(0);
    setLastResult(null);
    setMessage("¿JUGAR o RETIRARSE?");

    play(); // sin mp3 ✔️
  };

  // ===========================
  // RETIRARSE
  // ===========================
  const handleFold = () => {
    setPhase("resolved");
    setMessage("Te retiraste. Pierdes la apuesta.");
    setLastResult("fold");
  };

  // ===========================
  // JUGAR
  // ===========================
  const handlePlay = () => {
    if (credits < ante) {
      return Alert.alert("Créditos insuficientes", "No puedes igualar.");
    }

    setCredits((c) => c - ante);

    const dEval = evaluateHand(dealerCards);
    setDealerEval(dEval);
    setShowDealer(true);
    animateDealerReveal();

    const winner = compareHands(playerEval, dEval);
    setPhase("resolved");

    if (winner === "player") {
      let payout = ante * 4;
      let bonus = 0;

      if (playerEval.rankName === "straight-flush") bonus = ante * 3;
      if (playerEval.rankName === "three-kind") bonus = ante * 2;
      if (playerEval.rankName === "straight" || playerEval.rankName === "flush")
        bonus = ante;

      setCredits((c) => c + payout + bonus);
      setMessage(`Ganaste.\n${getRankLabel(playerEval.rankName)}\nBonus: ${bonus} CR`);
      setLastResult("win");
      play();
    } 
    else if (winner === "dealer") {
      setMessage("El dealer gana.");
      setLastResult("lose");
      play();
    } 
    else {
      const refund = ante * 2;
      setCredits((c) => c + refund);
      setMessage("Empate. Recuperas tu apuesta.");
      setLastResult("tie");
    }
  };

  const resetTable = () => {
    setPhase("idle");
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerEval(null);
    setDealerEval(null);
    dealerFade.setValue(0);
    setMessage("Presiona REPARTIR para comenzar.");
    setLastResult(null);
  };

  const adjustAnte = (d) => {
    setAnte((prev) => {
      const next = prev + d;
      if (next < 10) return 10;
      if (next > 500) return 500;
      return next;
    });
  };

  // ===========================
  // RENDER CARTA
  // ===========================
  const renderCard = (card, index, hidden) => (
    <LinearGradient
      key={index}
      colors={hidden ? ["#222","#000"] : ["#6a11cb","#2575fc"]}
      style={styles.card}
    >
      <Text style={styles.cardCorner}>{hidden ? "" : card.value}</Text>
      <Text style={styles.cardSuit}>{hidden ? "?" : card.suit}</Text>
      <Text style={[styles.cardCorner, { transform: [{ rotate: "180deg" }] }]}>
        {hidden ? "" : card.value}
      </Text>
    </LinearGradient>
  );

  const playerRank = playerEval ? getRankLabel(playerEval.rankName) : "—";
  const dealerRank = dealerEval ? getRankLabel(dealerEval.rankName) : "—";

  return (
    <LinearGradient colors={["#050816","#12032d","#200b45"]} style={styles.screen}>

      {/* HEADER */}
      <LinearGradient colors={["#FFD700","#FF9100"]} style={styles.header}>
        <Text style={styles.title}>Three Card Poker</Text>
        <Text style={styles.subtitle}>Mejor mano de 3 cartas gana</Text>
        <View style={styles.credits}>
          <Text style={styles.creditsLabel}>Créditos</Text>
          <Text style={styles.creditsValue}>{credits}</Text>
        </View>
      </LinearGradient>

      {/* RESULTADO */}
      {lastResult && (
        <LinearGradient colors={["#333","#000"]} style={styles.resultBox}>
          <Text style={styles.resultText}>{`Resultado: ${lastResult.toUpperCase()}`}</Text>
        </LinearGradient>
      )}

      {/* Apuestas */}
      <View style={styles.hud}>
        <Text style={styles.hudTitle}>Ante: {ante} CR</Text>
        <View style={styles.anteRow}>
          <TouchableOpacity onPress={() => adjustAnte(-10)} style={styles.chipBtn}>
            <Text style={styles.chipTxt}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => adjustAnte(+10)} style={styles.chipBtn}>
            <Text style={styles.chipTxt}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DEALER */}
      <View style={styles.handBlock}>
        <Text style={styles.handLabel}>DEALER ({showDealer ? dealerRank : "Oculto"})</Text>
        <View style={styles.cardsRow}>
          {dealerCards.map((c,i)=>renderCard(c,i,!showDealer))}
        </View>

        {showDealer && (
          <Animated.Text style={[styles.evalText,{opacity:dealerFade}]}>
            Mano: {dealerRank}
          </Animated.Text>
        )}
      </View>

      {/* VS */}
      <Text style={styles.vs}>VS</Text>

      {/* PLAYER */}
      <View style={styles.handBlock}>
        <Text style={[styles.handLabel,{color:"#00e5ff"}]}>TÚ ({playerRank})</Text>

        <View style={styles.cardsRow}>
          {playerCards.length === 3
            ? playerCards.map((c,i)=>renderCard(c,i,false))
            : [1,2,3].map((_,i)=>renderCard(null,i,true))
          }
        </View>
      </View>

      {/* MENSAJE */}
      <View style={styles.msgBox}>
        <Text style={styles.msg}>{message}</Text>
      </View>

      {/* BOTONES */}
      <View style={styles.actions}>
        {phase === "dealt" ? (
          <>
            <TouchableOpacity onPress={handleFold} style={styles.btnSecondary}>
              <LinearGradient colors={["#616161","#212121"]} style={styles.btnGrad}>
                <Text style={styles.btnTxt}>Retirarse</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlay} style={styles.btnPrimary}>
              <LinearGradient colors={["#00c853","#64dd17"]} style={styles.btnGrad}>
                <Text style={styles.btnTxt}>Jugar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={dealCards} style={styles.btnFull}>
            <LinearGradient colors={["#8E2DE2","#4A00E0"]} style={styles.btnGrad}>
              <Text style={styles.btnTxt}>Repartir ({ante} CR)</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={resetTable} style={styles.resetRow}>
          <Ionicons name="refresh" size={14} color="#bbb" />
          <Text style={styles.resetTxt}>Limpiar mesa</Text>
        </TouchableOpacity>
      </View>

    </LinearGradient>
  );
};

export default ThreeCardPokerUltra;

// ===========================
// ESTILOS
// ===========================
const CARD_W = width * 0.24;
const CARD_H = CARD_W * 1.45;

const styles = StyleSheet.create({
  screen: { flex:1, padding:16 },
  header: {
    padding:16, borderRadius:16, marginBottom:10,
    borderWidth:1, borderColor:"rgba(255,255,255,0.2)"
  },
  title: { fontSize:22, fontWeight:"900", color:"#1a0a00" },
  subtitle: { fontSize:11, color:"#3a2600" },
  credits: { marginTop:4 },
  creditsLabel: { fontSize:11, color:"#fff" },
  creditsValue: { fontSize:18, fontWeight:"900", color:"#ffd600" },
  resultBox:{ padding:8, borderRadius:20, alignSelf:"center", marginVertical:6 },
  resultText:{ color:"#fff", fontWeight:"bold" },
  hud:{ marginVertical:10 },
  hudTitle:{ color:"#fff", fontWeight:"bold" },
  anteRow:{ flexDirection:"row", gap:10, marginTop:4 },
  chipBtn:{
    width:28,height:28,borderRadius:14,backgroundColor:"#333",
    alignItems:"center",justifyContent:"center"
  },
  chipTxt:{ color:"#fff", fontSize:18, fontWeight:"900" },
  handBlock:{ alignItems:"center", marginBottom:10 },
  handLabel:{ color:"#ffe082", fontSize:14, marginBottom:4,fontWeight:"bold" },
  cardsRow:{ flexDirection:"row", gap:10 },
  card:{
    width:CARD_W,height:CARD_H,borderRadius:12,
    alignItems:"center",justifyContent:"center",
    borderWidth:2,borderColor:"rgba(255,255,255,0.5)"
  },
  cardCorner:{ position:"absolute",top:6,left:6,color:"#fff", fontWeight:"900" },
  cardSuit:{ fontSize:28, color:"#fff" },
  evalText:{ marginTop:6, color:"#b0bec5" },
  vs:{ alignSelf:"center", fontSize:22, color:"#ff4081", fontWeight:"900" },
  msgBox:{ marginVertical:10, backgroundColor:"rgba(0,0,0,0.4)", padding:10, borderRadius:12 },
  msg:{ color:"#fff", textAlign:"center" },
  actions:{ alignItems:"center" },
  btnPrimary:{ width:"100%", borderRadius:20, overflow:"hidden", marginBottom:6 },
  btnSecondary:{ width:"100%", borderRadius:20, overflow:"hidden", marginBottom:6 },
  btnFull:{ width:"100%", borderRadius:20, overflow:"hidden", marginBottom:6 },
  btnGrad:{
    paddingVertical:12, alignItems:"center"
  },
  btnTxt:{ fontSize:14, fontWeight:"bold", color:"#fff" },
  resetRow:{ flexDirection:"row", alignItems:"center", marginTop:4 },
  resetTxt:{ marginLeft:4, color:"#bbb", fontSize:12, textDecorationLine:"underline" }
});
