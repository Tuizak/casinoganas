import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

/* ---------- Secure keys ---------- */
const BIOMETRIC_EMAIL_KEY = "biometric_email";
const BIOMETRIC_PASSWORD_KEY = "biometric_password";

/* ---------- Helpers SecureStore ---------- */
const saveCredentials = async (email: string, password: string) => {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
    await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } catch (e) {
    console.warn("Error guardando credenciales:", e);
  }
};

const getCredentials = async () => {
  try {
    const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
    return { email, password };
  } catch (e) {
    console.warn("Error leyendo credenciales:", e);
    return { email: null, password: null };
  }
};

/* ---------- Biometric checks ---------- */
const hasBiometricHardwareAndEnrolled = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (e) {
    return false;
  }
};

/* ---------- Authenticate flow ---------- */
const authenticatePreferBiometricFirst = async () => {
  try {
    const strictResult = await LocalAuthentication.authenticateAsync({
      promptMessage: "Usa Face ID / Huella",
      fallbackLabel: "",
      disableDeviceFallback: true,
      cancelLabel: "Cancelar",
    });

    if (strictResult.success) return true;

    const fallbackResult = await LocalAuthentication.authenticateAsync({
      promptMessage: "Usa Face ID / Huella (o usar PIN)",
      fallbackLabel: "Usar PIN",
      disableDeviceFallback: false,
      cancelLabel: "Cancelar",
    });

    return !!fallbackResult.success;
  } catch (e) {
    try {
      const fallbackResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Usa Face ID / Huella (o usar PIN)",
        fallbackLabel: "Usar PIN",
        disableDeviceFallback: false,
        cancelLabel: "Cancelar",
      });
      return !!fallbackResult.success;
    } catch (err) {
      console.warn("authenticate error:", err);
      return false;
    }
  }
};

/* ---------- Floating Particle Component ---------- */
const FloatingParticle = ({ delay, size = 3, color = "#FFD700" }: { delay: number; size?: number; color?: string }) => {
  const translateY = useRef(new Animated.Value(height + 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startX = Math.random() * width;
    translateX.setValue(startX);
    
    const startAnimation = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -200,
          duration: 8000 + Math.random() * 7000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX + (Math.random() - 0.5) * 100,
          duration: 8000 + Math.random() * 7000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 0.8, useNativeDriver: true }),
        ]),
      ]).start(() => {
        translateY.setValue(height + 100);
        opacity.setValue(0);
        scale.setValue(0);
        setTimeout(startAnimation, Math.random() * 2000);
      });
    };

    setTimeout(startAnimation, delay);
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          backgroundColor: color,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    />
  );
};

