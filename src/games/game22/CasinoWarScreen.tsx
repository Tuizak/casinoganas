import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// -------------------------------
// CONFIG PRINCIPAL CASINO CLÁSICO
// -------------------------------
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

const BASE_BET = 10;

// -------------------------------------
// CARTAS PREMIUM (DISEÑO CASINO REAL)
// -------------------------------------
const getCardColor = (card) => {
  if (!card) return "#222";
  if (card.includes("♥") || card.includes("♦")) return "#d40000";
  return "#111";
};

const formatRank = (card) =>
  card?.replace("♠","").replace("♥","").replace("♦","").replace("♣","") ?? "?";

const formatSuit = (card) =>
  card?.match(/[♠♥♦♣]/)?.[0] ?? "?";

// -------------------------------------
// ANIMACIONES (Flip, Shake, Glow, Zoom)
// -------------------------------------

// Flip 3D
const useFlip = () => {
  const anim = useRef(new Animated.Value(0)).current;
  const flip = () => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  };
  return { anim, flip };
};

// Shake screen (perder)
const useShake = () => {
  const anim = useRef(new Animated.Value(0)).current;
  const trigger = () => {
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };
  return { anim, trigger };
};

// Glow ganador
const useGlow = () => {
  const anim = useRef(new Animated.Value(0)).current;
  const glow = () => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 900,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start(() =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }).start()
    );
  };
  return { anim, glow };
};

// Zoom win
const useZoom = () => {
  const anim = useRef(new Animated.Value(1)).current;
  const zoom = () => {
    anim.setValue(1);
    Animated.sequence([
      Animated.timing(anim,{toValue:1.25,duration:120,useNativeDriver:true}),
      Animated.timing(anim,{toValue:1,duration:120,useNativeDriver:true}),
    ]).start();
  };
  return { anim, zoom };
};

// Lightning Flash
const useLightning = () => {
  const anim = useRef(new Animated.Value(0)).current;
  const flash = () => {
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim,{toValue:1,duration:70,useNativeDriver:true}),
      Animated.timing(anim,{toValue:0,duration:90,useNativeDriver:true}),
    ]).start();
  };
  return { anim, flash };
};

// Fade message
const useFade = () => {
  const anim = useRef(new Animated.Value(0)).current;
  const fadeIn = () => {
    anim.setValue(0);
    Animated.timing(anim,{
      toValue:1,
      duration:350,
      useNativeDriver:true
    }).start();
  };
  return { anim, fadeIn };
};

// Probabilidad (fake estilo casino real)
const fakeProbability = () =>
  Math.floor(Math.random() * 40) + 30; // 30–70%
const getRandomCard = () => {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return `${rank}${suit}`;
};

const getCardValue = (card) => {
  const r = formatRank(card);
  return RANKS.indexOf(r);
};

