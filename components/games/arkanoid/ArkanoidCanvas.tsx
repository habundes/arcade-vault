"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  createEngine,
  CANVAS_W,
  CANVAS_H,
  type ArkanoidSnapshot,
} from "./engine";

export type { ArkanoidSnapshot };

export type ArkanoidCanvasHandle = {
  forceGameOver: () => void;
};

type ArkanoidCanvasProps = {
  paused: boolean;
  resetKey: number;
  onSnapshot: (s: ArkanoidSnapshot) => void;
  onGameOver?: () => void;
};

export const ArkanoidCanvas = forwardRef<
  ArkanoidCanvasHandle,
  ArkanoidCanvasProps
>(function ArkanoidCanvas({ paused, resetKey, onSnapshot, onGameOver }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
  const pausedRef = useRef(paused);
  const onSnapshotRef = useRef(onSnapshot);
  const onGameOverRef = useRef(onGameOver);
  const gameOverFiredRef = useRef(false);

  pausedRef.current = paused;
  onSnapshotRef.current = onSnapshot;
  onGameOverRef.current = onGameOver;

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
  }));

  // Main mount — create engine, load spritesheet, start RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const engine = createEngine();
    engineRef.current = engine;
    gameOverFiredRef.current = false;

    engine.initPaddle();

    let frameId: number;
    let lastTime: number | null = null;

    engine.loadSpritesheet("/games/arkanoid/spritesheet-breakout.png", () => {
      engine.loadLevel(1);

      const loop = (ts: number) => {
        const dt =
          lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
        lastTime = ts;

        if (!pausedRef.current) engine.update(dt);
        engine.draw(ctx);

        const snap = engine.getSnapshot();
        onSnapshotRef.current(snap);

        if (snap.gameOver && !gameOverFiredRef.current) {
          gameOverFiredRef.current = true;
          onGameOverRef.current?.();
        }

        frameId = requestAnimationFrame(loop);
      };

      frameId = requestAnimationFrame(loop);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
      engine.setKeyDown(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engine.setKeyUp(e.key);
    };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      engine.setMouseX(mouseX);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      engineRef.current = null;
    };
  }, []);

  // resetKey — reinitialise engine without remounting
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.reset();
    gameOverFiredRef.current = false;
  }, [resetKey]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
});
