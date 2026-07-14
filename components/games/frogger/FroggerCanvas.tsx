"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  createEngine,
  CANVAS_W,
  CANVAS_H,
  type FroggerSnapshot,
  type Skin,
} from "./engine";

export type { FroggerSnapshot, Skin };

export type FroggerHandle = {
  reset: () => void;
  forceGameOver: () => void;
};

type FroggerCanvasProps = {
  paused: boolean;
  skin?: Skin;
  onSnapshot: (s: FroggerSnapshot) => void;
};

const FroggerCanvas = forwardRef<FroggerHandle, FroggerCanvasProps>(
  function FroggerCanvas({ paused, skin = "clasico", onSnapshot }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
    const rafRef = useRef<number>(0);
    const lastTsRef = useRef<number>(0);
    const pausedRef = useRef(paused);
    const onSnapshotRef = useRef(onSnapshot);
    const skinRef = useRef(skin);

    // Sync props to refs every render so the RAF loop always reads current values
    pausedRef.current = paused;
    onSnapshotRef.current = onSnapshot;
    skinRef.current = skin;

    useImperativeHandle(ref, () => ({
      reset: () => engineRef.current?.initGame(),
      forceGameOver: () => engineRef.current?.forceGameOver(),
    }));

    useEffect(() => {
      engineRef.current?.setSkin(skin ?? "clasico");
    }, [skin]);

    // Single RAF loop — mount only
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const engine = createEngine(skinRef.current);
      engineRef.current = engine;
      engine.initGame();

      const tick = (ts: number) => {
        const dt = Math.min(ts - lastTsRef.current, 50);
        lastTsRef.current = ts;
        if (!pausedRef.current) engine.update(dt);
        engine.draw(ctx);
        onSnapshotRef.current(engine.getSnapshot());
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        )
          return;
        e.preventDefault();
        if (pausedRef.current) return;
        const dirMap: Record<string, "UP" | "DOWN" | "LEFT" | "RIGHT"> = {
          ArrowUp: "UP",
          ArrowDown: "DOWN",
          ArrowLeft: "LEFT",
          ArrowRight: "RIGHT",
        };
        engineRef.current?.moveFrog(dirMap[e.key]);
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener("keydown", handleKeyDown);
        engineRef.current = null;
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
      />
    );
  },
);

FroggerCanvas.displayName = "FroggerCanvas";
export default FroggerCanvas;