/* ---------- Animated Border Component ---------- */
const AnimatedBorder = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View style={[styles.animatedBorder, { transform: [{ rotate }, { scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FFD700', '#FF8C00', '#FFD700']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

/* ---------- Premium LoginScreen ---------- */
const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [autoTriedBiometric, setAutoTriedBiometric] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animaciones premium
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const borderGlowAnim = useRef(new Animated.Value(0)).current;
  const titleShakeAnim = useRef(new Animated.Value(0)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  // Ref para animaciones de entrada
  const inputRefs = useRef([
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current
  ]).current;

  useEffect(() => {
    // Animaciones de entrada mejoradas con secuencia
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 1500, 
          useNativeDriver: true 
        }),
        Animated.spring(slideAnim, { 
          toValue: 0, 
          tension: 70, 
          friction: 8, 
          useNativeDriver: true 
        }),
        Animated.spring(scaleAnim, { 
          toValue: 1, 
          tension: 70, 
          friction: 8, 
          useNativeDriver: true 
        }),
      ]),
      Animated.timing(inputRefs[0], { 
        toValue: 1, 
        duration: 800, 
        useNativeDriver: true 
      }),
      Animated.timing(inputRefs[1], { 
        toValue: 1, 
        duration: 800, 
        useNativeDriver: true 
      }),
    ]).start();

    // Animación de brillo constante mejorada
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { 
          toValue: 1, 
          duration: 3000, 
          useNativeDriver: true 
        }),
        Animated.timing(glowAnim, { 
          toValue: 0.3, 
          duration: 3000, 
          useNativeDriver: true 
        }),
      ])
    ).start();

    // Animación de borde luminoso
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(borderGlowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de shake sutil en el título
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleShakeAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(titleShakeAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Comprobar biometría
    const bootBiometric = async () => {
      const available = await hasBiometricHardwareAndEnrolled();
      setCanUseBiometric(available);

      if (available && !autoTriedBiometric) {
        setAutoTriedBiometric(true);
        const creds = await getCredentials();
        if (creds.email && creds.password) {
          const ok = await authenticatePreferBiometricFirst();
          if (ok) {
            try {
              await login(creds.email, creds.password);
              Alert.alert("✅ Éxito", "Has iniciado sesión con Face ID / Huella");
            } catch (err: any) {
              console.warn("Login after biometric failed:", err);
              Alert.alert("Error", "No se pudo iniciar sesión con las credenciales guardadas.");
            }
          }
        }
      }
    };

    bootBiometric();
  }, []);

  /* ---------- Handlers ---------- */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password);
      await saveCredentials(email, password);
      Alert.alert("🎉 Éxito", "Bienvenido a CasinoGanas");
    } catch (error: any) {
      Alert.alert("Error al iniciar sesión", error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricButton = async () => {
    try {
      const available = await hasBiometricHardwareAndEnrolled();
      if (!available) {
        Alert.alert("No disponible", "Tu dispositivo no tiene biometría configurada.");
        return;
      }

      const ok = await authenticatePreferBiometricFirst();
      if (!ok) return;

      const creds = await getCredentials();
      if (creds.email && creds.password) {
        try {
          await login(creds.email, creds.password);
          Alert.alert("✅ Éxito", "Inicio de sesión con Face ID / Huella");
        } catch (err: any) {
          Alert.alert("Error", "No se pudo iniciar sesión con las credenciales guardadas.");
        }
      } else {
        Alert.alert("Aviso", "Primero inicia sesión manualmente para guardar tus datos.");
      }
    } catch (e) {
      console.warn("handleBiometricButton error:", e);
      Alert.alert("Error", "Ocurrió un problema con la autenticación biométrica.");
    }
  };

  // Interpolaciones para animaciones
  const glowOpacity = glowAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [0.3, 0.8] 
  });
  
  const borderGlowOpacity = borderGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.4]
  });

  const titleScale = titleShakeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.02, 1]
  });

  const titleTranslateY = titleShakeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2]
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Fondo premium con gradientes animados */}
        <LinearGradient
          colors={["#0a0a0a", "#1a1a2e", "#0a0a0a"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Efectos de luz ambiental animados */}
        <Animated.View style={[styles.ambientGlow, { opacity: glowOpacity }]} />
        
        {/* Animated border giratorio */}
        <AnimatedBorder />

        {/* Partículas premium con más variedad */}
        {Array.from({ length: 20 }).map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 300}
            size={Math.random() * 6 + 2}
            color={i % 5 === 0 ? "#8B00FF" : i % 5 === 1 ? "#FF4500" : i % 5 === 2 ? "#00D4FF" : i % 5 === 3 ? "#FF1493" : "#FFD700"}
          />
        ))}

        {/* Overlay con blur premium */}
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />

        <KeyboardAvoidingView 
          style={styles.content} 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header premium */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton} 
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["rgba(255, 215, 0, 0.2)", "rgba(255, 165, 0, 0.1)"]}
                style={styles.backButtonGradient}
              >
                <Ionicons name="chevron-back" size={24} color="#FFD700" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Contenido principal premium */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Logo premium ESTÁTICO y GRANDE */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["rgba(255, 215, 0, 0.15)", "rgba(255, 165, 0, 0.08)"]}
                style={styles.logoBackground}
              >
                <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
                <View style={styles.logoImageContainer}>
                  <Image 
                    source={require("../../../assets/casinoganas.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </LinearGradient>
              {/* Efecto de destello alrededor del logo */}
              <Animated.View style={[styles.logoPulse, { opacity: glowOpacity }]} />
            </View>

            {/* Títulos premium con animación sutil */}
            <Animated.View style={[
              styles.headerText,
              { 
                transform: [
                  { scale: titleScale },
                  { translateY: titleTranslateY }
                ] 
              }
            ]}>
              <Text style={styles.welcomeText}>Bienvenido a CasinoGanas 🎰</Text>
              <Text style={styles.subtitle}>Inicia sesión para ganar en grande</Text>
            </Animated.View>

            {/* Formulario glassmorphism premium */}
            <View style={styles.formWrapper}>
              <Animated.View 
                style={[
                  styles.formBorderGlow,
                  { opacity: borderGlowOpacity }
                ]} 
              />
              
              <BlurView intensity={25} tint="dark" style={styles.formGlass}>
                <LinearGradient
                  colors={["rgba(255, 215, 0, 0.1)", "transparent"]}
                  style={styles.formInnerGlow}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />

                {/* Campo Email con animación de entrada */}
                <Animated.View style={[
                  styles.inputWrapper,
                  { opacity: inputRefs[0], transform: [{ translateX: inputRefs[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0]
                  }) }] }
                ]}>
                  <Ionicons name="mail-outline" size={22} color="#FFD700" style={styles.inputIcon} />
                  <Input 
                    placeholder="Correo electrónico" 
                    value={email} 
                    onChangeText={setEmail} 
                    placeholderTextColor="#666"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Animated.View>

                {/* Campo Contraseña con animación de entrada */}
                <Animated.View style={[
                  styles.inputWrapper,
                  { opacity: inputRefs[1], transform: [{ translateX: inputRefs[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  }) }] }
                ]}>
                  <Ionicons name="lock-closed-outline" size={22} color="#FFD700" style={styles.inputIcon} />
                  <Input 
                    placeholder="Contraseña" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </Animated.View>

                {/* Botón de Login premium con animación */}
                <Animated.View style={[
                  styles.buttonContainer,
                  { opacity: fadeAnim }
                ]}>
                  <TouchableOpacity 
                    onPress={handleLogin} 
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={["#FFD700", "#FFA500", "#FF8C00"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginButton}
                    >
                      <Animated.View style={[styles.buttonGlow, { opacity: glowOpacity }]} />
                      <Text style={styles.loginButtonText}>
                        {isLoading ? "Iniciando Sesión..." : "Iniciar Sesión"}
                      </Text>
                      <Ionicons name="arrow-forward" size={22} color="#0a0a0a" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Botón biométrico premium */}
                {canUseBiometric && (
                  <Animated.View style={{ opacity: fadeAnim }}>
                    <TouchableOpacity 
                      onPress={handleBiometricButton} 
                      style={styles.biometricButton}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["rgba(255, 215, 0, 0.1)", "rgba(255, 165, 0, 0.05)"]}
                        style={styles.biometricGradient}
                      >
                        <Ionicons name="finger-print" size={28} color="#FFD700" />
                        <Text style={styles.biometricText}>Usar Face ID / Huella</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {/* Enlace a registro con animación */}
                <Animated.View style={{ opacity: fadeAnim }}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate("Register")} 
                    style={styles.registerLink}
                  >
                    <Text style={styles.registerText}>
                      ¿No tienes cuenta? <Text style={styles.registerHighlight}>Regístrate</Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </BlurView>
            </View>

            {/* Separador decorativo premium con animación */}
            <Animated.View style={[styles.decorativeSection, { opacity: fadeAnim }]}>
              <View style={styles.decorativeLine} />
              <Ionicons name="diamond" size={16} color="#FFD700" />
              <Text style={styles.decorativeText}>EXPERIENCIA VIP</Text>
              <Ionicons name="diamond" size={16} color="#FFD700" />
              <View style={styles.decorativeLine} />
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;

