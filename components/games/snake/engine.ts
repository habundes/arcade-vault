// Motor del juego Snake — sin variables globales de módulo.
// Todo el estado vive dentro de la instancia devuelta por createEngine().

// ── Constants ────────────────────────────────────────────────────────────────

export const CANVAS_SIZE = 800;
export const CELL_SIZE = 20;
export const GRID = CANVAS_SIZE / CELL_SIZE; // 40

const INITIAL_LIVES = 3;
const POINTS_PER_FRUIT = 10;
const LEVEL_EVERY_PTS = 50;
const BASE_TICK_MS = 300;
const MIN_TICK_MS = 80;
const TICK_DECREMENT = 20;

// ── Types ────────────────────────────────────────────────────────────────────

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type Cell = { x: number; y: number };

export type FruitKey =
  | "banana"
  | "orange"
  | "grape"
  | "garlic"
  | "eggplant"
  | "strawberry"
  | "cherry"
  | "carrot"
  | "mushroom"
  | "broccoli"
  | "watermelon"
  | "pepper"
  | "kiwi"
  | "lemon"
  | "peach"
  | "peanut"
  | "apple"
  | "tomato"
  | "berries"
  | "grapes2"
  | "pineapple"
  | "melon";

export type SpriteRect = { x: number; y: number; w: number; h: number };

export const FRUIT_SPRITES: Record<FruitKey, SpriteRect> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};

const FRUIT_KEYS = Object.keys(FRUIT_SPRITES) as FruitKey[];

type Fruit = { cell: Cell; key: FruitKey };

type GameState = "playing" | "dead" | "gameover";

export type EngineState = {
  snake: Cell[];
  dir: Direction;
  nextDir: Direction;
  fruit: Fruit;
  score: number;
  lives: number;
  level: number;
  tickMs: number;
  gameState: GameState;
};

export type SnakeSnapshot = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomFruitKey(): FruitKey {
  return FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
}

function cellsEqual(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

function isCellFree(cell: Cell, snake: Cell[]): boolean {
  return !snake.some((s) => cellsEqual(s, cell));
}

function spawnFruit(snake: Cell[]): Fruit {
  let cell: Cell;
  do {
    cell = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } while (!isCellFree(cell, snake));
  return { cell, key: randomFruitKey() };
}

function calcTickMs(level: number): number {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - (level - 1) * TICK_DECREMENT);
}

function calcLevel(score: number): number {
  return Math.floor(score / LEVEL_EVERY_PTS) + 1;
}

const OPPOSITE: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

function initialSnake(): Cell[] {
  const cx = Math.floor(GRID / 2);
  const cy = Math.floor(GRID / 2);
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
}

function makeInitialState(): EngineState {
  const snake = initialSnake();
  return {
    snake,
    dir: "RIGHT",
    nextDir: "RIGHT",
    fruit: spawnFruit(snake),
    score: 0,
    lives: INITIAL_LIVES,
    level: 1,
    tickMs: calcTickMs(1),
    gameState: "playing",
  };
}

// ── Engine factory ────────────────────────────────────────────────────────────

export function createEngine() {
  let state: EngineState = makeInitialState();

  function getState(): EngineState {
    return state;
  }

  function snapshot(): SnakeSnapshot {
    return {
      score: state.score,
      lives: state.lives,
      level: state.level,
      gameOver: state.gameState === "gameover",
    };
  }

  function setDirection(dir: Direction): void {
    if (state.gameState !== "playing") return;
    if (dir === OPPOSITE[state.dir]) return;
    state.nextDir = dir;
  }

  function tick(): void {
    if (state.gameState !== "playing") return;

    state.dir = state.nextDir;

    const head = state.snake[0];
    const newHead: Cell = { x: head.x, y: head.y };

    if (state.dir === "UP") newHead.y -= 1;
    else if (state.dir === "DOWN") newHead.y += 1;
    else if (state.dir === "LEFT") newHead.x -= 1;
    else newHead.x += 1;

    // Wall collision
    const hitWall =
      newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID;

    // Self collision (exclude tail tip which will move)
    const body = state.snake.slice(0, state.snake.length - 1);
    const hitSelf = body.some((s) => cellsEqual(s, newHead));

    if (hitWall || hitSelf) {
      state.lives -= 1;
      if (state.lives <= 0) {
        state.gameState = "gameover";
      } else {
        // Respawn
        const newSnake = initialSnake();
        state.snake = newSnake;
        state.dir = "RIGHT";
        state.nextDir = "RIGHT";
        state.fruit = spawnFruit(newSnake);
        // Keep score, level, tickMs
      }
      return;
    }

    // Eat fruit?
    const ateFood = cellsEqual(newHead, state.fruit.cell);
    const newSnake = [newHead, ...state.snake];
    if (!ateFood) {
      newSnake.pop(); // remove tail
    }

    state.snake = newSnake;

    if (ateFood) {
      state.score += POINTS_PER_FRUIT;
      const newLevel = calcLevel(state.score);
      state.level = newLevel;
      state.tickMs = calcTickMs(newLevel);
      state.fruit = spawnFruit(newSnake);
    }
  }

  function forceGameOver(): void {
    state.gameState = "gameover";
  }

  function reset(): void {
    state = makeInitialState();
  }

  return { getState, snapshot, setDirection, tick, forceGameOver, reset };
}

export type Engine = ReturnType<typeof createEngine>;
