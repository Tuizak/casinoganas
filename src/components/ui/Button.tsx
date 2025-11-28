import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { theme } from "../../constants/theme";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export const Button = ({ title, onPress, disabled }: Props) => (
  <TouchableOpacity
    style={[styles.button, disabled && { opacity: 0.5 }]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
  >
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius,
    alignItems: "center",
    marginVertical: theme.spacing(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: 16,
  },
});