/* ---------- Estilos Premium ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  ambientGlow: {
    position: "absolute",
    top: "20%",
    left: "10%",
    right: "10%",
    height: width * 0.8,
    backgroundColor: "rgba(255, 215, 0, 0.03)",
    borderRadius: width * 0.4,
  },
  animatedBorder: {
    position: "absolute",
    top: -width * 0.5,
    left: -width * 0.5,
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    opacity: 0.1,
  },
  particle: {
    position: "absolute",
    borderRadius: 50,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
  },
  logoContainer: {
    marginBottom: 40,
    position: "relative",
  },
  logoBackground: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logoGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 90,
  },
  logoPulse: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 100,
    opacity: 0.3,
  },
  logoImageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  headerText: {
    alignItems: "center",
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(255, 215, 0, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  formWrapper: {
    width: "100%",
    borderRadius: 24,
    position: "relative",
    marginBottom: 32,
  },
  formBorderGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 24,
    zIndex: -1,
  },
  formGlass: {
    width: "100%",
    borderRadius: 24,
    padding: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)",
    position: "relative",
  },
  formInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.1)",
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 18,
    minHeight: 58,
  },
  buttonContainer: {
    marginTop: 12,
  },
  loginButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  loginButtonText: {
    color: "#0a0a0a",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 12,
    letterSpacing: 0.5,
  },
  biometricButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  biometricGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  biometricText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  registerLink: {
    marginTop: 24,
    alignItems: "center",
  },
  registerText: {
    color: "#999",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  registerHighlight: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  decorativeSection: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  decorativeLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
  },
  decorativeText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "bold",
    marginHorizontal: 16,
    letterSpacing: 2,
  },
});