// src/games/game12/LuckyCards.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, updateUserBalance } from "../../Apis/supabase";

const GRID_SIZE = 3;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const MAX_SCRATCHES = 3; // 👉 solo 3 cartas

const BET_OPTIONS = [10, 20, 50, 100];

type SymbolConfig = {
  id: string;
  emoji: string;
  multiplier: number;
  color: string;
};

const SYMBOLS: SymbolConfig[] = [
  { id: "star", emoji: "⭐", multiplier: 10, color: "#FFD700" },
  { id: "ticket", emoji: "🎫", multiplier: 5, color: "#FF9800" },
  { id: "melon", emoji: "🍉", multiplier: 4, color: "#FF5252" },
  { id: "grape", emoji: "🍇", multiplier: 3, color: "#AB47BC" },
  { id: "orange", emoji: "🍊", multiplier: 2, color: "#FFB300" },
  { id: "cherry", emoji: "🍒", multiplier: 1, color: "#E91E63" },
];

const PAYLINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Probabilidades (más cherries, pocas stars)
const SYMBOL_DECK: string[] = [
  "star",
  "ticket",
  "ticket",
  "melon",
  "melon",
  "grape",
  "grape",
  "grape",
  "orange",
  "orange",
  "orange",
  "orange",
  "cherry",
  "cherry",
  "cherry",
  "cherry",
  "cherry",
];

type Tile = {
  id: number;
  symbolId: string;
  revealed: boolean;
  isWinning: boolean;
};

const getSymbolConfig = (id: string): SymbolConfig =>
  SYMBOLS.find((s) => s.id === id)!;

const getRandomSymbolId = (): string => {
  const index = Math.floor(Math.random() * SYMBOL_DECK.length);
  return SYMBOL_DECK[index];
};

