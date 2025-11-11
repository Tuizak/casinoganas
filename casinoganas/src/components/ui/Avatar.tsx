import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../constants/theme";
import * as ImagePicker from "expo-image-picker";

interface Props {
  uri?: string;
  onChange?: (uri: string) => void;
}

export const Avatar = ({ uri, onChange }: Props) => {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].uri) {
      onChange?.(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={pickImage}>
      <Image
        source={{ uri: uri || "https://i.pravatar.cc/150" }}
        style={styles.image}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginVertical: theme.spacing(2),
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  image: {
    width: 120,
    height: 120,
  },
});
