"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  createEngine,
  H,
  W,
  type AsteroidsSnapshot,
  type Engine,
  type Keys,
} from "./engine";

const CAPTURED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);

export type AsteroidsCanvasHandle = {
  reset: () => void;
  forceGameOver: () => void;
};

type AsteroidsCanvasProps = {
  paused?: boolean;
  onSnapshot?: (snapshot: AsteroidsSnapshot) => void;
};

export const AsteroidsCanvas = forwardRef<
  AsteroidsCanvasHandle,
  AsteroidsCanvasProps
>(function AsteroidsCanvas({ paused = false, onSnapshot }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const pausedRef = useRef(paused);
  const onSnapshotRef = useRef(onSnapshot);

  pausedRef.current = paused;
  onSnapshotRef.current = onSnapshot;

  useImperativeHandle(ref, () => ({
    reset: () => engineRef.current?.initGame(),
    forceGameOver: () => engineRef.current?.forceGameOver(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const engine = createEngine();
    engineRef.current = engine;

    const keys: Keys = {};
    const justPressed: Keys = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
      if (!keys[e.code]) justPressed[e.code] = true;
      keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
      keys[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let frameId: number;
    let lastTime: number | null = null;

    const loop = (ts: number) => {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      if (!pausedRef.current) {
        engine.update(dt, keys, justPressed);
      }
      engine.draw(ctx);
      onSnapshotRef.current?.(engine.getSnapshot());
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      engineRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
});
