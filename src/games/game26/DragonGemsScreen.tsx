import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const BOARD_SIZE = 8;
const GEM_TYPES = ["ruby", "sapphire", "emerald", "amber", "amethyst", "diamond"];
const TILE_SIZE = Math.min(width - 40, 360) / BOARD_SIZE;
const START_MOVES = 25;
const START_TIME = 90;
const TARGET_SCORE = 5000;

// =====================================================
// UTILIDADES GEMA
// =====================================================
const getGemColors = (gem) => {
  switch (gem) {
    case "ruby": return ["#ff1744", "#b71c1c"];
    case "sapphire": return ["#2979ff", "#0d47a1"];
    case "emerald": return ["#00e676", "#004d40"];
    case "amber": return ["#ffca28", "#ff8f00"];
    case "amethyst": return ["#ba68c8", "#6a1b9a"];
    case "diamond": return ["#e0f7fa", "#b2ebf2"];
    default: return ["#777", "#222"];
  }
};

const getGemIcon = (gem) => {
  switch (gem) {
    case "ruby": return "flame";
    case "sapphire": return "water";
    case "emerald": return "leaf";
    case "amber": return "sunny";
    case "amethyst": return "moon";
    case "diamond": return "sparkles";
    default: return "ellipse";
  }
};

// =====================================================
// GENERAR TABLERO
// =====================================================
function generateBoard() {
  const newBoard = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      let gem;
      do {
        gem = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
      } while (
        (c >= 2 && row[c - 1] === gem && row[c - 2] === gem) ||
        (r >= 2 && newBoard[r - 1][c] === gem && newBoard[r - 2][c] === gem)
      );
      row.push(gem);
    }
    newBoard.push(row);
  }
  return newBoard;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function areAdjacent(a, b) {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr + dc === 1;
}

// =====================================================
// MATCHES
// =====================================================
function findMatches(b) {
  const mask = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(false)
  );

  // Horizontales
  for (let r = 0; r < BOARD_SIZE; r++) {
    let count = 1;
    for (let c = 1; c < BOARD_SIZE; c++) {
      if (b[r][c] && b[r][c] === b[r][c - 1]) count++;
      else {
        if (count >= 3)
          for (let k = 0; k < count; k++) mask[r][c - 1 - k] = true;
        count = 1;
      }
    }
    if (count >= 3)
      for (let k = 0; k < count; k++) mask[r][BOARD_SIZE - 1 - k] = true;
  }

  // Verticales
  for (let c = 0; c < BOARD_SIZE; c++) {
    let count = 1;
    for (let r = 1; r < BOARD_SIZE; r++) {
      if (b[r][c] && b[r][c] === b[r - 1][c]) count++;
      else {
        if (count >= 3)
          for (let k = 0; k < count; k++) mask[r - 1 - k][c] = true;
        count = 1;
      }
    }
    if (count >= 3)
      for (let k = 0; k < count; k++) mask[BOARD_SIZE - 1 - k][c] = true;
  }

  return mask;
}

function hasAnyMatch(board) {
  const m = findMatches(board);
  return m.some((row) => row.some((v) => v));
}

