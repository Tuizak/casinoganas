import React, { useRef, useState, useEffect } from "react"; 
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Easing,
  Modal,
  ScrollView,
  ImageBackground,
  Alert,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Svg, {
  G,
  Path,
  Text as SvgText,
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
const AnimatedPath: any = Animated.createAnimatedComponent(Path);
import { useAuth } from "../../hooks/useAuth";
import { getUserBalance, updateBalance } from "../../Apis/supabase";
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

// 🎨 TEMA MODERNO VIBRANTE
const CASINO_THEME = {
  colors: {
    primary: "#0F1419",        // Fondo negro moderno
    secondary: "#2D9D78",      // Verde oscuro sofisticado
    accent: "#FF1744",         // Rojo
    success: "#2D9D78",        // Verde éxito
    text: "#FFFFFF",           // Texto principal
    textSecondary: "#A0A0A0",  // Texto secundario
    card: "#1A1F2E",           // Fondo tarjetas oscuro
    border: "rgba(45, 157, 120, 0.3)", // Borde verde
    purple: "#8B5CF6",         // Púrpura
    orange: "#FF8C42",         // Naranja vibrante
  },
  gradients: {
    background: ["#0F1419", "#1a1f3a", "#0F1419"] as const,
    primaryButton: ["#2D9D78", "#1f6b52", "#2D9D78"] as const,
    secondaryButton: ["#8B5CF6", "#6D28D9", "#8B5CF6"] as const,
    wheelBackground: ["#1a2332", "#0d1b2a", "#1a2332"] as const,
    chipGold: ["#FFD700", "#FFA500", "#FFD700"] as const,
    chipRed: ["#FF1744", "#E91E63", "#FF1744"] as const,
    resultWin: ["#2D9D78", "#1f6b52", "#2D9D78"] as const,
    resultLose: ["#FF6B6B", "#E63946", "#FF6B6B"] as const,
  }
};

// Simple mapping of red numbers on a roulette (European style simplified)
const RED_NUMBERS = new Set([
  1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
]);

const CHIP_VALUES = [1, 5, 10, 25, 50, 100];
// European (single-zero) roulette wheel order, clockwise starting from 0
const NUMS = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];

// helper functions to draw SVG arcs (pie slices)
function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  var start = polarToCartesian(cx, cy, radius, endAngle);
  var end = polarToCartesian(cx, cy, radius, startAngle);

  var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  var d = [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, 'Z'].join(' ');
  return d;
}

