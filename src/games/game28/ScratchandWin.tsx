import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ImageBackground,
  Image,
  ScrollView,
} from "react-native";
import { BackHandler } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../hooks/useAuth";
import {
  getUserBalance,
  updateBalance,
  updateUserBalance,
} from "../../Apis/supabase";

const { width, height } = Dimensions.get("window");

// Configuración de economía mejorada con premios diferenciados
const GAME_CONFIG = {
  ENTRY_FEE: 10,
  MIN_BALANCE: 10,
};

// 🏎️ RACE TRACK THEME - Temática de carrera
const RACE_TRACK_THEME = {
  colors: {
    background: "#1a1a1a",      // Oscuro base
    primary: "#E63946",          // Rojo fuego
    secondary: "#FF8C00",        // Naranja
    accent: "#F1FAEE",           // Blanco
    trackDark: "#0f0f0f",        // Líneas de pista
    success: "#FFD700",          // Dorado ganador
    text: "#FFFFFF",             // Texto claro
  },
  gradients: {
    background: ["#1a1a1a", "#2d1b1b", "#1a1a1a"] as const,
    buttonPrimary: ["#E63946", "#FF8C00"] as const,  // Rojo → Naranja
    buttonSecondary: ["#FF8C00", "#FFB700"] as const, // Naranja → Dorado
    resultWin: ["#FFD700", "#FF8C00"] as const,      // Ganador dorado
    resultLose: ["#666666", "#333333"] as const,      // Pérdida gris
  }
};

// Cuántos símbolos mostrar en la vista previa antes de iniciar
const PREVIEW_COUNT = 9;
// Sistema de premios por símbolo
const SYMBOL_PRIZES: Record<string, number> = {
  // Carros - Premios mayores
  'car1': 50,  // 5x
  'car2': 40,  // 4x
  'car3': 30,  // 3x
  'car4': 25,  // 2.5x
  
  // Cartas - Premios menores
  'A': 20,     // 2x
  'K': 15,     // 1.5x
  'Q': 12,     // 1.2x
  'J': 10,     // 1x
  '10': 8,     // 0.8x
  '9': 5,      // 0.5x
};

// Symbols used in the grid: cars + card ranks
const symbols = Object.keys(SYMBOL_PRIZES);
// Top boxes should show only the main symbols (cars)
const topSymbols = ["car1", "car2", "car3", "car4"];

const carImages: Record<string, any> = {
  car1: require("../../../assets/Scratchandwin/car1.png"),
  car2: require("../../../assets/Scratchandwin/car2.png"),
  car3: require("../../../assets/Scratchandwin/car3.png"),
  car4: require("../../../assets/Scratchandwin/car4.png"),
};

const carColors: Record<string, string> = {
  car1: '#ff4d4d',
  car2: '#4da6ff',
  car3: '#d9d9d9',
  car4: '#f6fd42ff',
};

const cardImages: Record<string, any> = {
  '9': require('../../../assets/Scratchandwin/number9.png'),
  '10': require('../../../assets/Scratchandwin/number10.png'),
  'J': require('../../../assets/Scratchandwin/letterJ.png'),
  'Q': require('../../../assets/Scratchandwin/letterQ.png'),
  'K': require('../../../assets/Scratchandwin/letterK.png'),
  'A': require('../../../assets/Scratchandwin/letterA.png'),
};

