// src/games/gameXX/DiceRush.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const BET = 50; // apuesta fija
const SUM_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const DiceRush = ({ navigation }: any) => {
  const { user } = useAuth();

  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [rolling, setRolling] = useState(false);

  const [shakeAnim] = useState(new Animated.Value(0));
  const [dropAnim] = useState(new Animated.Value(0));

  const [selectedSums, setSelectedSums] = useState<number[]>([6, 7, 8]);
  const [resultText, setResultText] = useState<string | null>(null);
  const [lastSum, setLastSum] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number>(0);

  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);

  // Cargar saldo al entrar
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const data = await getUserBalance(user.id);
        setBalance(Number(data.balance || 0));
      } catch (e) {
        console.log("Error al cargar balance en DiceRush", e);
        Alert.alert("Error", "No se pudo cargar tu saldo.");
      } finally {
        setLoadingBalance(false);
      }
    };
    load();
  }, [user?.id]);

  const toggleSum = (sum: number) => {
    setSelectedSums((prev) => {
      if (prev.includes(sum)) {
        return prev.filter((n) => n !== sum);
      }
      if (prev.length >= 3) return prev;
      return [...prev, sum].sort((a, b) => a - b);
    });
  };

  const rollDice = async () => {
    if (rolling) return;

    if (!user) {
      Alert.alert("Sesión requerida", "Debes iniciar sesión para jugar.");
      return;
    }

    if (selectedSums.length === 0) {
      Alert.alert(
        "Selecciona números",
        "Elige al menos 1 número (máximo 3) de la suma de los dados."
      );
      return;
    }

    try {
      setRolling(true);
      setResultText(null);

      // Verificar saldo
      const balanceData = await getUserBalance(user.id);
      let currentBalance = Number(balanceData.balance || 0);

      if (currentBalance < BET) {
        Alert.alert(
          "Saldo insuficiente",
          `Necesitas al menos ${BET} créditos para jugar.`
        );
        setRolling(false);
        return;
      }

      // reiniciar posición de caída (arriba de la mesa)
      dropAnim.setValue(-160);
      shakeAnim.setValue(0);

      // Animación combinada: shake + caída a la mesa con rebote
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 12,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -12,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 6,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(dropAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación de caras cambiando mientras "caen"
      let ticks = 15;
      const interval = setInterval(() => {
        setDice1(Math.floor(Math.random() * 6) + 1);
        setDice2(Math.floor(Math.random() * 6) + 1);
        ticks -= 1;
        if (ticks <= 0) {
          clearInterval(interval);
        }
      }, 60);

      // Cuando termina la animación, fijamos el resultado real
      setTimeout(async () => {
        const finalD1 = Math.floor(Math.random() * 6) + 1;
        const finalD2 = Math.floor(Math.random() * 6) + 1;

        setDice1(finalD1);
        setDice2(finalD2);

        const sum = finalD1 + finalD2;
        setLastSum(sum);

        let reward = 0;
        const isHit = selectedSums.includes(sum);
        if (isHit) {
          reward = BET * 3;
        }

        const newBalance = currentBalance - BET + reward;

        try {
          await updateUserBalance(user.id, newBalance, BET, reward);
          setBalance(newBalance);
        } catch (e) {
          console.log("Error al actualizar saldo en DiceRush", e);
        }

        setLastWin(reward);

        if (isHit) {
          setResultText(
            `🎉 La suma fue ${sum}. ¡Adivinaste uno de tus números y ganaste ${reward} créditos!`
          );
        } else {
          setResultText(
            `😢 La suma fue ${sum}. Ninguno de tus números salió, perdiste tu apuesta.`
          );
        }

        setRolling(false);
      }, 60 * 15 + 250);
    } catch (error) {
      console.log("Error general en DiceRush", error);
      Alert.alert("Error", "No se pudo realizar la jugada.");
      setRolling(false);
    }
  };

  const isWinResult = resultText && resultText.includes("🎉");

  return (
    <LinearGradient
      colors={["#0a0a0f", "#1a1a24", "#0a0a0f"]}
      style={styles.container}
    >
      {/* App Bar Superior */}
      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Juegos</Text>
        </TouchableOpacity>

        <View style={styles.balancePill}>
          <Ionicons name="wallet" size={18} color="#FFD700" />
          <Text style={styles.balancePillText}>
            {loadingBalance ? "..." : balance.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Título y descripción */}
      <View style={styles.header}>
        <Text style={styles.gameTitle}>🎲 DC RUSH</Text>
        <Text style={styles.gameSubtitle}>
          Elige hasta 3 sumas. Si los dados caen en alguna de ellas, ganas x3 tu apuesta.
        </Text>
      </View>

      {/* Selector de números */}
      <View style={styles.selectorContainer}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorLabel}>NÚMEROS ELEGIDOS</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{selectedSums.length}/3</Text>
          </View>
        </View>

        <View style={styles.chipsGrid}>
          {SUM_OPTIONS.map((num) => {
            const selected = selectedSums.includes(num);
            return (
              <TouchableOpacity
                key={num}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleSum(num)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Mesa de dados */}
      <View style={styles.tableContainer}>
        <LinearGradient
          colors={["#145A32", "#0E4D2D", "#0B3D27"]}
          style={styles.table}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.tableBorder} />
          
          <Animated.View
            style={[
              styles.diceContainer,
              {
                transform: [
                  { translateX: shakeAnim },
                  { translateY: dropAnim },
                ],
              },
            ]}
          >
            <View style={styles.diceBox}>
              <LinearGradient
                colors={["#2a2a2a", "#1a1a1a"]}
                style={styles.dice}
              >
                <Text style={styles.diceValue}>{dice1}</Text>
              </LinearGradient>
            </View>

            <View style={styles.diceBox}>
              <LinearGradient
                colors={["#2a2a2a", "#1a1a1a"]}
                style={styles.dice}
              >
                <Text style={styles.diceValue}>{dice2}</Text>
              </LinearGradient>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Info de juego */}
      <View style={styles.gameInfo}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>APUESTA</Text>
          <Text style={styles.infoValue}>{BET} CR</Text>
        </View>

        {lastSum !== null && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>ÚLTIMA SUMA</Text>
            <Text style={styles.infoValue}>{lastSum}</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>PREMIO</Text>
          <Text style={[styles.infoValue, lastWin > 0 && styles.infoValueWin]}>
            {lastWin.toFixed(0)} CR
          </Text>
        </View>
      </View>

      {/* Botón de acción */}
      <TouchableOpacity
        style={[styles.playButton, rolling && styles.playButtonDisabled]}
        onPress={rollDice}
        disabled={rolling}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={rolling ? ["#999999", "#777777"] : ["#FFD700", "#FFA500"]}
          style={styles.playButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons
            name={rolling ? "hourglass" : "play"}
            size={20}
            color="#000000"
          />
          <Text style={styles.playButtonText}>
            {rolling ? "LANZANDO..." : "LANZAR DADOS"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Resultado */}
      {resultText && (
        <View style={[styles.resultCard, isWinResult && styles.resultCardWin]}>
          <Text style={[styles.resultText, isWinResult && styles.resultTextWin]}>
            {resultText}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

export default DiceRush;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    gap: 6,
  },
  balancePillText: {
    color: "#FFD700",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  gameTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: 2,
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  gameSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  selectorContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  selectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.2,
  },
  countBadge: {
    backgroundColor: "rgba(108, 99, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: "#6C63FF",
    fontSize: 12,
    fontWeight: "700",
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    minWidth: 50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  chipTextSelected: {
    color: "#000000",
  },
  tableContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  table: {
    borderRadius: 20,
    padding: 32,
    borderWidth: 3,
    borderColor: "#0E6655",
    shadowColor: "#145A32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  tableBorder: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  diceContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  diceBox: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dice: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  diceValue: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(255, 215, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameInfo: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoValueWin: {
    color: "#00E676",
  },
  playButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
  playButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: 1,
  },
  resultCard: {
    marginHorizontal: 20,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  resultCardWin: {
    backgroundColor: "rgba(0, 230, 118, 0.1)",
    borderColor: "rgba(0, 230, 118, 0.3)",
  },
  resultText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 20,
  },
  resultTextWin: {
    color: "#00E676",
  },
});