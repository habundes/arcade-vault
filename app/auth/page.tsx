"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";

function friendlyAuthError(message: string): string {
  if (/email not confirmed/i.test(message)) {
    return "Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Usuario o contraseña incorrectos.";
  }
  if (/user already registered/i.test(message)) {
    return "Ya existe una cuenta con ese correo.";
  }
  return message;
}

export default function AuthPage() {
  const router = useRouter();
  const { signInWithPassword, signUp, signInWithOAuth } = useAuth();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (tab === "up") {
        await signUp(email, pass, user || "PLAYER1");
      } else {
        await signInWithPassword(email, pass);
      }
      router.push("/games");
    } catch (err) {
      setError(friendlyAuthError((err as Error).message));
    } finally {
      setPending(false);
    }
  };

  const playAsGuest = () => {
    router.push("/games");
  };

  const oauth = async (provider: "google" | "github") => {
    setError(null);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(friendlyAuthError((err as Error).message));
    }
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.16em", marginTop: 6 }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === "in" ? "on" : ""}
            onClick={() => {
              setTab("in");
              setError(null);
            }}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "up" ? "on" : ""}
            onClick={() => {
              setTab("up");
              setError(null);
            }}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={submit}>
          {tab === "up" && (
            <div className="field slide-in">
              <label>Usuario</label>
              <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="px_kai" />
            </div>
          )}
          <div className="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@vault.gg"
              required
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="mono" style={{ color: "var(--magenta)", fontSize: 12, marginTop: 8 }}>
              {error}
            </div>
          )}

          <button
            className="btn lg"
            type="submit"
            disabled={pending}
            style={{ width: "100%", marginTop: 8 }}
          >
            {pending ? "…" : tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
          </button>
        </form>

        <button className="btn ghost" style={{ width: "100%", marginTop: 10 }} onClick={playAsGuest}>
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button" onClick={() => oauth("google")}>
            ◆ GOOGLE
          </button>
          <button className="btn ghost" type="button" onClick={() => oauth("github")}>
            ▣ GITHUB
          </button>
        </div>

        <div
          style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.1em" }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
