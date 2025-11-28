import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Image,
  Easing,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useNavigation } from "@react-navigation/native";
import { getUserBalance, updateBalance } from "../../Apis/supabase";

const { width, height } = Dimensions.get("window");

// 🎨 TEMA CYBERPUNK - MANTENER IGUAL
const CASINO_THEME = {
  colors: {
    primary: "#070712",
    secondary: "#FF2DFF", 
    accent: "#00D9FF",
    background: "#05060a",
    text: "#E6F7FF",
    success: "#00FF88",
    danger: "#FF4D6D",
    card: "#0f1020",
    border: "rgba(0,217,255,0.22)"
  },
  gradients: {
    background: ["#05060a", "#0b0f1a", "#05060a"] as const,
    balanceCard: ["rgba(0,217,255,0.06)", "rgba(255,45,255,0.04)"] as const,
    predictionHigh: ["#00D9FF", "#3FD1E5"] as const,
    predictionLow: ["#FF2DFF", "#FF6A88"] as const,
    predictionDefault: ["#1a1a1a", "#0f0f16"] as const,
    rollButton: ["#00D9FF", "#FF2DFF"] as const,
    resultWin: ["#9CE5FF", "#67C7E0"] as const,
    resultLose: ["#FF4D6D", "#C90C0F"] as const,
    betControls: ["#111", "#191920"] as const,
    diceGradient: ["#00D9FF", "#FF2DFF"] as const,
    diceGlow: "rgba(0,217,255,0.18)",
    glowOverlay: ["#00D9FF33", "#FF2DFF33"] as const,
  }
};

// 🎉 Componente de Confeti - MANTENER IGUAL
const ConfettiParticle: React.FC<{ delay: number }> = ({ delay }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const randomX = Math.random() * width - width / 2;
    const randomDuration = 2000 + Math.random() * 1000;

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height,
          duration: randomDuration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: randomX,
          duration: randomDuration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: randomDuration - 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, [delay]);

  const colors = ["#FFD700", "#FFA500", "#c90c0f", "#00AA00", "#FFFFFF"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: width / 2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: randomColor,
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate: `${Math.random() * 360}deg` },
        ],
      }}
    />
  );
};

const Confetti: React.FC<{ isVisible: boolean; onComplete?: () => void }> = ({
  isVisible,
  onComplete,
}) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (isVisible) {
      const newParticles = Array.from({ length: 30 }, (_, i) => i);
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible || particles.length === 0) return null;

  return (
    <View style={styles.confettiContainer}>
      {particles.map((particle) => (
        <ConfettiParticle key={particle} delay={particle * 50} />
      ))}
    </View>
  );
};

// Componente reutilizable para la cara del dado - MANTENER IGUAL
const diceImages: Record<number, any> = {
  1: require('../../../assets/diceNum/dice1.png'),
  2: require('../../../assets/diceNum/dice2.png'),
  3: require('../../../assets/diceNum/dice3.png'),
  4: require('../../../assets/diceNum/dice4.png'),
  5: require('../../../assets/diceNum/dice5.png'),
  6: require('../../../assets/diceNum/dice6.png'),
};

// 🔥 COMPONENTE PARA PRE-CARGAR IMÁGENES
const ImagePreloader: React.FC<{ onLoadComplete: () => void }> = ({ onLoadComplete }) => {
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    if (loadedCount === 6) {
      onLoadComplete();
    }
  }, [loadedCount, onLoadComplete]);

  return (
    <View style={{ position: 'absolute', opacity: 0 }}>
      {[1, 2, 3, 4, 5, 6].map((face) => (
        <Image
          key={face}
          source={diceImages[face]}
          onLoad={() => setLoadedCount(prev => prev + 1)}
          style={{ width: 1, height: 1 }}
        />
      ))}
    </View>
  );
};

const DiceFace: React.FC<{ value: number; size?: number }> = ({ value, size = 32 }) => {
  const img = diceImages[value];
  return img ? (
    <Image source={img} style={{ width: size * 1.5, height: size * 1.5, resizeMode: 'contain' }} />
  ) : null;
};

