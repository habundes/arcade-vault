// Ruta temporal de verificación — borrable tras confirmar la integración
import { createClient } from "@/lib/supabase/server";

export default async function HealthSupabasePage() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return <p>❌ ERROR — {error.message}</p>;
  }

  return <p>✅ CONEXIÓN OK — {session ? "sesión activa" : "sin sesión"}</p>;
}