// --------------------------------------
// COMPONENTE PRINCIPAL
// --------------------------------------
const CasinoWarUltra = () => {
  // Créditos
  const [credits, setCredits] = useState(200);

  // Cartas
  const [playerCard, setPlayerCard] = useState(null);
  const [dealerCard, setDealerCard] = useState(null);

  // War Mode
  const [isWar, setIsWar] = useState(false);
  const [warBet, setWarBet] = useState(0);

  // Multiplicador
  const [multiplier, setMultiplier] = useState(1);

  // Racha
  const [streak, setStreak] = useState(0);
  const [streakType, setStreakType] = useState(null);

  // Probabilidad dinámica fake
  const [prob, setProb] = useState(fakeProbability());

  // Mensajes
  const [message, setMessage] = useState("Presiona JUGAR para iniciar.");
  const fadeMsg = useFade();

  // Animaciones
  const flipPlayer = useFlip();
  const flipDealer = useFlip();
  const shake = useShake();
  const glow = useGlow();
  const zoom = useZoom();
  const lightning = useLightning();

  // Autoplay
  const [isAuto, setIsAuto] = useState(false);
  const autoplayRounds = useRef(0);

  // -----------------------------------
  // ACTUALIZAR PROBABILIDAD FAKE
  // -----------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setProb(fakeProbability());
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // -----------------------------
  // AUMENTAR / BAJAR MULTIPLIER
  // -----------------------------
  const cycleMultiplier = () => {
    if (multiplier === 1) setMultiplier(2);
    else if (multiplier === 2) setMultiplier(3);
    else if (multiplier === 3) setMultiplier(5);
    else setMultiplier(1);
  };

  // --------------------------------------
  // REINICIAR RONDA
  // --------------------------------------
  const resetRound = () => {
    setPlayerCard(null);
    setDealerCard(null);
    setIsWar(false);
    setWarBet(0);
    setMessage("Presiona JUGAR para iniciar.");
    fadeMsg.fadeIn();
  };

  // --------------------------------------
  // JUGAR UNA RONDA
  // --------------------------------------
  const playRound = () => {
    if (credits < BASE_BET * multiplier) {
      setMessage("No tienes créditos suficientes.");
      fadeMsg.fadeIn();
      return;
    }

    const pCard = getRandomCard();
    const dCard = getRandomCard();

    setPlayerCard(pCard);
    setDealerCard(dCard);

    flipPlayer.flip();
    flipDealer.flip();

    const pVal = getCardValue(pCard);
    const dVal = getCardValue(dCard);

    let bet = BASE_BET * multiplier;

    if (pVal > dVal) {
      setCredits((c) => c + bet);
      setMessage(`🏆 Ganaste +${bet} CR`);
      glow.glow();
      zoom.zoom();

      if (streakType === "win") setStreak((s) => s + 1);
      else {
        setStreak(1);
        setStreakType("win");
      }

    } else if (pVal < dVal) {
      setCredits((c) => c - bet);
      setMessage(`💀 Perdiste -${bet} CR`);
      shake.trigger();

      if (streakType === "lose") setStreak((s) => s + 1);
      else {
        setStreak(1);
        setStreakType("lose");
      }

    } else {
      // EMPATE → Activar WAR MODE
      setMessage("🔥 EMPATE • ¿Vas a GUERRA?");
      setIsWar(true);
      setWarBet(bet);
      lightning.flash();
      setStreak(0);
      setStreakType(null);
    }

    fadeMsg.fadeIn();
  };

  // --------------------------------------
  // RENDIRSE
  // --------------------------------------
  const surrender = () => {
    if (!isWar) return;

    const loss = Math.floor(warBet / 2);
    setCredits((c) => c - loss);
    setMessage(`Te rendiste (-${loss} CR)`);
    fadeMsg.fadeIn();
    setIsWar(false);
    setWarBet(0);
  };

  // --------------------------------------
  // GUERRA REAL
  // --------------------------------------
  const goToWar = () => {
    if (!isWar) return;

    let totalBet = warBet * 2;
    if (credits < totalBet) {
      setMessage("No tienes créditos suficientes.");
      fadeMsg.fadeIn();
      return;
    }

    const pCard = getRandomCard();
    const dCard = getRandomCard();

    setPlayerCard(pCard);
    setDealerCard(dCard);

    flipPlayer.flip();
    flipDealer.flip();

    const pVal = getCardValue(pCard);
    const dVal = getCardValue(dCard);

    if (pVal > dVal) {
      setCredits((c) => c + totalBet);
      setMessage(`🔥 ¡GANASTE LA GUERRA! +${totalBet} CR`);
      glow.glow();
      zoom.zoom();
    } else if (pVal < dVal) {
      setCredits((c) => c - totalBet);
      setMessage(`⚔️ Perdiste la guerra (-${totalBet} CR)`);
      shake.trigger();
    } else {
      setMessage("Empate en guerra • No pierdes nada");
    }

    fadeMsg.fadeIn();
    setIsWar(false);
    setWarBet(0);
  };

  // --------------------------------------
  // AUTOPLAY
  // --------------------------------------
  const startAutoPlay = () => {
    if (isAuto) return;

    autoplayRounds.current = 20;
    setIsAuto(true);

    const loop = () => {
      if (autoplayRounds.current <= 0) {
        setIsAuto(false);
        return;
      }
      autoplayRounds.current -= 1;

      playRound();

      setTimeout(() => {
        if (isWar) {
          goToWar();
        }
        loop();
      }, 350 + Math.random() * 150);
    };

    loop();
  };
  // --------------------------------------
  // RENDER DE CARTA PREMIUM
  // --------------------------------------
  const renderCard = (card, type) => {
    const rank = formatRank(card);
    const suit = formatSuit(card);
    const color = getCardColor(card);

    return (
      <Animated.View
        style={{
          transform: [
            {
              scale: zoom.anim,
            },
          ],
        }}
      >
        <LinearGradient
          colors={
            type === "player"
              ? ["#ffe082", "#ffca28"]
              : ["#ef9a9a", "#d32f2f"]
          }
          style={styles.cardGlow}
        >
          <View style={[styles.card, { borderColor: color }]}>
            {/* Top rank */}
            <View style={styles.cardCornerTop}>
              <Text style={[styles.cardRank, { color }]}>{rank}</Text>
              <Text style={[styles.cardSuitSmall, { color }]}>{suit}</Text>
            </View>

            {/* Center suit big */}
            <Ionicons
              name="diamond"
              size={40}
              color={color === "#111" ? "#111" : "#d00000"}
              style={{ opacity: 0.24 }}
            />

            {/* Bottom rank */}
            <View style={styles.cardCornerBottom}>
              <Text style={[styles.cardRank, { color }]}>{rank}</Text>
              <Text style={[styles.cardSuitSmall, { color }]}>{suit}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // --------------------------------------
  // VS Eléctrico Animado
  // --------------------------------------
  const renderVS = () => {
    return (
      <Animated.View
        style={{
          opacity: lightning.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          }),
          transform: [
            {
              scale: lightning.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.25],
              }),
            },
          ],
        }}
      >
        <LinearGradient
          colors={["#ff1744", "#ff9100"]}
          style={styles.vsBadge}
        >
          <Text style={styles.vsText}>VS</Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  // --------------------------------------
  // RENDER PRINCIPAL
  // --------------------------------------
  return (
    <View style={styles.container}>
      {/* Fondo clásico casino */}
      <LinearGradient
        colors={["#200000", "#4a0000", "#200000"]}
        style={styles.background}
      >
        {/* Lightning flash layer */}
        <Animated.View
          style={{
            opacity: lightning.anim,
            backgroundColor: "#fff",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Header */}
        <Animated.View
          style={{
            transform: [{ translateX: shake.anim }],
          }}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Casino War Royale</Text>
              <Text style={styles.subtitle}>
                Carta más alta gana • Casino Clásico
              </Text>
            </View>

            <View style={styles.creditBadge}>
              <LinearGradient
                colors={["#ffd600", "#ff8f00"]}
                style={styles.creditCircle}
              >
                <Ionicons name="cash" size={20} color="#000" />
              </LinearGradient>
              <Text style={styles.creditLabel}>Créditos</Text>
              <Animated.Text
                style={[
                  styles.creditValue,
                  {
                    textShadowColor: glow.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["transparent", "#ffd600"],
                    }),
                    textShadowRadius: glow.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 18],
                    }),
                  },
                ]}
              >
                {credits}
              </Animated.Text>
            </View>
          </View>
        </Animated.View>

        {/* HUD */}
        <View style={styles.hudRow}>
          <View style={styles.hudItem}>
            <Ionicons name="card" size={18} color="#ffd54f" />
            <Text style={styles.hudText}>Apuesta base</Text>
            <Text style={styles.hudValue}>{BASE_BET}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={cycleMultiplier}
            style={styles.hudItem}
          >
            <Ionicons name="stats-chart" size={18} color="#80d8ff" />
            <Text style={styles.hudText}>Multiplicador</Text>
            <Text style={styles.hudValue}>x{multiplier}</Text>
          </TouchableOpacity>

          <View style={styles.hudItem}>
            <Ionicons name="flash" size={18} color="#ff7043" />
            <Text style={styles.hudText}>Probabilidad</Text>
            <Text style={styles.hudValue}>{prob}%</Text>
          </View>
        </View>

        {/* Racha */}
        {streak > 0 && (
          <LinearGradient
            colors={
              streakType === "win"
                ? ["#00c853", "#b2ff59"]
                : ["#d50000", "#ff5252"]
            }
            style={styles.streakBar}
          >
            <Text style={styles.streakText}>
              {streakType === "win" ? "🔥 Racha de victorias:" : "💀 Racha de derrotas:"} {streak}
            </Text>
          </LinearGradient>
        )}

        {/* Mesa de cartas */}
        <LinearGradient
          colors={["#004d40", "#002f23"]}
          style={styles.table}
        >
          {/* Carta jugador */}
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Tú</Text>
            </View>

            <View style={styles.cardSpotlight}>
              {playerCard ? renderCard(playerCard, "player") : renderCard(null, "player")}
            </View>
          </View>

          {/* VS eléctrico */}
          <View style={{ marginVertical: 8 }}>{renderVS()}</View>

          {/* Carta dealer */}
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Dealer</Text>
            </View>

            <View style={styles.cardSpotlight}>
              {dealerCard ? renderCard(dealerCard, "dealer") : renderCard(null, "dealer")}
            </View>
          </View>
        </LinearGradient>

        {/* Mensaje */}
        <Animated.View style={[styles.messageBox, { opacity: fadeMsg.anim }]}>
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>

        {/* Botones */}
        <View style={styles.buttonArea}>
          {!isWar && (
            <>
              <TouchableOpacity
                style={styles.mainButton}
                activeOpacity={0.8}
                onPress={playRound}
              >
                <LinearGradient
                  colors={["#ff6d00", "#ff3d00"]}
                  style={styles.mainButtonGradient}
                >
                  <Ionicons name="play" size={20} color="#fff" />
                  <Text style={styles.mainButtonText}>
                    JUGAR • {BASE_BET * multiplier} CR
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.8}
                onPress={startAutoPlay}
              >
                <Ionicons name="repeat" size={18} color="#fff" />
                <Text style={styles.secondaryButtonText}>AutoPlay 20</Text>
              </TouchableOpacity>
            </>
          )}

          {isWar && (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={surrender}
              >
                <Ionicons name="flag-outline" size={18} color="#fff" />
                <Text style={styles.secondaryButtonText}>
                  Rendirse (-{Math.floor(warBet / 2)})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mainButton}
                activeOpacity={0.8}
                onPress={goToWar}
              >
                <LinearGradient
                  colors={["#00c6ff", "#0072ff"]}
                  style={styles.mainButtonGradient}
                >
                  <Ionicons name="flame" size={20} color="#fff" />
                  <Text style={styles.mainButtonText}>Ir a GUERRA (x2)</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.resetButton}
            activeOpacity={0.8}
            onPress={resetRound}
          >
            <Ionicons name="refresh" size={14} color="#bbb" />
            <Text style={styles.resetButtonText}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

