import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
  Vibration,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Audio, Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const { width, height } = Dimensions.get("window");
const SYMBOL_SIZE = 90;
const REELS = 5;

// 🔧 Ajuste global
Video.defaultProps = Video.defaultProps || {};
Video.defaultProps.useNativeControls = false;
Video.defaultProps.resizeMode = Video.RESIZE_MODE_COVER;
Video.defaultProps.shouldPlay = true;

const symbols = [
  require("./assets/symbols/zeus.png"),
  require("./assets/symbols/queen.png"),
  require("./assets/symbols/helmet.png"),
  require("./assets/symbols/lightning.png"),
  require("./assets/symbols/temple.png"),
  require("./assets/symbols/chalice.png"),
];

export default function ZeusPowerSlots({ navigation }: any) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [bet, setBet] = useState<number>(100);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [jackpot, setJackpot] = useState(false);
  const reels = useRef(Array(REELS).fill(null).map(() => new Animated.Value(0))).current;

  const [bgMusic, setBgMusic] = useState<Audio.Sound | null>(null);
  const [spinSound, setSpinSound] = useState<Audio.Sound | null>(null);
  const [winSound, setWinSound] = useState<Audio.Sound | null>(null);
  const [zeusSound, setZeusSound] = useState<Audio.Sound | null>(null);
  const [thunderSound, setThunderSound] = useState<Audio.Sound | null>(null);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const multipliers = [2, 5, 10, 20, 50];
  const videoRef = useRef<Video>(null);

  // 🎵 Música ambiente
  useFocusEffect(
    React.useCallback(() => {
      let bg: Audio.Sound;
      (async () => {
        bg = new Audio.Sound();
        await bg.loadAsync(require("./assets/sounds/zeus_theme.mp3"));
        await bg.setIsLoopingAsync(true);
        await bg.setVolumeAsync(0.35);
        await bg.playAsync();
        setBgMusic(bg);
      })();

      return () => {
        if (bg) {
          bg.stopAsync();
          bg.unloadAsync();
        }
      };
    }, [])
  );

  // 🔊 Sonidos
  useEffect(() => {
    let spin: Audio.Sound, win: Audio.Sound, thunder: Audio.Sound;
    (async () => {
      const data = await getUserBalance(user.id);
      setCredits(Number(data.balance || 0));

      spin = new Audio.Sound();
      win = new Audio.Sound();
      thunder = new Audio.Sound();

      await spin.loadAsync(require("./assets/sounds/spin.mp3"));
      await win.loadAsync(require("./assets/sounds/win.mp3"));
      await thunder.loadAsync(require("./assets/sounds/thunder.mp3"));

      setSpinSound(spin);
      setWinSound(win);
      setZeusSound(thunder);
      setThunderSound(thunder);
    })();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleVideoLoop = async (status: any) => {
    if (status.isLoaded && status.positionMillis >= status.durationMillis - 800) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.8, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
      await thunderSound?.replayAsync();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const spinReel = (reel: Animated.Value, delay: number) =>
    new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(reel, {
          toValue: -SYMBOL_SIZE * 15,
          duration: 1500 + delay,
          useNativeDriver: true,
        }),
        Animated.spring(reel, {
          toValue: -SYMBOL_SIZE * Math.floor(Math.random() * symbols.length),
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });

  const spinAll = async () => {
    if (spinning || credits < bet) return;

    setSpinning(true);
    setJackpot(false);
    setCredits((prev) => prev - bet);
    setLastWin(0);

    await spinSound?.replayAsync();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await Promise.all(reels.map((r, i) => spinReel(r, i * 250)));

    const winChance = Math.random();
    let win = 0;
    if (winChance > 0.95) win = bet * 50;
    else if (winChance > 0.75) win = bet * 5;
    else if (winChance > 0.5) win = bet * 2;

    if (win > 0) {
      setLastWin(win);
      setCredits((prev) => prev + win);
      await winSound?.replayAsync();

      if (win >= bet + 200) {
        await bgMusic?.pauseAsync();
        await zeusSound?.replayAsync();
        Vibration.vibrate([0, 400, 200, 800]);
        navigation.navigate("BigWin");
      } else if (win >= bet * 10) {
        setJackpot(true);
        await zeusSound?.replayAsync();
        Vibration.vibrate([0, 400, 200, 800]);
      }
    }

    await updateUserBalance(user.id, credits + win - bet, bet, win, {});
    setSpinning(false);
  };

  const incBet = () => setBet((prev) => Math.min(credits, prev + 50));
  const decBet = () => setBet((prev) => Math.max(50, prev - 50));

  const applyMultiplier = (value: number) => {
    setSelectedMultiplier(value);
    setBet((prev) => Math.min(credits, prev * value));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.6, duration: 150, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSelectedMultiplier(null));
  };

  return (
    <View style={styles.container}>
      {/* 🎬 Fondo Zeus */}
      <Animated.View style={[styles.videoContainer, { opacity: fadeAnim }]}>
        <Video
          ref={videoRef}
          source={require("./assets/bg_zeus.mp4")}
          style={styles.fullscreenVideo}
          shouldPlay
          isLooping
          isMuted
          resizeMode="cover"
          onPlaybackStatusUpdate={handleVideoLoop}
        />
      </Animated.View>

      {/* ⚡ Flash */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#fff9c4", opacity: flashAnim },
        ]}
      />

      {/* 💰 Header */}
      <View style={styles.header}>
        <Text style={styles.balance}>💰 {credits.toLocaleString()}</Text>
        <Text style={styles.bet}>🎯 Apuesta: ${bet}</Text>
      </View>

      {/* 🎰 Slot */}
      <View style={styles.slotFrame}>
        <LinearGradient colors={["#1a1333", "#08041c"]} style={styles.slotInner}>
          <View style={styles.reelRow}>
            {reels.map((r, i) => (
              <View key={i} style={styles.reelBox}>
                <Animated.View style={{ transform: [{ translateY: r }] }}>
                  {[...Array(20)].map((_, idx) => (
                    <View key={idx} style={styles.symbolContainer}>
                      <Image
                        source={symbols[idx % symbols.length]}
                        style={styles.symbolImage}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </Animated.View>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* ⚡ Texto de ganancia */}
      {lastWin > 0 && (
        <Animated.Text style={[styles.winText, { opacity: glowAnim }]}>
          ⚡ ¡Ganaste ${lastWin.toLocaleString()}! ⚡
        </Animated.Text>
      )}

      {/* 🎯 Control de apuesta */}
      <View style={styles.betControls}>
        <TouchableOpacity onPress={decBet}>
          <Ionicons name="remove-circle" size={46} color="#FFD700" />
        </TouchableOpacity>
        <LinearGradient colors={["#FFD700", "#FFB300"]} style={styles.betDisplay}>
          <Text style={styles.betValue}>${bet}</Text>
        </LinearGradient>
        <TouchableOpacity onPress={incBet}>
          <Ionicons name="add-circle" size={46} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* 🔘 Botón girar */}
      <TouchableOpacity
        onPress={spinAll}
        disabled={spinning}
        activeOpacity={0.85}
        style={styles.spinButton}
      >
        <LinearGradient colors={["#ff0080", "#ff8c00"]} style={styles.spinGradient}>
          <Ionicons name="refresh" size={28} color="#fff" />
          <Text style={styles.spinText}>{spinning ? "GIRANDO..." : "GIRAR"}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* 🔢 Multiplicadores abajo */}
      <View style={styles.bottomBar}>
        {multipliers.map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.multiplierButton,
              selectedMultiplier === m && styles.multiplierSelected,
            ]}
            onPress={() => applyMultiplier(m)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                selectedMultiplier === m
                  ? ["#FFD700", "#FF8C00"]
                  : ["#1f1f1f", "#3b3b3b"]
              }
              style={styles.multiplierGradient}
            >
              <Text
                style={[
                  styles.multiplierText,
                  { color: selectedMultiplier === m ? "#000" : "#FFD700" },
                ]}
              >
                x{m}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  videoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -10,
  },
  fullscreenVideo: {
    width: Dimensions.get("screen").width,
    height: Dimensions.get("screen").height,
    position: "absolute",
    top: 0,
    left: 0,
  },
  header: {
    position: "absolute",
    top: 60,
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balance: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  bet: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  slotFrame: { borderRadius: 20, overflow: "hidden" },
  slotInner: { padding: 5, borderRadius: 30 },
  reelRow: { flexDirection: "row" },
  reelBox: { height: 300, width: 70, overflow: "hidden", alignItems: "center" },
  symbolContainer: { height: SYMBOL_SIZE, justifyContent: "center" },
  symbolImage: { width: 60, height: 60 },
  winText: { fontSize: 22, fontWeight: "900", color: "#FFD700", marginTop: 20 },
  betControls: { flexDirection: "row", alignItems: "center", gap: 25, marginTop: 10 },
  betDisplay: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 25 },
  betValue: { fontSize: 26, fontWeight: "900", color: "#000" },
  spinButton: { borderRadius: 60, overflow: "hidden", marginTop: 20, marginBottom: 10 },
  spinGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 60,
  },
  spinText: { color: "#fff", fontWeight: "900", fontSize: 22 },

  // 🔢 Multiplicadores
  bottomBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingBottom: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    width: "100%",
  },
  multiplierButton: { borderRadius: 12, overflow: "hidden" },
  multiplierGradient: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  multiplierText: { fontWeight: "900", fontSize: 18, textAlign: "center" },
  multiplierSelected: { transform: [{ scale: 1.1 }] },
});
