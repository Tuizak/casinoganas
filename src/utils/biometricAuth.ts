import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export const BIOMETRIC_EMAIL_KEY = "biometric_email";
export const BIOMETRIC_PASSWORD_KEY = "biometric_password";

export const saveCredentials = async (email: string, password: string) => {
  await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
  await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
};

export const getCredentials = async () => {
  const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
  const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
  return { email, password };
};

export const hasBiometricAuth = async () => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
};

export const authenticateBiometric = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Inicia sesión con Face ID / Huella",
    fallbackLabel: "Usar contraseña",
    cancelLabel: "Cancelar",
  });
  return result.success;
};
