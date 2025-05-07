import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import * as Animatable from "react-native-animatable";

const { height, width } = Dimensions.get("window");

const prizeLevels = [
  "₪1,000,000",
  "₪500,000",
  "₪250,000",
  "₪100,000",
  "₪50,000",
  "₪25,000",
  "₪15,000",
  "₪12,500",
  "₪10,000",
  "₪7,500",
  "₪5,000",
  "₪3,000",
  "₪2,000",
  "₪1,000",
  "₪500",
].reverse(); // Start from top with ₪1,000,000

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
                { width: getRowWidth(i) }, // Dynamic width based on row position
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

// Function to control the width for the pyramid effect
const getRowWidth = (i) => {
  const widths = [
    "85%", // Top level
    "75%",
    "70%",
    "65%",
    "60%",
    "55%",
    "50%",
    "45%",
    "40%",
    "35%",
    "30%",
    "25%",
    "20%",
    "15%",
    "10%", // Bottom level
  ];
  return widths[i] || "100%"; // Default to full width
};

const styles = StyleSheet.create({
  wrapper: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    backgroundColor: "#000", // Solid black background
  },
  container: {
    backgroundColor: "rgba(0,0,0,0.8)", // Slight transparency
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    zIndex: 2,
    justifyContent: "center",
  },
  row: {
    paddingVertical: 8,
    marginVertical: 5,
    alignItems: "center", // Center the text
    justifyContent: "center",
    borderRadius: 6,
    height: 50, // Set a height to make each row consistent
  },
  text: {
    color: "#fff",
    fontSize: 22, // Consistent font size
    textAlign: "center",
  },
  active: {
    backgroundColor: "#ffd700", // Golden color for active step
    borderRadius: 6,
    paddingVertical: 15,
  },
  activeText: {
    color: "#000", // Black text for active step
    fontWeight: "bold",
  },
  faded: {
    opacity: 0.3,
  },
  fadedText: {
    color: "#666",
  },
});
