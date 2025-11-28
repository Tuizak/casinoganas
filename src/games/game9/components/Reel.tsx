import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Easing } from "react-native";

const symbols = ["🍒", "🍋", "🍉", "⭐", "💎", "7️⃣"];

interface ReelProps {
  index: number;
  spinning: boolean;
  onStop?: (symbol: string) => void;
}

export default function Reel({ index, spinning, onStop }: ReelProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (spinning) {
      spin();
    }
  }, [spinning]);

  const spin = () => {
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: -100 * 30,
        duration: 2500 + index * 250,
        easing: Easing.bezier(0.2, 0.8, 0.4, 1),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      const final = symbols[Math.floor(Math.random() * symbols.length)];
      onStop?.(final);
    });
  };

  return (
    <View style={styles.reelContainer}>
      <Animated.View
        style={[
          styles.strip,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {[...Array(30)].map((_, i) => (
          <View key={i} style={styles.symbolContainer}>
            <Text style={styles.symbol}>{symbols[i % symbols.length]}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  reelContainer: {
    width: 90,
    height: 100,
    overflow: "hidden",
    backgroundColor: "rgba(10,10,30,0.8)",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,0.3)",
    borderRadius: 12,
  },
  strip: {
    position: "absolute",
  },
  symbolContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  symbol: {
    fontSize: 56,
  },
});
