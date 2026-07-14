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
import {
  DEFAULT_SKIN,
  type AsteroidsSnapshot,
  type Skin,
} from "@/components/games/asteroids/engine";
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
import {
  SnakeCanvas,
  type SnakeCanvasHandle,
  type SnakeSnapshot,
} from "@/components/games/snake/SnakeCanvas";
import FroggerCanvas, {
  type FroggerHandle,
  type FroggerSnapshot,
} from "@/components/games/frogger/FroggerCanvas";
import { TouchDPad } from "@/components/games/shared/TouchDPad";
import { TouchActionButton } from "@/components/games/shared/TouchActionButton";

const SKIN_LABELS: Record<Skin, string> = {
  clasico: "CLÁSICO",
  neon: "NEON",
  retro: "RETRO",
};

export default function GamePlayer({ game }: { game: GameRow }) {
  const { user } = useAuth();
  const isAsteroids = game.id === "asteroides";
  const isTetris = game.id === "tetris";
  const isArkanoid = game.id === "arkanoid";
  const isSnake = game.id === "snake";
  const isFrogger = game.id === "frogger";

  const asteroidsRef = useRef<AsteroidsCanvasHandle>(null);
  const tetrisRef = useRef<TetrisCanvasHandle>(null);
  const arkanoidRef = useRef<ArkanoidCanvasHandle>(null);
  const snakeRef = useRef<SnakeCanvasHandle>(null);
  const froggerRef = useRef<FroggerHandle>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [engineLevel, setEngineLevel] = useState(1);
  const [tetrisLines, setTetrisLines] = useState(0);
  const [tetrisResetKey, setTetrisResetKey] = useState(0);
  const [arkanoidResetKey, setArkanoidResetKey] = useState(0);
  const [snakeResetKey, setSnakeResetKey] = useState(0);
  const [froggerTimeLeft, setFroggerTimeLeft] = useState(30);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ? user.name : "INVITADO");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const skinStorageKey = `av-skin-${game.id}`;
  const [skin, setSkin] = useState<Skin>(() => {
    if (typeof window === "undefined") return DEFAULT_SKIN;
    const stored = window.localStorage.getItem(skinStorageKey);
    return stored === "clasico" || stored === "neon" || stored === "retro"
      ? stored
      : DEFAULT_SKIN;
  });

  const handleSkinChange = (next: Skin) => {
    setSkin(next);
    localStorage.setItem(skinStorageKey, next);
  };

  const level =
    isAsteroids || isTetris || isArkanoid || isSnake || isFrogger
      ? engineLevel
      : Math.floor(score / 2500) + 1;

  // fake score timer — skipped for engine-driven games
  useEffect(() => {
    if (
      isAsteroids ||
      isTetris ||
      isArkanoid ||
      isSnake ||
      isFrogger ||
      over ||
      paused
    )
      return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [isAsteroids, isTetris, isArkanoid, isSnake, isFrogger, over, paused]);

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

  const handleSnakeSnapshot = useCallback((s: SnakeSnapshot) => {
    setScore(s.score);
    setLives(s.lives);
    setEngineLevel(s.level);
    if (s.gameOver) setOver(true);
  }, []);

  const handleFroggerSnapshot = useCallback((s: FroggerSnapshot) => {
    setScore(s.score);
    setLives(s.lives);
    setEngineLevel(s.level);
    setFroggerTimeLeft(s.timeLeft);
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
    } else if (isSnake) {
      snakeRef.current?.forceGameOver();
    } else if (isFrogger) {
      froggerRef.current?.forceGameOver();
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
    } else if (isSnake) {
      setSnakeResetKey((k) => k + 1);
      setEngineLevel(1);
    } else if (isFrogger) {
      froggerRef.current?.reset();
      setFroggerTimeLeft(30);
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
          {isFrogger && (
            <div className="hud-stat">
              <div className="l">Tiempo</div>
              <div
                className="v"
                style={{
                  color: froggerTimeLeft <= 10 ? "var(--magenta)" : undefined,
                }}
              >
                {froggerTimeLeft}s
              </div>
            </div>
          )}
        </div>
        <div className="hud-actions">
          {(isAsteroids || isFrogger) && (
            <select
              className="skin-select"
              value={skin}
              onChange={(e) => handleSkinChange(e.target.value as Skin)}
              aria-label="Skin del juego"
            >
              {(Object.keys(SKIN_LABELS) as Skin[]).map((s) => (
                <option key={s} value={s}>
                  {SKIN_LABELS[s]}
                </option>
              ))}
            </select>
          )}
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
                skin={skin}
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
          ) : isSnake ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                height: "100%",
                aspectRatio: "1/1",
              }}
            >
              <SnakeCanvas
                ref={snakeRef}
                paused={paused}
                resetKey={snakeResetKey}
                onSnapshot={handleSnakeSnapshot}
                onGameOver={() => setOver(true)}
              />
            </div>
          ) : isFrogger ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                height: "100%",
                aspectRatio: "3/4",
              }}
            >
              <FroggerCanvas
                ref={froggerRef}
                paused={paused}
                skin={skin}
                onSnapshot={handleFroggerSnapshot}
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

      {isSnake && (
        <TouchDPad
          onDirection={(dir) => snakeRef.current?.queueDirection(dir)}
          disabled={paused || over}
        />
      )}

      {isTetris && (
        <div className="touch-controls">
          <TouchDPad
            onDirection={(dir) => tetrisRef.current?.handleDirection(dir)}
            disabled={paused || over}
          />
          <TouchActionButton
            label="DROP"
            onPress={() => tetrisRef.current?.handleDrop()}
            disabled={paused || over}
          />
        </div>
      )}

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
