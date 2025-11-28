import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
  ScrollView,
  Dimensions,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// Colores para cada opción de la ruleta
const colorPalettes: Record<string, { gradient: string[]; icon: string }> = {
  rojo: { gradient: ["#FF4757", "#FF6B81", "#FF3838"], icon: "flame" },
  azul: { gradient: ["#5F27CD", "#341F97", "#4834DF"], icon: "water" },
  verde: { gradient: ["#00D2D3", "#1DD1A1", "#10AC84"], icon: "leaf" },
  morado: { gradient: ["#A55EEA", "#8854D0", "#6C5CE7"], icon: "sparkles" },
  dorado: { gradient: ["#FFD700", "#FFA500", "#FF9F43"], icon: "star" },
};

const Particle = ({ delay, color }: { delay: number; color: string }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Dimensions.get('window').height + 100, -100],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 80],
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
          backgroundColor: color,
          left: Math.random() * width,
          transform: [{ translateY }, { translateX }],
          opacity,
        },
      ]}
    />
  );
};

export default function CosmicRoulette() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(10);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  
  // Animaciones
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const balanceAnim = useRef(new Animated.Value(1)).current;
  const containerAnim = useRef(new Animated.Value(0)).current;

  const colors = ["rojo", "azul", "verde", "morado", "dorado"];
  const multipliers: Record<string, number> = {
    rojo: 2,
    azul: 3,
    verde: 4,
    morado: 5,
    dorado: 10,
  };

  // Bloquear retroceso durante el juego
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (spinning || gameActive) {
          Alert.alert(
            "Ruleta en movimiento",
            "No puedes salir mientras la ruleta está girando. Espera a que termine.",
            [{ text: "Entendido" }]
          );
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [spinning, gameActive])
  );

  // 🪙 Cargar balance del usuario
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return;
      try {
        const data = await getUserBalance(user.id);
        setBalance(Number(data.balance || 0));
      } catch (error) {
        console.error("Error al obtener balance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [user?.id]);

  // Animaciones de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación continua de brillo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulso continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animateBalance = () => {
    Animated.sequence([
      Animated.timing(balanceAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(balanceAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 🎡 Animación del giro
  const spinRoulette = async () => {
    if (!selectedColor) {
      Alert.alert("⚠️ Selecciona un color", "Debes elegir una energía cósmica antes de girar.");
      return;
    }
    if (spinning || balance < bet) {
      Alert.alert("❌ Créditos insuficientes", "Recarga tu balance para continuar.");
      return;
    }

    setGameActive(true);
    setSpinning(true);
    const newBalance = balance - bet;
    setBalance(newBalance);
    setResult(null);
    animateBalance();

    // Girar ruleta (3600 grados aprox + offset aleatorio)
    const finalRotation = 3600 + Math.floor(Math.random() * 360);
    Animated.timing(spinAnim, {
      toValue: finalRotation,
      duration: 4000,
      useNativeDriver: true,
    }).start(async () => {
      // Calcular resultado
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setResult(randomColor);

      let winAmount = 0;
      if (randomColor === selectedColor) {
        winAmount = bet * multipliers[randomColor];
        Alert.alert("🎉 ¡Victoria Cósmica!", `La ruleta cayó en ${randomColor}. Ganaste $${winAmount}`, [
          { text: "¡Genial!", style: "default" }
        ]);
      } else {
        Alert.alert("🌌 Sigue Intentando", `La energía fue ${randomColor}. La próxima será.`, [
          { text: "Continuar", style: "default" }
        ]);
      }

      const updatedBalance = newBalance + winAmount;
      setBalance(updatedBalance);
      animateBalance();

      try {
        await updateUserBalance(user.id, updatedBalance, bet, winAmount, {
          game: "CosmicRoulette",
          selectedColor: selectedColor,
          result: randomColor,
          win: randomColor === selectedColor,
          winAmount: winAmount,
        });
      } catch (error) {
        console.error("Error guardando resultado:", error);
      }

      setSpinning(false);
      setGameActive(false);
      spinAnim.setValue(0);
    });
  };

  const rotation = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  const containerTranslateY = containerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#0a0a0a", "#1a0a2e", "#16213e"]}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={{ opacity: fadeAnim }}>
          <Ionicons name="planet" size={80} color="#A55EEA" />
          <Text style={styles.loadingText}>Cargando Dimensión Cósmica...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#1a0a2e", "#16213e", "#0a0a0a"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Partículas de fondo */}
      {[...Array(12)].map((_, i) => (
        <Particle 
          key={i} 
          delay={i * 250} 
          color={colorPalettes[colors[i % colors.length]].gradient[0]} 
        />
      ))}

      <Animated.View style={[
        styles.content,
        { 
          opacity: containerAnim,
          transform: [{ translateY: containerTranslateY }]
        }
      ]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Mejorado */}
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => {
                if (spinning || gameActive) {
                  Alert.alert(
                    "Ruleta en movimiento",
                    "No puedes salir mientras la ruleta está girando.",
                    [{ text: "Continuar" }]
                  );
                } else {
                  navigation.goBack();
                }
              }}
              disabled={spinning || gameActive}
            >
              <LinearGradient
                colors={["rgba(165, 94, 234, 0.3)", "rgba(139, 84, 208, 0.2)"]}
                style={styles.backButtonGradient}
              >
                <Ionicons name="chevron-back" size={28} color="#FFD700" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Ionicons name="planet-outline" size={32} color="#FFD700" />
              <Text style={styles.title}>Ruleta Cósmica</Text>
              <View style={styles.titleBadge}>
                <Text style={styles.titleBadgeText}>PREMIUM</Text>
              </View>
            </View>

            <View style={styles.placeholder} />
          </Animated.View>

          {/* Balance Card Mejorado */}
          <Animated.View
            style={[
              styles.balanceCard,
              { opacity: fadeAnim, transform: [{ scale: balanceAnim }] },
            ]}
          >
            <LinearGradient
              colors={["rgba(165, 94, 234, 0.3)", "rgba(139, 84, 208, 0.2)", "rgba(165, 94, 234, 0.1)"]}
              style={styles.balanceGradient}
            >
              <View style={styles.balanceContent}>
                <View style={styles.balanceIconContainer}>
                  <Ionicons name="wallet" size={36} color="#FFD700" />
                </View>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>ENERGÍA CÓSMICA</Text>
                  <Text style={styles.balanceAmount}>${balance}</Text>
                </View>
                <View style={styles.balanceStats}>
                  <Text style={styles.balanceChange}>Apuesta: ${bet}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Ruleta Visual Mejorada */}
          <Animated.View
            style={[
              styles.rouletteContainer,
              { opacity: fadeAnim, transform: [{ rotate: rotation }] },
            ]}
          >
            <LinearGradient
              colors={["rgba(165, 94, 234, 0.4)", "rgba(139, 84, 208, 0.3)", "rgba(165, 94, 234, 0.2)"]}
              style={styles.rouletteCircle}
            >
              {colors.map((color, index) => {
                const angle = (360 / colors.length) * index;
                return (
                  <Animated.View
                    key={color}
                    style={[
                      styles.rouletteSegment,
                      {
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -90 },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={colorPalettes[color].gradient}
                      style={styles.segmentGradient}
                    >
                      <Ionicons
                        name={colorPalettes[color].icon as any}
                        size={24}
                        color="#FFF"
                      />
                      <Text style={styles.segmentMultiplier}>
                        {multipliers[color]}x
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                );
              })}

              {/* Centro de la ruleta mejorado */}
              <View style={styles.rouletteCenter}>
                <LinearGradient
                  colors={["#FFD700", "#FFA500", "#FF9F43"]}
                  style={styles.centerGradient}
                >
                  <Ionicons name="planet" size={44} color="#000" />
                </LinearGradient>
              </View>
            </LinearGradient>

            {/* Indicador mejorado */}
            <View style={styles.indicator}>
              <LinearGradient
                colors={["#FF4757", "#FF3838"]}
                style={styles.indicatorGradient}
              >
                <Ionicons name="caret-down" size={28} color="#FFF" />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Resultado Mejorado */}
          {result && (
            <Animated.View
              style={[styles.resultCard, { opacity: fadeAnim }]}
            >
              <LinearGradient
                colors={colorPalettes[result].gradient}
                style={styles.resultGradient}
              >
                <Ionicons
                  name={colorPalettes[result].icon as any}
                  size={32}
                  color="#FFF"
                />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultTitle}>ENERGÍA RESULTANTE</Text>
                  <Text style={styles.resultValue}>{result.toUpperCase()}</Text>
                </View>
                <View style={styles.multiplierChip}>
                  <Text style={styles.multiplierChipText}>
                    {multipliers[result]}x
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Selección de Color Mejorada */}
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.sectionTitle}>SELECCIONA TU ENERGÍA</Text>
            <View style={styles.colorOptions}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    selectedColor === color && styles.selectedOption,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedColor(color)}
                  disabled={spinning}
                >
                  <LinearGradient
                    colors={
                      selectedColor === color
                        ? colorPalettes[color].gradient
                        : ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"]
                    }
                    style={styles.colorOptionGradient}
                  >
                    <Ionicons
                      name={colorPalettes[color].icon as any}
                      size={28}
                      color={selectedColor === color ? "#FFF" : "#666"}
                    />
                    <View style={styles.colorTextContainer}>
                      <Text
                        style={[
                          styles.colorText,
                          selectedColor === color && styles.colorTextSelected,
                        ]}
                      >
                        {color.toUpperCase()}
                      </Text>
                      <Text style={styles.colorSubtext}>
                        Multiplicador {multipliers[color]}x
                      </Text>
                    </View>
                    {selectedColor === color && (
                      <Animated.View style={[styles.selectedGlow, { opacity: glowOpacity }]} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Control de Apuesta Mejorado */}
          <Animated.View
            style={[
              styles.betSection,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.sectionTitle}>CONTROL DE APUESTA</Text>
            <LinearGradient
              colors={["rgba(165, 94, 234, 0.2)", "rgba(139, 84, 208, 0.1)", "rgba(165, 94, 234, 0.05)"]}
              style={styles.betCard}
            >
              <TouchableOpacity
                style={styles.betButton}
                activeOpacity={0.7}
                onPress={() => setBet(Math.max(10, bet - 10))}
                disabled={spinning}
              >
                <LinearGradient
                  colors={["#FF4757", "#FF3838"]}
                  style={styles.betButtonGradient}
                >
                  <Ionicons name="remove" size={28} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.betDisplay}>
                <Ionicons name="cash" size={32} color="#FFD700" />
                <Text style={styles.betAmount}>${bet}</Text>
                <Text style={styles.betLabel}>APUESTA ACTUAL</Text>
              </View>

              <TouchableOpacity
                style={styles.betButton}
                activeOpacity={0.7}
                onPress={() => setBet(Math.min(balance, bet + 10))}
                disabled={spinning}
              >
                <LinearGradient
                  colors={["#00D2D3", "#10AC84"]}
                  style={styles.betButtonGradient}
                >
                  <Ionicons name="add" size={28} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>

            {/* Botones de apuesta rápida mejorados */}
            <View style={styles.quickBets}>
              {[10, 50, 100, 500].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickBetButton}
                  activeOpacity={0.7}
                  onPress={() => setBet(Math.min(balance, amount))}
                  disabled={spinning}
                >
                  <LinearGradient
                    colors={["rgba(165, 94, 234, 0.2)", "rgba(139, 84, 208, 0.1)"]}
                    style={styles.quickBetGradient}
                  >
                    <Text style={styles.quickBetText}>${amount}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Botón de Girar Mejorado */}
          <Animated.View
            style={[
              styles.spinButtonContainer,
              { opacity: fadeAnim, transform: [{ scale: pulseAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.spinButton}
              activeOpacity={0.9}
              onPress={spinRoulette}
              disabled={spinning || !selectedColor}
            >
              <LinearGradient
                colors={
                  spinning 
                    ? ["#666", "#555"] 
                    : !selectedColor
                    ? ["#555", "#333"]
                    : ["#A55EEA", "#8854D0", "#6C5CE7", "#A55EEA"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.spinGradient}
              >
                <Animated.View style={{ opacity: glowOpacity }}>
                  <Ionicons
                    name={spinning ? "sync" : "rocket"}
                    size={36}
                    color="#FFF"
                  />
                </Animated.View>
                <View style={styles.spinTextContainer}>
                  <Text style={styles.spinText}>
                    {spinning ? "🌌 GIRANDO..." : "🚀 ACTIVAR RULETA"}
                  </Text>
                  {!spinning && selectedColor && (
                    <Text style={styles.spinSubtext}>
                      Apuesta ${bet} en {selectedColor}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Info de multiplicadores mejorado */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.08)", "rgba(255, 215, 0, 0.05)"]}
              style={styles.infoGradient}
            >
              <Ionicons name="information-circle" size={24} color="#FFD700" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>SISTEMA DE MULTIPLICADORES</Text>
                <Text style={styles.infoText}>
                  Cada energía cósmica tiene un multiplicador único. ¡El dorado ofrece 10x tu apuesta!
                </Text>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    color: "#A55EEA",
    fontSize: 18,
    marginTop: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  particle: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  backButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  titleBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  titleBadgeText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  placeholder: {
    width: 60,
  },
  balanceCard: {
    marginBottom: 32,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#A55EEA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  balanceGradient: {
    padding: 24,
    borderWidth: 2,
    borderColor: "rgba(165, 94, 234, 0.4)",
    borderRadius: 25,
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  balanceInfo: {
    flex: 1,
    marginLeft: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#FFD700",
    marginBottom: 6,
    fontWeight: "700",
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textShadowColor: "#A55EEA",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  balanceStats: {
    alignItems: "flex-end",
  },
  balanceChange: {
    fontSize: 12,
    color: "#87CEEB",
    fontWeight: "600",
  },
  rouletteContainer: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  rouletteCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: "rgba(165, 94, 234, 0.6)",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#A55EEA",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  rouletteSegment: {
    position: "absolute",
    width: 50,
    height: 50,
  },
  segmentGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  segmentMultiplier: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
  },
  rouletteCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  centerGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 50,
  },
  indicator: {
    position: "absolute",
    top: -25,
  },
  indicatorGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#FF4757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  resultCard: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#A55EEA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  resultGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    gap: 16,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 2,
  },
  multiplierChip: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  multiplierChipText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "800",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFD700",
    marginBottom: 16,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  colorOptions: {
    gap: 12,
  },
  colorOption: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedOption: {
    shadowColor: "#A55EEA",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 12,
    transform: [{ scale: 1.02 }],
  },
  colorOptionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderWidth: 2,
    borderColor: "rgba(165, 94, 234, 0.3)",
    borderRadius: 20,
    gap: 16,
  },
  colorTextContainer: {
    flex: 1,
  },
  colorText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#888",
    letterSpacing: 1,
    marginBottom: 4,
  },
  colorTextSelected: {
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  colorSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "600",
  },
  selectedGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 25,
    backgroundColor: "#A55EEA",
    opacity: 0.3,
  },
  betSection: {
    marginBottom: 28,
  },
  betCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(165, 94, 234, 0.3)",
    marginBottom: 16,
  },
  betButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  betButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 32,
  },
  betDisplay: {
    alignItems: "center",
    gap: 8,
  },
  betAmount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textShadowColor: "#FFD700",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  betLabel: {
    fontSize: 12,
    color: "#87CEEB",
    fontWeight: "700",
    letterSpacing: 1,
  },
  quickBets: {
    flexDirection: "row",
    gap: 10,
  },
  quickBetButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  quickBetGradient: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(165, 94, 234, 0.3)",
  },
  quickBetText: {
    color: "#A55EEA",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  spinButtonContainer: {
    marginBottom: 24,
  },
  spinButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#A55EEA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  spinGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 32,
    gap: 16,
  },
  spinTextContainer: {
    alignItems: "center",
  },
  spinText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1.5,
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  spinSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  infoCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  infoGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
    borderRadius: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 18,
    fontWeight: "500",
  },
});