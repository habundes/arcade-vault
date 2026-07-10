"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  createEngine,
  CANVAS_SIZE,
  CELL_SIZE,
  FRUIT_SPRITES,
  type SnakeSnapshot,
} from "./engine";

export type { SnakeSnapshot };

export type SnakeCanvasHandle = {
  forceGameOver: () => void;
};

type SnakeCanvasProps = {
  paused: boolean;
  resetKey: number;
  onSnapshot: (s: SnakeSnapshot) => void;
  onGameOver?: () => void;
};

// ── Drawing ───────────────────────────────────────────────────────────────────

const GRID_COLOR = "#1a2a1a";
const GRID_LINE_COLOR = "#1e2e1e";
const BODY_COLOR = "#22c55e";
const HEAD_COLOR = "#16a34a";
const HEAD_EYE_COLOR = "#ffffff";

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = GRID_COLOR;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = 0.5;
  const grid = CANVAS_SIZE / CELL_SIZE;
  for (let i = 0; i <= grid; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, CANVAS_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(CANVAS_SIZE, pos);
    ctx.stroke();
  }
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: { x: number; y: number }[],
): void {
  const radius = CELL_SIZE / 4;

  for (let i = 1; i < snake.length; i++) {
    const cell = snake[i];
    ctx.fillStyle = BODY_COLOR;
    ctx.beginPath();
    ctx.roundRect(
      cell.x * CELL_SIZE + 1,
      cell.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2,
      radius,
    );
    ctx.fill();
  }

  if (snake.length === 0) return;
  const head = snake[0];
  ctx.fillStyle = HEAD_COLOR;
  ctx.beginPath();
  ctx.roundRect(
    head.x * CELL_SIZE + 1,
    head.y * CELL_SIZE + 1,
    CELL_SIZE - 2,
    CELL_SIZE - 2,
    radius,
  );
  ctx.fill();

  // Eyes
  const eyeSize = 3;
  ctx.fillStyle = HEAD_EYE_COLOR;
  ctx.fillRect(
    head.x * CELL_SIZE + 4,
    head.y * CELL_SIZE + 4,
    eyeSize,
    eyeSize,
  );
  ctx.fillRect(
    head.x * CELL_SIZE + CELL_SIZE - 4 - eyeSize,
    head.y * CELL_SIZE + 4,
    eyeSize,
    eyeSize,
  );
}

function drawFruit(
  ctx: CanvasRenderingContext2D,
  fruit: { cell: { x: number; y: number }; key: string },
  img: HTMLImageElement,
): void {
  const sp = FRUIT_SPRITES[fruit.key as keyof typeof FRUIT_SPRITES];
  if (!sp) return;
  const padding = 1;
  ctx.drawImage(
    img,
    sp.x,
    sp.y,
    sp.w,
    sp.h,
    fruit.cell.x * CELL_SIZE + padding,
    fruit.cell.y * CELL_SIZE + padding,
    CELL_SIZE - padding * 2,
    CELL_SIZE - padding * 2,
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SnakeCanvas = forwardRef<SnakeCanvasHandle, SnakeCanvasProps>(
  function SnakeCanvas({ paused, resetKey, onSnapshot, onGameOver }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
    const frameIdRef = useRef<number>(0);
    const pausedRef = useRef(paused);
    const onSnapshotRef = useRef(onSnapshot);
    const onGameOverRef = useRef(onGameOver);
    const gameOverFiredRef = useRef(false);
    const imgRef = useRef<HTMLImageElement | null>(null);

    pausedRef.current = paused;
    onSnapshotRef.current = onSnapshot;
    onGameOverRef.current = onGameOver;

    useImperativeHandle(ref, () => ({
      forceGameOver: () => engineRef.current?.forceGameOver(),
    }));

    // Mount: create engine, load image, start RAF
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const engine = createEngine();
      engineRef.current = engine;
      gameOverFiredRef.current = false;

      let accumulated = 0;
      let lastTs: number | null = null;

      const loop = (ts: number) => {
        const dt = lastTs === null ? 0 : ts - lastTs;
        lastTs = ts;

        accumulated += dt;
        const { tickMs } = engine.getState();

        while (accumulated >= tickMs) {
          engine.tick();
          accumulated -= tickMs;
        }

        const state = engine.getState();
        drawGrid(ctx);
        drawSnake(ctx, state.snake);
        if (imgRef.current) {
          drawFruit(ctx, state.fruit, imgRef.current);
        }

        const snap = engine.snapshot();
        onSnapshotRef.current(snap);

        if (snap.gameOver && !gameOverFiredRef.current) {
          gameOverFiredRef.current = true;
          onGameOverRef.current?.();
        }

        frameIdRef.current = requestAnimationFrame(loop);
      };

      const img = new Image();
      img.src = "/games/snake/fruits.png";
      img.onload = () => {
        imgRef.current = img;
        frameIdRef.current = requestAnimationFrame(loop);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "W":
            e.preventDefault();
            engine.setDirection("UP");
            break;
          case "ArrowDown":
          case "s":
          case "S":
            e.preventDefault();
            engine.setDirection("DOWN");
            break;
          case "ArrowLeft":
          case "a":
          case "A":
            e.preventDefault();
            engine.setDirection("LEFT");
            break;
          case "ArrowRight":
          case "d":
          case "D":
            e.preventDefault();
            engine.setDirection("RIGHT");
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        cancelAnimationFrame(frameIdRef.current);
        window.removeEventListener("keydown", handleKeyDown);
        engineRef.current = null;
        imgRef.current = null;
      };
    }, []);

    // Pausa: cancela RAF cuando paused=true, lo reinicia cuando paused=false
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !engineRef.current) return;

      if (paused) {
        cancelAnimationFrame(frameIdRef.current);
        return;
      }

      // Reiniciar RAF
      let accumulated = 0;
      let lastTs: number | null = null;

      const loop = (ts: number) => {
        const dt = lastTs === null ? 0 : ts - lastTs;
        lastTs = ts;

        accumulated += dt;
        const { tickMs } = engineRef.current!.getState();

        while (accumulated >= tickMs) {
          engineRef.current!.tick();
          accumulated -= tickMs;
        }

        const state = engineRef.current!.getState();
        drawGrid(ctx);
        drawSnake(ctx, state.snake);
        if (imgRef.current) {
          drawFruit(ctx, state.fruit, imgRef.current);
        }

        const snap = engineRef.current!.snapshot();
        onSnapshotRef.current(snap);

        if (snap.gameOver && !gameOverFiredRef.current) {
          gameOverFiredRef.current = true;
          onGameOverRef.current?.();
        }

        frameIdRef.current = requestAnimationFrame(loop);
      };

      frameIdRef.current = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(frameIdRef.current);
      };
    }, [paused]);

    // resetKey: reinicia motor y limpia estado
    useEffect(() => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.reset();
      gameOverFiredRef.current = false;
    }, [resetKey]);

    return (
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    );
  },
);
