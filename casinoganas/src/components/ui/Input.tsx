import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, TextInputProps } from "react-native";

interface Props extends TextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

export const Input = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  style,
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container]}>
      {(isFocused || value) && (
        <Text style={styles.placeholderFocused}>{placeholder}</Text>
      )}
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        placeholder={!isFocused ? placeholder : ""}
        placeholderTextColor="#888"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 56,
    justifyContent: "center",
  },
  placeholderFocused: {
    position: "absolute",
    top: -10,
    left: 16,
    fontSize: 12,
    color: "#FFD700",
    backgroundColor: "transparent",
    paddingHorizontal: 4,
  },
  input: {
    color: "#fff",
    fontSize: 16,
    paddingVertical: 18,
  },
});
