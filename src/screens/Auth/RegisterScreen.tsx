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

const { width, height } = Dimensions.get("window");

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

/* ---------- Premium RegisterScreen ---------- */
const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Animaciones premium
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current; // Más bajo para iPhone 11
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const borderGlowAnim = useRef(new Animated.Value(0)).current;
  const titleShakeAnim = useRef(new Animated.Value(0)).current;

  // Ref para animaciones de entrada de inputs
  const inputRefs = useRef([
    useRef(new Animated.Value(0)).current,
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
        duration: 600, 
        useNativeDriver: true 
      }),
      Animated.timing(inputRefs[1], { 
        toValue: 1, 
        duration: 600, 
        useNativeDriver: true 
      }),
      Animated.timing(inputRefs[2], { 
        toValue: 1, 
        duration: 600, 
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
        Animated.timing(titleShakeAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(titleShakeAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleRegister = async () => {
    const { email, password, confirm } = formData;
    
    if (!email || !password || !confirm) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }
    
    if (password !== confirm) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password);
      Alert.alert("🎉 ¡Éxito!", "Cuenta creada correctamente");
    } catch (error: any) {
      Alert.alert("Error al registrarse", error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        {/* Fondo premium con gradientes sutiles */}
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
            color={i % 4 === 0 ? "#8B00FF" : i % 4 === 1 ? "#FF4500" : i % 4 === 2 ? "#00D4FF" : "#FFD700"}
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

          {/* Contenido principal premium - POSICIÓN MÁS BAJA */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Logo premium ESTÁTICO y GRANDE - MÁS PEQUEÑO PARA IPHONE 11 */}
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
              <Text style={styles.welcomeText}>Crear Cuenta VIP</Text>
              <Text style={styles.subtitle}>Únete a la experiencia premium</Text>
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

                {/* Campos con animaciones de entrada espectaculares */}
                {[
                  { 
                    icon: "mail-outline", 
                    placeholder: "Correo electrónico", 
                    field: "email", 
                    keyboardType: "email-address" 
                  },
                  { 
                    icon: "lock-closed-outline", 
                    placeholder: "Contraseña", 
                    field: "password", 
                    secure: true 
                  },
                  { 
                    icon: "checkmark-circle-outline", 
                    placeholder: "Confirmar contraseña", 
                    field: "confirm", 
                    secure: true 
                  },
                ].map(({ icon, placeholder, field, keyboardType, secure }, index) => (
                  <Animated.View 
                    key={field}
                    style={[
                      styles.inputWrapper,
                      { 
                        opacity: inputRefs[index],
                        transform: [{ 
                          translateX: inputRefs[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [index % 2 === 0 ? -50 : 50, 0]
                          }) 
                        }] 
                      }
                    ]}
                  >
                    <Ionicons name={icon} size={22} color="#FFD700" style={styles.inputIcon} />
                    <Input 
                      placeholder={placeholder}
                      value={formData[field]}
                      onChangeText={(value) => updateField(field, value)}
                      placeholderTextColor="#666"
                      style={styles.input}
                      keyboardType={keyboardType}
                      secureTextEntry={secure}
                      autoCapitalize="none"
                    />
                  </Animated.View>
                ))}

                {/* Botón de Registro premium con animación */}
                <Animated.View style={[
                  styles.buttonContainer,
                  { opacity: fadeAnim }
                ]}>
                  <TouchableOpacity 
                    onPress={handleRegister} 
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={["#FFD700", "#FFA500", "#FF8C00"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.registerButton}
                    >
                      <Animated.View style={[styles.buttonGlow, { opacity: glowOpacity }]} />
                      <Text style={styles.registerButtonText}>
                        {isLoading ? "Creando Cuenta..." : "Crear Cuenta"}
                      </Text>
                      <Ionicons name="checkmark-circle" size={22} color="#0a0a0a" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Enlace a login con animación */}
                <Animated.View style={{ opacity: fadeAnim }}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate("Login")} 
                    style={styles.loginLink}
                  >
                    <Text style={styles.loginText}>
                      ¿Ya tienes cuenta? <Text style={styles.loginHighlight}>Inicia sesión</Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </BlurView>
            </View>

            {/* Separador decorativo premium - IGUAL QUE LOGIN */}
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

export default RegisterScreen;

/* ---------- Estilos Premium - IDÉNTICOS AL LOGIN ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  ambientGlow: {
    position: "absolute",
    top: "15%", // Más bajo para iPhone 11
    left: "10%",
    right: "10%",
    height: width * 0.7, // Más pequeño
    backgroundColor: "rgba(255, 215, 0, 0.03)",
    borderRadius: width * 0.35,
  },
  animatedBorder: {
    position: "absolute",
    top: -width * 0.6, // Ajustado para no interferir
    left: -width * 0.6,
    width: width * 2.2,
    height: width * 2.2,
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
    paddingTop: 20, // Espacio extra para notch
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 50 : 40, // Más bajo para iPhone 11
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
    marginTop: -20, // Compensa la posición más baja
  },
  logoContainer: {
    marginBottom: 30, // Menos espacio para bajar todo
  },
  logoBackground: {
    width: 150, // Más pequeño para iPhone 11
    height: 150,
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
  },
  logoGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 75,
  },
  logoPulse: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 85,
    opacity: 0.3,
  },
  logoImageContainer: {
    width: 120, // Más pequeño
    height: 120,
    borderRadius: 60,
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
    marginBottom: 35, // Menos espacio
  },
  welcomeText: {
    fontSize: 30, // Un poco más pequeño
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(255, 215, 0, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#CCCCCC",
    textAlign: "center",
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  formWrapper: {
    width: "100%",
    borderRadius: 24,
    position: "relative",
    marginBottom: 25, // Menos espacio
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
    padding: 26, // Un poco menos de padding
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
    marginBottom: 18, // Menos espacio entre inputs
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
    paddingVertical: 16, // Menos padding vertical
    minHeight: 54,
  },
  buttonContainer: {
    marginTop: 10, // Menos espacio
  },
  registerButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18, // Un poco menos
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
  registerButtonText: {
    color: "#0a0a0a",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 12,
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "#999",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  loginHighlight: {
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