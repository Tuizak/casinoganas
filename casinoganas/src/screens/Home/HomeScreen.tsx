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
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserBalance, addCredits, updateBalance } from "../../Apis/supabase";

const { width, height } = Dimensions.get("window");

// Componente de tarjeta de juego para el carrusel
const GameCarouselCard = ({ game, onPress, index }: any) => {
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
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
          style={styles.carouselOverlay}
        >
          <View style={styles.gameInfo}>
            <Text style={styles.carouselTitle}>{game.title}</Text>
            <Text style={styles.carouselDescription}>{game.description}</Text>
          </View>
        </LinearGradient>
        
        {/* Badge de icono flotante */}
        <View style={styles.floatingBadge}>
          <LinearGradient
            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
            style={styles.badgeGradient}
          >
            <Ionicons name={game.icon} size={18} color="#fff" />
          </LinearGradient>
        </View>

        {/* Botón Play flotante */}
        <View style={styles.playButtonCorner}>
          <LinearGradient
            colors={['#6C63FF', '#5A52D5']}
            style={styles.playCircle}
          >
            <Ionicons name="play" size={22} color="#fff" />
          </LinearGradient>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Componente de acción rápida minimalista
const QuickAction = ({ icon, label, onPress, color }: any) => {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Datos de juegos para el carrusel
  const games = [
    {
      id: "1",
      title: "Roulette Royale",
      description: "Rojo o Negro - Gana al instante",
      icon: "disc",
      iconColor: "#FFD700",
      image: require("../../../assets/rouletteroyale.png"),
      navigate: "RouletteGame4",
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
  image: require("../../../assets/cosmicspin.png"), // 👈 agrega una imagen en assets
  navigate: "CosmicSpin", // 👈 igual que el name del Stack.Screen
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
      Alert.alert("✅ Créditos agregados", `Se añadieron $${amount} a tu cuenta.`);
    } catch (e) {
      Alert.alert("Error", "No se pudo agregar créditos.");
    }
  };

  const handleWithdraw = async (amount: number) => {
    try {
      const newBal = Math.max(0, balance - amount);
      await updateBalance(user.id, newBal);
      setBalance(newBal);
      Alert.alert("💸 Retiro exitoso", `Se retiraron $${amount} de tu cuenta.`);
    } catch (e) {
      Alert.alert("Error", "No se pudo realizar el retiro.");
    }
  };

  const renderGameItem = ({ item, index }: any) => (
    <GameCarouselCard
      game={item}
      index={index}
      onPress={() => navigation.navigate(item.navigate)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Fondo sutil */}
      <LinearGradient
        colors={["#0a0a0f", "#1a1a24", "#0a0a0f"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header minimalista */}
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
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Balance Card Elegante */}
        <Animated.View
          style={[
            styles.balanceContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={["#1e1e2e", "#2a2a3e"]}
              style={styles.balanceGradient}
            >
              <View style={styles.balanceTop}>
                <View>
                  <Text style={styles.balanceLabel}>Balance disponible</Text>
                  <Text style={styles.balanceAmount}>
                    {loading ? "..." : `$${balance.toFixed(2)}`}
                  </Text>
                </View>
                <View style={styles.walletIcon}>
                  <Ionicons name="wallet-outline" size={24} color="#7C7C8A" />
                </View>
              </View>

              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={[styles.balanceBtn, styles.depositBtn]}
                  activeOpacity={0.8}
                  onPress={() => handleDeposit(100)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                  <Text style={[styles.balanceBtnText, { color: "#4CAF50" }]}>
                    Depositar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.balanceBtn, styles.withdrawBtn]}
                  activeOpacity={0.8}
                  onPress={() => handleWithdraw(50)}
                >
                  <Ionicons name="remove-circle-outline" size={20} color="#FF5252" />
                  <Text style={[styles.balanceBtnText, { color: "#FF5252" }]}>
                    Retirar
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Acciones Rápidas */}
        <Animated.View
          style={[
            styles.quickActionsContainer,
            { opacity: fadeAnim },
          ]}
        >
          <QuickAction
            icon="card-outline"
            label="Comprar"
            color="#6C63FF"
            onPress={() => navigation.navigate("BuyCredits")}
          />
          <QuickAction
            icon="gift-outline"
            label="Bonos"
            color="#FF6B9D"
            onPress={() => Alert.alert("Bonos", "Próximamente disponible")}
          />
          <QuickAction
            icon="trophy-outline"
            label="Premios"
            color="#FFD700"
            onPress={() => Alert.alert("Premios", "Próximamente disponible")}
          />
          <QuickAction
            icon="time-outline"
            label="Historial"
            color="#4ECDC4"
            onPress={() => Alert.alert("Historial", "Próximamente disponible")}
          />
        </Animated.View>

        {/* Carrusel de Juegos */}
        <Animated.View
          style={[
            styles.gamesSection,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Juegos Destacados</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={games}
            renderItem={renderGameItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={width - 84}
            decelerationRate="fast"
            snapToAlignment="start"
          />
        </Animated.View>

        {/* Promoción Sutil */}
        <Animated.View
          style={[
            styles.promoSection,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.promoCard}>
            <View style={styles.promoContent}>
              <View style={styles.promoIcon}>
                <Ionicons name="gift" size={24} color="#FFD700" />
              </View>
              <View style={styles.promoText}>
                <Text style={styles.promoTitle}>Bono de Bienvenida</Text>
                <Text style={styles.promoDesc}>
                  Duplica tu primer depósito hasta $500
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#7C7C8A" />
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#7C7C8A" />
          <Text style={styles.footerText}>Juego responsable y seguro</Text>
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
    color: "#7C7C8A",
    marginBottom: 4,
    fontWeight: "500",
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  profileButton: {
    padding: 4,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2a2a3e",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  balanceGradient: {
    padding: 24,
  },
  balanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: "#7C7C8A",
    marginBottom: 8,
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceActions: {
    flexDirection: "row",
    gap: 12,
  },
  balanceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  depositBtn: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  withdrawBtn: {
    backgroundColor: "rgba(255, 82, 82, 0.1)",
  },
  balanceBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 12,
    color: "#B8B8C8",
    fontWeight: "600",
  },
  gamesSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  seeAll: {
    fontSize: 14,
    color: "#6C63FF",
    fontWeight: "600",
  },
  carouselContainer: {
    paddingLeft: 24,
    paddingRight: 24,
  },
  carouselCard: {
    width: width * 0.75,
    height: 220,
    marginRight: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: "#1a1a2e",
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
    height: "65%",
    justifyContent: "flex-end",
    padding: 18,
  },
  gameInfo: {
    marginBottom: 8,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  carouselDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 18,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  floatingBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  badgeGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  playButtonCorner: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  promoSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e1e2e",
    padding: 20,
    borderRadius: 16,
  },
  promoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  promoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  promoText: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 13,
    color: "#7C7C8A",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#7C7C8A",
    fontWeight: "500",
  },
});