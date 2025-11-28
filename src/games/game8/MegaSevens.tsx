import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Dimensions,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const { width, height } = Dimensions.get("window");

/* =======================
   LAYOUT / ESCALAS
   ======================= */
const ROWS = 3;
const COLS = 5;
const H_PADDING = 16;                 // padding horizontal del panel
const MACHINE_SCALE = 0.92;           // qué tanto del ancho útil ocupa la máquina
const MACHINE_SIDE_PADDING = 14;      // padding interno horizontal de la caja
const GAP_COLS = 10;                  // separación entre columnas

const MACHINE_WIDTH = Math.min(
  width - H_PADDING * 2,
  Math.floor((width - H_PADDING * 2) * MACHINE_SCALE)
);

const CELL_W = Math.floor(
  (MACHINE_WIDTH - MACHINE_SIDE_PADDING * 2 - (COLS - 1) * GAP_COLS) / COLS
);
const CELL_H = Math.max(88, Math.min(112, Math.floor(height * 0.12))); // alto dinámico cómodo

/* =======================
   SÍMBOLOS Y PAGOS
   ======================= */
const SYM = ["SEVEN", "💎", "⭐", "🍀", "🔔", "🍒"] as const;
type Sym = typeof SYM[number];

const PAY: Record<Sym, number> = {
  SEVEN: 120,
  "💎": 90,
  "⭐": 70, // comodín (no paga solo, pero lo usamos para multiplicar línea)
  "🍀": 50,
  "🔔": 35,
  "🍒": 20,
};

// 💎 Scatter (paga en cualquier posición, multiplicador sobre apuesta)
const SCATTER = { symbol: "💎" as Sym, pay3: 2.5, pay4: 6, pay5: 15 };

// 7 rojo
const IMG = {
  SEVEN: require("../../../assets/seven.png"),
};

// Líneas horizontales simples (5x3)
const LINES = [
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
  ],
];