const LuckyCards = ({ navigation }: any) => {
  const { user } = useAuth();

  const [balance, setBalance] = useState<number>(0);
  const [bet, setBet] = useState<number>(BET_OPTIONS[2]); // 50

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [lastWin, setLastWin] = useState(0);

  const [roundActive, setRoundActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const [message, setMessage] = useState(
    "Elige tu apuesta, toca 'Jugar' y rasca solo 3 cartas."
  );

  // Cargar saldo
  useEffect(() => {
    const loadBalance = async () => {
      if (!user?.id) return;
      try {
        const data = await getUserBalance(user.id);
        setBalance(Number(data.balance || 0));
      } catch (error) {
        console.log("Error al cargar balance en LuckyCards", error);
        Alert.alert("Error", "No se pudo cargar tu saldo.");
      } finally {
        setLoadingBalance(false);
      }
    };
    loadBalance();
  }, [user?.id]);

  // Iniciar una nueva ronda
  const handlePlay = async () => {
    if (!user) {
      Alert.alert("Sesión requerida", "Debes iniciar sesión para jugar.");
      return;
    }
    if (processing) return;

    try {
      setProcessing(true);
      setRoundActive(false);
      setMessage("Generando cartas...");

      const data = await getUserBalance(user.id);
      const currentBalance = Number(data.balance || 0);

      if (currentBalance < bet) {
        Alert.alert(
          "Saldo insuficiente",
          `Necesitas al menos ${bet} créditos para jugar.`
        );
        setProcessing(false);
        return;
      }

      // 1) Generar tablero
      const generatedTiles: Tile[] = Array.from(
        { length: TOTAL_TILES },
        (_, idx) => ({
          id: idx,
          symbolId: getRandomSymbolId(),
          revealed: false,
          isWinning: false,
        })
      );

      // 2) Calcular líneas ganadoras (resultado ya definido)
      let totalMultiplier = 0;
      const winningIndexes = new Set<number>();

      PAYLINES.forEach((line) => {
        const [a, b, c] = line;
        const symA = generatedTiles[a].symbolId;
        const symB = generatedTiles[b].symbolId;
        const symC = generatedTiles[c].symbolId;

        if (symA === symB && symA === symC) {
          const conf = getSymbolConfig(symA);
          totalMultiplier += conf.multiplier;
          winningIndexes.add(a);
          winningIndexes.add(b);
          winningIndexes.add(c);
        }
      });

      const totalWin = bet * totalMultiplier;
      const newBalance = currentBalance - bet + totalWin;

      const tilesWithFlags = generatedTiles.map((tile) => ({
        ...tile,
        isWinning: winningIndexes.has(tile.id),
      }));

      // 3) Actualizar saldo
      await updateUserBalance(user.id, newBalance, bet, totalWin);

      // 4) Guardar estados
      setBalance(newBalance);
      setTiles(tilesWithFlags);
      setRevealedCount(0);
      setLastWin(totalWin);
      setRoundActive(true);

      if (totalWin > 0) {
        setMessage(
          `Hay cartas con líneas ganadoras escondidas. Rasca solo ${MAX_SCRATCHES} cartas.`
        );
      } else {
        setMessage(
          `Puede que este cartón no tenga premio... Rasca solo ${MAX_SCRATCHES} cartas y compruébalo.`
        );
      }
    } catch (error) {
      console.log("Error en LuckyCards/play", error);
      Alert.alert("Error", "No se pudo procesar la jugada.");
    } finally {
      setProcessing(false);
    }
  };

  const handleTilePress = (index: number) => {
    if (!roundActive || processing) return;
    if (revealedCount >= MAX_SCRATCHES) return;

    const tile = tiles[index];
    if (!tile || tile.revealed) return;

    const updated = [...tiles];
    updated[index] = { ...tile, revealed: true };

    const newRevealed = revealedCount + 1;
    setTiles(updated);
    setRevealedCount(newRevealed);

    if (newRevealed === MAX_SCRATCHES) {
      // ya usó las 3 oportunidades
      setRoundActive(false);
      if (lastWin > 0) {
        setMessage(
          `Cartón revelado: tu premio es de ${lastWin.toFixed(
            0
          )} créditos 🎉`
        );
      } else {
        setMessage("Cartón revelado: no hubo líneas ganadoras 😢");
      }
    }
  };

  const renderTile = (tile: Tile) => {
    const conf = getSymbolConfig(tile.symbolId);

    const borderColor = tile.isWinning
      ? "#00E676"
      : "rgba(255, 193, 7, 0.8)";

    return (
      <TouchableOpacity
        key={tile.id}
        style={styles.card}
        onPress={() => handleTilePress(tile.id)}
        disabled={!roundActive || tile.revealed || revealedCount >= MAX_SCRATCHES}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.cardInner,
            {
              borderColor: borderColor,
              opacity: tile.revealed ? 1 : 0.9,
            },
          ]}
        >
          {tile.revealed ? (
            <>
              <Text style={[styles.cardEmoji, { color: conf.color }]}>
                {conf.emoji}
              </Text>
              <Text style={styles.cardValue}>x{conf.multiplier}</Text>
            </>
          ) : (
            <>
              <Ionicons name="card-outline" size={24} color="#FFC107" />
              <Text style={styles.cardText}>RASCA</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={["#0a0a0f", "#1a1a24", "#0a0a0f"]}
      style={styles.container}
    >
      {/* Barra superior con botón de volver */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.backText}>Juegos</Text>
        </TouchableOpacity>

        <View style={styles.balanceBadge}>
          <Ionicons name="wallet-outline" size={16} color="#FFD700" />
          <Text style={styles.balanceText}>
            {loadingBalance ? "..." : `${balance.toFixed(0)} créditos`}
          </Text>
        </View>
      </View>

      {/* Título */}
      <Text style={styles.title}>Lucky Cards</Text>
      <Text style={styles.subTitle}>
        Rasca solo {MAX_SCRATCHES} cartas. 3 en línea = premio.
      </Text>

      {/* Apuesta */}
      <View style={styles.betRow}>
        <Text style={styles.betLabel}>Apuesta:</Text>
        {BET_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.betChip,
              bet === opt && styles.betChipActive,
              roundActive && styles.betChipDisabled,
            ]}
            onPress={() => !roundActive && setBet(opt)}
            disabled={roundActive}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.betChipText,
                bet === opt && styles.betChipTextActive,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tablero centrado */}
      <View style={styles.boardWrapper}>
        <LinearGradient colors={["#3b1b0f", "#1a1a24"]} style={styles.board}>
          <View style={styles.grid}>
            {tiles.length === 0
              ? Array.from({ length: TOTAL_TILES }).map((_, i) => (
                  <View key={i} style={styles.card}>
                    <View style={[styles.cardInner, { opacity: 0.4 }]}>
                      <Ionicons
                        name="card-outline"
                        size={22}
                        color="#555"
                      />
                      <Text style={[styles.cardText, { color: "#777" }]}>
                        RASCA
                      </Text>
                    </View>
                  </View>
                ))
              : tiles.map(renderTile)}
          </View>
        </LinearGradient>
      </View>

      {/* Info de ronda */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          Cartas rascadas: {revealedCount}/{MAX_SCRATCHES}
        </Text>
        <Text style={styles.infoText}>
          Último premio: {lastWin.toFixed(0)} créditos
        </Text>
      </View>

      {/* Botón Jugar (centrado) */}
      <TouchableOpacity
        style={[
          styles.playButton,
          (processing || roundActive) && { opacity: 0.6 },
        ]}
        onPress={handlePlay}
        disabled={processing || roundActive}
        activeOpacity={0.85}
      >
        <Ionicons name="play-circle-outline" size={22} color="#000" />
        <Text style={styles.playButtonText}>
          {roundActive ? "Rasca tus cartas" : "Jugar"}
        </Text>
      </TouchableOpacity>

      {/* Tabla de premios centrada abajo */}
      <View style={styles.payoutBox}>
        <Text style={styles.payoutTitle}>Líneas ganadoras</Text>
        <Text style={styles.payoutSub}>
          3 símbolos iguales en fila, columna o diagonal.
        </Text>
        {SYMBOLS.map((sym) => (
          <View key={sym.id} style={styles.payoutRow}>
            <Text style={[styles.payoutEmoji, { color: sym.color }]}>
              {sym.emoji}
            </Text>
            <Text style={styles.payoutText}>x{sym.multiplier}</Text>
          </View>
        ))}
        <View style={[styles.payoutRow, { marginTop: 4 }]}>
          <View style={styles.payoutDotLose} />
          <Text style={styles.payoutText}>
            Sin línea = pierdes la apuesta
          </Text>
        </View>
      </View>

      {/* Mensaje */}
      <Text style={styles.message}>{message}</Text>
    </LinearGradient>
  );
};

export default LuckyCards;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  balanceText: {
    color: "#FFD700",
    fontWeight: "600",
    fontSize: 13,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subTitle: {
    color: "#B8B8C8",
    marginTop: 4,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  betRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  betLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  betChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#444",
    minWidth: 48,
    alignItems: "center",
  },
  betChipActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  betChipDisabled: {
    opacity: 0.4,
  },
  betChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  betChipTextActive: {
    color: "#000",
  },
  boardWrapper: {
    alignItems: "center",
    marginBottom: 14,
  },
  board: {
    padding: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FF6B00",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 260,
    height: 260,
  },
  card: {
    width: "33.3333%",
    aspectRatio: 1,
    padding: 5,
  },
  cardInner: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "#201919",
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#FFC107",
  },
  cardEmoji: {
    fontSize: 30,
  },
  cardValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  infoText: {
    color: "#B8B8C8",
    fontSize: 13,
  },
  playButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    marginBottom: 10,
  },
  playButtonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  payoutBox: {
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 8,
    minWidth: 180,
  },
  payoutTitle: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  payoutSub: {
    color: "#B8B8C8",
    fontSize: 11,
    marginBottom: 6,
    textAlign: "center",
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  payoutEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  payoutText: {
    color: "#DDD",
    fontSize: 11,
  },
  payoutDotLose: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF5252",
    marginRight: 6,
  },
  message: {
    marginTop: 6,
    fontSize: 13,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
