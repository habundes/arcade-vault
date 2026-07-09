const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS: (string | null)[] = [
  null,
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#90caf9", // J - pale blue
  "#ffb74d", // L - orange
  "#9e9e9e", // N - tuerca (gris metálico)
];

const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

const LINE_SCORES = [0, 100, 300, 500, 800];

export type Piece = { type: number; shape: number[][]; x: number; y: number };

export type EngineState = {
  board: number[][];
  current: Piece;
  next: Piece;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
};

export type Engine = {
  state: EngineState;
  initGame: () => void;
  tryRotate: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  forceGameOver: () => void;
  tick: (dt: number) => void;
  drawBoard: (ctx: CanvasRenderingContext2D) => void;
  drawNext: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
};

export function createEngine(): Engine {
  const state: EngineState = {
    board: [],
    current: { type: 1, shape: [], x: 0, y: 0 },
    next: { type: 1, shape: [], x: 0, y: 0 },
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
  };

  let dropAccum = 0;
  let dropInterval = 1000;

  function createBoard(): number[][] {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  }

  function randomPiece(): Piece {
    const type = Math.floor(Math.random() * 8) + 1;
    const shape = (PIECES[type] as number[][]).map((row) => [...row]);
    return {
      type,
      shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }

  function collide(shape: number[][], ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && state.board[ny][nx]) return true;
      }
    }
    return false;
  }

  function rotateCW(shape: number[][]): number[][] {
    const rows = shape.length;
    const cols = shape[0].length;
    const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
    return result;
  }

  function merge(): void {
    for (let r = 0; r < state.current.shape.length; r++)
      for (let c = 0; c < state.current.shape[r].length; c++)
        if (state.current.shape[r][c])
          state.board[state.current.y + r][state.current.x + c] =
            state.current.shape[r][c];
  }

  function clearLines(): void {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (state.board[r].every((v) => v !== 0)) {
        state.board.splice(r, 1);
        state.board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      state.lines += cleared;
      state.score += (LINE_SCORES[cleared] ?? 0) * state.level;
      state.level = Math.floor(state.lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (state.level - 1) * 90);
    }
  }

  function ghostY(): number {
    let gy = state.current.y;
    while (!collide(state.current.shape, state.current.x, gy + 1)) gy++;
    return gy;
  }

  function spawn(): void {
    state.current = state.next;
    state.next = randomPiece();
    if (collide(state.current.shape, state.current.x, state.current.y)) {
      state.gameOver = true;
    }
  }

  function lockPiece(): void {
    merge();
    clearLines();
    spawn();
  }

  function drawBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    colorIndex: number,
    size: number,
    alpha = 1,
  ): void {
    if (!colorIndex) return;
    const color = COLORS[colorIndex];
    if (!color) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    ctx.globalAlpha = 1;
  }

  function drawBoard(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, COLS * BLOCK, ROWS * BLOCK);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(COLS * BLOCK, r * BLOCK);
      ctx.stroke();
    }

    // board cells
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        drawBlock(ctx, c, r, state.board[r][c], BLOCK);

    // ghost
    const gy = ghostY();
    for (let r = 0; r < state.current.shape.length; r++)
      for (let c = 0; c < state.current.shape[r].length; c++)
        if (state.current.shape[r][c])
          drawBlock(
            ctx,
            state.current.x + c,
            gy + r,
            state.current.shape[r][c],
            BLOCK,
            0.2,
          );

    // current piece
    for (let r = 0; r < state.current.shape.length; r++)
      for (let c = 0; c < state.current.shape[r].length; c++)
        drawBlock(
          ctx,
          state.current.x + c,
          state.current.y + r,
          state.current.shape[r][c],
          BLOCK,
        );
  }

  function drawNext(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): void {
    const NB = 30;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const shape = state.next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        drawBlock(ctx, offX + c, offY + r, shape[r][c], NB);
  }

  function initGame(): void {
    state.board = createBoard();
    state.score = 0;
    state.lines = 0;
    state.level = 1;
    state.gameOver = false;
    dropInterval = 1000;
    dropAccum = 0;
    state.next = randomPiece();
    spawn();
  }

  function tryRotate(): void {
    const rotated = rotateCW(state.current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collide(rotated, state.current.x + kick, state.current.y)) {
        state.current.shape = rotated;
        state.current.x += kick;
        return;
      }
    }
  }

  function moveLeft(): void {
    if (!collide(state.current.shape, state.current.x - 1, state.current.y))
      state.current.x--;
  }

  function moveRight(): void {
    if (!collide(state.current.shape, state.current.x + 1, state.current.y))
      state.current.x++;
  }

  function softDrop(): void {
    if (!collide(state.current.shape, state.current.x, state.current.y + 1)) {
      state.current.y++;
      state.score += 1;
    } else {
      lockPiece();
    }
  }

  function hardDrop(): void {
    const gy = ghostY();
    state.score += (gy - state.current.y) * 2;
    state.current.y = gy;
    lockPiece();
  }

  function forceGameOver(): void {
    state.gameOver = true;
  }

  function tick(dt: number): void {
    if (state.gameOver) return;
    const cappedDt = Math.min(dt, 50);
    dropAccum += cappedDt;
    if (dropAccum >= dropInterval) {
      dropAccum = 0;
      if (!collide(state.current.shape, state.current.x, state.current.y + 1)) {
        state.current.y++;
      } else {
        lockPiece();
      }
    }
  }

  initGame();

  return {
    state,
    initGame,
    tryRotate,
    moveLeft,
    moveRight,
    softDrop,
    hardDrop,
    forceGameOver,
    tick,
    drawBoard,
    drawNext,
  };
}