export default function MegaSevens({ navigation }: any) {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const reels = useMemo(
    () => [...Array(COLS)].map(() => new Animated.Value(0)),
    []
  );
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const d = await getUserBalance(user.id);
      setCredits(Number(d.balance || 0));
    };
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [user?.id, navigation]);

  const randSym = () => SYM[Math.floor(Math.random() * SYM.length)] as Sym;

  const buildMatrix = (): Sym[][] =>
    [...Array(COLS)].map(() => [...Array(ROWS)].map(() => randSym()));

  const animateReelTo = (av: Animated.Value, finalIndex: number, i: number) =>
    new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(av, {
          toValue: -CELL_H * 14,
          duration: 850 + i * 120,
          useNativeDriver: true,
        }),
        Animated.timing(av, {
          toValue: -CELL_H * finalIndex,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });

  const scoreLine = (matrix: Sym[][], lineIdx: number) => {
    const path = LINES[lineIdx];
    const first = matrix[path[0][0]][path[0][1]];
    let base: Sym | null = first !== "⭐" ? first : null;
    if (!base) {
      for (let i = 1; i < path.length; i++) {
        const s = matrix[path[i][0]][path[i][1]];
        if (s !== "⭐") {
          base = s;
          break;
        }
      }
    }
    if (!base || base === SCATTER.symbol) return { amount: 0, count: 0 };

    let count = 0;
    for (let i = 0; i < path.length; i++) {
      const s = matrix[path[i][0]][path[i][1]];
      if (s === base || s === "⭐") count++;
      else break;
    }
    if (count >= 3) {
      const amount = Math.floor((PAY[base] || 20) * bet * (count / 30));
      return { amount, count };
    }
    return { amount: 0, count: 0 };
  };

  const scoreScatter = (matrix: Sym[][]) => {
    const flat = matrix.flat();
    const count = flat.filter((s) => s === SCATTER.symbol).length;
    if (count >= 5) return Math.floor(bet * SCATTER.pay5);
    if (count === 4) return Math.floor(bet * SCATTER.pay4);
    if (count === 3) return Math.floor(bet * SCATTER.pay3);
    return 0;
  };

  const doSpin = async () => {
    if (spinning || credits < bet) {
      if (credits < bet) Alert.alert("Sin créditos", "Recarga en Home.");
      return;
    }
    setSpinning(true);
    setWinningLines([]);
    setLastWin(0);
    setCredits((c) => c - bet);

    const M = buildMatrix();
    await Promise.all(
      reels.map((av, i) => {
        const finalSym = M[i][1];
        const finalIndex = SYM.indexOf(finalSym);
        return animateReelTo(av, finalIndex, i);
      })
    );

    let total = 0;
    const winners: number[] = [];
    LINES.forEach((_, idx) => {
      const r = scoreLine(M, idx);
      if (r.amount > 0) {
        total += r.amount;
        winners.push(idx);
      }
    });
    total += scoreScatter(M);

    const newBal = credits - bet + total;
    setCredits(newBal);
    setLastWin(total);
    setWinningLines(winners);

    if (total > 0) {
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }

    try {
      await updateUserBalance(user.id, newBal, bet, total, {
        game: "MegaSevens",
        lines: winners,
      });
    } catch {}

    setSpinning(false);
  };

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const setQuick = (v: number) =>
    setBet((b) => Math.min(Math.max(10, v), Math.max(10, credits)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
      <LinearGradient
        colors={["#0a0a14", "#10102a", "#0a0a14"]}
        style={styles.fullBg}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.back}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFD700" />
            </TouchableOpacity>
            <Text style={styles.balance}>${credits.toLocaleString()}</Text>
          </View>

          {/* TÍTULO */}
          <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.titlePill}>
            <Text style={styles.title}>🔥 MEGA SEVENS (5×3)</Text>
          </LinearGradient>

          {/* MÁQUINA */}
          <View
            style={[
              styles.machineBox,
              { width: MACHINE_WIDTH, paddingHorizontal: MACHINE_SIDE_PADDING },
            ]}
          >
            <View style={styles.machineRow}>
              {[...Array(COLS)].map((_, i) => (
                <View key={i} style={[styles.viewport, { width: CELL_W, height: CELL_H }]}>
                  <Animated.View style={{ transform: [{ translateY: reels[i] }] }}>
                    {[...Array(20)].map((__, k) => {
                      const s = SYM[k % SYM.length] as Sym;
                      return (
                        <View
                          key={k}
                          style={[styles.cell, { width: CELL_W, height: CELL_H }]}
                        >
                          {s === "SEVEN" ? (
                            <Image source={IMG.SEVEN} style={styles.symImg} />
                          ) : (
                            <Text style={styles.sym}>{s}</Text>
                          )}
                        </View>
                      );
                    })}
                  </Animated.View>
                </View>
              ))}
            </View>

            {/* Divisores finos entre columnas */}
            {[1, 2, 3, 4].map((c) => (
              <View
                key={`div-${c}`}
                style={[
                  styles.colDivider,
                  {
                    left:
                      MACHINE_SIDE_PADDING +
                      c * CELL_W +
                      (c - 1) * GAP_COLS -
                      1,
                    height: CELL_H + 8,
                  },
                ]}
              />
            ))}

            {/* Glow de línea ganadora */}
            {winningLines.map((ln) => {
              const y = 6 + ln * (CELL_H + 0);
              return (
                <Animated.View
                  key={`glow-${ln}`}
                  pointerEvents="none"
                  style={[
                    styles.lineGlow,
                    { top: y, width: MACHINE_WIDTH - 12, opacity: glowOpacity },
                  ]}
                />
              );
            })}
          </View>

          {/* CONTROLES DE APUESTA GRANDES */}
          <View style={styles.controls}>
            <View style={styles.betRow}>
              <TouchableOpacity
                style={styles.bigBtn}
                onPress={() => setBet((b) => Math.max(10, b - 10))}
                activeOpacity={0.85}
              >
                <Ionicons name="remove" size={26} color="#FFD700" />
              </TouchableOpacity>

              <LinearGradient
                colors={["rgba(255,215,0,.18)", "rgba(255,165,0,.10)"]}
                style={styles.betDisplay}
              >
                <Text style={styles.betTxt}>${bet}</Text>
              </LinearGradient>

              <TouchableOpacity
                style={styles.bigBtn}
                onPress={() => setBet((b) => Math.min(credits, b + 10))}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={26} color="#FFD700" />
              </TouchableOpacity>
            </View>

            {/* CHIPS */}
            <View style={styles.quickRow}>
              {[10, 25, 50, 100].map((v) => (
                <TouchableOpacity key={v} onPress={() => setQuick(v)} activeOpacity={0.85}>
                  <LinearGradient
                    colors={
                      bet === v
                        ? ["#FFD700", "#FFA500"]
                        : ["rgba(255,215,0,.15)", "rgba(255,165,0,.08)"]
                    }
                    style={[
                      styles.chip,
                      { borderColor: bet === v ? "rgba(255,215,0,.6)" : "rgba(255,215,0,.35)" },
                    ]}
                  >
                    <Text
                      style={[styles.chipTxt, { color: bet === v ? "#0a0a0a" : "#FFD700" }]}
                    >
                      ${v}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setQuick(Math.max(10, credits))} activeOpacity={0.85}>
                <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.chip}>
                  <Text style={[styles.chipTxt, { color: "#0a0a0a" }]}>MAX</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* BOTÓN GIRAR */}
            <TouchableOpacity
              disabled={spinning}
              onPress={doSpin}
              style={styles.spinBtn}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={spinning ? ["#666", "#444"] : ["#e60073", "#c8005f", "#aa004d"]}
                style={styles.spinGrad}
              >
                <Ionicons name={spinning ? "reload" : "play"} size={26} color="#fff" />
                <Text style={styles.spinTxt}>{spinning ? "GIRANDO…" : "GIRAR"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* ÚLTIMO PREMIO */}
            <Text style={styles.last}>
              Último premio:{" "}
              <Text style={{ color: "#34d399", fontWeight: "800" }}>
                ${lastWin.toLocaleString()}
              </Text>
            </Text>
          </View>

          {/* TABLA DE PAGOS (grande y simétrica) */}
          <View style={styles.payWrap}>
            <Text style={styles.payTitle}>
              Pagos (3+ desde izquierda)  ⭐ comodín • 💎 scatter
            </Text>

            <View style={styles.payGrid}>
              {Object.entries(PAY).map(([symKey, val]) => (
                <View key={symKey} style={styles.payItem}>
                  {symKey === "SEVEN" ? (
                    <Image source={IMG.SEVEN} style={styles.payImg} />
                  ) : (
                    <Text style={styles.paySym}>{symKey}</Text>
                  )}
                  <Text style={styles.payVal}>×{val}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.payFoot}>
              💎 scatter: 3x={SCATTER.pay3}× • 4x={SCATTER.pay4}× • 5x={SCATTER.pay5}× apuesta
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* =======================
   ESTILOS
   ======================= */
const styles = StyleSheet.create({
  fullBg: { flex: 1 },

  header: {
    width: "100%",
    paddingHorizontal: H_PADDING,
    marginTop: 4,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,.12)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,.3)",
  },
  balance: { color: "#FFD700", fontSize: 18, fontWeight: "900" },

  titlePill: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 8,
  },
  title: { color: "#0b0b0b", fontSize: 18, fontWeight: "900", letterSpacing: 1 },

  machineBox: {
    alignSelf: "center",
    backgroundColor: "#151532",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,215,0,.3)",
    paddingVertical: 10,
    marginTop: 8,
  },
  machineRow: {
    flexDirection: "row",
    gap: GAP_COLS,
    justifyContent: "center",
  },
  viewport: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,.35)",
    backgroundColor: "rgba(10,10,30,.85)",
  },
  colDivider: {
    position: "absolute",
    top: 6,
    width: 2,
    backgroundColor: "rgba(255,215,0,.2)",
    borderRadius: 1,
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
  },
  sym: {
    fontSize: 44,
    textShadowColor: "rgba(255,255,255,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  symImg: {
    width: "82%",
    height: "82%",
    resizeMode: "contain",
  },
  lineGlow: {
    position: "absolute",
    left: 6,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,215,0,.75)",
    shadowColor: "#FFD700",
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 10,
  },

  /* CONTROLES */
  controls: { paddingHorizontal: H_PADDING, marginTop: 14 },
  betRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  bigBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,.10)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,.35)",
  },
  betDisplay: {
    minWidth: 160,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  betTxt: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: 1 },

  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginTop: 12,
  },
  chip: {
    minWidth: 74,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,.35)",
    paddingHorizontal: 14,
  },
  chipTxt: { fontSize: 14, fontWeight: "900" },

  spinBtn: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    marginTop: 16,
    alignSelf: "center",
  },
  spinGrad: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  spinTxt: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 1 },

  last: {
    marginTop: 12,
    color: "#fff",
    textAlign: "center",
  },

  /* PAGOS */
  payWrap: { marginTop: 16, paddingHorizontal: H_PADDING },
  payTitle: {
    color: "#FFD700",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  payGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginBottom: 8,
  },
  payItem: {
    minWidth: 120,
    height: 56,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,0.1)",
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.35)",
  },
  paySym: { fontSize: 26 },
  payImg: { width: 30, height: 30, resizeMode: "contain" },
  payVal: { color: "#FFD700", fontSize: 16, fontWeight: "900" },
  payFoot: {
    color: "rgba(255,255,255,.85)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
});