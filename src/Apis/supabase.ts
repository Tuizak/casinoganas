import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yexepnlfawbmxoyigakx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleGVwbmxmYXdibXhveWlnYWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzQzNjQsImV4cCI6MjA3NjcxMDM2NH0.yxRPp5oSiNY-NBAnRlRUHsrmPmtfNK8QdpifOkLdZwY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* -------------------- HELPERS -------------------- */

const generateAccountNumber = () => {
  const min = 10000000;
  const max = 99999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

/* -------------------- AUTH -------------------- */

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const user = data?.user;
  if (!user) return data;

  try {
    // Verificar si ya existe perfil
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    // Si no existe, crear perfil inicial
    if (!existing) {
      await supabase.from("profiles").insert([
        {
          id: user.id,
          balance: 1000,
          total_winnings: 0,
          total_games_played: 0,
          biggest_win: 0,
          account_number: generateAccountNumber(),
        },
      ]);
    }
  } catch (err: any) {
    console.warn("⚠️ Error creando perfil:", err.message);
  }

  return data;
};

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();

/* -------------------- PROFILE -------------------- */

export const getUserProfile = async (id: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getProfileByAccountNumber = async (accountNumber: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, balance, account_number")
    .eq("account_number", accountNumber)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (
  id: string,
  updates: { username?: string; avatar_url?: string }
) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

/* -------------------- BALANCE Y JUEGOS -------------------- */

// ✅ Arreglado para crear perfil si no existe
export const getUserBalance = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "balance, total_winnings, total_games_played, biggest_win, account_number"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    // Si no existe perfil, crearlo automáticamente
    if (!data) {
      const defaultProfile = {
        id: userId,
        balance: 1000,
        total_winnings: 0,
        total_games_played: 0,
        biggest_win: 0,
        account_number: generateAccountNumber(),
      };
      const { error: insertError } = await supabase
        .from("profiles")
        .insert([defaultProfile]);
      if (insertError) throw insertError;
      return defaultProfile;
    }

    return data;
  } catch (e) {
    console.error("Error cargando balance:", e);
    throw e;
  }
};

export const updateUserBalance = async (
  userId: string,
  newBalance: number,
  betAmount: number,
  winAmount: number = 0,
  gameResult?: any
) => {
  try {
    const { data: currentData } = await supabase
      .from("profiles")
      .select("total_winnings, total_games_played, biggest_win")
      .eq("id", userId)
      .maybeSingle();

    const newTotalWinnings = (currentData?.total_winnings || 0) + winAmount;
    const newGamesPlayed = (currentData?.total_games_played || 0) + 1;
    const newBiggestWin = Math.max(currentData?.biggest_win || 0, winAmount);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        balance: newBalance,
        total_winnings: newTotalWinnings,
        total_games_played: newGamesPlayed,
        biggest_win: newBiggestWin,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    const { error: historyError } = await supabase.from("game_history").insert({
      user_id: userId,
      game_type: "slot_machine",
      bet_amount: betAmount,
      win_amount: winAmount,
      balance_after: newBalance,
      result: gameResult,
    });

    if (historyError) throw historyError;

    return { balance: newBalance };
  } catch (error) {
    console.error("Error updating balance:", error);
    throw error;
  }
};

export const getGameHistory = async (userId: string, limit: number = 20) => {
  const { data, error } = await supabase
    .from("game_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

export const addCredits = async (userId: string, amount: number) => {
  try {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .maybeSingle();

    const newBalance = (currentProfile?.balance || 0) + amount;

    const { error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (error) throw error;
    return { balance: newBalance };
  } catch (error) {
    console.error("Error adding credits:", error);
    throw error;
  }
};

export const getUserStats = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const { data: gamesByType } = await supabase
      .from("game_history")
      .select("game_type, win_amount")
      .eq("user_id", userId);

    const { data: recentGames } = await supabase
      .from("game_history")
      .select("win_amount")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    let currentStreak = 0;
    for (const game of recentGames || []) {
      if (game.win_amount > 0) currentStreak++;
      else break;
    }

    return {
      ...profile,
      currentStreak,
      totalGames: gamesByType?.length || 0,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
};

export const updateBalance = async (userId: string, newBalance: number) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (error) throw error;
    return { balance: newBalance };
  } catch (error) {
    console.error("Error updating balance:", error);
    throw error;
  }
};

/* -------------------- TRANSFERENCIAS -------------------- */

export const transferCredits = async (
  fromUserId: string,
  toAccountNumber: string,
  amount: number
) => {
  if (amount <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  // Perfil remitente
  const { data: fromProfile, error: fromError } = await supabase
    .from("profiles")
    .select("id, balance")
    .eq("id", fromUserId)
    .maybeSingle();

  if (fromError) throw fromError;
  if (!fromProfile) throw new Error("Perfil del remitente no encontrado");

  // Perfil receptor por número de cuenta
  const { data: toProfile, error: toError } = await supabase
    .from("profiles")
    .select("id, balance")
    .eq("account_number", toAccountNumber)
    .maybeSingle();

  if (toError) throw toError;
  if (!toProfile) throw new Error("No se encontró usuario con ese número de cuenta");
  if (toProfile.id === fromUserId) {
    throw new Error("No puedes enviarte créditos a ti mismo");
  }

  const fromBalance = fromProfile.balance || 0;
  const toBalance = toProfile.balance || 0;

  if (fromBalance < amount) {
    throw new Error("Saldo insuficiente");
  }

  // Actualizar saldos
  const { error: updateFromError } = await supabase
    .from("profiles")
    .update({ balance: fromBalance - amount })
    .eq("id", fromUserId);

  if (updateFromError) throw updateFromError;

  const { error: updateToError } = await supabase
    .from("profiles")
    .update({ balance: toBalance + amount })
    .eq("id", toProfile.id);

  if (updateToError) throw updateToError;

  // Historial de transferencia (si existe la tabla credit_transfers)
  try {
    await supabase.from("credit_transfers").insert([
      {
        from_user_id: fromUserId,
        to_user_id: toProfile.id,
        amount,
      },
    ]);
  } catch (e) {
    console.warn("No se pudo guardar historial de transferencia:", e);
  }

  return {
    fromBalance: fromBalance - amount,
    toBalance: toBalance + amount,
    toUserId: toProfile.id,
  };
};
