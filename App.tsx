// App.tsx
import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import { AppNavigator } from "./src/navigation";
import { AuthProvider } from "./src/context/AuthContext";

export default function App() {
  return (
    <StripeProvider
      publishableKey="pk_test_51SW1VMHIeCS1hc8wmIpcjzD8XCvvf100gFAZDjgDmM4NjAul1bCByQfHuGx6vLiT99593272YASJbIciD8HsZACT00cX3uIzVA"   // 👈 SOLO la pk_test_..., sin espacios
    >
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </StripeProvider>
  );
}
