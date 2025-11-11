import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  ScrollView,
  Text,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile, getUserBalance, addCredits } from "../../Apis/supabase";

const ProfileScreen = ({ navigation }: any) => {
  const { user, refreshUser, logout } = useAuth();
  const [name, setName] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatar_url || "");
  const [balance, setBalance] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [biggestWin, setBiggestWin] = useState(0);
  const [loading, setLoading] = useState(true);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadUserData();
    startAnimations();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      if (user?.id) {
        const data = await getUserBalance(user.id);
        setBalance(data.balance || 0);
        setTotalWinnings(data.total_winnings || 0);
        setGamesPlayed(data.total_games_played || 0);
        setBiggestWin(data.biggest_win || 0);
      }
    } catch (error: any) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarScale, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(avatarScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleSave = async () => {
    try {
      if (user?.id) {
        await updateUserProfile(user.id, { username: name, avatar_url: avatar });
        await refreshUser();
        Alert.alert("✅ Éxito", "Perfil actualizado correctamente");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: logout },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient
          colors={["#0a0a0a", "#1a1410", "#0a0a0a"]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1410", "#0a0a0a"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={24} color="#FFD700" />
          </TouchableOpacity>
        </Animated.View>

        {/* Avatar Section */}
        <Animated.View
          style={[
            styles.avatarSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.avatarGradient}
              >
                <Avatar uri={avatar} onChange={setAvatar} />
              </LinearGradient>
              <TouchableOpacity
                style={styles.editAvatarButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#FFD700", "#FFA500"]}
                  style={styles.editAvatarGradient}
                >
                  <Ionicons name="camera" size={18} color="#1a0a00" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Text style={styles.userName}>
            {name || user?.email?.split("@")[0] || "Usuario"}
          </Text>

          <View style={styles.vipBadge}>
            <LinearGradient
              colors={["rgba(255, 215, 0, 0.2)", "rgba(255, 165, 0, 0.1)"]}
              style={styles.vipBadgeGradient}
            >
              <Ionicons name="diamond" size={14} color="#FFD700" />
              <Text style={styles.vipBadgeText}>MIEMBRO VIP</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View
          style={[
            styles.statsContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.08)"]}
            style={styles.statsCard}
          >
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="wallet" size={24} color="#FFD700" />
              </View>
              <Text style={styles.statValue}>${balance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>${totalWinnings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Ganancias</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="game-controller" size={24} color="#8B7EFF" />
              </View>
              <Text style={styles.statValue}>{gamesPlayed}</Text>
              <Text style={styles.statLabel}>Jugadas</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Mayor Premio */}
        <Animated.View
          style={[
            styles.biggestWinCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={["rgba(255, 215, 0, 0.1)", "rgba(255, 165, 0, 0.05)"]}
            style={styles.biggestWinGradient}
          >
            <View style={styles.biggestWinIcon}>
              <Ionicons name="star" size={28} color="#FFD700" />
            </View>
            <View style={styles.biggestWinInfo}>
              <Text style={styles.biggestWinLabel}>Mayor Premio</Text>
              <Text style={styles.biggestWinValue}>${biggestWin.toFixed(2)}</Text>
            </View>
            <Ionicons name="trophy" size={28} color="#FFA500" />
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("BuyCredits")}
          >
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.actionGradient}
            >
              <View style={styles.actionContent}>
                <Ionicons name="add-circle" size={24} color="#1a0a00" />
                <Text style={styles.actionText}>Comprar Créditos</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1a0a00" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("SlotMachine")}
          >
            <LinearGradient
              colors={["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.08)"]}
              style={styles.actionGradient}
            >
              <View style={styles.actionContent}>
                <Ionicons name="game-controller" size={24} color="#FFD700" />
                <Text style={styles.actionTextSecondary}>Jugar Slots</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFD700" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("History")}
          >
            <LinearGradient
              colors={["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.08)"]}
              style={styles.actionGradient}
            >
              <View style={styles.actionContent}>
                <Ionicons name="time" size={24} color="#FFD700" />
                <Text style={styles.actionTextSecondary}>Ver Historial</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFD700" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Form Section */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <LinearGradient
            colors={["rgba(255, 215, 0, 0.08)", "rgba(255, 165, 0, 0.03)"]}
            style={styles.formCard}
          >
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#FFD700" />
              <Input
                placeholder="Nombre de usuario"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#666"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#888" />
              <Input
                placeholder="Correo electrónico"
                value={user?.email || ""}
                editable={false}
                placeholderTextColor="#666"
                style={[styles.input, styles.inputDisabled]}
              />
            </View>

            <TouchableOpacity onPress={handleSave} activeOpacity={0.9}>
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.saveButton}
              >
                <Ionicons name="checkmark-circle" size={20} color="#1a0a00" />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          style={[
            styles.logoutSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <LinearGradient
              colors={["rgba(255, 69, 0, 0.15)", "rgba(255, 69, 0, 0.08)"]}
              style={styles.logoutButton}
            >
              <Ionicons name="log-out-outline" size={20} color="#FF5252" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={18} color="#666" />
          <Text style={styles.footerText}>Información segura y protegida</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFD700",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarGradient: {
    padding: 4,
    borderRadius: 70,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
  },
  editAvatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0a0a0a",
  },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 16,
    letterSpacing: -0.5,
  },
  vipBadge: {
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  vipBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  vipBadgeText: {
    color: "#FFD700",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1,
  },
  statsContainer: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 24,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    marginHorizontal: 4,
  },
  biggestWinCard: {
    marginBottom: 28,
    borderRadius: 16,
    overflow: "hidden",
  },
  biggestWinGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 16,
  },
  biggestWinIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  biggestWinInfo: {
    flex: 1,
  },
  biggestWinLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
    fontWeight: "600",
  },
  biggestWinValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 16,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a0a00",
    letterSpacing: 0.3,
  },
  actionTextSecondary: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFD700",
    letterSpacing: 0.3,
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.1)",
    gap: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: 14,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: "#1a0a00",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  logoutSection: {
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 69, 0, 0.3)",
    gap: 8,
  },
  logoutText: {
    color: "#FF5252",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
});