export default CasinoWarUltra;
// --------------------------------------
// ESTILOS COMPLETOS — CASINO CLÁSICO
// --------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#200000",
  },

  background: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 20,
  },

  // -------- HEADER --------
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffd700",
    textShadowColor: "#000",
    textShadowRadius: 7,
  },

  subtitle: {
    fontSize: 12,
    color: "#e0e0e0",
    marginTop: 2,
  },

  creditBadge: {
    alignItems: "center",
  },

  creditCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  creditLabel: {
    fontSize: 11,
    color: "#cfd8dc",
    textAlign: "center",
  },

  creditValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffd600",
    textAlign: "center",
  },

  // -------- HUD --------

  hudRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  hudItem: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  hudText: {
    fontSize: 11,
    color: "#cfd8dc",
    flex: 1,
  },

  hudValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },

  // ------ RACHA ------
  streakBar: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 10,
    elevation: 7,
  },

  streakText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 13,
    textAlign: "center",
  },

  // -------- TABLE --------
  table: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
    elevation: 4,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  cardLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },

  cardSpotlight: {
    flex: 1,
    alignItems: "center",
  },

  // -------- CARTA --------
  cardGlow: {
    padding: 4,
    borderRadius: 16,
  },

  card: {
    width: 95,
    height: 135,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  cardCornerTop: {
    position: "absolute",
    top: 4,
    left: 4,
    alignItems: "flex-start",
  },

  cardCornerBottom: {
    position: "absolute",
    bottom: 4,
    right: 4,
    alignItems: "flex-end",
  },

  cardRank: {
    fontSize: 15,
    fontWeight: "900",
  },

  cardSuitSmall: {
    fontSize: 12,
    marginTop: -2,
  },

  // -------- VS BADGE --------
  vsBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff6d00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 5,
  },

  vsText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },

  // -------- MENSAJE --------
  messageBox: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },

  messageText: {
    fontSize: 13,
    color: "#eceff1",
    textAlign: "center",
  },

  // -------- BOTONES --------

  buttonArea: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },

  mainButton: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
  },

  mainButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  mainButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  secondaryButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  resetButtonText: {
    fontSize: 12,
    color: "#b0bec5",
    marginLeft: 4,
    textDecorationLine: "underline",
  },
});
