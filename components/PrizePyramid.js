import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import * as Animatable from "react-native-animatable";

const { height, width } = Dimensions.get("window");

const prizeLevels = [
  "₪100",
  "₪200",
  "₪300",
  "₪500",
  "₪1,000",
  "₪2,000",
  "₪4,000",
  "₪8,000",
  "₪16,000",
  "₪32,000",
  "₪64,000",
  "₪125,000",
  "₪250,000",
  "₪500,000",
  "₪1,000,000",
].reverse(); // million on top

export default function PrizePyramid({ step }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (step >= currentStep) {
      let current = currentStep;
      const interval = setInterval(async () => {
        if (current > step) return clearInterval(interval);
        setCurrentStep(current);
        await playClimbSound();
        current++;
      }, 300);
      return () => clearInterval(interval);
    } else {
      setCurrentStep(step);
    }
  }, [step]);

  const playClimbSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/climb.mp3")
      );
      await sound.playAsync();
    } catch (err) {
      console.log("Sound error:", err);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Image
        source={require("../assets/images/sparkles.webp")}
        style={styles.background}
        resizeMode="cover"
      />

      <View style={styles.container}>
        {prizeLevels.map((amount, i) => {
          const index = prizeLevels.length - 1 - i;
          const isCurrent = index === currentStep;
          const isPast = index < currentStep;

          const Box = isCurrent
            ? Animatable.View
            : isPast
            ? Animatable.View
            : View;

          return (
            <Box
              key={i}
              animation={isCurrent ? "pulse" : isPast ? "fadeOut" : undefined}
              iterationCount={isCurrent ? "infinite" : 1}
              duration={500}
              style={[
                styles.row,
                isCurrent && styles.active,
                isPast && styles.faded,
              ]}
            >
              <Text
                style={[
                  styles.text,
                  isCurrent && styles.activeText,
                  isPast && styles.fadedText,
                ]}
              >
                {amount}
              </Text>
            </Box>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    backgroundColor: "#000",
  },
  background: {
    position: "absolute",
    width: width,
    height: height,
    opacity: 0.2,
  },
  container: {
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    zIndex: 2,
  },
  row: {
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  text: {
    color: "#999",
    fontSize: 18,
  },
  active: {
    backgroundColor: "#ffd700",
    borderRadius: 6,
  },
  activeText: {
    color: "#000",
    fontWeight: "bold",
  },
  faded: {
    opacity: 0.3,
  },
  fadedText: {
    color: "#666",
  },
});
