"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { insertScore, type GameRow } from "@/lib/supabase/queries";
import {
  AsteroidsCanvas,
  type AsteroidsCanvasHandle,
} from "@/components/games/asteroids/AsteroidsCanvas";
import type { AsteroidsSnapshot } from "@/components/games/asteroids/engine";
import {
  TetrisCanvas,
  type TetrisCanvasHandle,
  type TetrisSnapshot,
} from "@/components/games/tetris/TetrisCanvas";
import {
  ArkanoidCanvas,
  type ArkanoidCanvasHandle,
  type ArkanoidSnapshot,
} from "@/components/games/arkanoid/ArkanoidCanvas";

export default function GamePlayer({ game }: { game: GameRow }) {
  const { user } = useAuth();
  const isAsteroids = game.id === "asteroides";
  const isTetris = game.id === "tetris";
  const isArkanoid = game.id === "arkanoid";

  const asteroidsRef = useRef<AsteroidsCanvasHandle>(null);
  const tetrisRef = useRef<TetrisCanvasHandle>(null);
  const arkanoidRef = useRef<ArkanoidCanvasHandle>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [engineLevel, setEngineLevel] = useState(1);
  const [tetrisLines, setTetrisLines] = useState(0);
  const [tetrisResetKey, setTetrisResetKey] = useState(0);
  const [arkanoidResetKey, setArkanoidResetKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ? user.name : "INVITADO");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const level =
    isAsteroids || isTetris || isArkanoid
      ? engineLevel
      : Math.floor(score / 2500) + 1;

  // fake score timer — skipped for engine-driven games
  useEffect(() => {
    if (isAsteroids || isTetris || isArkanoid || over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [isAsteroids, isTetris, over, paused]);

  const handleAsteroidsSnapshot = useCallback((s: AsteroidsSnapshot) => {
    setScore(s.score);
    setLives(s.lives);
    setEngineLevel(s.level);
    setOver(s.gameOver);
  }, []);

  const handleTetrisSnapshot = useCallback((s: TetrisSnapshot) => {
    setScore(s.score);
    setTetrisLines(s.lines);
    setEngineLevel(s.level);
    if (s.gameOver) setOver(true);
  }, []);

  const handleArkanoidSnapshot = useCallback((s: ArkanoidSnapshot) => {
    setScore(s.score);
    setLives(s.lives);
    setEngineLevel(s.level);
    if (s.gameOver) setOver(true);
  }, []);

  const endGame = () => {
    if (isAsteroids) {
      asteroidsRef.current?.forceGameOver();
    } else if (isTetris) {
      tetrisRef.current?.forceGameOver();
      setOver(true);
    } else if (isArkanoid) {
      arkanoidRef.current?.forceGameOver();
    } else {
      setOver(true);
    }
  };

  const restart = () => {
    if (isAsteroids) {
      asteroidsRef.current?.reset();
    } else if (isTetris) {
      setTetrisResetKey((k) => k + 1);
      setTetrisLines(0);
      setEngineLevel(1);
    } else if (isArkanoid) {
      setArkanoidResetKey((k) => k + 1);
      setEngineLevel(1);
    }
    setScore(0);
    setLives(3);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      await insertScore(supabase, game.id, name, score);
      setSaved(true);
    } catch {
      setSaveError("No se pudo guardar la puntuación. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          {isTetris ? (
            <div className="hud-stat">
              <div className="l">Líneas</div>
              <div className="v">{tetrisLines}</div>
            </div>
          ) : (
            <div className="hud-stat lives">
              <div className="l">Vidas</div>
              <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
            </div>
          )}
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <Link href={`/juego/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {isAsteroids ? (
            <div className="asteroids-arena">
              <AsteroidsCanvas
                ref={asteroidsRef}
                paused={paused}
                onSnapshot={handleAsteroidsSnapshot}
              />
            </div>
          ) : isTetris ? (
            <div
              className="asteroids-arena"
              style={{ aspectRatio: "unset", padding: "12px 8px" }}
            >
              <TetrisCanvas
                ref={tetrisRef}
                paused={paused}
                resetKey={tetrisResetKey}
                onSnapshot={handleTetrisSnapshot}
              />
            </div>
          ) : isArkanoid ? (
            <div
              style={{ aspectRatio: "4/3", width: "100%", margin: "0 auto" }}
            >
              <ArkanoidCanvas
                ref={arkanoidRef}
                paused={paused}
                resetKey={arkanoidResetKey}
                onSnapshot={handleArkanoidSnapshot}
                onGameOver={() => setOver(true)}
              />
            </div>
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button
                  className="btn yellow"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "GUARDANDO…" : "GUARDAR PUNTUACIÓN"}
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            {saveError && (
              <div
                className="mono"
                style={{ color: "var(--magenta)", fontSize: 11, marginTop: 8 }}
              >
                {saveError}
              </div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
