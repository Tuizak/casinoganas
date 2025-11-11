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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { theme } from "../../constants/theme";
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

/* ---------- Authenticate flow:
    1) Intenta BIOMETRÍA STRICT (disableDeviceFallback: true) -> muestra solo FaceID/Huella
    2) Si falla o se cancela, intentar nuevamente permitiendo fallback a PIN (disableDeviceFallback: false)
    Esto logra que el PIN sea sólo un segundo recurso. ---------- */
const authenticatePreferBiometricFirst = async () => {
  try {
    // 1) Intentar SOLO biometría (sin fallback)
    const strictResult = await LocalAuthentication.authenticateAsync({
      promptMessage: "Usa Face ID / Huella",
      fallbackLabel: "", // minimizar opciones
      disableDeviceFallback: true, // fuerza a biometría (evita PIN)
      cancelLabel: "Cancelar",
    });

    if (strictResult.success) return true;

    // 2) Si no tuvo éxito (usuario canceló o biometría no coincidió), intentar con fallback (PIN)
    const fallbackResult = await LocalAuthentication.authenticateAsync({
      promptMessage: "Usa Face ID / Huella (o usar PIN)",
      fallbackLabel: "Usar PIN",
      disableDeviceFallback: false, // permite fallback a PIN si biometría falla
      cancelLabel: "Cancelar",
    });

    return !!fallbackResult.success;
  } catch (e) {
    // Algunos dispositivos/SDKs pueden lanzar en la primera llamada; intentar fallback seguro
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

/* ---------- LoginScreen (diseño intacto) ---------- */
const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [autoTriedBiometric, setAutoTriedBiometric] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(Math.random() * 0.5),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
    }))
  ).current;

  useEffect(() => {
    // Animaciones iniciales
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 20000, useNativeDriver: true })).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Partículas
    particles.forEach((particle, i) => {
      const animateParticle = () => {
        Animated.parallel([
          Animated.timing(particle.y, { toValue: -100, duration: 10000 + Math.random() * 5000, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(particle.opacity, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
            Animated.timing(particle.opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
        ]).start(() => {
          particle.y.setValue(height + 100);
          particle.x.setValue(Math.random() * width);
          animateParticle();
        });
      };
      setTimeout(() => animateParticle(), i * 500);
    });

    // Comprobar biometría disponible y, si hay credenciales guardadas, intentar autenticación automática
    const bootBiometric = async () => {
      const available = await hasBiometricHardwareAndEnrolled();
      setCanUseBiometric(available);

      // Evitar repetir el intento automático en re-renders
      if (available && !autoTriedBiometric) {
        setAutoTriedBiometric(true);
        const creds = await getCredentials();
        if (creds.email && creds.password) {
          // Intentamos autenticar prefiriendo biometría; si pasa, usamos las credenciales guardadas
          const ok = await authenticatePreferBiometricFirst();
          if (ok) {
            try {
              await login(creds.email, creds.password);
              Alert.alert("Éxito", "Has iniciado sesión con Face ID / Huella");
            } catch (err: any) {
              console.warn("Login after biometric failed:", err);
              Alert.alert("Error", "No se pudo iniciar sesión con las credenciales guardadas.");
            }
          } // si no ok, no hacemos nada (usuario verá pantalla normal)
        }
      }
    };

    bootBiometric();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Handlers ---------- */
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Llena todos los campos");
    try {
      await login(email, password);
      // Guardar credenciales seguro para futuros logins biométricos
      await saveCredentials(email, password);
      Alert.alert("Éxito", "Sesión iniciada correctamente");
    } catch (error: any) {
      Alert.alert("Error al iniciar sesión", error.message || String(error));
    }
  };

  const handleBiometricButton = async () => {
    try {
      const available = await hasBiometricHardwareAndEnrolled();
      if (!available) {
        return Alert.alert("No disponible", "Tu dispositivo no tiene biometría o no está configurada.");
      }

      // Intentar preferentemente biometría (no PIN). Si falla, se solicitará PIN en la segunda llamada.
      const ok = await authenticatePreferBiometricFirst();
      if (!ok) {
        return; // usuario canceló o no autenticó
      }

      const creds = await getCredentials();
      if (creds.email && creds.password) {
        try {
          await login(creds.email, creds.password);
          Alert.alert("Éxito", "Inicio de sesión con Face ID / Huella");
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

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Fondo animado con gradiente giratorio */}
        <Animated.View style={[styles.backgroundGradient, { transform: [{ rotate }] }]}>
          <LinearGradient colors={["#FFD700", "#FF4500", "#8B00FF", "#FFD700"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        </Animated.View>

        {/* Partículas flotantes */}
        {particles.map((particle, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                transform: [{ translateX: particle.x }, { translateY: particle.y }, { scale: particle.scale }],
                opacity: particle.opacity,
              },
            ]}
          />
        ))}

        {/* Overlay oscuro con blur */}
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />

        <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {/* Botón de regreso con animación */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
              <BlurView intensity={20} tint="dark" style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={24} color="#FFD700" />
              </BlurView>
            </TouchableOpacity>
          </Animated.View>

          {/* Contenido principal animado */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Logo/Icono con brillo */}
            <Animated.View style={[styles.logoContainer, { opacity: glowOpacity }]}>
              <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.logoGradient}>
                <Ionicons name="diamond" size={60} color="#0b0b0b" />
              </LinearGradient>
            </Animated.View>

            {/* Título con efecto de brillo */}
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>Accede a tu cuenta VIP</Text>

            {/* Formulario con glassmorphism */}
            <BlurView intensity={40} tint="dark" style={styles.formBlur}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#FFD700" style={styles.inputIcon} />
                <Input placeholder="Correo electrónico" value={email} onChangeText={setEmail} placeholderTextColor="#888" style={styles.input} />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#FFD700" style={styles.inputIcon} />
                <Input placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#888" style={styles.input} />
              </View>

              <TouchableOpacity onPress={handleLogin} activeOpacity={0.9}>
                <LinearGradient colors={["#FFD700", "#FFA500"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
                  <Text style={styles.buttonText}>Entrar</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0b0b0b" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Botón biométrico (aparece si hay hardware y biometría configurada) */}
              {canUseBiometric && (
                <TouchableOpacity onPress={handleBiometricButton} style={{ marginTop: 16, alignItems: "center" }}>
                  <Ionicons name="finger-print-outline" size={32} color="#FFD700" />
                  <Text style={{ color: "#FFD700", marginTop: 8 }}>Usar Face ID / Huella</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.registerButton}>
                <Text style={styles.registerText}>
                  ¿No tienes cuenta? <Text style={styles.registerTextBold}>Regístrate</Text>
                </Text>
              </TouchableOpacity>
            </BlurView>

            {/* Indicadores decorativos */}
            <View style={styles.decorativeContainer}>
              <View style={styles.decorativeLine} />
              <Text style={styles.decorativeText}>CASINO VIP</Text>
              <View style={styles.decorativeLine} />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;

/* ---------- Tus estilos originales (intactos) ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },
  backgroundGradient: {
    position: "absolute",
    width: width * 2,
    height: height * 2,
    left: -width / 2,
    top: -height / 2,
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFD700",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  formContainer: {
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFA500",
    marginBottom: 32,
    opacity: 0.8,
  },
  formBlur: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.1)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 18,
    minHeight: 56,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: "#0b0b0b",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  registerButton: {
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#aaa",
    fontSize: 14,
  },
  registerTextBold: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  decorativeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    width: "100%",
  },
  decorativeLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 215, 0, 0.3)",
  },
  decorativeText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    marginHorizontal: 16,
    letterSpacing: 2,
  },
});
