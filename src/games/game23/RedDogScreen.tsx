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
import { Audio } from "expo-av";

// CARTAS
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const SUITS = ["♠","♥","♦","♣"];``
const BASE_BET = 10;

// RNG MODES
const RNG_MODES = ["HOT", "NORMAL", "COLD"];

const RedDogUltra: React.FC = () => {

  // -------------------------
  // ESTADOS PRINCIPALES
  // -------------------------
  const [credits, setCredits] = useState(500);
  const [firstCard, setFirstCard] = useState<string | null>(null);
  const [secondCard, setSecondCard] = useState<string | null>(null);
  const [thirdCard, setThirdCard] = useState<string | null>(null);

  const [spread, setSpread] = useState<number | null>(null);
  const [currentBet, setCurrentBet] = useState(BASE_BET);

  const [roundActive, setRoundActive] = useState(false);
  const [canRaise, setCanRaise] = useState(false);

  const [message, setMessage] = useState("Presiona REPARTIR para iniciar la ronda.");
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Rachas
  const [winStreak, setWinStreak] = useState(0);
  const [loseStreak, setLoseStreak] = useState(0);

  // Historial últimas 10 rondas
  const [history, setHistory] = useState<string[]>([]);

  // RNG dinámico
  const [rngMode, setRngMode] = useState("NORMAL");

  // Jackpot / Lucky Dog
  const [jackpotTriggered, setJackpotTriggered] = useState(false);
  const [luckyDog, setLuckyDog] = useState(false);

  // Animaciones
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeMsg = useRef(new Animated.Value(0)).current;

  // -------------------------
  // FUNCIONES AUXILIARES
  // -------------------------

  const playSound = async(name: string) => {
    try {
      const s = new Audio.Sound();
      if (name === "flip") await s.loadAsync(require("./sounds/flip.mp3"));
      if (name === "win") await s.loadAsync(require("./sounds/win.mp3"));
      if (name === "lose") await s.loadAsync(require("./sounds/lose.mp3"));
      if (name === "trio") await s.loadAsync(require("./sounds/trio.mp3"));
      await s.playAsync();
      setTimeout(() => s.unloadAsync(), 800);
    } catch {}
  };

  const getRandomCard = () => {
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    return `${rank}${suit}`;
  };

  const getCardValue = (card: string) => {
    const rank = card.replace(/[♠♥♦♣]/g, "");
    return RANKS.indexOf(rank);
  };

  const calcSpread = (a: string, b: string) => {
    const v1 = getCardValue(a);
    const v2 = getCardValue(b);
    const diff = Math.abs(v1 - v2);
    return diff - 1;
  };

  const getMultiplier = (s: number) => {
    if (s <= 1) return 0;
    if (s === 2) return 5;
    if (s === 3) return 4;
    if (s === 4) return 2;
    return 1;
  };

  // -------------------------
  // RNG DINÁMICO
  // -------------------------
  const getDynamicCard = () => {
    const roll = Math.random();

    // 30% cambia de modo
    if (roll < 0.30) {
      const newMode = RNG_MODES[Math.floor(Math.random() * RNG_MODES.length)];
      setRngMode(newMode);
    }

    // HOT = valores altos
    if (rngMode === "HOT" && Math.random() < 0.2) {
      const rank = ["7","8","9","10","J","Q"][Math.floor(Math.random()*6)];
      const suit = SUITS[Math.floor(Math.random()*4)];
      return `${rank}${suit}`;
    }

    // COLD = valores bajos
    if (rngMode === "COLD" && Math.random() < 0.2) {
      const rank = ["2","3","4","5","6"][Math.floor(Math.random()*5)];
      const suit = SUITS[Math.floor(Math.random()*4)];
      return `${rank}${suit}`;
    }

    return getRandomCard();
  };

  // -------------------------
  // INICIAR RONDA
  // -------------------------
  const startRound = () => {
    if (credits < BASE_BET) {
      Alert.alert("Sin créditos", "Necesitas más créditos para jugar.");
      return;
    }

    const c1 = getDynamicCard();
    const c2 = getDynamicCard();

    setFirstCard(c1);
    setSecondCard(c2);
    setThirdCard(null);
    setCurrentBet(BASE_BET);
    setLastResult(null);
    setRoundActive(true);
    setCanRaise(true);
    setMessage("Analizando cartas...");

    const v1 = getCardValue(c1);
    const v2 = getCardValue(c2);

    // PAR
    if (v1 === v2) {
      const c3 = getDynamicCard();
      setThirdCard(c3);

      const v3 = getCardValue(c3);

      if (v3 === v1) {
        const win = BASE_BET * 11;
        setCredits(prev => prev + win);
        setMessage("🔥 ¡TRÍO perfecto! Pago 11 a 1");
        setLastResult("trio");
        setWinStreak(prev => prev + 1);
        setLoseStreak(0);
        playSound("trio");
        triggerFlash();
      } else {
        setMessage("Par sin trío → Empate.");
        setLastResult("push");
      }

      pushHistory("PAR");
      setSpread(null);
      setRoundActive(false);
      setCanRaise(false);
      return;
    }

    // CONSECUTIVAS → PUSH
    if (Math.abs(v1 - v2) === 1) {
      setSpread(0);
      setMessage("Consecutivas — Empate.");
      setLastResult("push");
      pushHistory("CONSEC");
      setRoundActive(false);
      setCanRaise(false);
      return;
    }

    // SPREAD NORMAL
    const s = calcSpread(c1, c2);
    setSpread(s);
    const mult = getMultiplier(s);

    setMessage(`Spread: ${s} • Potencial: ${mult}:1`);
  };

  // -------------------------
  // RESOLVER RONDA (3ra carta)
  // -------------------------
  const resolveRound = (raise: boolean) => {
    if (!roundActive || spread === null) return;

    let bet = BASE_BET;

    if (raise) {
      const double = BASE_BET * 2;
      if (credits < double) {
        Alert.alert("Créditos insuficientes", "No puedes subir la apuesta.");
        return;
      }
      bet = double;
    }

    setCurrentBet(bet);

    // JACKPOT 1%
    if (Math.random() < 0.01) {
      const winJ = bet * 20;
      setCredits(prev => prev + winJ);
      setMessage(`🎰 ¡JACKPOT! x20 (+${winJ} CR)`);
      setLastResult("jackpot");
      playSound("win");
      triggerFlash();
      pushHistory("JACKPOT");
      setRoundActive(false);
      setCanRaise(false);
      return;
    }

    // LUCKY DOG 5%
    if (Math.random() < 0.05) {
      const winL = bet * 5;
      setCredits(prev => prev + winL);
      setMessage(`🐶 ¡Lucky Dog! (+${winL} CR)`);
      setLastResult("lucky");
      playSound("win");
      triggerFlash();
      pushHistory("LUCKY");
      setRoundActive(false);
      setCanRaise(false);
      return;
    }

    const c3 = getDynamicCard();
    setThirdCard(c3);

    const v1 = getCardValue(firstCard!);
    const v2 = getCardValue(secondCard!);
    const v3 = getCardValue(c3);

    const low = Math.min(v1, v2);
    const high = Math.max(v1, v2);
    const mult = getMultiplier(spread);

    if (v3 > low && v3 < high) {
      const win = bet * mult;

      // BONUS por racha
      const bonus = winStreak >= 3 ? 5 : 0;

      setCredits(prev => prev + win + bonus);

      setMessage(
        `🎉 ¡GANASTE! Pago ${mult}:1 ${bonus > 0 ? `(+${bonus} bonus)` : ""}`
      );
      setLastResult("win");
      setWinStreak(prev => prev + 1);
      setLoseStreak(0);
      pushHistory("WIN");

      playSound("win");
      triggerBounce();

    } else {
      setCredits(prev => prev - bet);
      setMessage(`💀 Perdiste (-${bet} CR)`);
      setLastResult("lose");
      setLoseStreak(prev => prev + 1);
      setWinStreak(0);
      pushHistory("LOSE");

      playSound("lose");
      triggerShake();
    }

    setRoundActive(false);
    setCanRaise(false);
  };

  // -------------------------
  // HISTORIAL
  // -------------------------
  const pushHistory = (txt: string) => {
    setHistory(prev => {
      let arr = [txt, ...prev];
      if (arr.length > 10) arr.pop();
      return arr;
    });
  };

  // -------------------------
  // RESET
  // -------------------------
  const resetGame = () => {
    setFirstCard(null);
    setSecondCard(null);
    setThirdCard(null);
    setSpread(null);
    setRoundActive(false);
    setCanRaise(false);
    setMessage("Presiona REPARTIR para iniciar la ronda.");
    setLastResult(null);
  };

  // -------------------------
  // AUTO PLAY PRO (20 rondas)
  // -------------------------
  const [autoPlay, setAutoPlay] = useState(false);
  const [roundsLeft, setRoundsLeft] = useState(0);

  const startAutoPlay = () => {
    if (credits < BASE_BET) {
      Alert.alert("Sin créditos", "No tienes créditos suficientes.");
      return;
    }
    setAutoPlay(true);
    setRoundsLeft(20);
    setMessage("AUTO-PLAY activado (20 rondas)");
  };

  useEffect(() => {
    if (!autoPlay) return;

    if (roundsLeft <= 0) {
      setAutoPlay(false);
      setMessage("Auto-Play finalizado.");
      return;
    }

    if (credits < BASE_BET) {
      setAutoPlay(false);
      setMessage("Auto-Play detenido (sin créditos).");
      return;
    }

    const timer = setTimeout(() => {
      startRound();

      setTimeout(() => {
        resolveRound(false);
        setRoundsLeft(prev => prev - 1);
      }, 450);

    }, 650);

    return () => clearTimeout(timer);
  }, [autoPlay, roundsLeft]);

  // =====================================================
  // ANIMACIONES — SHAKE / FLASH / FLIP / BOUNCE
  // =====================================================

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const triggerFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const triggerFlip = () => {
    flipAnim.setValue(0);
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const triggerBounce = () => {
    bounceAnim.setValue(0);
    Animated.spring(bounceAnim, {
      toValue: 1,
      tension: 40,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  // =====================================================
  // UI — CARTAS PREMIUM (flip + bounce + shake)
  // =====================================================

  const getSuitColor = (card: string) => {
    if (!card) return "#999";
    if (card.includes("♥") || card.includes("♦")) return "#ff1744";
    return "#111";
  };

  const CardPremium = ({ value, glowColor }: any) => {
    const flip = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    const scale = bounceAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.15],
    });

    return (
      <Animated.View
        style={{
          transform: [
            { rotateY: flip },
            { scale },
            { translateX: shakeAnim },
          ],
        }}
      >
        <LinearGradient colors={glowColor} style={styles.cardGlow}>
          <View style={[styles.card, { borderColor: glowColor[0] }]}>
            <Text style={[styles.cardText, { color: getSuitColor(value) }]}>
              {value || "?"}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // =====================================================
  // INDICADORES (RNG, Racha, Historial)
  // =====================================================

  const renderRngIndicator = () => {
    let color = "#fff";
    if (rngMode === "HOT") color = "#ff1744";
    if (rngMode === "COLD") color = "#2979ff";

    return (
      <View style={styles.rngBox}>
        <Text style={[styles.rngText, { color }]}>RNG: {rngMode}</Text>
      </View>
    );
  };

  const renderStreak = () => {
    if (winStreak >= 3)
      return (
        <Text style={styles.streakHot}>🔥 Racha de {winStreak} victorias</Text>
      );

    if (loseStreak >= 3)
      return (
        <Text style={styles.streakCold}>💀 {loseStreak} derrotas seguidas</Text>
      );

    return null;
  };

  const renderHistory = () => (
    <View style={styles.historyBox}>
      <Text style={styles.historyTitle}>Últimas jugadas</Text>
      {history.map((h, i) => (
        <Text key={i} style={styles.historyItem}>• {h}</Text>
      ))}
    </View>
  );

  // =====================================================
  // VS ELÉCTRICO
  // =====================================================

  const renderVS = () => (
    <LinearGradient colors={["#ff0000", "#ffd700"]} style={styles.vsBadge}>
      <Text style={styles.vsText}>VS</Text>
    </LinearGradient>
  );

  // =====================================================
  // BOTONES PRO
  // =====================================================

  const renderButtons = () => {

    if (autoPlay)
      return (
        <View style={styles.autoPlayBox}>
          <Text style={styles.autoPlayText}>AUTO-PLAY ({roundsLeft})</Text>
        </View>
      );

    if (!roundActive)
      return (
        <TouchableOpacity
          style={styles.mainButton}
          activeOpacity={0.9}
          onPress={() => {
            playSound("flip");
            startRound();
          }}
        >
          <LinearGradient colors={["#ff416c", "#ff4b2b"]} style={styles.mainButtonGradient}>
            <Ionicons name="play" size={22} color="#fff" />
            <Text style={styles.mainButtonText}>Repartir • {BASE_BET} CR</Text>
          </LinearGradient>
        </TouchableOpacity>
      );

    if (roundActive && canRaise)
      return (
        <View style={styles.raiseRow}>

          {/* SEGUIR */}
          <TouchableOpacity
            style={styles.raiseButton}
            onPress={() => {
              playSound("flip");
              resolveRound(false);
            }}
          >
            <LinearGradient colors={["#43a047", "#66bb6a"]} style={styles.raiseButtonGradient}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.raiseButtonText}>Seguir igual</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* SUBIR */}
          <TouchableOpacity
            style={styles.raiseButton}
            onPress={() => {
              playSound("flip");
              resolveRound(true);
            }}
          >
            <LinearGradient colors={["#ff9800", "#ff5722"]} style={styles.raiseButtonGradient}>
              <Ionicons name="trending-up" size={18} color="#fff" />
              <Text style={styles.raiseButtonText}>Subir apuesta (x2)</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      );

    return null;
  };

  // =====================================================
  // MENSAJE ANIMADO
  // =====================================================
  useEffect(() => {
    Animated.timing(fadeMsg, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeMsg, {
          toValue: 0.4,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 800);
    });
  }, [message]);

  const renderMessage = () => (
    <Animated.View style={[styles.messageBox, { opacity: fadeMsg }]}>
      <Text style={styles.messageText}>{message}</Text>
    </Animated.View>
  );

  // =====================================================
  // 🔥 RETURN (UI COMPLETA)
  // =====================================================

  return (
    <View style={styles.container}>

      {/* FLASH GLOBAL */}
      {flashAnim.__getValue() > 0 && (
        <Animated.View
          style={[
            styles.flashOverlay,
            { opacity: flashAnim },
          ]}
        />
      )}

      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>RED DOG ULTRA</Text>
          <Text style={styles.subtitle}>Casino NG • Premium Edition</Text>
        </View>

        <LinearGradient colors={["#ffd700", "#ffea00"]} style={styles.creditBox}>
          <View style={styles.creditInner}>
            <Ionicons name="cash" size={18} color="#000" />
            <Text style={styles.creditValue}>{credits}</Text>
          </View>
        </LinearGradient>
      </View>

      {renderRngIndicator()}
      {renderStreak()}
      {renderHistory()}

      {/* CARTAS */}
      <View style={styles.cardsContainer}>

        <View style={styles.cardColumn}>
          <Text style={styles.cardLabel}>Carta 1</Text>
          <CardPremium value={firstCard} glowColor={["#ffd700", "#ffa000"]} />
        </View>

        <View style={styles.vsWrapper}>{renderVS()}</View>

        <View style={styles.cardColumn}>
          <Text style={styles.cardLabel}>Carta 2</Text>
          <CardPremium value={secondCard} glowColor={["#00e5ff", "#00b0ff"]} />
        </View>

      </View>

      {/* TERCERA CARTA */}
      <View style={styles.thirdCardArea}>
        <Text style={styles.cardLabel}>Tercera Carta</Text>
        <CardPremium value={thirdCard} glowColor={["#ff4081", "#ff9100"]} />
      </View>

      {/* SPREAD INFO */}
      {spread !== null && (
        <View style={styles.centerInfo}>
          <Text style={styles.centerTitle}>Spread</Text>
          <Text style={styles.centerValue}>{spread}</Text>
        </View>
      )}

      {/* MENSAJE */}
      {renderMessage()}

      {/* BOTONES */}
      <View style={styles.buttonsWrapper}>
        {renderButtons()}

        {/* AUTO PLAY BUTTON */}
        {!autoPlay && (
          <TouchableOpacity
            style={styles.autoButton}
            onPress={startAutoPlay}
          >
            <LinearGradient colors={["#4a148c", "#7b1fa2"]} style={styles.autoButtonGradient}>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.autoButtonText}>AUTO PLAY x20</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Créditos sin valor monetario real</Text>
      </View>

    </View>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#080014",
    padding: 20,
    paddingTop: 50,
  },

  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
    zIndex: 999,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffd700",
  },

  subtitle: {
    fontSize: 12,
    color: "#ffbfa0",
  },

  creditBox: {
    borderRadius: 12,
    overflow: "hidden",
  },

  creditInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },

  creditValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000",
  },

  rngBox: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.25)",
    marginBottom: 6,
  },

  rngText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  streakHot: {
    color: "#ff5252",
    fontWeight: "700",
    marginBottom: 6,
  },

  streakCold: {
    color: "#64b5f6",
    fontWeight: "700",
    marginBottom: 6,
  },

  historyBox: {
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  historyTitle: {
    color: "#ffd700",
    fontWeight: "700",
  },

  historyItem: {
    color: "#fff",
    fontSize: 11,
  },

  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },

  cardColumn: {
    flex: 1,
    alignItems: "center",
  },

  cardLabel: {
    color: "#fff",
    marginBottom: 6,
    fontWeight: "700",
  },

  cardGlow: {
    padding: 4,
    borderRadius: 18,
  },

  card: {
    width: 100,
    height: 140,
    borderRadius: 14,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  cardText: {
    fontSize: 38,
    fontWeight: "900",
  },

  vsWrapper: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },

  vsBadge: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 999,
  },

  vsText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },

  thirdCardArea: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  centerInfo: {
    alignItems: "center",
    marginBottom: 14,
  },

  centerTitle: {
    fontSize: 13,
    color: "#ffdb76",
  },

  centerValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
  },

  messageBox: {
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },

  messageText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },

  buttonsWrapper: {
    width: "100%",
  },

  mainButton: {
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 10,
  },

  mainButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  mainButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },

  raiseRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  raiseButton: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },

  raiseButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  raiseButtonText: {
    color: "#fff",
    fontWeight: "900",
  },

  autoButton: {
    borderRadius: 26,
    overflow: "hidden",
  },

  autoButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  autoButtonText: {
    color: "#fff",
    fontWeight: "900",
  },

  autoPlayBox: {
    padding: 10,
    backgroundColor: "#330000",
    borderRadius: 12,
    marginBottom: 10,
  },

  autoPlayText: {
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
  },

  footer: {
    marginTop: 16,
    alignItems: "center",
  },

  footerText: {
    color: "#ccc",
    fontSize: 11,
  },

});

export default RedDogUltra;
