// src/Apis/stripeClient.ts

// Datos de tu proyecto Supabase
const SUPABASE_URL = "https://yexepnlfawbmxoyigakx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleGVwbmxmYXdibXhveWlnYWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzQzNjQsImV4cCI6MjA3NjcxMDM2NH0.yxRPp5oSiNY-NBAnRlRUHsrmPmtfNK8QdpifOkLdZwY";

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/**
 * Crear PaymentIntent en Stripe vía Edge Function
 * @param amount monto en pesos (lo convertimos a centavos)
 */
export async function createPaymentIntent(amount: number) {
  // amount viene en pesos/monedas → centavos
  const cents = Math.round(amount * 100);

  const res = await fetch(`${FUNCTIONS_URL}/create-payment-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",

      // 👇 estos dos headers son IMPORTANTES
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      amount: cents,
      currency: "mxn",
    }),
  });

  const text = await res.text();
  console.log("↩️ Respuesta edge function:", text);

  if (!res.ok) {
    // aquí ya tienes el texto real del error en consola
    throw new Error("No se pudo crear el PaymentIntent");
  }

  const data = JSON.parse(text);

  if (!data.clientSecret) {
    throw new Error("La función no regresó clientSecret");
  }

  return data.clientSecret as string;
}
