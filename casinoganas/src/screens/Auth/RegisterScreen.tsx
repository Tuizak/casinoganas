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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Input } from "../../components/ui/Input";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get("window");

const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Partículas flotantes
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(Math.random() * 0.5),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
    }))
  ).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotación continua del fondo
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Efecto de brillo pulsante
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animar partículas
    particles.forEach((particle, i) => {
      const animateParticle = () => {
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -100,
            duration: 10000 + Math.random() * 5000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.8,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          particle.y.setValue(height + 100);
          particle.x.setValue(Math.random() * width);
          animateParticle();
        });
      };
      setTimeout(() => animateParticle(), i * 500);
    });
  }, []);

  const handleRegister = async () => {
    if (!email || !password) return Alert.alert("Error", "Llena todos los campos");
    if (password !== confirm) return Alert.alert("Error", "Las contraseñas no coinciden");

    try {
      await register(email, password);
      Alert.alert("¡Éxito!", "Cuenta creada correctamente");
    } catch (error: any) {
      Alert.alert("Error al registrarse", error.message);
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Fondo animado con gradiente giratorio */}
        <Animated.View
          style={[
            styles.backgroundGradient,
            { transform: [{ rotate }] },
          ]}
        >
          <LinearGradient
            colors={["#8B00FF", "#FF4500", "#FFD700", "#8B00FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        {/* Partículas flotantes */}
        {particles.map((particle, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        ))}

        {/* Overlay oscuro con blur */}
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />

        <KeyboardAvoidingView style={styles.content} behavior="padding">
          {/* Botón de regreso con animación */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <BlurView intensity={20} tint="dark" style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={24} color="#8B00FF" />
              </BlurView>
            </TouchableOpacity>
          </Animated.View>

          {/* Contenido principal animado */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Logo/Icono con brillo */}
            <Animated.View style={[styles.logoContainer, { opacity: glowOpacity }]}>
              <LinearGradient
                colors={["#8B00FF", "#FF4500"]}
                style={styles.logoGradient}
              >
                <Ionicons name="sparkles" size={60} color="#fff" />
              </LinearGradient>
            </Animated.View>

            {/* Título con efecto de brillo */}
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete al casino VIP</Text>

            {/* Formulario con glassmorphism */}
            <BlurView intensity={40} tint="dark" style={styles.formBlur}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#8B00FF" style={styles.inputIcon} />
                <Input
                  placeholder="Correo electrónico"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#888"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#8B00FF" style={styles.inputIcon} />
                <Input
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#888"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#8B00FF" style={styles.inputIcon} />
                <Input
                  placeholder="Confirmar contraseña"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  placeholderTextColor="#888"
                  style={styles.input}
                />
              </View>

              <TouchableOpacity onPress={handleRegister} activeOpacity={0.9}>
                <LinearGradient
                  colors={["#8B00FF", "#FF4500"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Crear Cuenta</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>
                  ¿Ya tienes cuenta?{" "}
                  <Text style={styles.loginTextBold}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </BlurView>

            {/* Beneficios */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Ionicons name="gift" size={20} color="#FFD700" />
                <Text style={styles.benefitText}>Bono de Bienvenida</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark" size={20} color="#8B00FF" />
                <Text style={styles.benefitText}>100% Seguro</Text>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default RegisterScreen;

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
    backgroundColor: "#8B00FF",
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
    borderColor: "rgba(139, 0, 255, 0.3)",
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
    shadowColor: "#8B00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#8B00FF",
    marginBottom: 8,
    textShadowColor: "rgba(139, 0, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#FF4500",
    marginBottom: 32,
    opacity: 0.8,
  },
  formBlur: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139, 0, 255, 0.2)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 64,
    borderWidth: 1,
    borderColor: "rgba(139, 0, 255, 0.1)",
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
    shadowColor: "#8B00FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  loginButton: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "#aaa",
    fontSize: 14,
  },
  loginTextBold: {
    color: "#8B00FF",
    fontWeight: "bold",
  },
  benefitsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 32,
    width: "100%",
    gap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 0, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 0, 255, 0.3)",
    flex: 1,
    justifyContent: "center",
  },
  benefitText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 8,
    fontWeight: "600",
  },
});