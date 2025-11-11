import React, { createContext, useContext, useState, useEffect } from "react";
import {
  supabase,
  signIn,
  signUp,
  signOut,
  getUserProfile,
} from "../Apis/supabase";
import { User } from "../types/user";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// 👇 Contexto
const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);
export { AuthContext }; // Mantén esto

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Actualiza datos del usuario
  const refreshUser = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.warn("Error obteniendo sesión:", error);

      const sessionUser = data?.session?.user;
      if (sessionUser) {
        const profile = await getUserProfile(sessionUser.id).catch(() => null);
        setUser(profile || { id: sessionUser.id, email: sessionUser.email });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    }
  };

  // ✅ Iniciar sesión
  const login = async (email: string, password: string) => {
    const { data, error } = await signIn(email, password);
    if (error) throw error;
    await refreshUser();
  };

  // ✅ Registrar cuenta nueva
  const register = async (email: string, password: string) => {
    const { data, error } = await signUp(email, password);
    if (error) throw error;

    // ⚠️ Si Supabase no devuelve sesión (modo con verificación de email)
    if (!data.session) {
      alert("📩 Revisa tu correo para confirmar la cuenta.");
    }

    await refreshUser();
  };

  // ✅ Cerrar sesión
  const logout = async () => {
    await signOut();
    setUser(null);
  };

  // ✅ Detectar automáticamente cambios en la sesión (registro, login, logout)
  useEffect(() => {
    const init = async () => {
      await refreshUser();
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await refreshUser();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, register, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook personalizado
export const useAuth = () => useContext(AuthContext);
