import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";
import { Ionicons } from "@expo/vector-icons";

const CrashX = () => {
  const { user } = useAuth();
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashed, setCrashed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [bet, setBet] = useState(100);
  const [winAmount, setWinAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<any>(null);

  const startGame = async () => {
    if (!user || playing) return;

    const balanceData = await getUserBalance(user.id);
    let currentBalance = balanceData.balance;

    if (currentBalance < bet) {
      Alert.alert("Saldo insuficiente", "Recarga tus créditos para jugar.");
      return;
    }

    setPlaying(true);
    setWithdrawn(false);
    setCrashed(false);
    setMultiplier(1.0);
    setWinAmount(0);

    // animación de inicio
    Animated.timing(animValue, {
      toValue: 1,
      duration: 500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    // restar apuesta
    const newBalance = currentBalance - bet;
    setBalance(newBalance);
    await updateUserBalance(user.id, newBalance, bet, 0);

    // crecimiento del multiplicador
    intervalRef.current = setInterval(() => {
      setMultiplier((prev) => {
        const next = Number((prev + 0.05 * prev).toFixed(2));
        const crashPoint = Math.random() * 10 + 1.5; // crash aleatorio

        if (next >= crashPoint) {
          clearInterval(intervalRef.current);
          setCrashed(true);
          setPlaying(false);

          if (!withdrawn) {
            setWinAmount(0);
            Alert.alert("💥 Crash!", "Perdiste esta ronda.");
          }

          return crashPoint;
        }
        return next;
      });
    }, 300);
  };

  const withdraw = async () => {
    if (!playing || withdrawn) return;

    clearInterval(intervalRef.current);
    const gain = Number((bet * multiplier).toFixed(2));

    const balanceData = await getUserBalance(user.id);
    const newBalance = balanceData.balance + gain;
    await updateUserBalance(user.id, newBalance, bet, gain);

    setWithdrawn(true);
    setWinAmount(gain);
    setPlaying(false);
    Alert.alert("🎉 ¡Ganaste!", `Retiraste $${gain}`);
  };

  const reset = () => {
    setMultiplier(1.0);
    setWithdrawn(false);
    setCrashed(false);
    setPlaying(false);
    setWinAmount(0);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <LinearGradient colors={["#000", "#111", "#0a0a0a"]} style={styles.container}>
      <Text style={styles.title}>🚀 CrashX</Text>

      <View style={styles.multiplierBox}>
        <Animated.Text
          style={[
            styles.multiplierText,
            crashed && { color: "#FF4040" },
            withdrawn && { color: "#00FF88" },
          ]}
        >
          x{multiplier.toFixed(2)}
        </Animated.Text>
      </View>

      {crashed && (
        <Text style={styles.crashText}>💥 El cohete explotó</Text>
      )}

      {winAmount > 0 && (
        <Text style={styles.winText}>💰 Ganaste ${winAmount}</Text>
      )}

      <View style={styles.buttons}>
        {!playing && !crashed ? (
          <TouchableOpacity style={styles.playBtn} onPress={startGame}>
            <Ionicons name="rocket" size={20} color="#000" />
            <Text style={styles.btnText}>Iniciar Apuesta</Text>
          </TouchableOpacity>
        ) : playing && !withdrawn ? (
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: "#00FF88" }]}
            onPress={withdraw}
          >
            <Ionicons name="cash-outline" size={20} color="#000" />
            <Text style={styles.btnText}>Retirar</Text>
          </TouchableOpacity>
        ) : (
          crashed && (
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: "#FFD700" }]}
              onPress={reset}
            >
              <Ionicons name="refresh" size={20} color="#000" />
              <Text style={styles.btnText}>Jugar de nuevo</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </LinearGradient>
  );
};

export default CrashX;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFD700",
    marginBottom: 40,
  },
  multiplierBox: {
    marginVertical: 40,
  },
  multiplierText: {
    fontSize: 56,
    fontWeight: "900",
    color: "#FFD700",
  },
  crashText: {
    fontSize: 18,
    color: "#FF4040",
    marginTop: 10,
  },
  winText: {
    fontSize: 18,
    color: "#00FF88",
    marginTop: 10,
  },
  buttons: {
    flexDirection: "row",
    marginTop: 40,
  },
  playBtn: {
    flexDirection: "row",
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    alignItems: "center",
    gap: 10,
  },
  btnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
});
