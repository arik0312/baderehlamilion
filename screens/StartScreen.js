import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StartScreen({ navigation }) {
  const [name, setName] = useState("");
  const [nameLocked, setNameLocked] = useState(false);
  const [lastScore, setLastScore] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedName = await AsyncStorage.getItem("lastName");
        const storedScore = await AsyncStorage.getItem("lastScore");

        if (storedName) {
          setName(storedName);
          setNameLocked(true);
        }
        if (storedScore) setLastScore(storedScore);
      } catch (err) {
        console.log("Failed to load from storage:", err);
      }
    };
    loadData();
  }, []);

  const handleStart = async () => {
    if (!name.trim() || name.length < 2) return;

    try {
      await AsyncStorage.setItem("lastName", name);
      navigation.navigate("Quiz", { name });
    } catch (err) {
      console.log("Failed to save name:", err);
    }
  };

  const handleDelete = () => {
    Alert.alert("מחק משתמש", "האם אתה בטוח שברצונך למחוק את המשתמש והניקוד?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחק",
        onPress: async () => {
          await AsyncStorage.removeItem("lastName");
          await AsyncStorage.removeItem("lastScore");
          setName("");
          setNameLocked(false);
          setLastScore(null);
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.container}>
            <Animatable.Image
              animation="bounceIn"
              duration={1500}
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>בדרך למיליון</Text>

            {nameLocked ? (
              <Text style={styles.readyText}>✅ מוכן לשחק, {name}!</Text>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="הכנס/י שם"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            )}

            <TouchableOpacity
              style={[
                styles.button,
                nameLocked || name.length >= 2 ? null : styles.disabledButton,
              ]}
              onPress={handleStart}
              disabled={!nameLocked && name.length < 2}
            >
              <Text style={styles.buttonText}>התחל משחק</Text>
            </TouchableOpacity>

            {lastScore && name && (
              <Text style={styles.lastScore}>
                🎯 ניקוד קודם של {name}: ₪{lastScore}
              </Text>
            )}

            {nameLocked && (
              <TouchableOpacity onPress={handleDelete}>
                <Text style={styles.deleteText}>🗑️ מחק משתמש</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0a23",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    color: "#fff",
    marginBottom: 20,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#1e1e3f",
    color: "#fff",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    textAlign: "center",
    fontSize: 18,
  },
  readyText: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#ffd700",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#555",
  },
  buttonText: {
    fontSize: 20,
    color: "#000",
    fontWeight: "bold",
  },
  lastScore: {
    color: "#ccc",
    fontSize: 16,
    marginTop: 10,
  },
  deleteText: {
    color: "#ff6666",
    marginTop: 20,
    fontSize: 16,
  },
  flex: {
    flex: 1,
  },
});
