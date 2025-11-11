import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// Colores para cada opción de la ruleta
const colorPalettes: Record<string, { gradient: string[]; icon: string }> = {
  rojo: { gradient: ["#FF4757", "#FF6B81"], icon: "flame" },
  azul: { gradient: ["#5F27CD", "#341F97"], icon: "water" },
  verde: { gradient: ["#00D2D3", "#1DD1A1"], icon: "leaf" },
  morado: { gradient: ["#A55EEA", "#8854D0"], icon: "sparkles" },
  dorado: { gradient: ["#FFD700", "#FFA500"], icon: "star" },
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
  
  // Animaciones
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const colors = ["rojo", "azul", "verde", "morado", "dorado"];
  const multipliers: Record<string, number> = {
    rojo: 2,
    azul: 3,
    verde: 4,
    morado: 5,
    dorado: 10,
  };

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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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

    setSpinning(true);
    const newBalance = balance - bet;
    setBalance(newBalance);
    setResult(null);

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
        Alert.alert("🎉 ¡Ganaste!", `La ruleta cayó en ${randomColor}. Ganaste $${winAmount}`);
      } else {
        Alert.alert("😢 Mala suerte", `Salió ${randomColor}. Inténtalo de nuevo.`);
      }

      const updatedBalance = newBalance + winAmount;
      setBalance(updatedBalance);

      try {
        await updateUserBalance(user.id, updatedBalance, bet, winAmount, {
          game: "CosmicRoulette",
          result: randomColor,
        });
      } catch (error) {
        console.error("Error guardando resultado:", error);
      }

      setSpinning(false);
      spinAnim.setValue(0);
    });
  };

  const rotation = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#0a0a0a", "#1a0a2e", "#16213e"]}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={{ opacity: fadeAnim }}>
          <Ionicons name="planet" size={64} color="#A55EEA" />
          <Text style={styles.loadingText}>Cargando dimensión cósmica...</Text>
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#A55EEA" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Ionicons name="planet-outline" size={24} color="#FFD700" />
            <Text style={styles.title}>Ruleta Cósmica</Text>
          </View>

          <View style={styles.placeholder} />
        </Animated.View>

        {/* Balance Card */}
        <Animated.View
          style={[
            styles.balanceCard,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={["rgba(165, 94, 234, 0.2)", "rgba(139, 84, 208, 0.1)"]}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceContent}>
              <View style={styles.balanceIconContainer}>
                <Ionicons name="wallet" size={32} color="#A55EEA" />
              </View>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Balance Cósmico</Text>
                <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Ruleta Visual */}
        <Animated.View
          style={[
            styles.rouletteContainer,
            { opacity: fadeAnim, transform: [{ rotate: rotation }] },
          ]}
        >
          <LinearGradient
            colors={["rgba(165, 94, 234, 0.3)", "rgba(139, 84, 208, 0.2)"]}
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
                        { translateY: -80 },
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
                      size={20}
                      color="#FFF"
                    />
                  </LinearGradient>
                </Animated.View>
              );
            })}

            {/* Centro de la ruleta */}
            <View style={styles.rouletteCenter}>
              <LinearGradient
                colors={["#A55EEA", "#8854D0"]}
                style={styles.centerGradient}
              >
                <Ionicons name="planet" size={40} color="#FFF" />
              </LinearGradient>
            </View>
          </LinearGradient>

          {/* Indicador */}
          <View style={styles.indicator}>
            <Ionicons name="caret-down" size={32} color="#FFD700" />
          </View>
        </Animated.View>

        {/* Resultado */}
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
                size={28}
                color="#FFF"
              />
              <Text style={styles.resultText}>
                Energía: {result.toUpperCase()}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Selección de Color */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Elige tu Energía Cósmica</Text>
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
              >
                <LinearGradient
                  colors={
                    selectedColor === color
                      ? colorPalettes[color].gradient
                      : ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]
                  }
                  style={styles.colorOptionGradient}
                >
                  <Ionicons
                    name={colorPalettes[color].icon as any}
                    size={24}
                    color={selectedColor === color ? "#FFF" : "#888"}
                  />
                  <Text
                    style={[
                      styles.colorText,
                      selectedColor === color && styles.colorTextSelected,
                    ]}
                  >
                    {color.toUpperCase()}
                  </Text>
                  <View style={styles.multiplierBadge}>
                    <Text style={styles.multiplierText}>
                      {multipliers[color]}x
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Control de Apuesta */}
        <Animated.View
          style={[
            styles.betSection,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Cantidad de Apuesta</Text>
          <LinearGradient
            colors={["rgba(165, 94, 234, 0.15)", "rgba(139, 84, 208, 0.08)"]}
            style={styles.betCard}
          >
            <TouchableOpacity
              style={styles.betButton}
              activeOpacity={0.7}
              onPress={() => setBet(Math.max(10, bet - 10))}
            >
              <LinearGradient
                colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
                style={styles.betButtonGradient}
              >
                <Ionicons name="remove" size={24} color="#A55EEA" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.betDisplay}>
              <Ionicons name="cash" size={24} color="#FFD700" />
              <Text style={styles.betAmount}>${bet}</Text>
            </View>

            <TouchableOpacity
              style={styles.betButton}
              activeOpacity={0.7}
              onPress={() => setBet(Math.min(balance, bet + 10))}
            >
              <LinearGradient
                colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
                style={styles.betButtonGradient}
              >
                <Ionicons name="add" size={24} color="#A55EEA" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

          {/* Botones de apuesta rápida */}
          <View style={styles.quickBets}>
            {[10, 50, 100, 500].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickBetButton}
                activeOpacity={0.7}
                onPress={() => setBet(Math.min(balance, amount))}
              >
                <Text style={styles.quickBetText}>${amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Botón de Girar */}
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
            disabled={spinning}
          >
            <LinearGradient
              colors={
                spinning
                  ? ["#666", "#555"]
                  : ["#A55EEA", "#8854D0", "#A55EEA"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.spinGradient}
            >
              <Animated.View style={{ opacity: glowOpacity }}>
                <Ionicons
                  name={spinning ? "sync" : "planet"}
                  size={28}
                  color="#FFF"
                />
              </Animated.View>
              <Text style={styles.spinText}>
                {spinning ? "GIRANDO..." : "🎡 GIRAR RULETA"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Info de multiplicadores */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={["rgba(255, 215, 0, 0.1)", "rgba(255, 165, 0, 0.05)"]}
            style={styles.infoGradient}
          >
            <Ionicons name="information-circle" size={20} color="#FFD700" />
            <Text style={styles.infoText}>
              Cada energía tiene su propio multiplicador. ¡El dorado paga 10x!
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    color: "#A55EEA",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(165, 94, 234, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 44,
  },
  balanceCard: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: "hidden",
  },
  balanceGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(165, 94, 234, 0.3)",
    borderRadius: 20,
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(165, 94, 234, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#A55EEA",
    letterSpacing: -1,
  },
  rouletteContainer: {
    alignItems: "center",
    marginBottom: 28,
    position: "relative",
  },
  rouletteCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "rgba(165, 94, 234, 0.5)",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  rouletteSegment: {
    position: "absolute",
    width: 40,
    height: 40,
  },
  segmentGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  rouletteCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
  },
  centerGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 40,
  },
  indicator: {
    position: "absolute",
    top: -20,
  },
  resultCard: {
    marginBottom: 28,
    borderRadius: 16,
    overflow: "hidden",
  },
  resultGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
  resultText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#A55EEA",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  colorOptions: {
    gap: 12,
  },
  colorOption: {
    borderRadius: 16,
    overflow: "hidden",
  },
  selectedOption: {
    shadowColor: "#A55EEA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  colorOptionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(165, 94, 234, 0.2)",
    borderRadius: 16,
    gap: 12,
  },
  colorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 0.5,
  },
  colorTextSelected: {
    color: "#FFF",
  },
  multiplierBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  multiplierText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "800",
  },
  betSection: {
    marginBottom: 28,
  },
  betCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(165, 94, 234, 0.2)",
  },
  betButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  betButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(165, 94, 234, 0.3)",
    borderRadius: 28,
  },
  betDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  betAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  quickBets: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  quickBetButton: {
    flex: 1,
    backgroundColor: "rgba(165, 94, 234, 0.1)",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(165, 94, 234, 0.2)",
  },
  quickBetText: {
    color: "#A55EEA",
    fontSize: 14,
    fontWeight: "700",
  },
  spinButtonContainer: {
    marginBottom: 24,
  },
  spinButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#A55EEA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  spinGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  spinText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
  infoCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  infoGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
  },
});