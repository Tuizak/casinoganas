// src/screens/Credits/SendCredit.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import {
  getUserBalance,
  getProfileByAccountNumber,
  transferCredits,
} from "../../Apis/supabase";

const { width, height } = Dimensions.get("window");

const SendCredit: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [myBalance, setMyBalance] = useState<number>(0);
  const [myAccountNumber, setMyAccountNumber] = useState<string | null>(null);

  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [receiverName, setReceiverName] = useState<string | null>(null);

  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);

  // Animaciones
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  const balanceAnim = React.useRef(new Animated.Value(1)).current;

  // Cargar saldo y numero de cuenta del usuario
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        setLoadingBalance(true);
        const data = await getUserBalance(user.id);
        setMyBalance(data.balance || 0);
        if (data.account_number) {
          setMyAccountNumber(data.account_number);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingBalance(false);
      }
    };

    loadData();
  }, [user]);

  // Animaciones de entrada
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

    // Animación de brillo continua
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animateBalance = () => {
    Animated.sequence([
      Animated.timing(balanceAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(balanceAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSearchAccount = async () => {
    if (!accountNumber.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa un número de cuenta.");
      return;
    }

    try {
      setLoadingSearch(true);
      Keyboard.dismiss();
      const profile = await getProfileByAccountNumber(accountNumber.trim());
      if (!profile) {
        setReceiverName(null);
        Alert.alert("Cuenta no encontrada", "Verifica el número e intenta nuevamente.");
        return;
      }
      setReceiverName(profile.username || `Cuenta ${profile.account_number}`);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", "No se pudo verificar la cuenta. Intenta más tarde.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSend = async () => {
    if (!user) return;

    const numericAmount = Number(amount);
    if (!accountNumber.trim() || !numericAmount || numericAmount <= 0) {
      Alert.alert("Datos incompletos", "Completa todos los campos para continuar.");
      return;
    }

    if (numericAmount > myBalance) {
      Alert.alert("Saldo insuficiente", "No tienes suficiente saldo para esta transferencia.");
      return;
    }

    if (!receiverName) {
      Alert.alert("Verifica la cuenta", "Primero busca y verifica la cuenta destino.");
      return;
    }

    try {
      setLoadingSend(true);
      Keyboard.dismiss();
      const result = await transferCredits(
        user.id,
        accountNumber.trim(),
        numericAmount
      );

      setMyBalance(result.fromBalance);
      setAmount("");
      setAccountNumber("");
      setReceiverName(null);
      animateBalance();

      Alert.alert(
        "Transferencia exitosa", 
        `Has enviado ${numericAmount} créditos correctamente.`,
        [{ text: "Aceptar" }]
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", "No se pudo completar la transferencia.");
    } finally {
      setLoadingSend(false);
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={["#0F0F23", "#1A1A2E", "#16213E"]}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header - Ley de Jerarquía */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#6366F1" />
            </TouchableOpacity>
            <Text style={styles.title}>Transferir</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Balance Card - Ley de Visibilidad */}
          <Animated.View 
            style={[
              styles.balanceCard,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: balanceAnim }] 
              }
            ]}
          >
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIcon}>
                <Ionicons name="wallet-outline" size={24} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                {loadingBalance ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : (
                  <Text style={styles.balanceAmount}>${myBalance.toFixed(2)}</Text>
                )}
              </View>
            </View>
            
            {myAccountNumber && (
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Tu cuenta: {myAccountNumber}</Text>
              </View>
            )}
          </Animated.View>

          {/* Form Section - Ley de Proximidad */}
          <Animated.View 
            style={[
              styles.formSection,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            {/* Account Input - Ley de Feedback */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número de cuenta destino</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.textInput}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Ingresa el número de cuenta"
                  placeholderTextColor="#6B7280"
                  keyboardType="number-pad"
                  returnKeyType="search"
                  onSubmitEditing={handleSearchAccount}
                />
                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    loadingSearch && styles.buttonDisabled
                  ]}
                  onPress={handleSearchAccount}
                  disabled={loadingSearch}
                >
                  {loadingSearch ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="search" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>

              {receiverName && (
                <Animated.View 
                  style={[
                    styles.receiverInfo,
                    { opacity: glowOpacity }
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.receiverText}>{receiverName}</Text>
                </Animated.View>
              )}
            </View>

            {/* Amount Input - Ley de Consistencia */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monto a transferir</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>

              {/* Quick Amounts - Ley de Accesibilidad */}
              <View style={styles.quickAmounts}>
                {[50, 100, 200, 500].map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={styles.quickAmount}
                    onPress={() => setAmount(quickAmount.toString())}
                  >
                    <Text style={styles.quickAmountText}>${quickAmount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Send Button - Ley de Affordance */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (loadingSend || !receiverName || !amount) && styles.buttonDisabled
              ]}
              onPress={handleSend}
              disabled={loadingSend || !receiverName || !amount}
            >
              {loadingSend ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={20} color="#FFF" />
                  <Text style={styles.sendButtonText}>Transferir ahora</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Security Info - Ley de Confianza */}
            <View style={styles.securityInfo}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
              <Text style={styles.securityText}>Transferencia segura y en tiempo real</Text>
            </View>
          </Animated.View>

          {/* Help Text - Ley de Prevención de Errores */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>¿Primera vez transfiriendo?</Text>
            <Text style={styles.helpText}>
              • Verifica siempre el número de cuenta{'\n'}
              • Confirma el nombre del destinatario{'\n'}
              • Las transferencias son instantáneas
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerPlaceholder: {
    width: 40,
  },
  balanceCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  accountInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  accountLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  formSection: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: "#E5E7EB",
    fontWeight: "600",
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginRight: 12,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  receiverInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  receiverText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
    marginLeft: 8,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    color: "#9CA3AF",
    fontWeight: "600",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    paddingVertical: 14,
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  quickAmount: {
    flex: 1,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  quickAmountText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "600",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 16,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  helpSection: {
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.1)",
  },
  helpTitle: {
    fontSize: 16,
    color: "#E5E7EB",
    fontWeight: "600",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
  },
});

export default SendCredit;