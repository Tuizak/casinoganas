import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, addCredits, updateBalance } from "../../Apis/supabase";

const { width } = Dimensions.get("window");

// Tarjeta para cada juego del carrusel
const GameCarouselCard = ({ game, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.carouselCard,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={game.image}
          style={styles.gameImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.92)"]}
          style={styles.carouselOverlay}
        >
          <View style={styles.gameInfo}>
            <Text style={styles.carouselTitle}>{game.title}</Text>
            <Text style={styles.carouselDescription}>
              {game.description}
            </Text>
          </View>
        </LinearGradient>

        {/* Badge de icono flotante */}
        <View style={styles.floatingBadge}>
          <LinearGradient
            colors={["rgba(255,215,0,0.3)", "rgba(255,215,0,0.15)"]}
            style={styles.badgeGradient}
          >
            <Ionicons name={game.icon} size={20} color="#FFD700" />
          </LinearGradient>
        </View>

        {/* Botón Play flotante */}
        <View style={styles.playButtonCorner}>
          <LinearGradient
            colors={["#FFD700", "#FFA500"]}
            style={styles.playCircle}
          >
            <Ionicons name="play" size={20} color="#000" />
          </LinearGradient>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Acciones rápidas
const QuickAction = ({ icon, label, onPress, color }: any) => {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.quickActionIcon,
          { backgroundColor: color + "18" },
        ]}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // 🔥 TODOS LOS JUEGOS 1–20
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
      description: "Predice la energía del universo",
      icon: "planet",
      iconColor: "#A55EEA",
      image: require("../../../assets/ruletacosmica.png"),
      navigate: "CosmicRoulette",
    },
    {
      id: "3",
      title: "Battle of Elements",
      description: "Desata el poder elemental",
      icon: "flash",
      iconColor: "#FFD700",
      image: require("../../../assets/battleelements.png"),
      navigate: "BattleOfElements",
    },
    {
      id: "4",
      title: "Tragamonedas",
      description: "Gira y gana grandes premios",
      icon: "diamond",
      iconColor: "#FF6B9D",
      image: require("../../../assets/tragamonedasdiamantes.png"),
      navigate: "SlotMachine",
    },
    {
      id: "5",
      title: "Cosmic Spin",
      description: "Gira la galaxia y gana créditos cósmicos",
      icon: "sparkles",
      iconColor: "#FF00C8",
      image: require("../../../assets/cosmicspin.png"),
      navigate: "CosmicSpin",
    },
    {
      id: "6",
      title: "Neon Fruits",
      description: "Brillos neón, frutas locas, premios épicos",
      icon: "color-wand",
      iconColor: "#00FFFF",
      image: require("../../../assets/neonfruits.png"),
      navigate: "NeonFruits",
    },
    {
      id: "7",
      title: "Mystic Gems",
      description: "Descubre gemas místicas del universo",
      icon: "diamond",
      iconColor: "#9C27B0",
      image: require("../../../assets/mysticgems.png"),
      navigate: "MysticGems",
    },
    {
      id: "8",
      title: "Mega Sevens",
      description: "Los sietes cósmicos te esperan para el gran premio",
      icon: "flame",
      iconColor: "#FF4500",
      image: require("../../../assets/megasevens.png"),
      navigate: "MegaSevens",
    },
    {
      id: "9",
      title: "Zeus Power Slots",
      description: "El poder de Zeus",
      icon: "flash",
      iconColor: "#FFB300",
      image: require("../../../assets/zeuspower.png"),
      navigate: "ZeusPowerSlots",
    },
    {
      id: "10",
      title: "Plinko Cosmic",
      description: "Deja caer la ficha y prueba tu suerte",
      icon: "ellipse",
      iconColor: "#4CAF50",
      image: require("../../../assets/plinkocosmico.png"),
      navigate: "PlinkoCosmic",
    },
    {
      id: "11",
      title: "Ghost Line",
      description: "Atraviesa la línea fantasmal y gana",
      icon: "flame",
      iconColor: "#FF4500",
      image: require("../../../assets/GhostLineGame.png"),
      navigate: "GhostLineGame",
    },
    {
      id: "12",
      title: "Lucky Cards",
      description: "Elige la carta ganadora y multiplica tu apuesta",
      icon: "card-outline",
      iconColor: "#FFD700",
      image: require("../../../assets/luckycards.png"),
      navigate: "LuckyCards",
    },
    {
      id: "13",
      title: "Spin of Fate",
      description: "Un giro puede cambiar tu destino",
      icon: "refresh-circle-outline",
      iconColor: "#6C63FF",
      image: require("../../../assets/spinoffate.png"),
      navigate: "SpinOfFate",
    },
    {
      id: "14",
      title: "Treasure Flip",
      description: "Abre cofres y descubre tesoros ocultos",
      icon: "cube-outline",
      iconColor: "#FFB74D",
      image: require("../../../assets/treasureflip.png"),
      navigate: "TreasureFlip",
    },
    {
      id: "15",
      title: "Dice Duel",
      description: "Lanza los dados y vence a la casa",
      icon: "help-outline",
      iconColor: "#26C6DA",
      image: require("../../../assets/diceduel.png"),
      navigate: "DiceDuel",
    },
    {
      id: "16",
      title: "Lucky Wheel",
      description: "Gira la rueda y apunta al premio máximo",
      icon: "disc-outline",
      iconColor: "#AB47BC",
      image: require("../../../assets/luckywheel.png"),
      navigate: "LuckyWheel",
    },
    {
      id: "17",
      title: "Minefield Rush",
      description: "Avanza sin pisar la bomba equivocada",
      icon: "warning-outline",
      iconColor: "#EF5350",
      image: require("../../../assets/minefieldrush.png"),
      navigate: "MinefieldRush",
    },
    {
      id: "18",
      title: "Card Match",
      description: "Encuentra las parejas y gana créditos",
      icon: "grid-outline",
      iconColor: "#42A5F5",
      image: require("../../../assets/cardmatch.png"),
      navigate: "CardMatch",
    },
    {
      id: "19",
      title: "Tower of Chance",
      description: "Apila bloques y decide cuándo cobrar",
      icon: "albums-outline",
      iconColor: "#FFEE58",
      image: require("../../../assets/towerofchance.png"),
      navigate: "TowerOfChance",
    },
    {
      id: "20",
      title: "Crash X",
      description: "Súbete al multiplicador y sal antes del crash",
      icon: "trending-up-outline",
      iconColor: "#00E676",
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
      description: "Elige Dragon o Tiger y gana al instante",
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

  useEffect(() => {
    const loadBalance = async () => {
      if (!user?.id) return;
      try {
        const data = await getUserBalance(user.id);
        setBalance(Number(data.balance || 0));
      } catch (e) {
        console.log("Error al cargar balance", e);
      } finally {
        setLoading(false);
      }
    };
    loadBalance();

    const unsubscribe = navigation.addListener("focus", loadBalance);
    return unsubscribe;
  }, [user?.id, navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDeposit = async (amount: number) => {
    try {
      const updated = await addCredits(user.id, amount);
      setBalance(updated.balance);
      Alert.alert(
        "✅ Créditos agregados",
        `Se añadieron $${amount} a tu cuenta.`
      );
    } catch (e) {
      Alert.alert("Error", "No se pudo agregar créditos.");
    }
  };

  const handleWithdraw = async (amount: number) => {
    try {
      const newBal = Math.max(0, balance - amount);
      await updateBalance(user.id, newBal);
      setBalance(newBal);
      Alert.alert(
        "💸 Retiro exitoso",
        `Se retiraron $${amount} de tu cuenta.`
      );
    } catch (e) {
      Alert.alert("Error", "No se pudo realizar el retiro.");
    }
  };

  const renderGameItem = ({ item }: any) => (
    <GameCarouselCard
      game={item}
      onPress={() => navigation.navigate(item.navigate)}
    />
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0f", "#1a1a24", "#0a0a0f"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hola de nuevo</Text>
              <Text style={styles.userName}>
                {user?.username || user?.email?.split("@")[0] || "Usuario"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Profile")}
            >
              <View style={styles.profileCircle}>
                <LinearGradient
                  colors={["#2a2a3e", "#1e1e2e"]}
                  style={styles.profileGradient}
                >
                  <Ionicons name="person" size={22} color="#FFD700" />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Balance Card premium estilo login */}
        <Animated.View
          style={[
            styles.balanceContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={["#30220f", "#1e1e2e", "#30220f"]}
              style={styles.balanceGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Decoración superior tipo login */}
              <View style={styles.balanceDecoration}>
                <View style={styles.decorationCircle} />
                <View style={[styles.decorationCircle, { right: 40 }]} />
              </View>

              <View style={styles.balanceTop}>
                <View style={styles.balanceLeftSection}>
                  <Text style={styles.balanceLabel}>Balance disponible</Text>
                  <Text style={styles.balanceAmount}>
                    {loading
                      ? "..."
                      : `$${balance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </Text>
                </View>
                <View style={styles.walletIconWrapper}>
                  <LinearGradient
                    colors={[
                      "rgba(255, 215, 0, 0.25)",
                      "rgba(255, 215, 0, 0.1)",
                    ]}
                    style={styles.walletIcon}
                  >
                    <Ionicons name="wallet" size={28} color="#FFD700" />
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={styles.balanceBtn}
                  activeOpacity={0.8}
                  onPress={() => handleDeposit(100)}
                >
                  <LinearGradient
                    colors={["#4CAF50", "#45A049"]}
                    style={styles.balanceBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="add-circle" size={20} color="#FFF" />
                    <Text style={styles.balanceBtnText}>Depositar</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.balanceBtn}
                  activeOpacity={0.8}
                  onPress={() => handleWithdraw(50)}
                >
                  <LinearGradient
                    colors={["#FF5252", "#E53935"]}
                    style={styles.balanceBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="remove-circle" size={20} color="#FFF" />
                    <Text style={styles.balanceBtnText}>Retirar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Acciones rápidas */}
               <Animated.View
          style={[styles.quickActionsContainer, { opacity: fadeAnim }]}
        >
          <QuickAction
            icon="card"
            label="Comprar"
            color="#FFD700"
            onPress={() => navigation.navigate("BuyCredits")}
          />
          <QuickAction
            icon="swap-horizontal"
            label="Enviar"
            color="#4ECDC4"
            onPress={() => navigation.navigate("SenCredit")}
          />
          <QuickAction
            icon="trophy"
            label="Premios"
            color="#FFD700"
            onPress={() => Alert.alert("Premios", "Próximamente disponible")}
          />
          <QuickAction
            icon="time"
            label="Historial"
            color="#4ECDC4"
            onPress={() => Alert.alert("Historial", "Próximamente disponible")}
          />
        </Animated.View>


        {/* Carrusel de juegos */}
        <Animated.View style={[styles.gamesSection, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Juegos Destacados</Text>
              <View style={styles.sectionUnderline} />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("AllGames")}
            >
              <Text style={styles.seeAll}>Ver todos →</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={games}
            renderItem={renderGameItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={width * 0.78 + 16}
            decelerationRate="fast"
            snapToAlignment="start"
          />
        </Animated.View>

        {/* Promo Banner */}
        <Animated.View style={[styles.promoSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.promoCard}
            activeOpacity={0.85}
            onPress={() => {}}
          >
            <LinearGradient
              colors={["#2a2a3e", "#1e1e2e"]}
              style={styles.promoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              
              
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            <Text style={styles.footerText}>Juego responsable y seguro</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 4,
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  profileButton: {
    padding: 2,
  },
  profileCircle: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  profileGradient: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  balanceCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.1)",
  },
  balanceGradient: {
    padding: 24,
    position: "relative",
  },
  balanceDecoration: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 100,
    overflow: "hidden",
  },
  decorationCircle: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 215, 0, 0.08)",
  },
  balanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  balanceLeftSection: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: -1.5,
    textShadowColor: "rgba(255, 215, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  walletIconWrapper: {
    marginTop: -5,
  },
  walletIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  balanceActions: {
    flexDirection: "row",
    gap: 12,
  },
  balanceBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  balanceBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 14,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    gap: 10,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    color: "#B8B8C8",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  gamesSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  sectionUnderline: {
    width: 60,
    height: 3,
    backgroundColor: "#FFD700",
    marginTop: 4,
    borderRadius: 2,
  },
  seeAll: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  carouselContainer: {
    paddingLeft: 24,
    paddingRight: 24,
  },
  carouselCard: {
    width: width * 0.78,
    height: 230,
    marginRight: 16,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.1)",
  },
  gameImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  carouselOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    justifyContent: "flex-end",
    padding: 20,
  },
  gameInfo: {
    marginBottom: 10,
  },
  carouselTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: -0.5,
  },
  carouselDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 19,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    fontWeight: "500",
  },
  floatingBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  playButtonCorner: {
    position: "absolute",
    top: 14,
    right: 14,
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  promoSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  promoCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)",
  },
  promoGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  promoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  promoIconBox: {
    borderRadius: 28,
    overflow: "hidden",
  },
  promoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  promoText: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  promoDesc: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 19,
    fontWeight: "500",
  },
  promoArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  footerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
