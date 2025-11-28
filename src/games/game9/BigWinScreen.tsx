import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { Video, Audio } from "expo-av";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

export default function BigWinScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const bigWinMusic = useRef<Audio.Sound | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    (async () => {
      bigWinMusic.current = new Audio.Sound();
      await bigWinMusic.current.loadAsync(require("./assets/sounds/bigwin.mp3"));
      await bigWinMusic.current.setVolumeAsync(0.9);
      await bigWinMusic.current.playAsync();
    })();

    const timer = setTimeout(async () => {
      await bigWinMusic.current?.stopAsync();
      await bigWinMusic.current?.unloadAsync();
      navigation.goBack();
    }, 6500);

    return () => {
      bigWinMusic.current?.unloadAsync();
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require("./assets/bigwin.mp4")}
        style={styles.video}
        shouldPlay
        resizeMode="cover"
      />
      <Text style={styles.text}> BIG WIN </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  video: { width, height, position: "absolute" },
  text: {
    fontSize: 60,
    fontWeight: "900",
    color: "#FFD700",
    textShadowColor: "#ff8c00",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
  },
});
