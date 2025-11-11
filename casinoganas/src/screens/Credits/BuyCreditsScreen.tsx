import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { addCredits, getUserBalance } from "../../Apis/supabase";

// Componente de tarjeta de crédito con animación de brillo
const CreditCard = ({ amount, onPress, disabled }: any) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <TouchableOpacity
      style={styles.creditOption}
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#FFD700", "#FFA500", "#FFD700"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.creditGradient}
      >
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
        <View style={styles.cardContent}>
          <Ionicons name="cash" size={32} color="#1a0a00" />
          <Text style={styles.creditAmount}>${amount}</Text>
          <Text style={styles.creditLabel}>Agregar</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function BuyCreditsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  const handleAddCredits = async (amount: number) => {
    try {
      setLoading(true);
      const updated = await addCredits(user.id, amount);
      setBalance(updated.balance);
      Alert.alert("✅ Compra exitosa", `Se agregaron $${amount} a tu cuenta`);
    } catch (err) {
      Alert.alert("Error", "No se pudo agregar créditos");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await getUserBalance(user.id);
        setBalance(Number(data.balance || 0));
      } catch {}
    };
    fetchBalance();
  }, []);

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
        {/* Header con botón de regreso */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comprar Créditos</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Balance destacado */}
        <View style={styles.balanceSection}>
          <LinearGradient
            colors={["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.08)"]}
            style={styles.balanceCard}
          >
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet" size={40} color="#FFD700" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Tu Balance</Text>
              <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Descripción */}
        <Text style={styles.description}>
          Selecciona la cantidad que deseas agregar a tu cuenta
        </Text>

        {/* Opciones de crédito */}
        <View style={styles.optionsContainer}>
          {[50, 100, 200, 300, 400, 500, 1000].map((amount) => (
            <CreditCard
              key={amount}
              amount={amount}
              disabled={loading}
              onPress={() => handleAddCredits(amount)}
            />
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Botón de Stripe (placeholder) */}
        <TouchableOpacity
          style={styles.stripeButton}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert(
              "Próximamente",
              "La opción de pago con tarjeta estará disponible muy pronto."
            )
          }
        >
          <LinearGradient
            colors={["rgba(255, 215, 0, 0.08)", "rgba(255, 165, 0, 0.03)"]}
            style={styles.stripeGradient}
          >
            <View style={styles.stripeContent}>
              <View style={styles.stripeIconBox}>
                <Ionicons name="card-outline" size={24} color="#FFD700" />
              </View>
              <View style={styles.stripeTextContainer}>
                <Text style={styles.stripeTitle}>Pagar con Tarjeta</Text>
                <Text style={styles.stripeSubtitle}>Próximamente disponible</Text>
              </View>
              <Ionicons name="lock-closed" size={20} color="#888" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer informativo */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={18} color="#666" />
          <Text style={styles.footerText}>
            Transacciones seguras y protegidas
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
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
  placeholder: {
    width: 44,
  },
  balanceSection: {
    marginBottom: 24,
  },
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  balanceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 4,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: -1,
  },
  description: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  creditOption: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  creditGradient: {
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: 50,
    transform: [{ skewX: "-20deg" }],
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  creditAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1a0a00",
    flex: 1,
    textAlign: "center",
    letterSpacing: -1,
  },
  creditLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a0a00",
    opacity: 0.8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    color: "#666",
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: "600",
  },
  stripeButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  stripeGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)",
    borderRadius: 16,
  },
  stripeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stripeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  stripeTextContainer: {
    flex: 1,
  },
  stripeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  stripeSubtitle: {
    fontSize: 13,
    color: "#888",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
});