// 🎲 **COMPONENTE DADO CON PRE-CARGA GARANTIZADA**
const DiceSimple2D: React.FC<{
  value: number;
  size?: number;
  rotateAnim?: Animated.Value;
  scaleAnim?: Animated.Value;
  isRolling?: boolean;
}> = ({ value, size = 80, rotateAnim, scaleAnim, isRolling = false }) => {
  const [isImageReady, setIsImageReady] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const rotate = rotateAnim?.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg']
  }) || '0deg';

  const displayValue = Math.max(1, Math.min(6, currentValue));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.Image
        source={diceImages[displayValue]}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
          transform: [
            { rotate },
            { scaleX: scaleAnim || 1 },
            { scaleY: scaleAnim || 1 }
          ],
          opacity: isImageReady ? 1 : 0,
        }}
        onLoad={() => setIsImageReady(true)}
        onError={(e) => {
          console.log('Image error:', e.nativeEvent.error);
          setIsImageReady(true); // Fallback para mostrar algo
        }}
      />
      {!isImageReady && (
        <View style={[styles.dicePlaceholder, { width: size, height: size }]}>
          <Text style={styles.placeholderText}>{displayValue}</Text>
        </View>
      )}
    </View>
  );
};

const DiceGame = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(10);
  const [gameState, setGameState] = useState<"betting" | "rolling" | "result">("betting");
  const [selectedPrediction, setSelectedPrediction] = useState<"high" | "low" | null>(null);
  const [die1, setDie1] = useState(1);
  const [die2, setDie2] = useState(1);
  const [isWinner, setIsWinner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [winAmount, setWinAmount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // ESTADOS PARA EL CAMBIO SECUENCIAL DE CARAS
  const [rollingFace1, setRollingFace1] = useState(1);
  const [rollingFace2, setRollingFace2] = useState(1);
  const [diceMounted, setDiceMounted] = useState(false);

  // Animaciones
  const rollAnim1 = useRef(new Animated.Value(0)).current;
  const rollAnim2 = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1)).current;
  const predictionOpacity = useRef(new Animated.Value(1)).current;
  const resultTranslateY = useRef(new Animated.Value(100)).current;

  // Referencias para los intervals
  const faceInterval1 = useRef<NodeJS.Timeout | null>(null);
  const faceInterval2 = useRef<NodeJS.Timeout | null>(null);
  const scaleLoopRef1 = useRef<Animated.CompositeAnimation | null>(null);
  const scaleLoopRef2 = useRef<Animated.CompositeAnimation | null>(null);

  // 💰 Cargar balance - MANTENER IGUAL
  useEffect(() => {
    const loadBalance = async () => {
      try {
        if (user?.id) {
          const data = await getUserBalance(user.id);
          setBalance(data.balance);
        }
      } catch (error) {
        console.error("Error loading balance:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBalance();
  }, [user?.id]);

  // 🔥 PRE-CARGAR IMÁGENES AL INICIAR
  useEffect(() => {
    const timer = setTimeout(() => {
      setDiceMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // ✨ Animación de brillo continuo - MANTENER IGUAL
  useEffect(() => {
    glowLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    glowLoopRef.current.start();
    return () => {
      glowLoopRef.current?.stop();
      glowLoopRef.current = null;
    };
  }, []);

  // Cleanup para evitar memory leaks
  useEffect(() => {
    return () => {
      if (faceInterval1.current) clearInterval(faceInterval1.current);
      if (faceInterval2.current) clearInterval(faceInterval2.current);
    };
  }, []);

  // Handle hardware back button - MANTENER IGUAL
  useEffect(() => {
    const onBackPress = () => {
      if (gameState === "rolling") {
        setShowExitWarning(true);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [gameState]);

  // 🎬 Transiciones suaves entre estados - MANTENER IGUAL
  useEffect(() => {
    if (gameState === "rolling") {
      Animated.timing(predictionOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (gameState === "betting") {
      Animated.timing(predictionOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else if (gameState === "result") {
      resultTranslateY.setValue(100);
      Animated.parallel([
        Animated.spring(resultScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(resultTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [gameState]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // Background glow animation - MANTENER IGUAL
  const bgGlowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(bgGlowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(bgGlowAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [bgGlowAnim]);

  // 🔥 **FUNCIÓN MEJORADA CON DETENCIÓN PRECISA**
  const startSequentialFaceChange = (
    setFace: (face: number) => void, 
    intervalTime: number, 
    totalDuration: number,
    finalValue: number
  ) => {
    let currentFace = 1;
    const totalIntervals = Math.floor(totalDuration / intervalTime);
    let intervalsCompleted = 0;
    
    // 🔥 INICIAR CON UN PEQUEÑO DELAY PARA GARANTIZAR QUE EL COMPONENTE ESTÉ LISTO
    const timeoutId = setTimeout(() => {
      setFace(1);
      
      const interval = setInterval(() => {
        intervalsCompleted++;
        currentFace = currentFace < 6 ? currentFace + 1 : 1;
        setFace(currentFace);
        
        // 🔥 DETENER EXACTAMENTE EN EL VALOR FINAL
        if (intervalsCompleted >= totalIntervals) {
          clearInterval(interval);
          // 🔥 ESTABLECER EL VALOR FINAL EXACTO
          setFace(finalValue);
        }
      }, intervalTime);
    }, 50);
    
    return timeoutId;
  };

  // 🔧 CONFIGURACIÓN DE VELOCIDAD DEL ROLLING (en milisegundos)
  const ROLLING_DURATION = 1400; // Tiempo total del rolling

  // 🔥 **FUNCIÓN ROLLDICE CON SINCRONIZACIÓN PERFECTA**
  const rollDice = async () => {
    if (!selectedPrediction || bet > balance || !diceMounted) return;

    setGameState("rolling");
    
    // RESETEAR ANIMACIONES
    rollAnim1.setValue(0);
    rollAnim2.setValue(0);
    resultScale.setValue(0);
    scaleAnim1.setValue(1);
    scaleAnim2.setValue(1);

    // 🔥 INICIALIZAR CON VALORES VÁLIDOS Y CONFIRMADOS
    setRollingFace1(1);
    setRollingFace2(1);

    // Limpiar intervals previos
    if (faceInterval1.current) clearInterval(faceInterval1.current);
    if (faceInterval2.current) clearInterval(faceInterval2.current);

    // Generar valores finales
    const finalD1 = Math.floor(Math.random() * 6) + 1;
    const finalD2 = Math.floor(Math.random() * 6) + 1;

    // 🔥 ESPERAR UN FRAME ANTES DE INICIAR ANIMACIONES
    requestAnimationFrame(() => {
      // INICIAR CAMBIO SECUENCIAL DE CARAS CON PROTECCIÓN Y VALORES FINALES
      faceInterval1.current = startSequentialFaceChange(setRollingFace1, 180, ROLLING_DURATION, finalD1);
      faceInterval2.current = startSequentialFaceChange(setRollingFace2, 220, ROLLING_DURATION, finalD2);



      // Animaciones de rotación con easing más suave al final
      const rollAnimation1 = Animated.timing(rollAnim1, {
        toValue: 1,
        duration: ROLLING_DURATION,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      });

      const rollAnimation2 = Animated.timing(rollAnim2, {
        toValue: 1,
        duration: ROLLING_DURATION,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      });

      // Animación de escala - pulsación durante el rolling
      scaleLoopRef1.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim1, { toValue: 0.95, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim1, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        ])
      );

      scaleLoopRef2.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim2, { toValue: 0.95, duration: 180, useNativeDriver: true }),
          Animated.timing(scaleAnim2, { toValue: 1.05, duration: 180, useNativeDriver: true }),
        ])
      );

      // Iniciar animaciones
      scaleLoopRef1.current.start();
      scaleLoopRef2.current.start();
      Animated.parallel([rollAnimation1, rollAnimation2]).start();

      // DETENER TODO Y MOSTRAR RESULTADO
      setTimeout(() => {
        // 🔥 LOS INTERVALS YA SE DETUVIERON AUTOMÁTICAMENTE Y ESTABLECIERON LOS VALORES FINALES

        // Detener animaciones de escala
        scaleLoopRef1.current?.stop();
        scaleLoopRef2.current?.stop();

        // Animar scale de vuelta a normal
        Animated.parallel([
          Animated.timing(scaleAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();

        // 🔥 ESTABLECER VALORES FINALES (YA DEBERÍAN ESTAR SETEADOS POR LOS INTERVALS)
        setDie1(finalD1);
        setDie2(finalD2);

        // Lógica del juego
        const totalValue = finalD1 + finalD2;
        const prediction = selectedPrediction === "high" ? totalValue > 7 : totalValue <= 7;
        setIsWinner(prediction);
        const winAmt = prediction ? bet * 2 : 0;
        setWinAmount(winAmt);
        const newBalance = prediction ? balance + winAmt : balance - bet;
        setBalance(newBalance);

        if (user?.id) {
          updateBalance(user.id, newBalance).catch(console.error);
        }

        if (prediction) {
          setShowConfetti(true);
        }

        setTimeout(() => {
          setGameState("result");
        }, 300);
      }, ROLLING_DURATION);
    });
  };

  // 🔄 Reiniciar juego
  const resetGame = () => {
    Animated.timing(resultScale, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedPrediction(null);
      setDie1(1);
      setDie2(1);
      setRollingFace1(1);
      setRollingFace2(1);
      setIsWinner(false);
      setWinAmount(0);
      setShowConfetti(false);
      setGameState("betting");
      try {
        glowLoopRef.current?.stop();
      } catch (e) {}
      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      );
      glowLoopRef.current.start();
    });
  };

  // 💵 Ajustar apuesta - MANTENER IGUAL
  const adjustBet = (amount: number) => {
    const newBet = Math.max(1, Math.min(bet + amount, balance));
    setBet(newBet);
  };



  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={CASINO_THEME.gradients.background} style={StyleSheet.absoluteFillObject} />
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="loading" size={48} color={CASINO_THEME.colors.accent} />
          <Text style={[styles.loadingText, { color: CASINO_THEME.colors.accent }]}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={CASINO_THEME.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 🔥 PRE-CARGADOR DE IMÁGENES */}
      <ImagePreloader onLoadComplete={() => setImagesPreloaded(true)} />

      {/* Animated cyberpunk glow overlay - MANTENER IGUAL */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: bgGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.26] }),
            transform: [
              { scale: bgGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
            ],
          },
        ]}
      >
        <LinearGradient colors={CASINO_THEME.gradients.glowOverlay} style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      {/* 🎉 Confeti - MANTENER IGUAL */}
      <Confetti isVisible={showConfetti} onComplete={() => setShowConfetti(false)} />

      <View style={styles.container}>
        {/* 🏷️ Título - MANTENER IGUAL */}
        <View style={styles.titleWrapper}>
          <Text style={styles.titleEmoji}>🎲</Text>
          <Text style={styles.title}>CASINO DICE</Text>
        </View>

        {/* 💰 Balance - MANTENER IGUAL */}
        <LinearGradient
          colors={CASINO_THEME.gradients.balanceCard}
          style={styles.balanceCard}
        >
          <View style={styles.balanceContent}>
            <MaterialCommunityIcons name="wallet" size={24} color={CASINO_THEME.colors.accent} />
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceAmount}>${balance}</Text>
          </View>
        </LinearGradient>

        {/* 🎲 Dados animados - MOSTRAR EN BETTING Y ROLLING, EN RESULT USAR LOS MISMOS DADOS */}
        {diceMounted && (
          <Animated.View
            style={[
              styles.diceContainer,
            ]}
          >
            {gameState !== "result" && (
              <Animated.View style={[styles.diceGlow, { opacity: glowOpacity }]} />
            )}
            
            <View style={styles.twoDiceRow}>
              <View style={styles.singleDiceBox}>
                <DiceSimple2D 
                  value={gameState === "rolling" ? rollingFace1 : die1} 
                  size={80} 
                  rotateAnim={gameState === "rolling" ? rollAnim1 : undefined}
                  scaleAnim={gameState === "rolling" ? scaleAnim1 : undefined}
                  isRolling={gameState === "rolling"}
                />
              </View>

              <View style={styles.singleDiceBox}>
                <DiceSimple2D 
                  value={gameState === "rolling" ? rollingFace2 : die2} 
                  size={80} 
                  rotateAnim={gameState === "rolling" ? rollAnim2 : undefined}
                  scaleAnim={gameState === "rolling" ? scaleAnim2 : undefined}
                  isRolling={gameState === "rolling"}
                />
              </View>
            </View>
            
            {/* 🔥 MOSTRAR TOTAL SOLO EN RESULTADO */}
            {gameState === "result" && (
              <Text style={styles.totalLabel}>Total: {die1 + die2}</Text>
            )}
          </Animated.View>
        )}

        {/* 📊 Predicción y Apuesta - MANTENER IGUAL */}
        {gameState === "betting" && (
          <Animated.View style={[styles.predictionContainer, { opacity: predictionOpacity }]}>
            <Text style={styles.predictionLabel}>¿Alto o Bajo?</Text>
            <Text style={styles.predictionSub}>(Mayor a 7 = Alto, Menor o igual a 7 = Bajo)</Text>

            <View style={styles.predictionRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedPrediction("high")}
              >
                <LinearGradient
                  colors={selectedPrediction === "high" ? CASINO_THEME.gradients.predictionHigh : CASINO_THEME.gradients.predictionDefault}
                  style={[
                    styles.predictionBtn,
                    selectedPrediction === "high" && styles.predictionBtnSelected,
                  ]}
                >
                  <MaterialCommunityIcons name="arrow-up" size={32} color="#FFF" />
                  <Text style={styles.predictionText}>ALTO</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedPrediction("low")}
              >
                <LinearGradient
                  colors={selectedPrediction === "low" ? CASINO_THEME.gradients.predictionLow : CASINO_THEME.gradients.predictionDefault}
                  style={[
                    styles.predictionBtn,
                    selectedPrediction === "low" && styles.predictionBtnSelected,
                  ]}
                >
                  <MaterialCommunityIcons name="arrow-down" size={32} color="#FFF" />
                  <Text style={styles.predictionText}>BAJO</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* 💵 Controles de apuesta - MANTENER IGUAL */}
            <View style={styles.betContainer}>
              <Text style={styles.betLabel}>Apuesta</Text>
              <View style={styles.betControls}>
                <TouchableOpacity
                  style={styles.betBtn}
                  onPress={() => adjustBet(-5)}
                >
                  <LinearGradient
                    colors={CASINO_THEME.gradients.betControls}
                    style={styles.betBtnGradient}
                  >
                    <Text style={styles.betBtnText}>-</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <LinearGradient
                  colors={CASINO_THEME.gradients.balanceCard}
                  style={styles.betDisplay}
                >
                  <Text style={styles.betAmount}>${bet}</Text>
                </LinearGradient>

                <TouchableOpacity
                  style={styles.betBtn}
                  onPress={() => adjustBet(5)}
                >
                  <LinearGradient
                    colors={CASINO_THEME.gradients.betControls}
                    style={styles.betBtnGradient}
                  >
                    <Text style={styles.betBtnText}>+</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* 🎉 Resultado - SIN DADOS DUPLICADOS */}
        {gameState === "result" && (
          <Animated.View style={[styles.resultBox, { 
            transform: [
              { scale: resultScale },
              { translateY: resultTranslateY }
            ] 
          }]}>
            <LinearGradient
              colors={isWinner ? CASINO_THEME.gradients.resultWin : CASINO_THEME.gradients.resultLose}
              style={styles.resultContent}
            >
              <MaterialCommunityIcons
                name={isWinner ? "crown" : "close-circle"}
                size={60}
                color="#FFF"
              />
              <Text style={styles.resultText}>
                {isWinner ? "🎉 ¡GANASTE!" : "💔 PERDISTE"}
              </Text>
              <Text style={styles.resultSub}>
                {isWinner ? `+$${bet * 2}` : `-$${bet}`}
              </Text>
              <Text style={styles.predictionResult}>
                Predicción: {selectedPrediction === "high" ? "ALTO" : "BAJO"} | Resultado: {die1} + {die2} = {die1 + die2}
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.againBtn}
                onPress={resetGame}
              >
                <LinearGradient
                  colors={CASINO_THEME.gradients.rollButton}
                  style={styles.againGradient}
                >
                  <MaterialCommunityIcons name="reload" size={20} color="#000" />
                  <Text style={styles.againText}>Jugar de Nuevo</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* 🎬 Botón de lanzamiento - MANTENER IGUAL */}
        {gameState === "betting" && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.rollBtn, { opacity: selectedPrediction && bet <= balance ? 1 : 0.5 }]}
            onPress={rollDice}
            disabled={!selectedPrediction || bet > balance}
          >
            <LinearGradient
              colors={CASINO_THEME.gradients.rollButton}
              style={styles.rollGradient}
            >
              <MaterialCommunityIcons name="dice-6" size={28} color="#000" />
              <Text style={styles.rollText}>LANZAR DADOS</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ⬅️ Botón de regreso - MANTENER IGUAL */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (gameState === 'rolling') {
              setShowExitWarning(true);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="chevron-back" size={24} color={CASINO_THEME.colors.accent} />
        </TouchableOpacity>

        {showExitWarning && (
          <View style={styles.warningOverlay} pointerEvents="auto">
            <View style={styles.warningContainer}>
              <Text style={styles.warningTitle}>¿Salir mientras lanza?</Text>
              <Text style={styles.warningBody}>Estás en medio del lanzamiento. Si sales ahora, perderás esta tirada.</Text>
              <View style={styles.warningActions}>
                <TouchableOpacity
                  style={styles.warningButtonCancel}
                  onPress={() => setShowExitWarning(false)}
                >
                  <Text style={styles.warningButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.warningButtonExit}
                  onPress={() => {
                    setShowExitWarning(false);
                    navigation.goBack();
                  }}
                >
                  <Text style={styles.warningButtonText}>Salir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// 🎨 Estilos con Temática Casino - MANTENER IGUAL
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CASINO_THEME.colors.background },
  container: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 18, marginTop: 15, fontWeight: "600" },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },

  titleWrapper: { alignItems: "center", marginBottom: 30, marginTop: -50 },
  titleEmoji: { fontSize: 48 },
  title: {
    fontSize: 32,
    color: CASINO_THEME.colors.accent,
    fontWeight: "900",
    textShadowColor: "#FF8C00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 2,
  },

  balanceCard: {
    width: width * 0.9,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: CASINO_THEME.colors.border,
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  balanceLabel: {
    color: CASINO_THEME.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  balanceAmount: {
    color: CASINO_THEME.colors.accent,
    fontSize: 24,
    fontWeight: "900",
    marginLeft: 10,
  },

  diceContainer: {
    width: width * 0.9,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  dicePlaceholder: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  placeholderText: {
    color: '#00D9FF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  diceGlow: {
    position: "absolute",
    width: 200,
    height: 140,
    borderRadius: 15,
    backgroundColor: CASINO_THEME.gradients.diceGlow,
  },
  
  twoDiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  singleDiceBox: {
    width: 100,
    height: 100,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  resultDiceContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  resultTwoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  resultSinglePlain: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  totalLabel: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },

  predictionContainer: {
    width: width * 0.9,
    alignItems: "center",
  },
  predictionLabel: {
    color: CASINO_THEME.colors.accent,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 5,
  },
  predictionSub: {
    color: "#999",
    fontSize: 12,
    marginBottom: 20,
  },
  predictionRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 30,
  },
  predictionBtn: {
    width: 110,
    height: 110,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: CASINO_THEME.colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  predictionBtnSelected: {
    shadowColor: "#FFF",
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  predictionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },

  betContainer: {
    width: "100%",
    alignItems: "center",
  },
  betLabel: {
    color: CASINO_THEME.colors.accent,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
  },
  betControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  betBtn: {
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
  },
  betBtnGradient: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: CASINO_THEME.colors.border,
  },
  betBtnText: {
    color: CASINO_THEME.colors.accent,
    fontSize: 24,
    fontWeight: "900",
  },
  betDisplay: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: CASINO_THEME.colors.border,
    alignItems: "center",
    minWidth: 100,
  },
  betAmount: {
    color: CASINO_THEME.colors.accent,
    fontSize: 20,
    fontWeight: "900",
  },

  resultBox: {
    width: width * 0.85,
    marginBottom: 40,
  },
  resultContent: {
    paddingVertical: 30,
    paddingHorizontal: 30,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: CASINO_THEME.colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  resultText: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 15,
  },
  resultSub: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 10,
  },
  predictionResult: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 15,
    fontStyle: "italic",
    textAlign: 'center',
  },
  againBtn: {
    marginTop: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  againGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 12,
    gap: 10,
    borderRadius: 15,
  },
  againText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },

  rollBtn: {
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: CASINO_THEME.colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  },
  rollGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 16,
    gap: 12,
  },
  rollText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,215,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: CASINO_THEME.colors.border,
  },
  warningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  warningContainer: {
    width: '86%',
    backgroundColor: '#0b0b0d',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  warningTitle: {
    color: CASINO_THEME.colors.accent,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  warningBody: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 12,
  },
  warningActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  warningButtonCancel: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  warningButtonExit: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: CASINO_THEME.colors.accent,
  },
  warningButtonText: {
    color: '#000',
    fontWeight: '700',
  },
});

export default DiceGame;