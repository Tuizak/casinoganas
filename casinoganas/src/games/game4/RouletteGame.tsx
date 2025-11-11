import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const RouletteGame4 = () => {
  const [gameState, setGameState] = useState<"choose" | "spinning" | "result">("choose");
  const [selectedColor, setSelectedColor] = useState<"red" | "black" | null>(null);
  const [winningColor, setWinningColor] = useState<"red" | "black" | null>(null);
  const [isWinner, setIsWinner] = useState(false);

  const rotation = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  // ✨ Luz pulsante ambiental
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // 🎡 Girar ruleta
  const spinRoulette = () => {
    setGameState("spinning");
    rotation.setValue(0);

    const finalRotation = 8 + Math.random() * 4; // 8–12 vueltas
    Animated.timing(rotation, {
      toValue: finalRotation,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      const result: "red" | "black" = Math.random() < 0.5 ? "red" : "black";
      setWinningColor(result);
      setIsWinner(result === selectedColor);
      setGameState("result");

      Animated.spring(resultScale, { toValue: 1, useNativeDriver: true }).start();
    });
  };

  const handleChoice = (color: "red" | "black") => {
    setSelectedColor(color);
    spinRoulette();
  };

  const resetGame = () => {
    setSelectedColor(null);
    setWinningColor(null);
    setIsWinner(false);
    setGameState("choose");
    resultScale.setValue(0);
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#000000", "#130b00", "#000000"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.container}>
        {/* 🏷️ Título */}
        <View style={styles.titleWrapper}>
          <Text style={styles.titleEmoji}>🎯</Text>
          <Text style={styles.title}>Roulette Royale</Text>
        </View>

        {/* 🎡 Ruleta */}
        <Animated.View style={[styles.wheelWrapper, { transform: [{ rotate: rotateInterpolate }] }]}>
          <Animated.View style={[styles.wheelGlow, { opacity: glowOpacity }]} />
          <LinearGradient colors={["#A0522D", "#D2691E", "#FFD700"]} style={styles.wheel}>
            {[...Array(18)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.segment,
                  {
                    backgroundColor: i % 2 === 0 ? "#C41E3A" : "#000",
                    transform: [{ rotate: `${(360 / 18) * i}deg` }],
                  },
                ]}
              />
            ))}
            <View style={styles.center}>
              <View style={styles.diamond} />
            </View>
          </LinearGradient>
          <View style={styles.arrow}>
            <Ionicons name="caret-down" size={40} color="#FFF" />
          </View>
        </Animated.View>

        {/* ⚫🔴 Elección */}
        {gameState === "choose" && (
          <View style={styles.choiceContainer}>
            <Text style={styles.choiceTitle}>Elige tu color</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleChoice("red")}>
                <LinearGradient colors={["#FF0000", "#C41E3A"]} style={styles.choiceBtn}>
                  <Text style={styles.choiceText}>ROJO</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleChoice("black")}>
                <LinearGradient colors={["#111", "#000"]} style={styles.choiceBtn}>
                  <Text style={styles.choiceText}>NEGRO</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 🔄 Girando */}
        {gameState === "spinning" && (
          <View style={styles.spinning}>
            <MaterialCommunityIcons name="loading" size={48} color="#FFD700" />
            <Text style={styles.spinText}>Girando la ruleta...</Text>
            <Text style={styles.subText}>
              Has elegido: {selectedColor === "red" ? "🔴 Rojo" : "⚫ Negro"}
            </Text>
          </View>
        )}

        {/* 🎉 Resultado */}
        {gameState === "result" && (
          <Animated.View style={[styles.resultBox, { transform: [{ scale: resultScale }] }]}>
            <LinearGradient
              colors={isWinner ? ["#FFD700", "#FFA500"] : ["#FF0000", "#8B0000"]}
              style={styles.resultContent}
            >
              <MaterialCommunityIcons
                name={isWinner ? "crown" : "close-circle"}
                size={60}
                color="#FFF"
              />
              <Text style={styles.resultText}>
                {isWinner ? "🎉 ¡Ganaste!" : "💔 Inténtalo otra vez"}
              </Text>
              <Text style={styles.resultSub}>
                Color ganador: {winningColor === "red" ? "🔴 Rojo" : "⚫ Negro"}
              </Text>

              <TouchableOpacity activeOpacity={0.8} style={styles.againBtn} onPress={resetGame}>
                <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.againGradient}>
                  <Ionicons name="refresh" size={24} color="#000" />
                  <Text style={styles.againText}>Jugar de nuevo</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default RouletteGame4;

// 🎨 Estilos
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },

  titleWrapper: { alignItems: "center", marginBottom: 30 },
  titleEmoji: { fontSize: 36 },
  title: {
    fontSize: 30,
    color: "#FFD700",
    fontWeight: "900",
    textShadowColor: "#FF8C00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 1,
  },

  wheelWrapper: {
    width: 300,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255,215,0,0.2)",
  },
  wheel: {
    width: 300,
    height: 300,
    borderRadius: 150,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#2c1b00",
    borderWidth: 4,
    borderColor: "rgba(255,215,0,0.5)",
    shadowColor: "#FFD700",
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  segment: {
    position: "absolute",
    width: 150,
    height: 30,
    left: 150,
    top: 120,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  center: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFD700",
    shadowColor: "#FFF",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  diamond: { width: 25, height: 25, backgroundColor: "#FFF", transform: [{ rotate: "45deg" }] },
  arrow: { position: "absolute", top: -25 },

  choiceContainer: { marginTop: 40, alignItems: "center" },
  choiceTitle: { color: "#FFF", fontSize: 22, marginBottom: 20, fontWeight: "700" },
  choiceRow: { flexDirection: "row", gap: 20 },
  choiceBtn: {
    width: 120,
    height: 120,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  choiceText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },

  spinning: { alignItems: "center", marginTop: 40 },
  spinText: { color: "#FFD700", fontSize: 18, marginTop: 10 },
  subText: { color: "#FFF", fontSize: 16, marginTop: 5 },

  resultBox: { marginTop: 50, alignItems: "center" },
  resultContent: {
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  resultText: { color: "#FFF", fontSize: 24, fontWeight: "900", marginTop: 20 },
  resultSub: { color: "#FFF", fontSize: 16, marginTop: 10 },
  againBtn: { marginTop: 25, borderRadius: 15, overflow: "hidden" },
  againGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    paddingVertical: 14,
    gap: 10,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  againText: { color: "#000", fontWeight: "800", fontSize: 16 },
});
