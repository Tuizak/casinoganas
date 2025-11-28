// src/screens/Credits/BuyCreditsScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { createPaymentIntent } from "../../Apis/stripeClient";
import { addCredits, getUserBalance } from "../../Apis/supabase";

const BuyCreditsScreen = () => {
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const navigation = useNavigation();

  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const presetAmounts = [50, 100, 200, 500];

  const handleBuy = async () => {
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión para comprar monedas.");
      return;
    }

    if (!amount || amount <= 0) {
      Alert.alert("Monto inválido", "Ingresa un monto mayor a 0.");
      return;
    }

    try {
      setLoading(true);

      const clientSecret = await createPaymentIntent(amount);

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Casinoganas",
        defaultBillingDetails: {
          name: user.email || "Jugador",
        },
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        console.log("Stripe init error", initError);
        Alert.alert("Error", "No se pudo iniciar el pago.");
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        console.log("Stripe error", presentError);
        if (presentError.code === "Canceled") {
          Alert.alert("Pago cancelado", "No se realizó el cargo.");
        } else {
          Alert.alert("Error", presentError.message || "Error al procesar el pago.");
        }
        return;
      }

      await addCredits(user.id, amount);

      const balanceData = await getUserBalance(user.id);
      console.log("Nuevo balance:", balanceData.balance);

      Alert.alert(
        "Pago exitoso",
        `Se acreditaron ${amount} monedas a tu cuenta. 🎉`
      );
    } catch (e: any) {
      console.log("Error general compra:", e);
      Alert.alert(
        "Error",
        "Hubo un problema al procesar el pago. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0A0A14", "#1A1A2E", "#16213E"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A14" />
      
      {/* Header con botón de retroceso */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate("Home" as never)}
        >
          <LinearGradient
            colors={["rgba(255,215,0,0.2)", "rgba(255,193,7,0.1)"]}
            style={styles.backButtonGradient}
          >
            <Ionicons name="chevron-back" size={24} color="#FFD700" />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Comprar Monedas</Text>
          <View style={styles.headerBadge}>
            <Ionicons name="diamond" size={14} color="#FFD700" />
            <Text style={styles.headerBadgeText}>Premium</Text>
          </View>
        </View>
        
        <View style={styles.headerIcon}>
          <Ionicons name="wallet" size={28} color="#FFD700" />
        </View>
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        {/* Tarjeta de información */}
        <LinearGradient
          colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]}
          style={styles.infoCard}
        >
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#4FC3F7" />
            <Text style={styles.infoTitle}>Información Importante</Text>
          </View>
          <Text style={styles.infoText}>
            Las monedas se usan para jugar y luego puedes retirarlas
            (1 moneda = 1 peso MXN).
          </Text>
        </LinearGradient>

        {/* Selector de montos */}
        <View style={styles.amountSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Selecciona el Monto</Text>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountDisplayText}>${amount} MXN</Text>
            </View>
          </View>
          
          <View style={styles.amountGrid}>
            {presetAmounts.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.amountCard,
                  amount === value && styles.amountCardActive,
                ]}
                onPress={() => setAmount(value)}
                disabled={loading}
              >
                <LinearGradient
                  colors={
                    amount === value 
                      ? ["#FFD700", "#FFC107", "#FFB300"] 
                      : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
                  }
                  style={styles.amountCardGradient}
                >
                  <View style={styles.amountCardHeader}>
                    <Ionicons 
                      name="sparkles" 
                      size={18} 
                      color={amount === value ? "#000" : "#FFD700"} 
                    />
                    <Text style={[
                      styles.amountCardPopular,
                      amount === value && styles.amountCardPopularActive
                    ]}>
                      {value === 100 ? "POPULAR" : "RECOMENDADO"}
                    </Text>
                  </View>
                  
                  <Text style={[
                    styles.amountCardValue,
                    amount === value && styles.amountCardValueActive
                  ]}>
                    {value}
                  </Text>
                  
                  <Text style={[
                    styles.amountCardLabel,
                    amount === value && styles.amountCardLabelActive
                  ]}>
                    MONEDAS
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón de pago */}
        <View style={styles.paymentSection}>
          <TouchableOpacity
            style={[styles.buyButton, loading && styles.buyButtonDisabled]}
            onPress={handleBuy}
            disabled={loading}
          >
            <LinearGradient
              colors={["#00E676", "#00C853", "#4CAF50"]}
              style={styles.buyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <View style={styles.buyButtonContent}>
                    <Ionicons name="lock-closed" size={20} color="#fff" />
                    <Text style={styles.buyButtonText}>
                      Pagar ${amount} MXN
                    </Text>
                    <Ionicons name="flash" size={18} color="#fff" />
                  </View>
                  <Text style={styles.buyButtonSubtext}>
                    Pago seguro • Entrega instantánea
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer de seguridad */}
        <View style={styles.footer}>
          <View style={styles.securitySection}>
            <View style={styles.securityBadges}>
              <View style={styles.securityBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <Text style={styles.securityText}>SSL Seguro</Text>
              </View>
              <View style={styles.securityBadge}>
                <Ionicons name="card" size={16} color="#2196F3" />
                <Text style={styles.securityText}>Stripe</Text>
              </View>
              <View style={styles.securityBadge}>
                <Ionicons name="time" size={16} color="#FF9800" />
                <Text style={styles.securityText}>Instantáneo</Text>
              </View>
            </View>
            
            <Text style={styles.footerNotice}>
              Tus pagos están protegidos con encriptación bancaria de grado militar
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

export default BuyCreditsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  headerBadgeText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerIcon: {
    padding: 8,
    backgroundColor: "rgba(255,215,0,0.1)",
    borderRadius: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    color: "#4FC3F7",
    fontSize: 14,
    fontWeight: "700",
  },
  infoText: {
    color: "#B0B0C0",
    fontSize: 14,
    lineHeight: 20,
  },
  amountSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  amountDisplay: {
    backgroundColor: "rgba(255,215,0,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  amountDisplayText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amountCard: {
    width: "48%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  amountCardActive: {
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    transform: [{ scale: 1.02 }],
  },
  amountCardGradient: {
    padding: 16,
    alignItems: "center",
  },
  amountCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  amountCardPopular: {
    color: "#FFD700",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  amountCardPopularActive: {
    color: "#000",
  },
  amountCardValue: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  amountCardValueActive: {
    color: "#000",
  },
  amountCardLabel: {
    color: "#B0B0C0",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  amountCardLabelActive: {
    color: "#000",
    fontWeight: "800",
  },
  paymentSection: {
    marginBottom: 24,
  },
  buyButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  buyButtonDisabled: {
    opacity: 0.7,
  },
  buyButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  buyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buyButtonSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    marginTop: "auto",
    marginBottom: 30,
  },
  securitySection: {
    alignItems: "center",
  },
  securityBadges: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  securityText: {
    color: "#8888A0",
    fontSize: 10,
    fontWeight: "600",
  },
  footerNotice: {
    fontSize: 11,
    color: "#666680",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 16,
  },
});