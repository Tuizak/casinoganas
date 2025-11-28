import React, { useRef } from "react";
import { TouchableOpacity, Text, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface SpinButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export default function SpinButton({ onPress, disabled }: SpinButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        disabled={disabled}
      >
        <LinearGradient
          colors={disabled ? ["#444", "#222"] : ["#e60073", "#c8005f", "#aa004d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Ionicons
            name={disabled ? "pause" : "play-circle"}
            size={28}
            color="#fff"
          />
          <Text style={styles.text}>{disabled ? "GIRANDO..." : "GIRAR"}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 18,
    shadowColor: "#e60073",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  text: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
});
