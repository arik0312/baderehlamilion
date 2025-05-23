import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState, View } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import * as Animatable from "react-native-animatable"; 

import questionsData from "../assets/triviaquestions.json";
import PrizePyramid from "../components/PrizePyramid";
const { width, height } = Dimensions.get("window");

const compliments = [
  "תשובה נכונה!",
  "עבודה מעולה!",
  "כל הכבוד!",
  "את/ה תותח/ית!",
  "יפה מאוד!",
  "יש לך את זה!",
  "אלופה/אלוף!",
  "מדהים!",
  "מרשים מאוד!",
  "בדיוק ככה!",
];

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function QuizScreen({ navigation, route }) {
  const { name } = route.params || {};
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showPyramid, setShowPyramid] = useState(false);
  const [showUI, setShowUI] = useState(true);

  const [timer, setTimer] = useState(15);
  const timerRef = useRef(null);
  const [soundCorrect, setSoundCorrect] = useState(null);
  const [soundWrong, setSoundWrong] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  // Lifelines states
  const [usedFifty, setUsedFifty] = useState(false);
  const [fiftyOptions, setFiftyOptions] = useState(null);
  const [usedAudience, setUsedAudience] = useState(false);
  const [audienceResult, setAudienceResult] = useState(null);
  const [usedPhone, setUsedPhone] = useState(false);
  const [phoneResult, setPhoneResult] = useState(null);
  const [pool, setPool] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadSounds() {
      try {
        const { sound: sc } = await Audio.Sound.createAsync(
          require("../assets/sounds/correct.mp3")
        );
        const { sound: sw } = await Audio.Sound.createAsync(
          require("../assets/sounds/wrong.mp3")
        );

        if (mounted) {
          setSoundCorrect(sc);
          setSoundWrong(sw);
        } else {
          sc.unloadAsync();
          sw.unloadAsync();
        }
      } catch (e) {
        console.error("❌ error loading sounds", e);
      }
    }
    loadSounds();

    return () => {
      mounted = false;
      soundCorrect && soundCorrect.unloadAsync();
      soundWrong && soundWrong.unloadAsync();
    };
  }, []);

  const handleTimeOut = () => {
    if (!currentQuestion) return;

    setDisabled(true);
    setFeedback(`⌛ הזמן נגמר! התשובה הנכונה היא: ${currentQuestion.answer}`);
    setTimeout(() => {
      setGameOver(true);
      saveScore();
    }, 3000);
  };

  useEffect(() => {
    const randomizedPool = shuffleArray(questionsData).map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }));
    setPool(randomizedPool);
    setCurrentQuestion(
      randomizedPool[Math.floor(Math.random() * randomizedPool.length)]
    );
  }, []);

  useEffect(() => {
    if (!currentQuestion) return;

    setTimer(15);
    clearInterval(timerRef.current);
    if (!gameOver) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [currentQuestion, gameOver]);

  if (!currentQuestion) return null;
  const question = currentQuestion;

  const saveScore = async () => {
    try {
      await AsyncStorage.setItem("lastScore", score.toString());
      await AsyncStorage.setItem("lastName", name);
    } catch (error) {
      console.log("Failed to save score:", error);
    }
  };

  const handleFifty = () => {
    if (usedFifty || disabled) return;
    const wrongs = question.options.filter((opt) => opt !== question.answer);
    const removed = shuffleArray(wrongs).slice(0, 2);
    setFiftyOptions(question.options.filter((opt) => !removed.includes(opt)));
    setUsedFifty(true);
  };

  const handleAudience = () => {
    if (usedAudience || disabled) return;
    const base = {};
    let remaining = 100;
    question.options.forEach((opt) => {
      if (opt === question.answer) {
        const perc = 50 + Math.floor(Math.random() * 21);
        base[opt] = perc;
        remaining -= perc;
      }
    });
    const wrongs = question.options.filter((opt) => opt !== question.answer);
    wrongs.forEach((opt, i) => {
      const perc =
        i === wrongs.length - 1
          ? remaining
          : Math.floor(Math.random() * (remaining + 1));
      base[opt] = perc;
      remaining -= perc;
    });
    setAudienceResult(base);
    setUsedAudience(true);
  };

  const handlePhone = () => {
    if (usedPhone || disabled) return;
    const isCorrect = Math.random() < 0.7;
    if (isCorrect) setPhoneResult(question.answer);
    else {
      const wrongs = question.options.filter((opt) => opt !== question.answer);
      setPhoneResult(wrongs[Math.floor(Math.random() * wrongs.length)]);
    }
    setUsedPhone(true);
  };

  const handleAnswer = async (option) => {
    if (disabled || gameOver) return;
    clearInterval(timerRef.current);
    setSelectedOption(option);
    setDisabled(true);

    const isCorrect = option === currentQuestion.answer;

    // Play sound for correct/wrong answer
    if (isCorrect && soundCorrect) {
      await soundCorrect.replayAsync();
    } else if (!isCorrect && soundWrong) {
      await soundWrong.replayAsync();
    }

    // Show feedback
    const msg = isCorrect
      ? compliments[Math.floor(Math.random() * compliments.length)]
      : `❌ לא נכון! התשובה הנכונה היא: ${currentQuestion.answer}`;
    setFeedback(msg);

    if (!isCorrect) {
      // wrong → game over after delay
      setTimeout(() => {
        setGameOver(true);
        saveScore();
      }, 3000);
      return;
    }

    // correct → update score and show pyramid
    setScore((prev) => prev + 1000);

    // Hide the UI and show the pyramid
    setShowUI(false);
    setShowPyramid(true); // This triggers the pyramid to appear

    // After 3 seconds, hide pyramid and show other UI components
    setTimeout(() => {
      setShowPyramid(false);
      setShowUI(true); // Show other components again

      // Continue to next question
      setPool((prevPool) => {
        const nextPool = prevPool.filter((q) => q !== currentQuestion);

        if (nextPool.length === 0) {
          setGameOver(true);
          saveScore();
          return [];
        }

        const nextQ = nextPool[Math.floor(Math.random() * nextPool.length)];
        setCurrentQuestion(nextQ);
        return nextPool;
      });

      setSelectedOption(null);
      setFeedback("");
      setDisabled(false);
      setFiftyOptions(null);
      setAudienceResult(null);
      setPhoneResult(null);
    }, 3000);
  };

  const showOptions = fiftyOptions || question.options;
  const simulateMillion = () => {
    clearInterval(timerRef.current);
    setScore(15000);
    setQuestionIndex(14);
    setFeedback("🎉 מצב סימולציה: זכית במיליון! 🎉");
    setDisabled(true);
    setSelectedOption(null);
    setFiftyOptions(null);
    setAudienceResult(null);
    setPhoneResult(null);
    setShowPyramid(false);
    setGameOver(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <TouchableOpacity onPress={simulateMillion} style={styles.debugBtn}>
        <Text>Simulate ₪1,000,000</Text>
      </TouchableOpacity> */}

      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
      />
      {/* <TouchableOpacity
        style={styles.restartButton}
        onPress={() => navigation.replace("Start")}
      >
        <Text style={styles.restartText}>🔁 התחל מחדש</Text>
      </TouchableOpacity> */}

      <Text style={styles.welcome}>שלום {name} 👋</Text>
      <Text style={styles.score}>ניקוד: ₪{score}</Text>

      {!gameOver && (
        <>
          <View style={styles.lifelines}>
            <TouchableOpacity
              style={[styles.lifeline, usedFifty && styles.lifelineUsed]}
              onPress={handleFifty}
              disabled={usedFifty}
            >
              <Text style={styles.lifelineText}>🟦 50:50</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.lifeline, usedAudience && styles.lifelineUsed]}
              onPress={handleAudience}
              disabled={usedAudience}
            >
              <Text style={styles.lifelineText}>👥 קהל</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.lifeline, usedPhone && styles.lifelineUsed]}
              onPress={handlePhone}
              disabled={usedPhone}
            >
              <Text style={styles.lifelineText}>📞 טלפוני</Text>
            </TouchableOpacity>
          </View>
          {showUI && (
            <>
              <Text style={styles.timer}>⌛ {String(timer)} שניות</Text>
              {question && (
                <Text style={styles.question}>{question.question}</Text>
              )}

              {showOptions &&
                showOptions.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.option,
                      selectedOption === option &&
                        (option === question.answer
                          ? styles.correct
                          : styles.wrong),
                    ]}
                    onPress={() => handleAnswer(option)}
                    disabled={disabled}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
            </>
          )}

          {audienceResult && (
            <View style={styles.resultBlock}>
              <Text style={styles.resultTitle}>👥 הקהל ענה:</Text>
              {Object.entries(audienceResult).map(([opt, val]) => (
                <Text key={opt} style={styles.resultText}>
                  {opt}: {val}%
                </Text>
              ))}
            </View>
          )}

          {usedPhone && phoneResult && (
            <View style={styles.resultBlock}>
              <Text style={styles.resultText}>📞 החבר אמר: {phoneResult}</Text>
            </View>
          )}
        </>
      )}

      {showPyramid && (
        <View style={styles.pyramidWrapper}>
          <Animatable.View
            animation="zoomIn"
            iterationCount={1}
            duration={2000} // Climbing duration, you can adjust
            style={styles.pyramidContainer}
          >
            <PrizePyramid step={score} />
          </Animatable.View>
        </View>
      )}

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      {gameOver && pool.length === 0 && (
        <View style={styles.winContainer}>
          <LottieView
            source={require("../assets/animations/winner.json")}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
          <Text style={styles.winnerText}>
            🎉 כל הכבוד {name}! זכית במיליון 🎉
          </Text>
          <TouchableOpacity
            style={styles.gameOverBtn}
            onPress={() => navigation.replace("Start")}
          >
            {" "}
            {/* Replay */}
            <Text style={styles.restartText}>🔁 שחק שוב</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameOver && pool.length > 0 && (
        <TouchableOpacity
          style={styles.gameOverBtn}
          onPress={() => navigation.replace("Start")}
        >
          <Text style={styles.restartText}>סיים משחק</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a23",
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  debugBtn: {
    position: "absolute",
    top: 60,
    left: 10,
    padding: 8,
    backgroundColor: "#ff0",
    borderRadius: 4,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    resizeMode: "contain",
  },
  restartButton: { position: "absolute", top: 45, right: 20, zIndex: 10 },
  restartText: { color: "#ffd700", fontSize: 16, fontWeight: "bold" },
  welcome: { color: "#fff", fontSize: 20, marginTop: 10, textAlign: "center" },
  score: {
    color: "#ffd700",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  timer: { color: "#fff", fontSize: 16, marginBottom: 10 },
  lifelines: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 10,
  },
  lifeline: {
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  lifelineUsed: { backgroundColor: "#666" },
  lifelineText: { color: "#fff", fontSize: 14 },
  question: {
    color: "#fff",
    fontSize: 22,
    marginVertical: 20,
    textAlign: "center",
  },
  option: {
    backgroundColor: "#1e1e3f",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    width: "100%",
  },
  optionText: { color: "#fff", fontSize: 18, textAlign: "center" },
  correct: { backgroundColor: "green" },
  wrong: { backgroundColor: "crimson" },
  feedback: {
    marginTop: 20,
    fontSize: 20,
    color: "#ffd700",
    textAlign: "center",
    fontWeight: "bold",
  },
  resultBlock: { marginTop: 20 },
  resultTitle: { color: "#fff", fontSize: 16, marginBottom: 5 },
  resultText: { color: "#ccc", fontSize: 14 },
  pyramidWrapper: {
    position: "absolute",
    top: "30%", // Adjust based on where you want it to appear
    left: "50%",
    transform: [{ translateX: -width * 0.4 }],
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: "50%",
    zIndex: 10, // Ensure pyramid is on top
  },
  pyramidContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  winContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a23",
    padding: 20,
  },
  lottie: { width: 300, height: 300 },
  winnerText: {
    fontSize: 22,
    color: "#ffd700",
    textAlign: "center",
    marginVertical: 20,
    fontWeight: "bold",
  },
  gameOverBtn: {
    backgroundColor: "green",
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    alignSelf: "center",
  },
});
