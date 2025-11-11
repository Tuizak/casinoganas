import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Dimensions,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const elements = ["🔥 Fuego", "💧 Agua", "🌪️ Aire", "🌱 Tierra", "⚡ Rayo"];
const rules: Record<string, string[]> = {
  "🔥 Fuego": ["🌱 Tierra", "🌪️ Aire"],
  "💧 Agua": ["🔥 Fuego", "⚡ Rayo"],
  "🌪️ Aire": ["💧 Agua", "🌱 Tierra"],
  "🌱 Tierra": ["⚡ Rayo", "💧 Agua"],
  "⚡ Rayo": ["🌪️ Aire", "🔥 Fuego"],
};

const elementColors: Record<string, string[]> = {
  "🔥 Fuego": ["#FF4500", "#FF8C00", "#FFD700"],
  "💧 Agua": ["#00BFFF", "#1E90FF", "#87CEEB"],
  "🌪️ Aire": ["#E0E0E0", "#B0C4DE", "#F0F8FF"],
  "🌱 Tierra": ["#228B22", "#32CD32", "#90EE90"],
  "⚡ Rayo": ["#FFD700", "#FFFF00", "#FFF68F"],
};

const Particle = ({ delay }: { delay: number }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height, -100],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: Math.random() * width,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

export default function BattleOfElements() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(50);
  const [selected, setSelected] = useState<string | null>(null);
  const [enemyElement, setEnemyElement] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [winStreak, setWinStreak] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const explosionAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const balanceAnim = useRef(new Animated.Value(1)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadBalance = async () => {
      if (!user?.id) return;
      const data = await getUserBalance(user.id);
      setBalance(Number(data.balance || 0));
      setLoading(false);
    };
    loadBalance();
  }, [user?.id]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animateBattle = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    explosionAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(explosionAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(explosionAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const animateBalance = () => {
    Animated.sequence([
      Animated.timing(balanceAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(balanceAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateStreak = () => {
    streakAnim.setValue(0);
    Animated.spring(streakAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const playRound = async () => {
    if (!selected) {
      Alert.alert("Selecciona un elemento para luchar");
      return;
    }
    if (balance < bet) {
      Alert.alert("Sin energía suficiente", "Recarga en la pantalla principal");
      return;
    }

    setSpinning(true);
    const newBalance = balance - bet;
    setBalance(newBalance);
    animateBalance();

    const enemy = elements[Math.floor(Math.random() * elements.length)];
    setEnemyElement(enemy);
    await new Promise((r) => setTimeout(r, 1200));

    let win = false;
    let draw = false;
    if (selected === enemy) {
      draw = true;
    } else if (rules[selected]?.includes(enemy)) {
      win = true;
    }

    let winAmount = 0;
    let message = "";
    if (draw) {
      winAmount = bet;
      message = "Empate cósmico ⚖️";
      setWinStreak(0);
    } else if (win) {
      winAmount = bet * 2;
      message = "¡Victoria elemental! 🌟";
      setWinStreak((prev) => prev + 1);
      animateStreak();
    } else {
      message = "Has sido superado... 💀";
      setWinStreak(0);
    }

    const finalBalance = newBalance + winAmount;
    setBalance(finalBalance);
    setResult(message);
    animateBattle();
    animateBalance();

    try {
      await updateUserBalance(user.id, finalBalance, bet, winAmount, {
        game: "BattleOfElements",
        playerElement: selected,
        enemyElement: enemy,
        result: message,
      });
    } catch (error) {
      console.error("Error actualizando balance:", error);
    }

    setSpinning(false);
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (loading) {
    return (
      <LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.center}>
        <Animated.View style={{ transform: [{ scale: balanceAnim }] }}>
          <MaterialCommunityIcons name="lightning-bolt" size={60} color="#FFD700" />
          <Text style={styles.loadingText}>Cargando energía...</Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Partículas de fondo */}
      {[...Array(20)].map((_, i) => (
        <Particle key={i} delay={i * 150} />
      ))}

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#FFD700" />
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ scale: balanceAnim }] }}>
          <LinearGradient
            colors={["#FFD700", "#FFA500", "#FF8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.balanceContainer}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#000" />
            <Text style={styles.balanceText}>{balance}</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Racha de victorias */}
      {winStreak > 0 && (
        <Animated.View
          style={[
            styles.streakContainer,
            {
              transform: [{ scale: streakAnim }],
            },
          ]}
        >
          <LinearGradient colors={["#FF4500", "#FFD700"]} style={styles.streakGradient}>
            <MaterialCommunityIcons name="fire" size={20} color="#FFF" />
            <Text style={styles.streakText}>Racha: {winStreak}</Text>
            <MaterialCommunityIcons name="fire" size={20} color="#FFF" />
          </LinearGradient>
        </Animated.View>
      )}

      {/* TÍTULO */}
      <Animated.View style={[styles.titleContainer, { opacity: glowOpacity }]}>
        <Text style={styles.title}>⚔️ BATALLA ELEMENTAL ⚔️</Text>
      </Animated.View>

      {/* OPCIONES DE ELEMENTO */}
      <View style={styles.grid}>
        {elements.map((el) => {
          const isSelected = selected === el;
          const colors = elementColors[el];
          return (
            <TouchableOpacity
              key={el}
              onPress={() => setSelected(el)}
              disabled={spinning}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={isSelected ? colors : ["#1a1a2e", "#16213e"]}
                style={[
                  styles.elementBtn,
                  isSelected && styles.elementBtnSelected,
                ]}
              >
                <Text style={styles.elementText}>{el}</Text>
                {isSelected && (
                  <Animated.View
                    style={[
                      styles.selectedGlow,
                      {
                        opacity: glowOpacity,
                      },
                    ]}
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* RESULTADO CON EXPLOSIÓN */}
      {enemyElement && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
            marginTop: 30,
          }}
        >
          <Animated.View
            style={[
              styles.explosionEffect,
              {
                opacity: explosionAnim,
                transform: [
                  {
                    scale: explosionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 3],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.vsContainer}>
            <LinearGradient
              colors={elementColors[selected!]}
              style={styles.vsBox}
            >
              <Text style={styles.vsLabel}>Tu Elemento</Text>
              <Text style={styles.vsElement}>{selected}</Text>
            </LinearGradient>

            <MaterialCommunityIcons
              name="sword-cross"
              size={40}
              color="#FFD700"
              style={{ marginHorizontal: 15 }}
            />

            <LinearGradient
              colors={elementColors[enemyElement]}
              style={styles.vsBox}
            >
              <Text style={styles.vsLabel}>Enemigo</Text>
              <Text style={styles.vsElement}>{enemyElement}</Text>
            </LinearGradient>
          </View>

          <LinearGradient
            colors={
              result?.includes("Victoria")
                ? ["#FFD700", "#FF8C00"]
                : result?.includes("Empate")
                ? ["#87CEEB", "#4682B4"]
                : ["#FF4500", "#8B0000"]
            }
            style={styles.resultContainer}
          >
            <Text style={styles.resultText}>{result}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* CONTROLES DE APUESTA */}
      <View style={styles.betControls}>
        <TouchableOpacity
          onPress={() => setBet(Math.max(10, bet - 10))}
          style={styles.betBtn}
          activeOpacity={0.7}
        >
          <LinearGradient colors={["#FF4500", "#FF6347"]} style={styles.betBtnGradient}>
            <Ionicons name="remove-circle" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <LinearGradient
          colors={["#1a1a2e", "#16213e"]}
          style={styles.betDisplay}
        >
          <Text style={styles.betLabel}>Apuesta</Text>
          <Text style={styles.betAmount}>{bet}</Text>
        </LinearGradient>

        <TouchableOpacity
          onPress={() => setBet(Math.min(balance, bet + 10))}
          style={styles.betBtn}
          activeOpacity={0.7}
        >
          <LinearGradient colors={["#32CD32", "#228B22"]} style={styles.betBtnGradient}>
            <Ionicons name="add-circle" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* BOTÓN DE LUCHA */}
      <TouchableOpacity
        onPress={playRound}
        disabled={spinning}
        activeOpacity={0.8}
        style={styles.fightBtnContainer}
      >
        <LinearGradient
          colors={spinning ? ["#555", "#333"] : ["#FF4500", "#FFD700", "#FF8C00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fightBtn}
        >
          <Animated.View style={{ opacity: glowOpacity }}>
            <MaterialCommunityIcons
              name={spinning ? "sword" : "flash"}
              size={32}
              color="#FFF"
            />
          </Animated.View>
          <Text style={styles.fightText}>
            {spinning ? "⚔️ BATALLANDO..." : "🔥 ¡LUCHAR!"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#FFD700", fontSize: 20, marginTop: 15, fontWeight: "600" },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
    marginTop: 10,
  },
  backBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  balanceText: { color: "#000", fontSize: 22, fontWeight: "bold" },
  streakContainer: {
    alignSelf: "center",
    marginBottom: 10,
  },
  streakGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 10,
  },
  streakText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "#FF8C00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  elementBtn: {
    width: width * 0.28,
    height: 90,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  elementBtnSelected: {
    shadowColor: "#FFD700",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 12,
    borderColor: "#FFD700",
    borderWidth: 3,
  },
  elementText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  selectedGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 18,
    backgroundColor: "#FFD700",
    opacity: 0.3,
  },
  explosionEffect: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FFD700",
    opacity: 0,
  },
  vsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  vsBox: {
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  vsLabel: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
    opacity: 0.9,
  },
  vsElement: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  resultContainer: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  resultText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  betControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginTop: 25,
  },
  betBtn: {
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  betBtnGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  betDisplay: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 140,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  betLabel: {
    color: "#87CEEB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  betAmount: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
  },
  fightBtnContainer: {
    marginTop: 30,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  fightBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 30,
    gap: 15,
  },
  fightText: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 1,
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});