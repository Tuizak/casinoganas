import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function ResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { result, credits }: any = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.result}>
        {result === "win" ? "🎉 ¡Ganaste 50 créditos!" : "😢 Perdiste esta vez"}
      </Text>

      <Text style={styles.credits}>Créditos actuales: {credits}</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("SlotMachine" as never)}
      >
        <Text style={styles.btnText}>🎰 Jugar otra vez</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#444" }]}
        onPress={() => navigation.navigate("Home" as never)}
      >
        <Text style={styles.btnText}>🏠 Regresar al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  result: { fontSize: 26, color: "#fff", marginBottom: 20 },
  credits: { fontSize: 18, color: "gold", marginBottom: 30 },
  btn: {
    backgroundColor: "#e60073",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});
