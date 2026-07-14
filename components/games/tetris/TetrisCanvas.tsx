"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createEngine, type Engine } from "./engine";
import {
  TouchDPad,
  type DPadDirection,
} from "@/components/games/shared/TouchDPad";
import { TouchActionButton } from "@/components/games/shared/TouchActionButton";

export type TetrisSnapshot = {
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
};

export type TetrisCanvasHandle = {
  forceGameOver: () => void;
};

type TetrisCanvasProps = {
  paused: boolean;
  resetKey: number;
  onSnapshot: (s: TetrisSnapshot) => void;
  onGameOver?: () => void;
};

export const TetrisCanvas = forwardRef<TetrisCanvasHandle, TetrisCanvasProps>(
  function TetrisCanvas({ paused, resetKey, onSnapshot, onGameOver }, ref) {
    const boardRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Engine | null>(null);
    const pausedRef = useRef(paused);
    const onSnapshotRef = useRef(onSnapshot);
    const onGameOverRef = useRef(onGameOver);
    const gameOverFiredRef = useRef(false);
    const [isGameOver, setIsGameOver] = useState(false);

    pausedRef.current = paused;
    onSnapshotRef.current = onSnapshot;
    onGameOverRef.current = onGameOver;

    useImperativeHandle(ref, () => ({
      forceGameOver: () => {
        if (engineRef.current) engineRef.current.forceGameOver();
      },
    }));

    // main mount — create engine and RAF loop
    useEffect(() => {
      const board = boardRef.current;
      const preview = previewRef.current;
      const ctx = board?.getContext("2d");
      const nCtx = preview?.getContext("2d");
      if (!board || !preview || !ctx || !nCtx) return;

      const engine = createEngine();
      engineRef.current = engine;
      gameOverFiredRef.current = false;

      let frameId: number;
      let lastTime: number | null = null;

      const loop = (ts: number) => {
        const dt = lastTime === null ? 0 : ts - lastTime;
        lastTime = ts;

        if (!pausedRef.current) {
          engine.tick(dt);
          engine.drawBoard(ctx);
          engine.drawNext(nCtx, preview);

          const { score, lines, level, gameOver } = engine.state;
          onSnapshotRef.current({ score, lines, level, gameOver });

          if (gameOver && !gameOverFiredRef.current) {
            gameOverFiredRef.current = true;
            setIsGameOver(true);
            onGameOverRef.current?.();
          }
        }

        frameId = requestAnimationFrame(loop);
      };

      frameId = requestAnimationFrame(loop);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space") e.preventDefault();
        if (pausedRef.current || engine.state.gameOver) return;
        switch (e.code) {
          case "ArrowLeft":
            engine.moveLeft();
            break;
          case "ArrowRight":
            engine.moveRight();
            break;
          case "ArrowDown":
            engine.softDrop();
            break;
          case "ArrowUp":
          case "KeyX":
            engine.tryRotate();
            break;
          case "Space":
            engine.hardDrop();
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("keydown", handleKeyDown);
        engineRef.current = null;
      };
    }, []);

    // resetKey — reinitialise engine
    useEffect(() => {
      if (!engineRef.current) return;
      engineRef.current.initGame();
      gameOverFiredRef.current = false;
      setIsGameOver(false);
    }, [resetKey]);

    const handleDirection = (dir: DPadDirection) => {
      const engine = engineRef.current;
      if (!engine || pausedRef.current || engine.state.gameOver) return;
      switch (dir) {
        case "LEFT":
          engine.moveLeft();
          break;
        case "RIGHT":
          engine.moveRight();
          break;
        case "DOWN":
          engine.softDrop();
          break;
        case "UP":
          engine.tryRotate();
          break;
      }
    };

    const handleDrop = () => {
      const engine = engineRef.current;
      if (!engine || pausedRef.current || engine.state.gameOver) return;
      engine.hardDrop();
    };

    return (
      <>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <canvas
            ref={boardRef}
            width={300}
            height={600}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "var(--ink-dim)",
                textTransform: "uppercase",
              }}
            >
              Siguiente
            </div>
            <canvas
              ref={previewRef}
              width={120}
              height={120}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>
        <div className="touch-controls">
          <TouchDPad
            onDirection={handleDirection}
            disabled={paused || isGameOver}
          />
          <TouchActionButton
            label="DROP"
            onPress={handleDrop}
            disabled={paused || isGameOver}
          />
        </div>
      </>
    );
  },
);
