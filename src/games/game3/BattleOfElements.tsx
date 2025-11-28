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
  "💧 Agua": ["#00BFFF", "#1E90FF", "#4169E1"],
  "🌪️ Aire": ["#E0E0E0", "#B0C4DE", "#87CEEB"],
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

const FloatingOrb = ({ color, delay, position }: { color: string; delay: number; position: { x: number; y: number } }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -20, 0],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.floatingOrb,
        {
          left: position.x,
          top: position.y,
          backgroundColor: color,
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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
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
      Alert.alert("⚠️ Selecciona un elemento", "Elige tu elemento para comenzar la batalla");
      return;
    }
    if (balance < bet) {
      Alert.alert("⚡ Sin energía suficiente", "Recarga en la pantalla principal para continuar");
      return;
    }

    setSpinning(true);
    const newBalance = balance - bet;
    setBalance(newBalance);
    animateBalance();

    const enemy = elements[Math.floor(Math.random() * elements.length)];
    setEnemyElement(enemy);
    await new Promise((r) => setTimeout(r, 1500));

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
      message = "⚖️ Empate Cósmico";
      setWinStreak(0);
    } else if (win) {
      winAmount = bet * 2;
      message = "🌟 ¡Victoria Elemental!";
      setWinStreak((prev) => prev + 1);
      animateStreak();
    } else {
      message = "💀 Derrota...";
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

  const handleBackPress = () => {
    if (spinning) {
      Alert.alert(
        "⚔️ Batalla en Progreso",
        "La batalla está en curso. Espera a que termine antes de salir.",
        [{ text: "Entendido", style: "cancel" }]
      );
      return;
    }
    navigation.goBack();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  if (loading) {
    return (
      <LinearGradient colors={["#0a0a0a", "#1a1a2e", "#16213e"]} style={styles.center}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: "center" }}>
          <MaterialCommunityIcons name="lightning-bolt" size={70} color="#FFD700" />
          <Text style={styles.loadingText}>Cargando energía elemental...</Text>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingBarFill,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </View>
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

      {/* Partículas de fondo mejoradas */}
      {[...Array(25)].map((_, i) => (
        <Particle key={i} delay={i * 120} />
      ))}

      {/* Orbes flotantes decorativos */}
      <FloatingOrb color="#FF4500" delay={0} position={{ x: width * 0.1, y: height * 0.2 }} />
      <FloatingOrb color="#00BFFF" delay={1000} position={{ x: width * 0.8, y: height * 0.3 }} />
      <FloatingOrb color="#FFD700" delay={500} position={{ x: width * 0.5, y: height * 0.15 }} />
      <FloatingOrb color="#32CD32" delay={1500} position={{ x: width * 0.2, y: height * 0.7 }} />

      {/* HEADER MEJORADO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backBtn} activeOpacity={0.8}>
          <LinearGradient colors={["rgba(255, 215, 0, 0.2)", "rgba(255, 140, 0, 0.1)"]} style={styles.backBtnGradient}>
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </LinearGradient>
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ scale: balanceAnim }] }}>
          <LinearGradient
            colors={["#FFD700", "#FFA500", "#FF8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.balanceContainer}
          >
            <View style={styles.balanceContent}>
              <MaterialCommunityIcons name="lightning-bolt" size={26} color="#000" />
              <View>
                <Text style={styles.balanceLabel}>ENERGÍA</Text>
                <Text style={styles.balanceText}>{balance}</Text>
              </View>
            </View>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Racha de victorias mejorada */}
      {winStreak > 0 && (
        <Animated.View
          style={[
            styles.streakContainer,
            {
              transform: [{ scale: streakAnim }],
            },
          ]}
        >
          <LinearGradient colors={["#FF4500", "#FFD700", "#FF8C00"]} style={styles.streakGradient}>
            <MaterialCommunityIcons name="fire" size={22} color="#FFF" />
            <Text style={styles.streakText}>RACHA DE FUEGO: {winStreak}</Text>
            <MaterialCommunityIcons name="fire" size={22} color="#FFF" />
          </LinearGradient>
        </Animated.View>
      )}

      {/* TÍTULO MEJORADO */}
      <Animated.View style={[styles.titleContainer, { opacity: glowOpacity, transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.titleWrapper}>
          <MaterialCommunityIcons name="sword-cross" size={32} color="#FFD700" />
          <Text style={styles.title}>BATALLA ELEMENTAL</Text>
          <MaterialCommunityIcons name="sword-cross" size={32} color="#FFD700" />
        </View>
        <Text style={styles.subtitle}>Domina los elementos y conquista</Text>
      </Animated.View>

      {/* OPCIONES DE ELEMENTO MEJORADAS */}
      <View style={styles.grid}>
        {elements.map((el) => {
          const isSelected = selected === el;
          const colors = elementColors[el];
          return (
            <TouchableOpacity
              key={el}
              onPress={() => !spinning && setSelected(el)}
              disabled={spinning}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  {
                    transform: [{ scale: isSelected ? pulseAnim : 1 }],
                  },
                ]}
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
                    <>
                      <Animated.View
                        style={[
                          styles.selectedGlow,
                          {
                            opacity: glowOpacity,
                          },
                        ]}
                      />
                      <View style={styles.selectedBorder} />
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* RESULTADO CON EXPLOSIÓN MEJORADO */}
      {enemyElement && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
            marginTop: 25,
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
                      outputRange: [0.5, 3.5],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.vsContainer}>
            <View style={styles.vsBoxWrapper}>
              <LinearGradient
                colors={elementColors[selected!]}
                style={styles.vsBox}
              >
                <Text style={styles.vsLabel}>TU PODER</Text>
                <Text style={styles.vsElement}>{selected}</Text>
              </LinearGradient>
              <View style={styles.vsBoxGlow} />
            </View>

            <View style={styles.vsSwordContainer}>
              <MaterialCommunityIcons
                name="sword-cross"
                size={44}
                color="#FFD700"
              />
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.vsBoxWrapper}>
              <LinearGradient
                colors={elementColors[enemyElement]}
                style={styles.vsBox}
              >
                <Text style={styles.vsLabel}>ENEMIGO</Text>
                <Text style={styles.vsElement}>{enemyElement}</Text>
              </LinearGradient>
              <View style={styles.vsBoxGlow} />
            </View>
          </View>

          <LinearGradient
            colors={
              result?.includes("Victoria")
                ? ["#FFD700", "#FF8C00", "#FF4500"]
                : result?.includes("Empate")
                ? ["#87CEEB", "#4682B4", "#1E90FF"]
                : ["#FF4500", "#8B0000", "#4B0000"]
            }
            style={styles.resultContainer}
          >
            <Text style={styles.resultText}>{result}</Text>
            {result?.includes("Victoria") && (
              <MaterialCommunityIcons name="crown" size={28} color="#FFF" style={{ marginLeft: 10 }} />
            )}
          </LinearGradient>
        </Animated.View>
      )}

      {/* CONTROLES DE APUESTA MEJORADOS */}
      <View style={styles.betControls}>
        <TouchableOpacity
          onPress={() => !spinning && setBet(Math.max(10, bet - 10))}
          disabled={spinning}
          style={styles.betBtn}
          activeOpacity={0.7}
        >
          <LinearGradient colors={["#FF4500", "#FF6347"]} style={styles.betBtnGradient}>
            <Ionicons name="remove-circle" size={34} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <LinearGradient
          colors={["#1a1a2e", "#16213e", "#0f3460"]}
          style={styles.betDisplay}
        >
          <Text style={styles.betLabel}>💰 APUESTA</Text>
          <Text style={styles.betAmount}>{bet}</Text>
          <View style={styles.betBorder} />
        </LinearGradient>

        <TouchableOpacity
          onPress={() => !spinning && setBet(Math.min(balance, bet + 10))}
          disabled={spinning}
          style={styles.betBtn}
          activeOpacity={0.7}
        >
          <LinearGradient colors={["#32CD32", "#228B22"]} style={styles.betBtnGradient}>
            <Ionicons name="add-circle" size={34} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* BOTÓN DE LUCHA MEJORADO */}
      <TouchableOpacity
        onPress={playRound}
        disabled={spinning}
        activeOpacity={0.8}
        style={styles.fightBtnContainer}
      >
        <LinearGradient
          colors={spinning ? ["#555", "#333", "#222"] : ["#FF4500", "#FFD700", "#FF8C00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fightBtn}
        >
          <Animated.View style={{ opacity: spinning ? 1 : glowOpacity, flexDirection: "row", alignItems: "center", gap: 15 }}>
            <MaterialCommunityIcons
              name={spinning ? "sword" : "flash"}
              size={36}
              color="#FFF"
            />
            <Text style={styles.fightText}>
              {spinning ? "BATALLANDO..." : "¡LUCHAR!"}
            </Text>
            <MaterialCommunityIcons
              name={spinning ? "sword" : "flash"}
              size={36}
              color="#FFF"
            />
          </Animated.View>
          {!spinning && (
            <Animated.View
              style={[
                styles.buttonShimmer,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { 
    color: "#FFD700", 
    fontSize: 22, 
    marginTop: 20, 
    fontWeight: "700",
    textShadowColor: "#FF8C00",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  loadingBar: {
    width: 200,
    height: 6,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 3,
    marginTop: 20,
    overflow: "hidden",
  },
  loadingBarFill: {
    width: 50,
    height: 6,
    backgroundColor: "#FFD700",
    borderRadius: 3,
  },
  particle: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  floatingOrb: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
    marginTop: 10,
  },
  backBtn: {
    borderRadius: 25,
    overflow: "hidden",
  },
  backBtnGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  balanceLabel: {
    color: "#000",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  balanceText: { 
    color: "#000", 
    fontSize: 24, 
    fontWeight: "900",
    letterSpacing: 1,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 50,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  streakContainer: {
    alignSelf: "center",
    marginBottom: 10,
  },
  streakGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 12,
    shadowColor: "#FF4500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 12,
  },
  streakText: { 
    color: "#FFF", 
    fontSize: 17, 
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 8,
  },
  title: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "900",
    textShadowColor: "#FF8C00",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
    letterSpacing: 2,
  },
  subtitle: {
    color: "#87CEEB",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    opacity: 0.9,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    marginBottom: 20,
  },
  elementBtn: {
    width: width * 0.28,
    height: 95,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  elementBtnSelected: {
    shadowColor: "#FFD700",
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
    borderColor: "#FFD700",
    borderWidth: 3,
  },
  elementText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  selectedGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 22,
    backgroundColor: "#FFD700",
  },
  selectedBorder: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  explosionEffect: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#FFD700",
  },
  vsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  vsBoxWrapper: {
    position: "relative",
  },
  vsBox: {
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    minWidth: 125,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  vsBoxGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 22,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
  },
  vsLabel: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 1.5,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    },
vsElement: {
color: "#FFF",
fontSize: 30,
fontWeight: "900",
textShadowColor: "#000",
textShadowOffset: { width: 2, height: 2 },
textShadowRadius: 6,
},
vsSwordContainer: {
alignItems: "center",
marginHorizontal: 15,
},
vsText: {
color: "#FFD700",
fontSize: 16,
fontWeight: "900",
marginTop: 4,
letterSpacing: 2,
textShadowColor: "#FF8C00",
textShadowOffset: { width: 0, height: 2 },
textShadowRadius: 6,
},
resultContainer: {
flexDirection: "row",
alignItems: "center",
paddingHorizontal: 32,
paddingVertical: 16,
borderRadius: 25,
shadowColor: "#FFD700",
shadowOffset: { width: 0, height: 6 },
shadowOpacity: 1,
shadowRadius: 15,
elevation: 15,
borderWidth: 3,
borderColor: "rgba(255, 255, 255, 0.3)",
},
resultText: {
color: "#FFF",
fontSize: 26,
fontWeight: "900",
textAlign: "center",
textShadowColor: "#000",
textShadowOffset: { width: 2, height: 2 },
textShadowRadius: 8,
letterSpacing: 1,
},
betControls: {
flexDirection: "row",
justifyContent: "center",
alignItems: "center",
gap: 22,
marginTop: 25,
},
betBtn: {
borderRadius: 32,
shadowColor: "#000",
shadowOffset: { width: 0, height: 6 },
shadowOpacity: 0.5,
shadowRadius: 8,
elevation: 10,
},
betBtnGradient: {
width: 64,
height: 64,
borderRadius: 32,
justifyContent: "center",
alignItems: "center",
},
betDisplay: {
position: "relative",
paddingHorizontal: 32,
paddingVertical: 16,
borderRadius: 22,
alignItems: "center",
minWidth: 150,
overflow: "hidden",
},
betBorder: {
position: "absolute",
top: 0,
left: 0,
right: 0,
bottom: 0,
borderRadius: 22,
borderWidth: 3,
borderColor: "#FFD700",
},
betLabel: {
color: "#87CEEB",
fontSize: 13,
fontWeight: "800",
marginBottom: 6,
letterSpacing: 1.5,
},
betAmount: {
color: "#FFD700",
fontSize: 32,
fontWeight: "900",
textShadowColor: "#FF8C00",
textShadowOffset: { width: 0, height: 2 },
textShadowRadius: 6,
},
fightBtnContainer: {
marginTop: 30,
shadowColor: "#FFD700",
shadowOffset: { width: 0, height: 8 },
shadowOpacity: 1,
shadowRadius: 20,
elevation: 20,
},
fightBtn: {
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
padding: 22,
borderRadius: 35,
overflow: "hidden",
borderWidth: 3,
borderColor: "rgba(255, 255, 255, 0.3)",
},
fightText: {
color: "#FFF",
fontSize: 28,
fontWeight: "900",
letterSpacing: 2,
textShadowColor: "#000",
textShadowOffset: { width: 2, height: 2 },
textShadowRadius: 6,
},
buttonShimmer: {
position: "absolute",
top: 0,
left: 0,
width: 100,
height: "100%",
backgroundColor: "rgba(255, 255, 255, 0.3)",
},
});