const Roulette: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [balance, setBalance] = useState<number>(0);
  const [selectedChip, setSelectedChip] = useState<number>(CHIP_VALUES[0]);
  const [placedBets, setPlacedBets] = useState<Array<{type: string; value?: string | number | null; amount: number;}>>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ number: number; color: 'red'|'black'|'green' } | null>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [numberModalVisible, setNumberModalVisible] = useState(false);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [totalWin, setTotalWin] = useState<number>(0);
  const [showExitWarning, setShowExitWarning] = useState(false);
  
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const winAnim = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [currentRotation, setCurrentRotation] = useState<number>(0);

  // Tamaño fijo para la ruleta
  const WHEEL_SIZE = Math.min(width * 0.85, 400);
  const WHEEL_RADIUS = WHEEL_SIZE / 2;

  useEffect(() => {
    const loadBalance = async () => {
      try {
        if (user?.id) {
          const data = await getUserBalance(user.id);
          setBalance(data.balance ?? 0);
        } else {
          setBalance((b) => (b === 0 ? 1000 : b));
        }
      } catch (err) {
        console.error('Error loading roulette balance', err);
        setBalance((b) => (b === 0 ? 1000 : b));
      }
    };
    loadBalance();
    
    const latestRot = { current: 0 } as { current: number };
    let raf: number | null = null;
    const id = rotation.addListener(({ value }) => {
      latestRot.current = value % 360;
      if (raf == null) {
        raf = requestAnimationFrame(() => {
          setCurrentRotation(latestRot.current);
          raf = null;
        });
      }
    });
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      rotation.removeListener(id);
    };
  }, [user?.id]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  // Manejar back button del teléfono
  useEffect(() => {
    const backAction = () => {
      if (spinning) {
        // Si está girando, mostramos modal de advertencia y bloqueamos el evento
        setShowExitWarning(true);
        return true;
      }

      // Si NO está girando, intentar navegar hacia atrás usando navigation
      try {
        if (navigation && (navigation as any).goBack) {
          (navigation as any).goBack();
          return true; // Consumimos el evento porque ya navegamos
        }
      } catch (err) {
        // fallthrough
      }

      // No hay navegación disponible, dejar que el sistema maneje el back
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [spinning, navigation]);

  const totalPlaced = placedBets.reduce((s, b) => s + b.amount, 0);

  const placeCurrentBet = (type: string, value: string | number | null = null) => {
    if (!selectedChip) return;
    setPlacedBets((prev) => [...prev, { type, value, amount: selectedChip }]);
  };

  const getAreaTotal = (type: string, value: string | number | null = null) => {
    return placedBets.filter(b => b.type === type && String(b.value) === String(value)).reduce((s, b) => s + b.amount, 0);
  };

  const clearBets = () => setPlacedBets([]);

  // Handler for the header back button (respects spinning)
  const handleHeaderBack = () => {
    if (spinning) {
      setShowExitWarning(true);
    } else {
      try {
        if (navigation && (navigation as any).goBack) (navigation as any).goBack();
      } catch (err) {
        // ignore
      }
    }
  };

  const spinWheel = () => {
    if (spinning) return;
    if (placedBets.length === 0) return;
    const betTotal = totalPlaced;
    if (betTotal > balance) return;

    setBalance((b) => b - betTotal);
    setSpinning(true);
    setResult(null);
    setWinningIndex(null);
    setTotalWin(0);
    highlightAnim.setValue(0);
    winAnim.setValue(0);
    bounceAnim.setValue(0);

    const spins = 4 + Math.floor(Math.random() * 4);
    const endRotation = spins * 360 + Math.floor(Math.random() * 360);

    Animated.timing(rotation, {
      toValue: endRotation,
      duration: 3200 + Math.floor(Math.random() * 1000),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
        const finalAngle = endRotation % 360;
        const originalTheta = (360 - finalAngle) % 360;
        const anglePer = 360 / NUMS.length;

        const centers = NUMS.map((_, i) => ((i * anglePer + anglePer / 2) % 360));
        const angularDistance = (a: number, b: number) => {
          const diff = Math.abs(a - b) % 360;
          return diff > 180 ? 360 - diff : diff;
        };
        let bestIdx = 0;
        let bestDist = 1e9;
        centers.forEach((c, i) => {
          const d = angularDistance(originalTheta, c);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        });
        let idx = bestIdx;
        setWinningIndex(idx);
        
        // highlight + pequeño delay antes de mostrar resultado
        Animated.sequence([
          Animated.timing(highlightAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.delay(800),
          // vibración breve para simular el puntero golpeando la ruleta
          Animated.sequence([
            Animated.timing(bounceAnim, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 0, duration: 90, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 0.5, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.timing(highlightAnim, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]).start();

        if (idx < 0) idx = 0;
        if (idx >= NUMS.length) idx = NUMS.length - 1;
        const number = NUMS[idx];
        const color = number === 0 ? 'green' : (RED_NUMBERS.has(number) ? 'red' : 'black');

      let totalWinAmount = 0;
      placedBets.forEach((b) => {
        let payout = 0;
        let wonBet = false;
        if (b.type === 'red') {
          payout = 2;
          wonBet = color === 'red';
        } else if (b.type === 'black') {
          payout = 2;
          wonBet = color === 'black';
        } else if (b.type === 'odd') {
          payout = 2;
          wonBet = number !== 0 && number % 2 === 1;
        } else if (b.type === 'even') {
          payout = 2;
          wonBet = number !== 0 && number % 2 === 0;
        } else if (b.type === 'range') {
          payout = 2;
          if (b.value === '1-18') wonBet = number >= 1 && number <= 18;
          if (b.value === '19-36') wonBet = number >= 19 && number <= 36;
        } else if (b.type === 'dozen') {
          payout = 3;
          if (b.value === 1) wonBet = number >= 1 && number <= 12;
          if (b.value === 2) wonBet = number >= 13 && number <= 24;
          if (b.value === 3) wonBet = number >= 25 && number <= 36;
        } else if (b.type === 'number') {
          payout = 36;
          wonBet = Number(b.value) === number;
        }

        if (wonBet) totalWinAmount += b.amount * payout;
      });

      setTotalWin(totalWinAmount);
      if (totalWinAmount > 0) {
        setBalance((prev) => prev + totalWinAmount);
        Animated.spring(winAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      setResult({ number, color });
      // Ocultar resultado automáticamente después de 3 segundos
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = setTimeout(() => setResult(null), 3000);

      if (user?.id) {
        const expectedFinal = (balance - totalPlaced) + totalWinAmount;
        updateBalance(user.id, expectedFinal).catch(console.error);
      }

      setPlacedBets([]);
      rotation.setValue(endRotation % 360);
      setSpinning(false);
    });
  };

  const rotationInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const winScale = winAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  const markerBounce = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -6, -12],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={CASINO_THEME.gradients.background} style={StyleSheet.absoluteFillObject} />
      
      {/* Fondo de textura sutil */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?q=80&w=1000' }}
        style={[StyleSheet.absoluteFill, { opacity: 0.05 }]}
        resizeMode="cover"
      />

      <View style={styles.container}>
        {/* Header elegante */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleHeaderBack}>
            <Ionicons name="chevron-back" size={24} color={CASINO_THEME.colors.secondary} />
            <Text style={styles.backText}>Atrás</Text>
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="chart-donut" size={28} color={CASINO_THEME.colors.secondary} />
            <Text style={styles.title}>RULETA EUROPEA</Text>
          </View>
          
          <View style={styles.balanceContainer}>
            <MaterialCommunityIcons name="wallet" size={20} color={CASINO_THEME.colors.secondary} />
            <Text style={styles.balanceText}>${balance.toLocaleString()}</Text>
          </View>
        </View>

        {/* Área de la rueda */}
        <View style={styles.wheelSection}>
            <LinearGradient colors={CASINO_THEME.gradients.wheelBackground} style={styles.wheelOuter}>
              <View style={[styles.wheelWrap, { width: WHEEL_SIZE, height: WHEEL_SIZE }]}>
                
                {/* Reflejo dinámico */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.reflectionOverlay,
                    { transform: [{ rotate: rotationInterpolate }] },
                    { opacity: spinning ? 0.18 : 0.12 }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.45)','rgba(255,255,255,0)']}
                    style={{ width: '100%', height: '100%', borderRadius: WHEEL_RADIUS }}
                  />
                </Animated.View>

                {/* Ruleta principal CON NÚMEROS INTEGRADOS - SIN ROTACIÓN INVERSA */}
                <Animated.View style={[styles.wheel, { transform: [{ rotate: rotationInterpolate }] }]}> 
                  <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} preserveAspectRatio="xMidYMid meet">
                    <Defs>
                      <RadialGradient id="wheelShade" cx="50%" cy="50%" r="50%">
                        <Stop offset="0" stopColor="rgba(255,255,255,0.06)" />
                        <Stop offset="0.6" stopColor="rgba(0,0,0,0.12)" />
                        <Stop offset="1" stopColor="rgba(0,0,0,0.5)" />
                      </RadialGradient>

                      <RadialGradient id="rimMetal" cx="50%" cy="50%" r="50%">
                        <Stop offset="0" stopColor="#f7f7f7" />
                        <Stop offset="0.6" stopColor="#b0a9a2" />
                        <Stop offset="1" stopColor="#6b6056" />
                      </RadialGradient>

                      {/* Patrón para los segmentos de colores */}
                      <RadialGradient id="redSegment" cx="50%" cy="50%" r="50%">
                        <Stop offset="0" stopColor="#FF1744" />
                        <Stop offset="1" stopColor="#B2102F" />
                      </RadialGradient>
                      <RadialGradient id="blackSegment" cx="50%" cy="50%" r="50%">
                        <Stop offset="0" stopColor="#1a1a2e" />
                        <Stop offset="1" stopColor="#0a0a1a" />
                      </RadialGradient>
                      <RadialGradient id="greenSegment" cx="50%" cy="50%" r="50%">
                        <Stop offset="0" stopColor="#2D9D78" />
                        <Stop offset="1" stopColor="#1f6b52" />
                      </RadialGradient>
                    </Defs>

                    {/* Borde metálico exterior */}
                    <Circle cx={WHEEL_RADIUS} cy={WHEEL_RADIUS} r={WHEEL_RADIUS - 5} fill="url(#rimMetal)" stroke="#ffffff20" strokeWidth={1} />
                    
                    {/* Madera interna */}
                    <Circle cx={WHEEL_RADIUS} cy={WHEEL_RADIUS} r={WHEEL_RADIUS - 15} fill="#1a1210" opacity={0.55} />
                    
                    <G>
                      {NUMS.map((n, idx) => {
                        const anglePer = 360 / NUMS.length;
                        const start = idx * anglePer;
                        const end = (idx + 1) * anglePer;
                        
                        let fill = 'url(#blackSegment)';
                        if (n === 0) {
                          fill = 'url(#greenSegment)';
                        } else if (RED_NUMBERS.has(n)) {
                          fill = 'url(#redSegment)';
                        }
                        
                        const d = describeArc(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_RADIUS - 25, start, end);
                        
                        // Calcular posición para el texto
                        const midAngle = (start + end) / 2;
                        const textRadius = WHEEL_RADIUS - 42;
                        const textPos = polarToCartesian(WHEEL_RADIUS, WHEEL_RADIUS, textRadius, midAngle);
                        
                        return (
                          <G key={`seg-${n}`}>
                            <Path d={d} fill={fill} stroke="rgba(0,0,0,0.6)" strokeWidth={3} />
                            
                            {/* Número SIN rotación inversa - gira naturalmente con la ruleta */}
                            <SvgText
                              x={textPos.x}
                              y={textPos.y}
                              textAnchor="middle"
                              alignmentBaseline="middle"
                              fontSize="13"
                              fontWeight="bold"
                              fill={n === 0 ? '#000000' : (RED_NUMBERS.has(n) ? '#FFFFFF' : '#FFFFFF')}
                              stroke={n === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                              strokeWidth="0.5"
                            >
                              {n}
                            </SvgText>
                          </G>
                        );
                      })}

                      {/* Highlight del número ganador */}
                      {typeof winningIndex === 'number' && (() => {
                        const anglePer = 360 / NUMS.length;
                        const s = winningIndex * anglePer;
                        const e = (winningIndex + 1) * anglePer;
                        const hd = describeArc(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_RADIUS - 20, s, e);
                        return (
                          <AnimatedPath 
                            d={hd} 
                            fill={'rgba(255, 215, 0, 0.4)'} 
                            opacity={highlightAnim as any}
                            stroke="#FFD700"
                            strokeWidth={2}
                          />
                        );
                      })()}

                      {/* Centro de la ruleta */}
                      <Circle cx={WHEEL_RADIUS} cy={WHEEL_RADIUS} r={WHEEL_RADIUS * 0.15} fill="#0f0f1e" stroke="#2D9D78" strokeWidth={3} />
                      
                      {/* Sombra radial */}
                      <Circle cx={WHEEL_RADIUS} cy={WHEEL_RADIUS} r={WHEEL_RADIUS - 25} fill="url(#wheelShade)" opacity={0.6} />
                    </G>
                  </Svg>
                </Animated.View>

                {/* Marcador fijo */}
                <Animated.View
                  style={[
                    styles.markerWrap,
                    { 
                      width: WHEEL_SIZE, 
                      height: WHEEL_SIZE,
                      transform: [{ translateY: markerBounce }] 
                    }
                  ]}
                  pointerEvents="none"
                >
                  <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
                    <Path 
                      d={`M ${WHEEL_RADIUS} ${WHEEL_RADIUS - WHEEL_RADIUS + 10} L ${WHEEL_RADIUS - 8} ${WHEEL_RADIUS - WHEEL_RADIUS + 25} L ${WHEEL_RADIUS + 8} ${WHEEL_RADIUS - WHEEL_RADIUS + 25} Z`}
                      fill="#FFD700" 
                      stroke="#1a1a2e" 
                      strokeWidth={2} 
                    />
                    <Path 
                      d={`M ${WHEEL_RADIUS} ${WHEEL_RADIUS - WHEEL_RADIUS + 10} L ${WHEEL_RADIUS - 8} ${WHEEL_RADIUS - WHEEL_RADIUS + 25} L ${WHEEL_RADIUS + 8} ${WHEEL_RADIUS - WHEEL_RADIUS + 25} Z`}
                      fill="none" 
                      stroke="#ffffff60" 
                      strokeWidth={0.8} 
                    />
                  </Svg>
                </Animated.View>

                {/* Resultado sobre la ruleta */}
                {result && (
                  <Animated.View
                    style={[styles.resultContainerAbsolute, { transform: [{ scale: winScale }] }]}
                    onTouchEnd={() => setResult(null)}
                  >
                    <LinearGradient
                      colors={totalWin > 0 ? CASINO_THEME.gradients.resultWin : CASINO_THEME.gradients.resultLose}
                      style={styles.resultBox}
                    >
                      <Text style={styles.resultNumber}>{result.number}</Text>
                      <View style={[styles.resultColor, { backgroundColor: result.color === 'red' ? '#E31837' : result.color === 'black' ? '#1A1F2E' : '#2E8B57' }]}> 
                        <Text style={styles.resultColorText}>{result.color.toUpperCase()}</Text>
                      </View>
                      {totalWin > 0 && (
                        <Text style={styles.winAmount}>+${totalWin}</Text>
                      )}
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>
            </LinearGradient>
        </View>

        {/* Resto del código permanece igual */}
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Panel de fichas */}
          <View style={[styles.chipsPanel, spinning && { opacity: 0.5, pointerEvents: 'none' }]}>
            <Text style={styles.sectionTitle}>FICHAS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
              {CHIP_VALUES.map((chip) => (
                <TouchableOpacity 
                  key={chip} 
                  onPress={() => setSelectedChip(chip)}
                  disabled={spinning}
                  style={{
                    borderRadius: 20,
                    marginRight: 8,
                    borderWidth: selectedChip === chip ? 2 : 0,
                    borderColor: selectedChip === chip ? '#FFF' : 'transparent',
                    opacity: spinning ? 0.5 : 1,
                  }}
                >
                  <LinearGradient
                    colors={CASINO_THEME.gradients.chipGold}
                    style={{
                      minWidth: 70,
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: '#0A0E17',
                        fontWeight: '900',
                        fontSize: 14,
                      }}
                    >
                      ${chip}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Panel de apuestas */}
          <View style={[styles.betsPanel, spinning && { opacity: 0.5, pointerEvents: 'none' }]}>
            <Text style={styles.sectionTitle}>APUESTAS</Text>
            
            <View style={styles.betGrid}>
              {/* Fila 1: Colores */}
              <View style={styles.betRow}>
                <TouchableOpacity 
                  onPress={() => placeCurrentBet('red', null)} 
                  style={[styles.betButton, styles.redBet, getAreaTotal('red', null) > 0 && styles.betActive]}
                >
                  <Text style={styles.betButtonText}>ROJO</Text>
                  {getAreaTotal('red', null) > 0 && (
                    <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('red', null)}</Text></View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => placeCurrentBet('black', null)} 
                  style={[styles.betButton, styles.blackBet, getAreaTotal('black', null) > 0 && styles.betActive]}
                >
                  <Text style={styles.betButtonText}>NEGRO</Text>
                  {getAreaTotal('black', null) > 0 && (
                    <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('black', null)}</Text></View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Fila 2: Par/Impar */}
              <View style={styles.betRow}>
                <TouchableOpacity onPress={() => placeCurrentBet('even', null)} style={[styles.betButton, getAreaTotal('even', null) > 0 && styles.betActive]}>
                  <Text style={styles.betButtonText}>PAR</Text>
                  {getAreaTotal('even', null) > 0 && <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('even', null)}</Text></View>}
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => placeCurrentBet('odd', null)} style={[styles.betButton, getAreaTotal('odd', null) > 0 && styles.betActive]}>
                  <Text style={styles.betButtonText}>IMPAR</Text>
                  {getAreaTotal('odd', null) > 0 && <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('odd', null)}</Text></View>}
                </TouchableOpacity>
              </View>

              {/* Fila 3: Rangos */}
              <View style={styles.betRow}>
                <TouchableOpacity onPress={() => placeCurrentBet('range', '1-18')} style={[styles.betButton, getAreaTotal('range','1-18') > 0 && styles.betActive]}>
                  <Text style={styles.betButtonText}>1-18</Text>
                  {getAreaTotal('range','1-18') > 0 && <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('range','1-18')}</Text></View>}
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => placeCurrentBet('range', '19-36')} style={[styles.betButton, getAreaTotal('range','19-36') > 0 && styles.betActive]}>
                  <Text style={styles.betButtonText}>19-36</Text>
                  {getAreaTotal('range','19-36') > 0 && <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('range','19-36')}</Text></View>}
                </TouchableOpacity>
              </View>

              {/* Fila 4: Docenas */}
              <View style={styles.betRow}>
                <TouchableOpacity onPress={() => placeCurrentBet('dozen', 1)} style={[styles.betButton, getAreaTotal('dozen', 1) > 0 && styles.betActive]}>
                  <Text style={styles.betButtonText}>1-12</Text>
                  {getAreaTotal('dozen', 1) > 0 && <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('dozen', 1)}</Text></View>}
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => placeCurrentBet('dozen', 2)} style={[styles.betButton, getAreaTotal('dozen', 2) > 0 && styles.betActive]}>
                  <Text style={styles.betButtonText}>13-24</Text>
                  {getAreaTotal('dozen', 2) > 0 && <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('dozen', 2)}</Text></View>}
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => placeCurrentBet('dozen', 3)} style={[styles.betButton, getAreaTotal('dozen', 3) > 0 && styles.betActive]}>
                  <Text style={styles.betButtonText}>25-36</Text>
                  {getAreaTotal('dozen', 3) > 0 && <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('dozen', 3)}</Text></View>}
                </TouchableOpacity>
              </View>

              {/* Fila 5: Número específico */}
              <View style={styles.betRow}>
                <TouchableOpacity 
                  onPress={() => setNumberModalVisible(true)} 
                  style={[styles.betButton, styles.numberBet, getAreaTotal('number', null) > 0 && styles.betActive]}
                >
                  <MaterialCommunityIcons name="dice-multiple" size={20} color="#FFF" />
                  <Text style={styles.betButtonText}>NÚMERO ESPECÍFICO</Text>
                  {getAreaTotal('number', null) > 0 && <View style={styles.betChip}><Text style={styles.betChipText}>${getAreaTotal('number', null)}</Text></View>}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Panel de control */}
          <View style={styles.controlPanel}>
            <View style={styles.betInfo}>
              <Text style={styles.betInfoText}>Apuesta Total: ${totalPlaced}</Text>
              {totalPlaced > balance && (
                <Text style={styles.errorText}>Saldo insuficiente</Text>
              )}
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                onPress={clearBets} 
                disabled={spinning}
                style={[styles.clearButton, spinning && { opacity: 0.5 }]}
              >
                <LinearGradient colors={CASINO_THEME.gradients.secondaryButton} style={styles.clearGradient}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FFF" />
                  <Text style={styles.clearText}>Limpiar</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                disabled={spinning || placedBets.length === 0 || totalPlaced > balance} 
                onPress={spinWheel} 
                style={[styles.spinButton, (spinning || placedBets.length === 0 || totalPlaced > balance) && styles.spinDisabled]}
              >
                <LinearGradient colors={CASINO_THEME.gradients.primaryButton} style={styles.spinGradient}>
                  <MaterialCommunityIcons name="reload" size={24} color="#0A0E17" />
                  <Text style={styles.spinText}>{spinning ? 'GIRANDO...' : 'GIRAR'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal de selección de números */}
        <Modal visible={numberModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar Número</Text>
              <ScrollView contentContainerStyle={styles.numberGrid}>
                {Array.from({ length: 37 }).map((_, i) => (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => { placeCurrentBet('number', i); setNumberModalVisible(false); }} 
                    style={[
                      styles.numberCell,
                      i === 0 && styles.zeroCell,
                      RED_NUMBERS.has(i) && i !== 0 && styles.redCell,
                      getAreaTotal('number', i) > 0 && styles.numberSelected
                    ]}
                  >
                    <Text style={[
                      styles.numberCellText,
                      (i === 0 || !RED_NUMBERS.has(i)) && i !== 0 && styles.blackNumber
                    ]}>
                      {i}
                    </Text>
                    {getAreaTotal('number', i) > 0 && (
                      <View style={styles.numberChip}><Text style={styles.numberChipText}>${getAreaTotal('number', i)}</Text></View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => setNumberModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de advertencia de salida */}
        <Modal visible={showExitWarning} animationType="fade" transparent={true}>
          <View style={styles.warningOverlay}>
            <View style={styles.warningContainer}>
              <MaterialCommunityIcons name="alert-circle" size={60} color={CASINO_THEME.colors.accent} />
              <Text style={styles.warningTitle}>¡Espera!</Text>
              <Text style={styles.warningMessage}>La ruleta está girando. ¿Seguro que quieres salir?</Text>
              <View style={styles.warningActions}>
                <TouchableOpacity 
                  onPress={() => setShowExitWarning(false)}
                  style={styles.warningButtonCancel}
                >
                  <Text style={styles.warningButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setShowExitWarning(false);
                    (navigation as any).goBack();
                  }}
                  style={styles.warningButtonExit}
                >
                  <Text style={styles.warningButtonExitText}>Salir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Roulette;

// Los estilos permanecen exactamente iguales...
const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: CASINO_THEME.colors.primary 
  },
  container: { 
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 20, 25, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.2)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  backText: {
    color: CASINO_THEME.colors.secondary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: CASINO_THEME.colors.secondary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 217, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 217, 255, 0.5)',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  balanceText: {
    color: CASINO_THEME.colors.secondary,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  
  // Wheel Section
  wheelSection: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    overflow: "visible",
  },
  wheelOuter: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  wheelWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wheel: {
    width: '100%',
    height: '100%',
  },
  reflectionOverlay: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: 999,
    zIndex: 5,
  },
  markerWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width * 0.72,
    height: width * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  },
  
  // Resto de los estilos permanecen igual...
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  
  // Result Display
  resultContainer: {
    marginTop: 12,
  },
  resultBox: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    minWidth: 120,
  },
  resultNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  resultColor: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  resultColorText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },
  winAmount: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 14,
  },
  resultContainerAbsolute: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  
  // Chips Panel
  chipsPanel: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: CASINO_THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  
  // Bets Panel
  betsPanel: {
    marginBottom: 20,
  },
  betGrid: {
    gap: 12,
  },
  betRow: {
    flexDirection: 'row',
    gap: 10,
  },
  betButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CASINO_THEME.colors.card,
    borderWidth: 1,
    borderColor: CASINO_THEME.colors.border,
    position: 'relative',
    minHeight: 54,
  },
  betButtonText: {
    color: CASINO_THEME.colors.text,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  redBet: {
    backgroundColor: '#E31837',
  },
  blackBet: {
    backgroundColor: '#1A1F2E',
  },
  numberBet: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  betActive: {
    borderWidth: 2,
    borderColor: CASINO_THEME.colors.secondary,
    shadowColor: CASINO_THEME.colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  betChip: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: CASINO_THEME.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
    minWidth: 35,
  },
  betChipText: {
    color: '#0A0E17',
    fontWeight: '900',
    fontSize: 10,
    textAlign: 'center',
  },
  
  // Control Panel
  controlPanel: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: CASINO_THEME.colors.border,
  },
  betInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  betInfoText: {
    color: CASINO_THEME.colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  errorText: {
    color: '#E31837',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  clearGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  clearText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  spinButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: CASINO_THEME.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  spinGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  spinText: {
    color: '#0A0E17',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  spinDisabled: {
    opacity: 0.5,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: CASINO_THEME.colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CASINO_THEME.colors.border,
  },
  modalTitle: {
    color: CASINO_THEME.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  numberCell: {
    width: 50,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2A2F3E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: CASINO_THEME.colors.border,
  },
  zeroCell: {
    backgroundColor: '#2E8B57',
  },
  redCell: {
    backgroundColor: '#E31837',
  },
  numberCellText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  blackNumber: {
    color: '#FFF',
  },
  numberSelected: {
    borderWidth: 2,
    borderColor: CASINO_THEME.colors.secondary,
  },
  numberChip: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: CASINO_THEME.colors.secondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    minWidth: 20,
  },
  numberChipText: {
    color: '#0A0E17',
    fontWeight: '900',
    fontSize: 8,
    textAlign: 'center',
  },
  modalClose: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: CASINO_THEME.colors.secondary,
    borderRadius: 12,
  },
  modalCloseText: {
    color: '#0A0E17',
    fontWeight: '800',
    fontSize: 16,
  },
  warningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 23, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContainer: {
    backgroundColor: CASINO_THEME.colors.card,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CASINO_THEME.colors.secondary,
    shadowColor: CASINO_THEME.colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    width: '85%',
  },
  warningTitle: {
    color: CASINO_THEME.colors.accent,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 16,
    marginBottom: 12,
  },
  warningMessage: {
    color: CASINO_THEME.colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  warningActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  warningButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CASINO_THEME.colors.card,
    borderWidth: 2,
    borderColor: CASINO_THEME.colors.secondary,
    alignItems: 'center',
  },
  warningButtonCancelText: {
    color: CASINO_THEME.colors.secondary,
    fontWeight: '800',
    fontSize: 14,
  },
  warningButtonExit: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CASINO_THEME.colors.accent,
    alignItems: 'center',
  },
  warningButtonExitText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});