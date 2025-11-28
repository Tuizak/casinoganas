import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const { width, height } = Dimensions.get("window");

// Layout
const COLS = 3;
const H_PADDING = 16;
const MACHINE_SIDE_PADDING = 14;

// Emojis (⭐ = Wild)
const S = ["🍒", "🍋", "🍉", "🍇", "🔔", "⭐"] as const;
type Sym = typeof S[number];

const PAY: Record<Sym, number> = {
  "🍒": 20,
  "🍋": 25,
  "🍉": 30,
  "🍇": 40,
  "🔔": 60,
  "⭐": 0,
};

export default function NeonFruits({ navigation }: any) {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);

const COLS = 3;
const H_PADDING = 16;
const MACHINE_SIDE_PADDING = 14;

//escala 
const MACHINE_SCALE = 0.90;   
const SIDE_GAP = 16;         

const MACHINE_WIDTH = (width - H_PADDING * 2) * MACHINE_SCALE;
const CELL_W = Math.floor(
  (MACHINE_WIDTH - MACHINE_SIDE_PADDING * 2 - (COLS - 1) * 10) / COLS
);
const CELL_H = Math.min(120, Math.max(92, Math.floor(height * 0.12)));
  const reels = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  // luces
  const bulbsTop = [...Array(24)].map(() => useRef(new Animated.Value(0)).current);
  const bulbsSide = [...Array(14)].map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const d = await getUserBalance(user.id);
      setCredits(Number(d.balance || 0));
    })();
  }, [user?.id]);

  useEffect(() => {
    [...bulbsTop, ...bulbsSide].forEach((a, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, { toValue: 1, duration: 700 + (i % 4) * 120, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const randSym = () => S[Math.floor(Math.random() * S.length)] as Sym;

  const scoreLine = (line: Sym[]) => {
    const nonWild = line.filter((x) => x !== "⭐");
    if (nonWild.length === 0) return bet * 5;
    const t = nonWild[0];
    const allSame = line.every((x) => x === t || x === "⭐");
    return allSame ? Math.max(bet * (PAY[t] / 10), bet) : 0;
  };

  const spin = async () => {
    if (spinning || credits < bet) {
      if (credits < bet) Alert.alert("Sin créditos", "Recarga en Home");
      return;
    }
    setSpinning(true);
    setCredits((c) => c - bet);
    setLastWin(0);

    const cols: Sym[][] = [[], [], []];
    const anims = [0, 1, 2].map(
      (i) =>
        new Promise<void>((resolve) => {
          const col: Sym[] = [randSym(), randSym(), randSym()];
          cols[i] = col;
          Animated.sequence([
            Animated.timing(reels[i], {
              toValue: -CELL_H * 14,
              duration: 940 + i * 140,
              useNativeDriver: true,
            }),
            Animated.timing(reels[i], {
              toValue: -CELL_H * S.indexOf(col[1]),
              duration: 260,
              useNativeDriver: true,
            }),
          ]).start(() => resolve());
        })
    );

    await Promise.all(anims);

    // líneas
    const lines: Sym[][] = [
      [cols[0][0], cols[1][0], cols[2][0]],
      [cols[0][1], cols[1][1], cols[2][1]],
      [cols[0][2], cols[1][2], cols[2][2]],
      [cols[0][0], cols[1][1], cols[2][2]],
      [cols[0][2], cols[1][1], cols[2][0]],
    ];

    const total = lines.reduce((a, l) => a + scoreLine(l), 0);
    const newBal = credits - bet + total;

    setLastWin(total);
    setCredits(newBal);

    try {
      await updateUserBalance(user.id, newBal, bet, total, {
        game: "NeonFruits",
        lines: lines.map((l) => l.join(" ")).join(" | "),
      });
    } catch {}

    setSpinning(false);
  };

  const renderBulbStrip = (arr: Animated.Value[], horizontal: boolean) => (
    <View style={[styles.bulbStrip, horizontal ? { flexDirection: "row" } : { flexDirection: "column" }]}>
      {arr.map((a, i) => {
        const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] });
        const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
        return <Animated.View key={i} style={[styles.bulb, { opacity, transform: [{ scale }] }]} />;
      })}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#080810" }}>
      {/* Marco fino y simétrico en toda la pantalla */}
      <View style={styles.frameFull}>
        {renderBulbStrip(bulbsTop, true)}
        <View style={styles.frameCenterRow}>
          {renderBulbStrip(bulbsSide, false)}
          <LinearGradient colors={["#19192e", "#13132a", "#0b0b1d"]} style={styles.gamePanel}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                <Ionicons name="arrow-back" size={22} color="#FFD700" />
              </TouchableOpacity>
              <Text style={styles.balance}>${credits.toLocaleString()}</Text>
            </View>

            {/* Título */}
            <LinearGradient colors={["#FFD700", "#FFA500", "#FFD700"]} style={styles.titleGrad}>
              <Text style={styles.title}>💡 NEON FRUITS — ⭐ WILD</Text>
            </LinearGradient>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 28 }}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Máquina */}
              <View
                style={[
                  styles.machine,
                  { width: MACHINE_WIDTH, paddingHorizontal: MACHINE_SIDE_PADDING },
                ]}
              >
                {/* separadores simétricos */}
                <View style={[styles.colDivider, { left: MACHINE_WIDTH / 3 - 1 }]} />
                <View style={[styles.colDivider, { right: MACHINE_WIDTH / 3 - 1 }]} />

                {[0, 1, 2].map((c) => (
                  <View key={c} style={[styles.reelViewport, { width: CELL_W, height: CELL_H }]}>
                    <Animated.View style={{ transform: [{ translateY: reels[c] }] }}>
                      {[...Array(18)].map((_, k) => (
                        <View key={k} style={[styles.cell, { width: CELL_W, height: CELL_H }]}>
                          <Text
                            style={[
                              styles.sym,
                              S[k % S.length] === "⭐" && styles.wild,
                            ]}
                          >
                            {S[k % S.length]}
                          </Text>
                        </View>
                      ))}
                    </Animated.View>
                  </View>
                ))}
              </View>

              {/* Controles GRANDES */}
              <View style={styles.betRow}>
                <TouchableOpacity style={styles.bigIconBtn} onPress={() => setBet((b) => Math.max(10, b - 10))}>
                  <Ionicons name="remove" size={28} color="#FFD700" />
                </TouchableOpacity>

                <LinearGradient colors={["rgba(255,215,0,.2)", "rgba(255,165,0,.1)"]} style={styles.bigBetDisplay}>
                  <Text style={styles.bigBetTxt}>${bet}</Text>
                </LinearGradient>

                <TouchableOpacity style={styles.bigIconBtn} onPress={() => setBet((b) => Math.min(credits, b + 10))}>
                  <Ionicons name="add" size={28} color="#FFD700" />
                </TouchableOpacity>
              </View>

              <View style={styles.quickRow}>
                {[10, 25, 50, 100].map((v) => (
                  <TouchableOpacity key={v} onPress={() => setBet(Math.min(credits, v))} activeOpacity={0.9}>
                    <LinearGradient
                      colors={bet === v ? ["#FFD700", "#FFA500"] : ["rgba(255,215,0,.16)", "rgba(255,165,0,.08)"]}
                      style={[styles.quickChip, bet === v && { borderColor: "#FFD700" }]}
                    >
                      <Text style={[styles.quickTxt, { color: bet === v ? "#0b0b0b" : "#FFD700" }]}>${v}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* SPIN grande tipo píldora */}
              <TouchableOpacity disabled={spinning} onPress={spin} activeOpacity={0.92} style={styles.spinBtn}>
                <LinearGradient
                  colors={spinning ? ["#666", "#444"] : ["#e60073", "#c8005f", "#aa004d"]}
                  style={styles.spinGrad}
                >
                  <Ionicons name={spinning ? "reload" : "play"} size={28} color="#fff" />
                  <Text style={styles.spinTxt}>{spinning ? "Girando…" : "GIRAR"}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.lastWin}>
                Último premio:{" "}
                <Text style={{ color: "#34d399", fontWeight: "800" }}>${lastWin.toLocaleString()}</Text>
              </Text>

              {/* pagos */}
              <View style={styles.payTable}>
                {Object.entries(PAY).map(([sym, mult]) => (
                  <View key={sym} style={styles.payItem}>
                    <Text style={[styles.paySym, sym === "⭐" && styles.wild]}>{sym}</Text>
                    <Text style={styles.payVal}>×{mult}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </LinearGradient>
          {renderBulbStrip(bulbsSide, false)}
        </View>
        {renderBulbStrip(bulbsTop, true)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frameFull: {
    flex: 1,
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2, // fino y simétrico
    borderColor: "#d4af37",
    backgroundColor: "#eae6dfff",
  },
  frameCenterRow: { flex: 1, flexDirection: "row", alignItems: "stretch" },

  bulbStrip: {
    justifyContent: "space-between",
    alignItems: "center",
    padding: 1,
    backgroundColor: "#3a2600",
  },
  bulb: {
    width: 12, // bombilla más pequeña para marco fino
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },

gamePanel: {
  flex: 1,
  paddingHorizontal: H_PADDING,
  paddingTop: 30,
  borderLeftWidth: 0, 
  borderRightWidth: 0, 
  // borderColor: "rgba(255,215,0,.45)", // opcional: elimina esta línea
},


  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,.12)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,.35)",
  },
  balance: { color: "#FFD700", fontSize: 20, fontWeight: "900" },

  titleGrad: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
  },
  title: { color: "#0b0b0b", fontSize: 18, fontWeight: "900", letterSpacing: 1 },

  machine: {
    alignSelf: "center",
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2, // borde fino
    borderColor: "rgba(255,215,0,.35)",
    backgroundColor: "#0f0f21",
    flexDirection: "row",
    gap: 10,
    position: "relative",
  },
  colDivider: {
    position: "absolute",
    top: 10,
    bottom: 10,
    width: 2, // fino y simétrico
    backgroundColor: "rgba(255,215,0,.25)",
    borderRadius: 1,
  },

  reelViewport: {
    backgroundColor: "rgba(10,10,30,.85)",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,.35)",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,215,0,.08)",
  },
  sym: {
    fontSize: 58,
    textShadowColor: "rgba(255,255,255,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  wild: { textShadowColor: "rgba(255,215,0,.8)", textShadowRadius: 10 },

  // CONTROLES GRANDES
  betRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 18,
    justifyContent: "center",
  },
  bigIconBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,.10)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,.35)",
  },
  bigBetDisplay: {
    minWidth: 140,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  bigBetTxt: { color: "#f2f8f4ff", fontSize: 28, fontWeight: "900", letterSpacing: 1 },

  quickRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 12,
  },
  quickChip: {
    height: 44,
    minWidth: 70,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,.35)",
  },
  quickTxt: { fontSize: 14, fontWeight: "900" },

  spinBtn: {
    width: "100%",
    borderRadius: 28, // píldora
    overflow: "hidden",
    marginTop: 16,
    alignSelf: "center",
  },
  spinGrad: {
    height: 58, // alto grande
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  spinTxt: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 1 },

  lastWin: { marginTop: 14, color: "#fff", textAlign: "center" },

  payTable: {
  marginTop: 16,
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
  justifyContent: "center",
  paddingBottom: 16,
  paddingHorizontal: 8,
},
payItem: {
  minWidth: 100,                     
  height: 56,                       
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  backgroundColor: "rgba(255,215,0,.12)",
  borderColor: "rgba(255,215,0,.35)",
  borderWidth: 1,
  paddingHorizontal: 16,
  borderRadius: 14,
},
paySym: { fontSize: 28 },           
payVal: { color: "#FFD700", fontWeight: "900", fontSize: 16 }, 

});