export default function ScratchandWin() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [balance, setBalance] = useState<number>(0);
  const [bet, setBet] = useState<number>(GAME_CONFIG.ENTRY_FEE);
  const [loading, setLoading] = useState(true);

  const [grid, setGrid] = useState<string[]>(Array(9).fill(""));
  const [flipped, setFlipped] = useState<boolean[]>(Array(9).fill(false));
  const [previewIndices, setPreviewIndices] = useState<number[]>([]);
  const [animValues] = useState(() =>
    Array.from({ length: 9 }, () => new Animated.Value(0))
  );
  const [result, setResult] = useState<{ win: boolean; amount: number; symbol?: string } | null>(null);
  const [chargedThisRound, setChargedThisRound] = useState(false);
  const [winningSymbols, setWinningSymbols] = useState<string[]>([]);
  const [payoutProcessed, setPayoutProcessed] = useState(false);
  const [winningAmount, setWinningAmount] = useState<number>(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const resultScale = resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

  // Efectos de animación mejorados
  useEffect(() => {
    if (winningSymbols.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
    }
  }, [winningSymbols]);

  useEffect(() => {
    if (result) {
      Animated.spring(resultAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: false,
      }).start();
    } else {
      resultAnim.setValue(0);
    }
  }, [result]);

  const gridSize = Math.min(width * 0.9, 400);
  const cellSize = (gridSize - 24) / 3;
  const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

  useEffect(() => {
    const loadBalance = async () => {
      if (!user?.id) return;
      try {
        const data = await getUserBalance(user.id);
        setBalance(Number(data.balance || 0));
      } catch (e) {
        console.log("Error loading balance", e);
      } finally {
        setLoading(false);
      }
    };
    loadBalance();
    const unsub = (navigation as any).addListener?.("focus", loadBalance);
    return unsub;
  
    return unsub;
  }, [user?.id]);

  // Handle hardware back button: show warning if game started
  useEffect(() => {
    const onBackPress = () => {
      // No mostrar advertencia si el juego terminó (todas las cartas reveladas)
      if (gameStarted && !flipped.every(Boolean)) {
        setShowExitWarning(true);
        return true; // prevent default
      }
      return false; // allow default
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [gameStarted, flipped]);

  const shuffleGrid = () => {
    const newGrid = Array.from(
      { length: 9 },
      () => symbols[Math.floor(Math.random() * symbols.length)]
    );
    setGrid(newGrid);
    setFlipped(Array(9).fill(false));
    animValues.forEach((a) => a.setValue(0));
    setResult(null);
    setChargedThisRound(false);
    setWinningSymbols([]);
    setPayoutProcessed(false);
    setWinningAmount(0);
    setShowResultModal(false);
    // Limpiar cualquier preview previo para que nuevos previews sean aleatorios
    setPreviewIndices([]);
  };

  useEffect(() => {
    // Inicializar tablero aleatorio sin mostrar vista previa
    shuffleGrid();
  }, []);

  // Refs to track touch start positions per cell for drag-to-reveal
  const touchStartsRef = useRef<Array<{ x: number; y: number } | null>>(Array(9).fill(null));

  const flipAt = (index: number) => {
    // No permitir rasguño antes de presionar Iniciar
    if (!gameStarted) return;
    
    if (flipped[index] || result) return;
    
    if (!chargedThisRound) {
      if (balance < GAME_CONFIG.ENTRY_FEE) {
        Alert.alert(
          "Saldo insuficiente", 
          `Necesitas al menos $${GAME_CONFIG.ENTRY_FEE} para jugar.`
        );
        return;
      }
      const newBal = balance - GAME_CONFIG.ENTRY_FEE;
      setBalance(newBal);
      setChargedThisRound(true);
      if (user?.id) updateBalance(user.id, newBal).catch(console.error);
    }

    Animated.sequence([
      Animated.timing(animValues[index], {
        toValue: 0.5,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(animValues[index], {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    const newFlipped = [...flipped];
    newFlipped[index] = true;
    setFlipped(newFlipped);

    setTimeout(() => checkWin(newFlipped), 600);
  };

  const checkWin = (currentFlipped: boolean[]) => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 9; i++) {
      if (currentFlipped[i]) {
        const s = grid[i];
        counts[s] = (counts[s] || 0) + 1;
      }
    }

    // Encontrar TODOS los símbolos que tienen 3+ coincidencias
    const allWinningSymbols = Object.keys(counts).filter((s) => counts[s] >= 3);

    // Si hay uno o más triples y aún no hemos registrado ganancia, sumar ALL los premios
    if (allWinningSymbols.length > 0 && winningSymbols.length === 0) {
      const totalPrize = allWinningSymbols.reduce((sum, sym) => sum + (SYMBOL_PRIZES[sym] || 10), 0);
      setWinningSymbols(allWinningSymbols); // Guardar TODOS los símbolos ganadores
      setWinningAmount(totalPrize); // Guardar la suma total
    }

    if (currentFlipped.filter(Boolean).length === 9) {
      const finalWinners = allWinningSymbols.length > 0 ? allWinningSymbols : winningSymbols;
      const finalWinner = finalWinners.length > 0 ? finalWinners[0] : null;
      let finalResult = { win: false, amount: 0, symbol: '' };
      
      if (finalWinner) {
        if (!payoutProcessed) {
          // Usar el sistema de premios diferenciado (suma de todos los triples)
          const payout = winningAmount || (allWinningSymbols.length > 0 
            ? allWinningSymbols.reduce((sum, sym) => sum + (SYMBOL_PRIZES[sym] || 10), 0)
            : 10);
          const newBalance = balance + payout;
          setBalance(newBalance);
          setPayoutProcessed(true);
          if (user?.id)
            updateUserBalance(user.id, newBalance, bet, payout, {
              game: "scratchandwin",
              symbols: allWinningSymbols.join(','),
            }).catch(console.error);
        }
        const finalAmount = winningAmount || (allWinningSymbols.length > 0 
          ? allWinningSymbols.reduce((sum, sym) => sum + (SYMBOL_PRIZES[sym] || 10), 0)
          : 10);
        finalResult = { win: true, amount: finalAmount, symbol: finalWinner };
      } else {
        if (user?.id && !payoutProcessed)
          updateUserBalance(user.id, balance, bet, 0, {
            game: "scratchandwin",
          }).catch(console.error);
      }
      
      setResult(finalResult);
      // Mostrar el modal después de un pequeño delay para que se vean las animaciones
      setTimeout(() => {
        setShowResultModal(true);
      }, 1000);
    }
  };

  const revealAll = () => {
    if (result) return;

    if (!chargedThisRound) {
      if (balance < GAME_CONFIG.ENTRY_FEE) {
        Alert.alert(
          "Saldo insuficiente", 
          `Necesitas al menos $${GAME_CONFIG.ENTRY_FEE} para jugar.`
        );
        return;
      }
      const newBal = balance - GAME_CONFIG.ENTRY_FEE;
      setBalance(newBal);
      setChargedThisRound(true);
      if (user?.id) updateBalance(user.id, newBal).catch(console.error);
    }

    const newFlipped = Array(9).fill(true);
    setFlipped(newFlipped);
    
    animValues.forEach((a, i) => {
      Animated.sequence([
        Animated.delay(i * 80),
        Animated.parallel([
          Animated.timing(a, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ])
      ]).start();
    });
    
    setTimeout(() => checkWin(newFlipped), 1000);
  };

  // Revela aleatoriamente algunos símbolos como preview antes de iniciar
  const revealPreview = (count = PREVIEW_COUNT) => {
    const indices: number[] = [];
    const pool = Array.from({ length: 9 }, (_, i) => i);
    while (indices.length < Math.min(count, 9)) {
      const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      indices.push(pick);
    }

    const newFlipped = Array(9).fill(false);
    indices.forEach((i) => (newFlipped[i] = true));
    setPreviewIndices(indices);
    setFlipped(newFlipped);

    // Animar aparición de los previews
    indices.forEach((idx, i) => {
      Animated.sequence([
        Animated.delay(i * 120),
        Animated.timing(animValues[idx], {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const startGame = () => {
    if (balance < GAME_CONFIG.ENTRY_FEE) {
      Alert.alert(
        "Saldo insuficiente",
        `Necesitas al menos $${GAME_CONFIG.ENTRY_FEE} para jugar.`
      );
      return;
    }

    // Cobrar la apuesta y empezar
    const newBal = balance - GAME_CONFIG.ENTRY_FEE;
    setBalance(newBal);
    if (user?.id) updateBalance(user.id, newBal).catch(console.error);

    // Animación: ocultar (hacer 'fold') las cartas con stagger, luego mezclar y ocultar definitivamente
    setIsShuffling(true);
    // cobrar ya
    setChargedThisRound(true);

    const hideAnims = animValues.map((a, i) =>
      Animated.timing(a, {
        toValue: 0,
        duration: 220,
        delay: i * 40,
        useNativeDriver: true,
      })
    );

    Animated.stagger(30, hideAnims).start(() => {
      // Mezclar tablero sin resetear el estado de cobro
      const newGrid = Array.from(
        { length: 9 },
        () => symbols[Math.floor(Math.random() * symbols.length)]
      );
      setGrid(newGrid);
      // Limpiar previews anteriores para asegurar nuevos previews aleatorios
      setPreviewIndices([]);
      // ocultar caras (no reveladas)
      setFlipped(Array(9).fill(false));
      // asegurar anim values en 0
      animValues.forEach((a) => a.setValue(0));
      setGameStarted(true);
      setIsShuffling(false);
    });
  };

  const playAgain = () => {
    setShowResultModal(false);
    setTimeout(() => {
      shuffleGrid();
      setGameStarted(false);
      setChargedThisRound(false);
    }, 300);
  };

  const closeResultModal = () => {
    setShowResultModal(false);
  };

  // Función para obtener el multiplicador del símbolo
  const getSymbolMultiplier = (symbol: string) => {
    const prize = SYMBOL_PRIZES[symbol];
    return (prize / GAME_CONFIG.ENTRY_FEE).toFixed(1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require("../../../assets/Scratchandwin/scratchandwinbackground1.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <Animated.View 
          style={[
            styles.overlay,
            winningSymbols.length > 0 && {
              backgroundColor: winningSymbols[0].startsWith('car') 
                ? carColors[winningSymbols[0]] 
                : '#FFD700',
              opacity: glowOpacity
            }
          ]} 
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    // No mostrar advertencia si el juego está completo
                    if (gameStarted && !flipped.every(Boolean)) {
                      setShowExitWarning(true);
                    } else {
                      navigation.goBack();
                    }
                  }}
              >
                <Ionicons name="chevron-back" size={24} color="#FFD700" />
                <Text style={styles.backText}>Atrás</Text>
              </TouchableOpacity>
              
              <View style={styles.titleContainer}>
                <FontAwesome5 name="flag-checkered" size={20} color="#FFD700" />
                <Text style={[styles.title, { color: "#FFD700" }]}>Carrera de Premios</Text>
              </View>
              
              <View style={styles.placeholder} />
            </View>

            {/* Información de premios mejorada */}
            <View style={styles.prizeInfo}>
              <View style={styles.prizeItem}>
                <MaterialCommunityIcons name="currency-usd" size={16} color="#FFD700" />
                <Text style={styles.prizeText}>Apuesta: ${GAME_CONFIG.ENTRY_FEE}</Text>
              </View>
              <View style={styles.prizeItem}>
                <MaterialCommunityIcons name="trophy" size={16} color="#FFD700" />
                <Text style={styles.prizeText}>Premios: $5 - $50</Text>
              </View>
            </View>

            <View style={styles.balanceCard}>
              <View style={styles.balanceContent}>
                <MaterialCommunityIcons name="wallet-outline" size={26} color="#FFD700" />
                <View style={styles.balanceTextContainer}>
                  <Text style={styles.balanceLabel}>Tu Saldo</Text>
                  <Text style={styles.balanceText}>${balance.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* betCard removed - using prizeInfo position for the displayed bet */}

            <View style={styles.symbolsHeader}>
              <Text style={styles.symbolsTitle}>Símbolos Ganadores</Text>
              <Text style={styles.symbolsSubtitle}>Encuentra 3 símbolos iguales para ganar</Text>
            </View>

            {/* Symbol List con premios */}
            <View style={styles.symbolList}>
              {topSymbols.map((s, idx) => {
                const color = carColors[s] || '#FFD700';
                const prize = SYMBOL_PRIZES[s];
                return (
                  <View key={idx} style={styles.symbolWithPrize}>
                    <Animated.View
                      style={[
                        styles.symbolBox,
                        { 
                          borderColor: color, 
                          shadowColor: color,
                          transform: [{
                            scale: winningSymbols.includes(s) ? pulseScale : 1
                          }]
                        },
                      ]}
                    >
                      <View style={[styles.symbolBoxInner, { backgroundColor: `${color}20` }]}>
                        {carImages[s] ? (
                          <Image
                            source={carImages[s]}
                            style={styles.symbolBoxCarImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={styles.symbolBoxText}>{s}</Text>
                        )}
                      </View>
                    </Animated.View>
                    <View style={styles.prizeBadge}>
                      <Text style={styles.prizeBadgeText}>${prize}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Información de premios de cartas */}
            <View style={styles.cardPrizesInfo}>
              <Text style={styles.cardPrizesTitle}>Premios de Cartas:</Text>
              <View style={styles.cardPrizesRow}>
                <Text style={styles.cardPrizeText}>A: $20</Text>
                <Text style={styles.cardPrizeText}>K: $15</Text>
                <Text style={styles.cardPrizeText}>Q: $12</Text>
                <Text style={styles.cardPrizeText}>J: $10</Text>
                <Text style={styles.cardPrizeText}>10: $8</Text>
                <Text style={styles.cardPrizeText}>9: $5</Text>
              </View>
            </View>

            <View style={[styles.gridWrap, { width: gridSize, height: gridSize }]}>
              {/* Resultado centrado en el grid */}
              {showResultModal && result && result.win && (
                <Animated.View
                  style={[
                    styles.resultTextOverlay,
                    {
                      opacity: resultAnim,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Text style={styles.resultDisplayText}>
                    ¡Ganó ${result.amount.toLocaleString()}!
                  </Text>
                </Animated.View>
              )}
              <View style={styles.gridInner}>
                {grid.map((s, i) => {
                  const isCarSymbol = typeof s === 'string' && s.startsWith('car');
                  const isWinner = winningSymbols.length > 0 && winningSymbols.includes(grid[i]);
                  const highlightColor = isCarSymbol ? carColors[s] || '#FFD700' : '#FFD700';
                  
                  return (
                      <View
                        key={i}
                        style={[
                          styles.cellTouchable,
                          { width: cellSize, height: cellSize },
                        ]}
                        onStartShouldSetResponder={() => true}
                        onMoveShouldSetResponder={() => true}
                        onResponderGrant={(e) => {
                          touchStartsRef.current[i] = {
                            x: e.nativeEvent.locationX,
                            y: e.nativeEvent.locationY,
                          };
                        }}
                        onResponderMove={(e) => {
                          const start = touchStartsRef.current[i];
                          if (!start) return;
                          const dx = e.nativeEvent.locationX - start.x;
                          const dy = e.nativeEvent.locationY - start.y;
                          const dist = Math.sqrt(dx * dx + dy * dy);
                          // threshold in pixels to consider this a 'scratch' gesture
                          if (dist > 18) {
                            if (!flipped[i]) flipAt(i);
                          }
                        }}
                        onResponderRelease={() => {
                          touchStartsRef.current[i] = null;
                        }}
                      >
                        <View style={[styles.cell, { width: cellSize, height: cellSize }]}>
                        <AnimatedLinearGradient
                          colors={["#0A2E5A", "#0E4A7A", "#125A9A"]}
                          style={[
                            styles.cardBack,
                            {
                              width: cellSize,
                              height: cellSize,
                              position: "absolute",
                              opacity: animValues[i].interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0],
                              }),
                              transform: [{
                                scale: animValues[i].interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [1, 0.9, 1],
                                })
                              }]
                            },
                          ]}
                        >
                          <View style={styles.scratchPattern}>
                            <View style={styles.patternLine} />
                            <View style={[styles.patternLine, styles.patternLineRotated]} />
                          </View>
                          <Text style={styles.cardBackText}>TOCA PARA RASCAR</Text>
                        </AnimatedLinearGradient>

                        <Animated.View
                          style={[
                            styles.frontCard,
                            isWinner && flipped[i] && {
                              borderColor: highlightColor,
                              shadowColor: highlightColor,
                              transform: [{ scale: pulseScale }]
                            },
                          ]}
                        >
                          <Animated.View
                            style={[
                              StyleSheet.absoluteFillObject,
                              {
                                justifyContent: "center",
                                alignItems: "center",
                                opacity: animValues[i],
                                transform: [{
                                  scale: animValues[i].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1],
                                  })
                                }]
                              },
                            ]}
                          >
                            {typeof grid[i] === "string" && carImages[grid[i]] ? (
                              <View style={[styles.cellImageContainer, { backgroundColor: `${carColors[grid[i]]}15` }]}>
                                <Image
                                  source={carImages[grid[i]]}
                                  style={styles.cellCarImage}
                                  resizeMode="contain"
                                />
                              </View>
                            ) : typeof grid[i] === "string" && cardImages[grid[i]] ? (
                              <View style={styles.cellImageContainer}>
                                <Image
                                  source={cardImages[grid[i]]}
                                  style={styles.cellImage}
                                  resizeMode="contain"
                                />
                              </View>
                            ) : (
                              <Text style={styles.symbol}>{grid[i]}</Text>
                            )}
                          </Animated.View>
                        </Animated.View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Controls - flujo: Iniciar -> Revelar Todo -> Jugar Otra Vez */}
            <View style={styles.controls}>
              {!gameStarted ? (
                <TouchableOpacity
                  style={[styles.revealButton, isShuffling && { opacity: 0.6 }]}
                  onPress={startGame}
                  activeOpacity={0.8}
                  disabled={isShuffling}
                >
                  <LinearGradient
                    colors={RACE_TRACK_THEME.gradients.buttonPrimary}
                    style={styles.revealButtonGradient}
                  >
                    <MaterialCommunityIcons name="play" size={20} color="#FFF" />
                    <Text style={styles.revealButtonText}>Iniciar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : !flipped.every(Boolean) ? (
                <TouchableOpacity
                  style={[styles.revealButton, isShuffling && { opacity: 0.6 }]}
                  onPress={revealAll}
                  activeOpacity={0.8}
                  disabled={isShuffling}
                >
                  <LinearGradient
                    colors={RACE_TRACK_THEME.gradients.buttonSecondary}
                    style={styles.revealButtonGradient}
                  >
                    <MaterialCommunityIcons name="eye-outline" size={20} color="#FFF" />
                    <Text style={styles.revealButtonText}>Revelar Todo</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.playAgainButton, isShuffling && { opacity: 0.6 }]}
                  onPress={playAgain}
                  activeOpacity={0.8}
                  disabled={isShuffling}
                >
                  <LinearGradient
                    colors={RACE_TRACK_THEME.gradients.buttonPrimary}
                    style={styles.playAgainButtonGradient}
                  >
                    <MaterialCommunityIcons name="replay" size={20} color="#FFF" />
                    <Text style={styles.playAgainButtonText}>Jugar Otra Vez</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.footer} />
          </View>
        </ScrollView>

        {showExitWarning && (
          <View style={styles.warningOverlay} pointerEvents="auto">
            <View style={styles.warningContainer}>
              <Text style={styles.warningTitle}>¿Salir del juego?</Text>
              <Text style={styles.warningBody}>Si sales ahora, perderás el progreso de la partida. ¿Deseas continuar?</Text>
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

      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  container: { 
    padding: 20, 
    alignItems: "center",
    paddingTop: StatusBar.currentHeight,
    minHeight: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  backText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "800",
    textShadowColor: "rgba(255, 215, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  placeholder: { width: 80 },
  
  prizeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prizeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  
  balanceCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  balanceTextContainer: {
    flex: 1,
  },
  balanceLabel: {
    color: "#AAA",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  balanceText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
  },
  
  betCard: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    width: '100%',
  },
  betContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  betTextContainer: {
    alignItems: "center",
    flex: 1,
  },
  betLabel: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "600",
  },
  betAmount: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "900",
  },
  
  symbolsHeader: {
    width: "100%",
    marginBottom: 12,
    alignItems: 'center',
  },
  symbolsTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  symbolsSubtitle: {
    color: "#AAA",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  
  symbolList: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  symbolWithPrize: {
    alignItems: 'center',
  },
  symbolBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  symbolBoxInner: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  symbolBoxCarImage: { 
    width: 65, 
    height: 65 
  },
  symbolBoxText: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#FFF" 
  },
  prizeBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  prizeBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  
  cardPrizesInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
  },
  cardPrizesTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardPrizesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  cardPrizeText: {
    color: '#AAA',
    fontSize: 10,
    fontWeight: '600',
  },
  
  gridWrap: {
    marginVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gridInner: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cellTouchable: { 
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cell: {
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  
  cardBack: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  scratchPattern: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  patternLine: {
    width: "200%",
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: [{ rotate: "45deg" }],
  },
  patternLineRotated: {
    transform: [{ rotate: "-45deg" }],
  },
  cardBackText: { 
    color: "rgba(255, 255, 255, 0.8)", 
    fontSize: 10, 
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  frontCard: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cellImageContainer: {
    width: "90%",
    height: "90%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  cellCarImage: { 
    width: "100%", 
    height: "100%" 
  },
  cellImage: { 
    width: "80%", 
    height: "80%" 
  },
  symbol: { 
    fontSize: 32, 
    fontWeight: "bold", 
    color: "#333" 
  },
  
  // CONTROLES
  controls: {
    marginTop: 20,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  revealButton: {
    borderRadius: 25,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    width: '90%',
    marginBottom: 10,
  },
  revealButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
  },
  revealButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  
  playAgainButton: {
    borderRadius: 25,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    width: '90%',
    marginBottom: 10,
  },
  playAgainButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
  },
  playAgainButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  
  // RESULTADO centrado en el grid
  resultTextOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -120 }, { translateY: -40 }],
    width: 240,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  resultDisplayText: {
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFD700",
    textShadowColor: "rgba(0, 0, 0, 0.95)",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 15,
  },
  resultWinText: {
    color: "#FFD700",
  },
  resultLoseText: {
    color: "#FF4444",
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
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  warningTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  warningBody: {
    color: '#DDD',
    fontSize: 13,
    marginBottom: 12,
  },
  warningActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  warningButtonCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  warningButtonExit: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFD700',
  },
  warningButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  
  footer: { 
    marginTop: 10 
  },
});