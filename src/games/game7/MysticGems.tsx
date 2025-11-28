import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

/** ===== Símbolos =====
 * DIAMOND = se pinta con emoji 💎 (texto)
 * GEM1..GEM5 = se pintan con imágenes desde /assets
 */
const SYMS = ["DIAMOND", "GEM1", "GEM2", "GEM3", "GEM4", "GEM5"] as const;
type Sym = typeof SYMS[number];

/** Pagos por símbolo cuando hay TRÍO (lógica existente) */
const PAY: Record<Sym, number> = {
  DIAMOND: 120, // 💎
  GEM1: 70,
  GEM2: 60,
  GEM3: 50,
  GEM4: 40,
  GEM5: 30,
};

// Carga de imágenes de las gemas
const GEM_IMG: Record<Exclude<Sym, "DIAMOND">, any> = {
  GEM1: require("../../../assets/gema1.png"),
  GEM2: require("../../../assets/gema2.png"),
  GEM3: require("../../../assets/gema3.png"),
  GEM4: require("../../../assets/gema4.png"),
  GEM5: require("../../../assets/gema5.png"),
};

export default function MysticGems({ navigation }: any) {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);

  const reel = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const winPulse = useRef(new Animated.Value(1)).current;

  const rand = () => SYMS[Math.floor(Math.random() * SYMS.length)] as Sym;

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const d = await getUserBalance(user.id);
      setCredits(Number(d.balance || 0));
    })();
  }, [user?.id]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(Animated.timing(particleAnim, { toValue: 1, duration: 4000, useNativeDriver: true })).start();
  }, []);

  const spinOnce = async () => {
    const finals: Sym[] = [];
    await Promise.all(
      [0, 1, 2].map(
        (i) =>
          new Promise<void>((resolve) => {
            const f = rand();
            finals[i] = f;
            Animated.sequence([
              Animated.timing(reel[i], { toValue: -100 * 15, duration: 850 + i * 120, useNativeDriver: true }),
              Animated.timing(reel[i], { toValue: -100 * SYMS.indexOf(f), duration: 240, useNativeDriver: true }),
            ]).start(() => resolve());
          })
      )
    );
    return finals;
  };

  const spin = async () => {
    if (spinning || credits < bet) {
      if (credits < bet) Alert.alert("Sin créditos", "Recarga en Home");
      return;
    }
    setSpinning(true);
    setCredits((c) => c - bet);
    setLastWin(0);

    let finals = await spinOnce();
    let win = 0;

    const allEq = finals[0] === finals[1] && finals[1] === finals[2];
    const twoEq = finals[0] === finals[1] || finals[1] === finals[2] || finals[0] === finals[2];

    if (allEq) {
      win = (PAY[finals[0]] || 40) * bet / 10;
    } else if (twoEq) {
      // RESPIN: una tirada extra para completar el trío
      const missingIndex = finals[0] === finals[1] ? 2 : finals[1] === finals[2] ? 0 : 1;
      const f = rand();
      finals[missingIndex] = f;
      await new Promise<void>((resolve) => {
        Animated.sequence([
          Animated.timing(reel[missingIndex], { toValue: -100 * 15, duration: 500, useNativeDriver: true }),
          Animated.timing(reel[missingIndex], { toValue: -100 * SYMS.indexOf(f), duration: 200, useNativeDriver: true }),
        ]).start(() => resolve());
      });
      if (finals[0] === finals[1] && finals[1] === finals[2]) {
        win = (PAY[finals[0]] || 40) * bet / 10;
      } else {
        win = Math.floor(bet * 1.5);
      }
    }

    const newBal = credits - bet + win;
    setCredits(newBal);
    setLastWin(win);

    if (win > 0) {
      Animated.sequence([
        Animated.timing(winPulse, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(winPulse, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(winPulse, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(winPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }

    try {
      await updateUserBalance(user.id, newBal, bet, win, { game: "MysticGems", result: finals.join(" ") });
    } catch {}

    setSpinning(false);
  };

  const renderSymbol = (s: Sym) => {
    if (s === "DIAMOND") {
      return <Text style={styles.symEmoji}>💎</Text>;
    }
    // GEM images
    return <Image source={GEM_IMG[s]} style={styles.symImg} />;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <LinearGradient colors={["#0d1b2a", "#1b263b", "#2d4654"]} style={styles.wrap}>
        {/* Partículas */}
        <View style={styles.particles}>
          {[...Array(8)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: `${i * 12.5}%`,
                  opacity: particleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.8, 0.3] }),
                  transform: [{ translateY: particleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }],
                },
              ]}
            >
              <Text style={styles.particleText}>✨</Text>
            </Animated.View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <LinearGradient colors={["#34d399", "#10b981"]} style={styles.backGrad}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.balanceBox}>
            <View style={styles.balanceGlow} />
            <LinearGradient colors={["#10b981", "#059669"]} style={styles.balanceGrad}>
              <Ionicons name="diamond" size={20} color="#fff" />
              <Text style={styles.balance}>{credits}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Título */}
        <Animated.View
          style={[
            styles.titleContainer,
            { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] },
          ]}
        >
          <Text style={styles.topLabel}>🌿 TEMPLO MÍSTICO 🌿</Text>
          <View style={styles.titleBox}>
            <Animated.View
              style={[styles.titleGlow, { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }) }]}
            />
            <LinearGradient colors={["#10b981", "#34d399", "#6ee7b7"]} style={styles.titleGrad}>
              <Text style={styles.title}>💎 MYSTIC GEMS</Text>
            </LinearGradient>
          </View>
          <Text style={styles.subtitle}>⚡ FUNCIÓN RESPIN MÁGICO ⚡</Text>
        </Animated.View>

        {/* Marco y carretes */}
        <View style={styles.stoneFrame}>
          <View style={styles.stoneBorder}>
            <LinearGradient colors={["#059669", "#047857", "#065f46"]} style={styles.innerStone}>
              <View style={styles.cornerTL}><Text style={styles.cornerIcon}>🍃</Text></View>
              <View style={styles.cornerTR}><Text style={styles.cornerIcon}>🍃</Text></View>
              <View style={styles.cornerBL}><Text style={styles.cornerIcon}>🍃</Text></View>
              <View style={styles.cornerBR}><Text style={styles.cornerIcon}>🍃</Text></View>

              <View style={styles.reelsRow}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.gemSlot}>
                    <LinearGradient colors={["rgba(16,185,129,0.2)", "transparent"]} style={styles.slotGlow}>
                      <View style={styles.viewport}>
                        <Animated.View style={{ transform: [{ translateY: reel[i] }] }}>
                          {[...Array(20)].map((_, k) => {
                            const s = SYMS[k % SYMS.length] as Sym;
                            return (
                              <View key={k} style={styles.slot}>
                                {renderSymbol(s)}
                              </View>
                            );
                          })}
                        </Animated.View>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Victoria */}
        {lastWin > 0 && (
          <Animated.View style={[styles.winBanner, { transform: [{ scale: winPulse }] }]}>
            <LinearGradient colors={["#fbbf24", "#f59e0b", "#d97706"]} style={styles.winGrad}>
              <Text style={styles.winEmoji}>🏆</Text>
              <View>
                <Text style={styles.winLabel}>¡VICTORIA MÍSTICA!</Text>
                <Text style={styles.winAmount}>${lastWin}</Text>
              </View>
              <Text style={styles.winEmoji}>🏆</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Panel control */}
        <View style={styles.controlPanel}>
          <View style={styles.betBox}>
            <Text style={styles.betLabel}>🔮 APUESTA RITUAL 🔮</Text>
            <View style={styles.betRow}>
              <TouchableOpacity style={styles.betBtn} onPress={() => setBet(Math.max(10, bet - 10))}>
                <LinearGradient colors={["#065f46", "#047857"]} style={styles.betBtnGrad}>
                  <Ionicons name="remove-circle" size={28} color="#6ee7b7" />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.betDisplay}>
                <LinearGradient colors={["#064e3b", "#065f46"]} style={styles.betDisplayGrad}>
                  <Text style={styles.betIcon}>💰</Text>
                  <Text style={styles.betTxt}>{bet}</Text>
                </LinearGradient>
              </View>

              <TouchableOpacity style={styles.betBtn} onPress={() => setBet(Math.min(credits, bet + 10))}>
                <LinearGradient colors={["#065f46", "#047857"]} style={styles.betBtnGrad}>
                  <Ionicons name="add-circle" size={28} color="#6ee7b7" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity disabled={spinning} onPress={spin} style={styles.spinBtn} activeOpacity={0.85}>
            <View style={styles.spinOuter}>
              <LinearGradient
                colors={spinning ? ["#065f46", "#047857"] : ["#10b981", "#059669", "#047857"]}
                style={styles.spinGrad}
              >
                <View style={styles.spinInner}>
                  <Ionicons name={spinning ? "sync" : "diamond"} size={36} color="#fff" />
                  <Text style={styles.spinTxt}>{spinning ? "INVOCANDO..." : "INVOCAR GEMAS"}</Text>
                </View>
                {!spinning && (
                  <>
                    <View style={styles.spinShine} />
                    <View style={[styles.spinShine, { left: "50%" }]} />
                  </>
                )}
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tabla de pagos */}
        <View style={styles.payTable}>
          <LinearGradient colors={["#064e3b", "#065f46"]} style={styles.payGrad}>
            <Text style={styles.payTitle}>📜 TESOROS DEL TEMPLO 📜</Text>
            <View style={styles.payDivider} />
            <View style={styles.payGrid}>
              {Object.entries(PAY).map(([symKey, val]) => (
                <View key={symKey} style={styles.payItem}>
                  <LinearGradient
                    colors={["rgba(16,185,129,0.2)", "rgba(16,185,129,0.05)"]}
                    style={styles.payItemGrad}
                  >
                    {symKey === "DIAMOND" ? (
                      <Text style={styles.paySymEmoji}>💎</Text>
                    ) : (
                      <Image
                        source={GEM_IMG[symKey as Exclude<Sym, "DIAMOND">]}
                        style={styles.payImg}
                      />
                    )}
                    <Text style={styles.payVal}>×{val}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
            <Text style={styles.payNote}>✨ 3 gemas iguales = Victoria</Text>
            <Text style={styles.payNote}>🔄 2 gemas iguales = Respin gratis</Text>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", paddingTop: 20, paddingHorizontal: 12, position: "relative" },

  particles: { position: "absolute", top: 0, left: 0, right: 0, height: 300, zIndex: 0 },
  particle: { position: "absolute", top: 250 },
  particleText: { fontSize: 16, opacity: 0.6 },

  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 12,
    zIndex: 10,
  },
  back: { borderRadius: 14, overflow: "hidden", elevation: 6 },
  backGrad: { padding: 12, alignItems: "center", justifyContent: "center" },
  balanceBox: { position: "relative" },
  balanceGlow: { position: "absolute", left: -4, right: -4, top: -4, bottom: -4, backgroundColor: "#10b981", opacity: 0.4, borderRadius: 24 },
  balanceGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#6ee7b7",
  },
  balance: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 1 },

  titleContainer: { alignItems: "center", marginVertical: 16, zIndex: 1 },
  topLabel: { color: "#6ee7b7", fontSize: 13, fontWeight: "700", letterSpacing: 3, marginBottom: 8 },
  titleBox: { position: "relative" },
  titleGlow: { position: "absolute", left: -8, right: -8, top: -8, bottom: -8, backgroundColor: "#10b981", borderRadius: 20 },
  titleGrad: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: "#6ee7b7" },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "rgba(16,185,129,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: { color: "#fbbf24", fontSize: 11, fontWeight: "700", marginTop: 8, letterSpacing: 2 },

  stoneFrame: { width: "95%", marginVertical: 20 },
  stoneBorder: { backgroundColor: "#065f46", borderRadius: 28, padding: 4, borderWidth: 3, borderColor: "#34d399" },
  innerStone: { borderRadius: 24, padding: 20, position: "relative" },
  cornerTL: { position: "absolute", top: 12, left: 12 },
  cornerTR: { position: "absolute", top: 12, right: 12 },
  cornerBL: { position: "absolute", bottom: 12, left: 12 },
  cornerBR: { position: "absolute", bottom: 12, right: 12 },
  cornerIcon: { fontSize: 24, opacity: 0.7 },

  reelsRow: { flexDirection: "row", gap: 14, justifyContent: "center" },
  gemSlot: { borderRadius: 18, overflow: "hidden" },
  slotGlow: { padding: 3 },
  viewport: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#6ee7b7",
    backgroundColor: "#000",
  },
  slot: { width: 100, height: 100, alignItems: "center", justifyContent: "center" },

  // Render del símbolo
  symEmoji: { fontSize: 56, textShadowColor: "rgba(255,255,255,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  symImg: { width: 64, height: 64, resizeMode: "contain" },

  winBanner: { marginTop: 20, width: "90%", borderRadius: 20, overflow: "hidden", elevation: 12 },
  winGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 20, paddingHorizontal: 20 },
  winEmoji: { fontSize: 32 },
  winLabel: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  winAmount: { color: "#fff", fontSize: 32, fontWeight: "900", textAlign: "center", letterSpacing: 1 },

  controlPanel: { width: "95%", alignItems: "center", marginTop: 24, gap: 20 },
  betBox: { width: "100%", alignItems: "center" },
  betLabel: { color: "#6ee7b7", fontSize: 13, fontWeight: "700", marginBottom: 12, letterSpacing: 2 },
  betRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  betBtn: { borderRadius: 16, overflow: "hidden", elevation: 4 },
  betBtnGrad: { width: 60, height: 60, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#6ee7b7" },
  betDisplay: { borderRadius: 18, overflow: "hidden", elevation: 6 },
  betDisplayGrad: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 32, borderWidth: 3, borderColor: "#6ee7b7" },
  betIcon: { fontSize: 24 },
  betTxt: { color: "#6ee7b7", fontSize: 36, fontWeight: "900", letterSpacing: 1 },

  spinBtn: { width: "95%", elevation: 10 },
  spinOuter: { borderRadius: 24, padding: 3, backgroundColor: "#34d399" },
  spinGrad: { borderRadius: 22, paddingVertical: 20, position: "relative", overflow: "hidden" },
  spinInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, zIndex: 1 },
  spinTxt: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  spinShine: { position: "absolute", top: 0, left: "-10%", width: "30%", height: "100%", backgroundColor: "rgba(255,255,255,0.25)", transform: [{ skewX: "-25deg" }] },

  payTable: { width: "95%", borderRadius: 24, overflow: "hidden", marginTop: 28, elevation: 6 },
  payGrad: { padding: 20, borderWidth: 2, borderColor: "#34d399" },
  payTitle: { color: "#fbbf24", fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 12, letterSpacing: 1 },
  payDivider: { height: 2, backgroundColor: "rgba(52,211,153,0.3)", marginBottom: 16 },
  payGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 16 },
  payItem: { borderRadius: 14, overflow: "hidden" },
  payItemGrad: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: "#34d399" },
  paySymEmoji: { fontSize: 36 },
  payImg: { width: 36, height: 36, resizeMode: "contain" },
  payVal: { color: "#6ee7b7", fontSize: 14, fontWeight: "800", marginTop: 4 },
  payNote: { color: "#a7f3d0", fontSize: 12, textAlign: "center", marginTop: 4, fontStyle: "italic" },
});