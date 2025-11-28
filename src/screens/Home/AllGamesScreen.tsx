import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CARD_WIDTH = (width - 24 * 2 - 16) / 2; // márgenes + espacio entre columnas

const games = [
  {
      id: "29",
      title: "European Roulette",
      description: "Ruleta clásica - Apuesta y gira",
      icon: "disc",
      iconColor: "#FFD700",
      image: require("../../../assets/European-Roulette.png"),
      navigate: "Roulette",
    },
  {
    id: "2",
    title: "Ruleta Cósmica",
    description: "Ruleta espacial",
    icon: "planet",
    image: require("../../../assets/ruletacosmica.png"),
    navigate: "CosmicRoulette",
  },
  {
    id: "3",
    title: "Battle of Elements",
    description: "Batalla elemental",
    icon: "flash",
    image: require("../../../assets/battleelements.png"),
    navigate: "BattleOfElements",
  },
  {
    id: "4",
    title: "Tragamonedas",
    description: "Slots clásicos",
    icon: "diamond",
    image: require("../../../assets/tragamonedasdiamantes.png"),
    navigate: "SlotMachine",
  },
  {
    id: "5",
    title: "Cosmic Spin",
    description: "Giro galáctico",
    icon: "sparkles",
    image: require("../../../assets/cosmicspin.png"),
    navigate: "CosmicSpin",
  },
  {
    id: "6",
    title: "Neon Fruits",
    description: "Frutas neón",
    icon: "color-wand",
    image: require("../../../assets/neonfruits.png"),
    navigate: "NeonFruits",
  },
  {
    id: "7",
    title: "Mystic Gems",
    description: "Gemas místicas",
    icon: "diamond",
    image: require("../../../assets/mysticgems.png"),
    navigate: "MysticGems",
  },
  {
    id: "8",
    title: "Mega Sevens",
    description: "Jackpot de 7s",
    icon: "flame",
    image: require("../../../assets/megasevens.png"),
    navigate: "MegaSevens",
  },
  {
    id: "9",
    title: "Zeus Power Slots",
    description: "Poder del trueno",
    icon: "flash",
    image: require("../../../assets/zeuspower.png"),
    navigate: "ZeusPowerSlots",
  },
  {
    id: "10",
    title: "Plinko Cosmic",
    description: "Plinko espacial",
    icon: "ellipse",
    image: require("../../../assets/plinkocosmico.png"),
    navigate: "PlinkoCosmic",
  },
  {
    id: "11",
    title: "Ghost Line",
    description: "Línea fantasmal",
    icon: "flame",
    image: require("../../../assets/GhostLineGame.png"),
    navigate: "GhostLineGame",
  },
  {
    id: "12",
    title: "Lucky Cards",
    description: "Cartas de suerte",
    icon: "card-outline",
    image: require("../../../assets/luckycards.png"),
    navigate: "LuckyCards",
  },
  {
    id: "13",
    title: "Spin of Fate",
    description: "Destino giratorio",
    icon: "refresh-circle-outline",
    image: require("../../../assets/spinoffate.png"),
    navigate: "SpinOfFate",
  },
  {
    id: "14",
    title: "Treasure Flip",
    description: "Cofres misteriosos",
    icon: "cube-outline",
    image: require("../../../assets/treasureflip.png"),
    navigate: "TreasureFlip",
  },
  {
    id: "15",
    title: "Dice Duel",
    description: "Duelo de dados",
    icon: "help-outline",
    image: require("../../../assets/diceduel.png"),
    navigate: "DiceDuel",
  },
  {
    id: "16",
    title: "Lucky Wheel",
    description: "Rueda de la suerte",
    icon: "disc-outline",
    image: require("../../../assets/luckywheel.png"),
    navigate: "LuckyWheel",
  },
  {
    id: "17",
    title: "Minefield Rush",
    description: "Campo minado",
    icon: "warning-outline",
    image: require("../../../assets/minefieldrush.png"),
    navigate: "MinefieldRush",
  },
  {
    id: "18",
    title: "Card Match",
    description: "Memorama",
    icon: "grid-outline",
    image: require("../../../assets/cardmatch.png"),
    navigate: "CardMatch",
  },
  {
    id: "19",
    title: "Tower of Chance",
    description: "Torre de riesgo",
    icon: "albums-outline",
    image: require("../../../assets/towerofchance.png"),
    navigate: "TowerOfChance",
  },
  {
    id: "20",
    title: "Crash X",
    description: "Multiplicador loco",
    icon: "trending-up-outline",
    image: require("../../../assets/crashx.png"),
    navigate: "CrashX",
  },
   {
      id: "21",
      title: "Blackjack",
      description: "Llega a 21 sin pasarte y vence al crupier",
      icon: "layers-outline",
      iconColor: "#4CAF50",
      image: require("../../../assets/blackjack.png"),
      navigate: "Blackjack",
    },
    {
      id: "22",
      title: "Casino War",
      description: "Carta contra carta: el que tenga la más alta gana",
      icon: "swap-vertical-outline",
      iconColor: "#FF9800",
      image: require("../../../assets/casinowar.png"),
      navigate: "CasinoWar",
    },
    {
      id: "23",
      title: "Red Dog",
      description: "Apuesta si la siguiente carta cae en el rango",
      icon: "paw-outline",
      iconColor: "#F44336",
      image: require("../../../assets/reddog.png"),
      navigate: "RedDog",
    },
    {
      id: "24",
      title: "Dragon Tiger",
      description: "Dragon o Tiger: elige tu lado y gana al instante",
      icon: "flame-outline",
      iconColor: "#E91E63",
      image: require("../../../assets/dragontiger.png"),
      navigate: "DragonTiger",
    },
    {
      id: "25",
      title: "Three Card Poker",
      description: "Forma la mejor mano con solo tres cartas",
      icon: "albums-outline",
      iconColor: "#3F51B5",
      image: require("../../../assets/threecardpoker.png"),
      navigate: "ThreeCardPoker",
    },
    {
      id: "26",
      title: "Dragon Gems",
      description: "Gemas legendarias custodiadas por dragones",
      icon: "diamond-outline",
      iconColor: "#00BCD4",
      image: require("../../../assets/dragongems.png"),
      navigate: "DragonGems",
    },
    {
      id: "27",
      title: "Dice Game",
      description: "Predice alto o bajo - ¡Duplica tu apuesta!",
      icon: "game-controller",
      iconColor: "#FF6B6B",
      image: require("../../../assets/dicegame.png"),
      navigate: "DiceGame",
    },
    {
      id: "28",
      title: "Scratch & Win!",
      description: "Encuentra 3 iguales para ganar",
      icon: "ticket",
      iconColor: "#FFD700",
      image: require("../../../assets/scratchandwin1.png"),
      navigate: "ScratchandWin",
    },
    
];

const AllGamesScreen = ({ navigation }: any) => {
  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate(item.navigate)}
    >
      <View style={styles.cardImageWrapper}>
        <Image source={item.image} style={styles.cardImage} />
        <View style={styles.cardImageOverlay} />
        <View style={styles.cardIconBadge}>
          <Ionicons name={item.icon as any} size={18} color="#FFD700" />
        </View>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.cardTag}>
          <Ionicons name="star" size={11} color="#FFD700" />
          <Text style={styles.cardTagText}>Juego Casino</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={["#0a0a0f", "#1a1a24", "#0a0a0f"]}
      style={styles.container}
    >
      {/* Header estilo app */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#FFD700" />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Todos los juegos</Text>

        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.headerSubtitle}>
        Explora todo el catálogo de CasinoGanas
      </Text>

      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderItem}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
};

export default AllGamesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 18,
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    backgroundColor: "#15151f",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  cardImageWrapper: {
    width: "100%",
    height: 90,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardIconBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.5)",
  },
  cardInfo: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 6,
  },
  cardTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(255,215,0,0.12)",
  },
  cardTagText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: "600",
    color: "#FFD700",
  },
});