// =====================================================
// APLICAR MATCHES + CAÍDA
// =====================================================
function applyMatches(board) {
  let total = 0;
  let combo = 0;
  let b = cloneBoard(board);

  while (true) {
    const mask = findMatches(b);
    let found = false;
    let removed = 0;

    // remover
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (mask[r][c]) {
          removed++;
          found = true;
          b[r][c] = null;
        }
      }
    }

    if (!found) break;

    combo++;
    const base = removed * 60;
    total += base * combo;

    // Caer gemas
    for (let c = 0; c < BOARD_SIZE; c++) {
      let write = BOARD_SIZE - 1;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (b[r][c] !== null) {
          b[write][c] = b[r][c];
          if (write !== r) b[r][c] = null;
          write--;
        }
      }
      for (let r = write; r >= 0; r--) {
        b[r][c] = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
      }
    }
  }

  return { newBoard: b, gained: total };
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
const DragonGemsUltra = () => {
  const [board, setBoard] = useState(generateBoard());
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(START_MOVES);
  const [timeLeft, setTimeLeft] = useState(START_TIME);
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("Toca JUGAR para iniciar.");

  // Timer
  useEffect(() => {
    if (status !== "playing") return;
    if (timeLeft <= 0) return handleGameOver();

    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [status, timeLeft]);

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // CLIC EN GEMA
  const handleGemPress = (row, col) => {
    if (status === "won" || status === "lost") return;

    if (status === "ready") setStatus("playing");

    const pos = { row, col };

    if (!selected) {
      setSelected(pos);
      return;
    }

    if (selected.row === row && selected.col === col) {
      setSelected(null);
      return;
    }

    if (!areAdjacent(selected, pos)) {
      setSelected(pos);
      return;
    }

    const temp = cloneBoard(board);
    const a = temp[selected.row][selected.col];
    const b = temp[row][col];
    temp[selected.row][selected.col] = b;
    temp[row][col] = a;

    if (!hasAnyMatch(temp)) {
      setSelected(null);
      setMessage("Ese movimiento no crea combinación 😅");
      return;
    }

    const { newBoard, gained } = applyMatches(temp);

    setBoard(newBoard);
    setScore((s) => s + gained);
    setMovesLeft((m) => m - 1);
    setSelected(null);

    if (gained > 0) setMessage(`🔥 ¡Combo! +${gained}`);

    setTimeout(() => {
      if (movesLeft - 1 <= 0 || timeLeft <= 0) {
        handleGameOver(gained);
      } else if (score + gained >= TARGET_SCORE) {
        setStatus("won");
        setMessage(`🏆 Meta alcanzada (${TARGET_SCORE} pts)`);
      }
    }, 150);
  };

  const handleGameOver = (last = 0) => {
    const final = score + last;
    if (final >= TARGET_SCORE) {
      setStatus("won");
      setMessage(`🏆 ¡Objetivo logrado! Score final: ${final}`);
    } else {
      setStatus("lost");
      setMessage(`⛔ Se acabó el tiempo/movimientos. Score: ${final}`);
    }
  };

  const resetGame = () => {
    setBoard(generateBoard());
    setSelected(null);
    setScore(0);
    setMovesLeft(START_MOVES);
    setTimeLeft(START_TIME);
    setStatus("ready");
    setMessage("Toca JUGAR para iniciar.");
  };

  // =====================================================
  // RENDER GEM
  // =====================================================
  const renderGem = (gem, row, col) => {
    const sel = selected && selected.row === row && selected.col === col;
    const [c1, c2] = getGemColors(gem);

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[styles.tile, sel && styles.tileSelected]}
        onPress={() => handleGemPress(row, col)}
        activeOpacity={0.9}
      >
        <View style={styles.tileBase}>
          <LinearGradient colors={["#666", "#111"]} style={styles.gemFrame}>
            <LinearGradient colors={[c1, c2]} style={styles.gemInner}>
              <View style={styles.gemHighlight} />
              <View style={styles.gemGlow} />
              <View style={styles.shine} />
              <Ionicons
                name={getGemIcon(gem)}
                size={TILE_SIZE * 0.42}
                color={gem === "diamond" ? "#004d40" : "#fff"}
                style={styles.gemIcon}
              />
            </LinearGradient>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  // =====================================================
  // UI PRINCIPAL
  // =====================================================
  return (
    <LinearGradient colors={["#050816", "#12032d", "#1c0f3a"]} style={styles.screen}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>💎 Dragon Gems</Text>
          <Text style={styles.subtitle}>Alinea gemas y llega a {TARGET_SCORE} pts</Text>
        </View>

        <View style={styles.targetBadge}>
          <Text style={styles.targetLabel}>Meta</Text>
          <Text style={styles.targetValue}>{TARGET_SCORE}</Text>
        </View>
      </View>

      {/* HUD */}
      <View style={styles.hudRow}>
        <View style={styles.hudPill}>
          <Ionicons name="trophy" size={18} color="#ffd600" />
          <Text style={styles.hudLabel}>Score</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>

        <View style={styles.hudPill}>
          <Ionicons name="flash" size={18} color="#4fc3f7" />
          <Text style={styles.hudLabel}>Movs</Text>
          <Text style={styles.hudValue}>{movesLeft}</Text>
        </View>

        <View style={styles.hudPill}>
          <Ionicons name="time" size={18} color="#ff9100" />
          <Text style={styles.hudLabel}>Tiempo</Text>
          <Text style={styles.hudValue}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* TABLERO */}
      <View style={styles.boardWrapper}>
        <LinearGradient colors={["#1b1b2f", "#162447"]} style={styles.boardInner}>
          {board.map((row, r) => (
            <View key={r} style={{ flexDirection: "row" }}>
              {row.map((gem, c) => renderGem(gem, r, c))}
            </View>
          ))}
        </LinearGradient>
      </View>

      {/* MENSAJE */}
      <View style={styles.messageBox}>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {/* BOTONES */}
      <View style={styles.controls}>
        {status === "ready" && (
          <TouchableOpacity style={styles.mainButton} onPress={() => setStatus("playing")}>
            <LinearGradient colors={["#ffd700", "#ff8f00"]} style={styles.mainButtonGradient}>
              <Ionicons name="play" size={22} color="#000" />
              <Text style={[styles.mainButtonText, { color: "#000" }]}>JUGAR</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {(status === "won" || status === "lost") && (
          <TouchableOpacity style={styles.mainButton} onPress={resetGame}>
            <LinearGradient colors={["#8E2DE2", "#4A00E0"]} style={styles.mainButtonGradient}>
              <Ionicons name="refresh" size={22} color="#fff" />
              <Text style={styles.mainButtonText}>Reiniciar</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={14} color="#666" />
        <Text style={styles.footerText}>Juego de entretenimiento. Créditos sin valor real.</Text>
      </View>

    </LinearGradient>
  );
};

// =====================================================
// ESTILOS
// =====================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 22,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
  },
  subtitle: {
    color: "#cfd8dc",
    fontSize: 12,
  },

  targetBadge: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  targetLabel: { color: "#cfd8dc", fontSize: 10 },
  targetValue: { color: "#ffd600", fontWeight: "900", fontSize: 16 },

  hudRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  hudPill: {
    flexDirection: "row",
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
    gap: 6,
  },
  hudLabel: { color: "#cfd8dc", fontSize: 11, flex: 1 },
  hudValue: { color: "#fff", fontSize: 14, fontWeight: "900" },

  boardWrapper: { alignItems: "center", marginBottom: 12 },
  boardInner: {
    padding: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  tile: { width: TILE_SIZE, height: TILE_SIZE, padding: 3 },
  tileSelected: {
    transform: [{ scale: 1.07 }],
    shadowColor: "#ffd700",
    shadowOpacity: 1,
    shadowRadius: 12,
  },

  tileBase: {
    flex: 1,
    backgroundColor: "#05070d",
    borderRadius: TILE_SIZE / 3,
    padding: 2,
  },

  gemFrame: {
    flex: 1,
    borderRadius: TILE_SIZE / 3.1,
    padding: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },

  gemInner: {
    flex: 1,
    borderRadius: TILE_SIZE / 3.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },

  gemHighlight: {
    position: "absolute",
    top: 0,
    height: "35%",
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  gemGlow: {
    position: "absolute",
    bottom: -6,
    height: "40%",
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  shine: {
    position: "absolute",
    top: -40,
    left: -40,
    width: TILE_SIZE * 2,
    height: TILE_SIZE * 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    transform: [{ rotate: "45deg" }],
    opacity: 0.4,
  },

  gemIcon: { zIndex: 2 },

  messageBox: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    marginBottom: 10,
  },
  messageText: { color: "#eceff1", textAlign: "center" },

  controls: { alignItems: "center" },
  mainButton: { width: "100%", borderRadius: 26, overflow: "hidden" },
  mainButtonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  mainButtonText: { color: "#fff", fontWeight: "900", fontSize: 15 },

  footer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: { color: "#75828a", marginLeft: 4, fontSize: 11 },
});

// =====================================================
// EXPORT CORRECTO
// =====================================================
export default DragonGemsUltra;
