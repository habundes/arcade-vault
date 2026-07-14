export const CELL = 40;
export const COLS = 12;
export const ROWS = 16;
export const CANVAS_W = COLS * CELL; // 480
export const CANVAS_H = ROWS * CELL; // 640

const HOME_ROW = 0;
const RIVER_ROWS = [1, 2, 3, 4, 5] as const;
const MEDIAN_ROW = 6;
const ROAD_ROWS = [7, 8, 9, 10, 11, 12, 13] as const;
const SAFE_ROW = 14;
const HOME_COLS = [1, 3, 5, 7, 9] as const;
const TIME_LIMIT = 30;
const DIE_DURATION = 800;
const LEVEL_COMPLETE_DURATION = 1500;
const TURTLE_SURFACE_MS = 3000;
const TURTLE_SINK_MS = 1000;
const TURTLE_SUBMERGED_MS = 1500;
const TURTLE_CYCLE_MS =
  TURTLE_SURFACE_MS + TURTLE_SINK_MS + TURTLE_SUBMERGED_MS;

// ── Skins ─────────────────────────────────────────────────────────────────────

export type Skin = "clasico" | "neon" | "retro";

type FroggerPalette = {
  bgRiver: string;
  bgGrass: string;
  bgRoad: string;

  laneMarker: string;
  riverGlow: string;
  scanlines: boolean;

  vehicleRow7: string;
  vehicleRow8: string;
  vehicleRow9: string;
  vehicleRow10: string;
  vehicleRow11: string;
  vehicleRow12: string;
  vehicleRow13: string;
  vehicleHeadlight: string;

  logFill: string;
  logBorder: string;
  logGrain: string;

  turtleShell: string;
  turtleBorder: string;
  turtlePattern: string;
  turtleHead: string;
  turtleRipple: string;

  baseEmptyBorder: string;
  baseLilypadOuter: string;
  baseLilypadInner: string;
  baseFrogMini: string;
  baseFrogEyes: string;

  frogBody: string;
  frogEyes: string;
  frogPupils: string;
  frogGlow: string | null;

  timerBg: string;
  timerFull: string;
  timerLow: string;

  overlayBg: string;
  overlayText: string;
};

export const FROGGER_PALETTES: Record<Skin, FroggerPalette> = {
  clasico: {
    bgRiver: "#000000",
    bgGrass: "#000000",
    bgRoad: "#000000",

    laneMarker: "rgba(255,255,255,0.25)",
    riverGlow: "rgba(255,255,255,0.12)",
    scanlines: false,

    vehicleRow7: "#ffffff",
    vehicleRow8: "#dddddd",
    vehicleRow9: "#ffffff",
    vehicleRow10: "#cccccc",
    vehicleRow11: "#ffffff",
    vehicleRow12: "#dddddd",
    vehicleRow13: "#ffffff",
    vehicleHeadlight: "#888888",

    logFill: "#333333",
    logBorder: "#999999",
    logGrain: "#555555",

    turtleShell: "#cccccc",
    turtleBorder: "#aaaaaa",
    turtlePattern: "#888888",
    turtleHead: "#bbbbbb",
    turtleRipple: "rgba(255,255,255,0.08)",

    baseEmptyBorder: "#555555",
    baseLilypadOuter: "#111111",
    baseLilypadInner: "#ffffff",
    baseFrogMini: "#cccccc",
    baseFrogEyes: "#888888",

    frogBody: "#ffffff",
    frogEyes: "#aaaaaa",
    frogPupils: "#000000",
    frogGlow: null,

    timerBg: "#222222",
    timerFull: "#ffffff",
    timerLow: "#aaaaaa",

    overlayBg: "rgba(0,0,0,0.80)",
    overlayText: "#ffffff",
  },

  neon: {
    bgRiver: "#001428",
    bgGrass: "#0a1f0a",
    bgRoad: "#1a0028",

    laneMarker: "rgba(255,255,255,0.08)",
    riverGlow: "rgba(0,204,255,0.12)",
    scanlines: false,

    vehicleRow7: "#ff006e",
    vehicleRow8: "#00f5ff",
    vehicleRow9: "#f5ff00",
    vehicleRow10: "#ff8800",
    vehicleRow11: "#ff44ff",
    vehicleRow12: "#44ffff",
    vehicleRow13: "#f5ff00",
    vehicleHeadlight: "#ffffff",

    logFill: "#5a3300",
    logBorder: "#8b5e27",
    logGrain: "#7a4f1a",

    turtleShell: "#00ff88",
    turtleBorder: "#00cc55",
    turtlePattern: "#00aa44",
    turtleHead: "#2ac46a",
    turtleRipple: "rgba(0,204,255,0.15)",

    baseEmptyBorder: "#444444",
    baseLilypadOuter: "#003a00",
    baseLilypadInner: "#00ff44",
    baseFrogMini: "#00ff88",
    baseFrogEyes: "#ff006e",

    frogBody: "#00ff88",
    frogEyes: "#ffffff",
    frogPupils: "#000000",
    frogGlow: "rgba(0,255,136,0.45)",

    timerBg: "#111111",
    timerFull: "#00f5ff",
    timerLow: "#ff006e",

    overlayBg: "rgba(0,0,0,0.65)",
    overlayText: "#00f5ff",
  },

  retro: {
    bgRiver: "#0a0800",
    bgGrass: "#0d0d00",
    bgRoad: "#0d0500",

    laneMarker: "rgba(255,176,0,0.20)",
    riverGlow: "rgba(255,176,0,0.15)",
    scanlines: true,

    vehicleRow7: "#ffb000",
    vehicleRow8: "#ff7b00",
    vehicleRow9: "#ffd27f",
    vehicleRow10: "#ff9500",
    vehicleRow11: "#ffb000",
    vehicleRow12: "#ff7b00",
    vehicleRow13: "#ffd27f",
    vehicleHeadlight: "#ffe4a0",

    logFill: "#3a1a00",
    logBorder: "#7a4000",
    logGrain: "#5a3000",

    turtleShell: "#ffb000",
    turtleBorder: "#ff7b00",
    turtlePattern: "#cc6600",
    turtleHead: "#ff9500",
    turtleRipple: "rgba(255,176,0,0.12)",

    baseEmptyBorder: "#664400",
    baseLilypadOuter: "#1a0a00",
    baseLilypadInner: "#ffb000",
    baseFrogMini: "#ffd27f",
    baseFrogEyes: "#ff7b00",

    frogBody: "#ffb000",
    frogEyes: "#ffe4a0",
    frogPupils: "#000000",
    frogGlow: null,

    timerBg: "#1a0a00",
    timerFull: "#ffb000",
    timerLow: "#ff7b00",

    overlayBg: "rgba(0,0,0,0.80)",
    overlayText: "#ffb000",
  },
};

// ── Game types ────────────────────────────────────────────────────────────────

export type FroggerSnapshot = {
  score: number;
  lives: number;
  level: number;
  timeLeft: number;
  gameOver: boolean;
};

type Frog = {
  col: number;
  row: number;
  alive: boolean;
  dieTimer: number;
  rideOffset: number;
  lastDir: "UP" | "DOWN" | "LEFT" | "RIGHT";
};

type Vehicle = {
  row: number;
  x: number;
  widthPx: number;
  speed: number;
  colorHex: string;
};

type Platform = {
  type: "log" | "turtle";
  row: number;
  x: number;
  widthPx: number;
  speed: number;
  submerged: boolean;
  submergeTimer: number;
  submergePhase: number;
};

type HomeBase = {
  col: number;
  occupied: boolean;
};

type Phase = "playing" | "dying" | "levelComplete" | "gameover";

const ROAD_LANE_CONFIG = [
  { row: 7, dir: 1, factor: 1.0, widthCells: 2, count: 3, color: "#ff00ff" },
  { row: 8, dir: -1, factor: 1.2, widthCells: 1, count: 4, color: "#00ffff" },
  { row: 9, dir: 1, factor: 0.9, widthCells: 2, count: 3, color: "#ffff00" },
  { row: 10, dir: -1, factor: 1.4, widthCells: 3, count: 2, color: "#ff8800" },
  { row: 11, dir: 1, factor: 1.1, widthCells: 1, count: 4, color: "#ff44ff" },
  { row: 12, dir: -1, factor: 0.8, widthCells: 2, count: 3, color: "#44ffff" },
  { row: 13, dir: 1, factor: 1.3, widthCells: 1, count: 4, color: "#ffff44" },
] as const;

const RIVER_LANE_CONFIG = [
  {
    row: 1,
    type: "log" as const,
    dir: 1,
    factor: 1.0,
    widthCells: 3,
    count: 3,
  },
  {
    row: 2,
    type: "turtle" as const,
    dir: -1,
    factor: 0.8,
    widthCells: 2,
    count: 3,
  },
  {
    row: 3,
    type: "log" as const,
    dir: 1,
    factor: 1.2,
    widthCells: 4,
    count: 2,
  },
  {
    row: 4,
    type: "turtle" as const,
    dir: -1,
    factor: 1.0,
    widthCells: 2,
    count: 4,
  },
  {
    row: 5,
    type: "log" as const,
    dir: 1,
    factor: 0.9,
    widthCells: 3,
    count: 3,
  },
];

// ── Engine ────────────────────────────────────────────────────────────────────

export function createEngine(skin: Skin = "clasico") {
  let activeSkin: Skin = skin;

  const frog: Frog = {
    col: 5,
    row: SAFE_ROW,
    alive: true,
    dieTimer: 0,
    rideOffset: 0,
    lastDir: "UP",
  };
  let vehicles: Vehicle[] = [];
  let platforms: Platform[] = [];
  const homes: HomeBase[] = (HOME_COLS as readonly number[]).map((col) => ({
    col,
    occupied: false,
  }));

  let score = 0;
  let lives = 3;
  let level = 1;
  let timeLeft = TIME_LIMIT;
  let phase: Phase = "playing";
  let levelCompleteTimer = 0;
  let minRowReached = SAFE_ROW;

  function setSkin(s: Skin) {
    activeSkin = s;
  }

  function generateVehicles(baseSpeed: number) {
    vehicles = [];
    for (const cfg of ROAD_LANE_CONFIG) {
      const speed = baseSpeed * cfg.factor * cfg.dir;
      const widthPx = cfg.widthCells * CELL;
      const spacing = CANVAS_W / cfg.count;
      for (let i = 0; i < cfg.count; i++) {
        vehicles.push({
          row: cfg.row,
          x: i * spacing,
          widthPx,
          speed,
          colorHex: cfg.color,
        });
      }
    }
  }

  function generatePlatforms(baseSpeed: number) {
    platforms = [];
    for (const cfg of RIVER_LANE_CONFIG) {
      const speed = baseSpeed * cfg.factor * cfg.dir;
      const widthPx = cfg.widthCells * CELL;
      const spacing = CANVAS_W / cfg.count;
      for (let i = 0; i < cfg.count; i++) {
        const initialPhase =
          cfg.type === "turtle" ? (i / cfg.count) * TURTLE_CYCLE_MS : 0;
        platforms.push({
          type: cfg.type,
          row: cfg.row,
          x: i * spacing,
          widthPx,
          speed,
          submerged: false,
          submergeTimer: 0,
          submergePhase: initialPhase,
        });
      }
    }
  }

  function initLevel() {
    const baseSpeed = 80 + (level - 1) * 15;
    generateVehicles(baseSpeed);
    generatePlatforms(baseSpeed);
    homes.forEach((h) => (h.occupied = false));
    frog.col = 5;
    frog.row = SAFE_ROW;
    frog.alive = true;
    frog.dieTimer = 0;
    frog.rideOffset = 0;
    timeLeft = TIME_LIMIT;
    minRowReached = SAFE_ROW;
    phase = "playing";
  }

  function initGame() {
    score = 0;
    lives = 3;
    level = 1;
    initLevel();
  }

  function killFrog() {
    if (phase !== "playing") return;
    phase = "dying";
    frog.alive = false;
    frog.dieTimer = DIE_DURATION;
    lives -= 1;
  }

  function respawnFrog() {
    frog.col = 5;
    frog.row = SAFE_ROW;
    frog.alive = true;
    frog.dieTimer = 0;
    frog.rideOffset = 0;
    timeLeft = TIME_LIMIT;
    minRowReached = SAFE_ROW;
    phase = "playing";
  }

  function checkLevelComplete() {
    if (homes.every((h) => h.occupied)) {
      score += 1000;
      phase = "levelComplete";
      levelCompleteTimer = LEVEL_COMPLETE_DURATION;
    }
  }

  function findPlatformUnder(): Platform | null {
    const frogCenterX = frog.col * CELL + frog.rideOffset + CELL / 2;
    for (const p of platforms) {
      if (p.row !== frog.row) continue;
      if (frogCenterX >= p.x && frogCenterX < p.x + p.widthPx) return p;
    }
    return null;
  }

  function isInRiverRow(row: number): boolean {
    return (RIVER_ROWS as readonly number[]).includes(row);
  }

  function isInRoadRow(row: number): boolean {
    return (ROAD_ROWS as readonly number[]).includes(row);
  }

  function update(dtMs: number) {
    if (phase === "levelComplete") {
      levelCompleteTimer -= dtMs;
      if (levelCompleteTimer <= 0) {
        level++;
        initLevel();
      }
      return;
    }

    if (phase === "dying") {
      frog.dieTimer -= dtMs;
      if (frog.dieTimer <= 0) {
        if (lives <= 0) {
          phase = "gameover";
        } else {
          respawnFrog();
        }
      }
      moveObjects(dtMs);
      return;
    }

    if (phase === "gameover") return;

    moveObjects(dtMs);
    updateTurtles(dtMs);

    if (isInRiverRow(frog.row) && frog.alive) {
      const plat = findPlatformUnder();
      if (plat) {
        frog.rideOffset += plat.speed * (dtMs / 1000);
        const frogPixelX = frog.col * CELL + frog.rideOffset;
        if (frogPixelX < 0 || frogPixelX + CELL > CANVAS_W) {
          killFrog();
          return;
        }
      }
    }

    timeLeft -= dtMs / 1000;
    if (timeLeft <= 0) {
      timeLeft = 0;
      killFrog();
      return;
    }

    if (isInRoadRow(frog.row) && frog.alive) {
      const frogLeft = frog.col * CELL + CELL * 0.15;
      const frogRight = frogLeft + CELL * 0.7;
      for (const v of vehicles) {
        if (v.row !== frog.row) continue;
        const vLeft = v.x + 2;
        const vRight = v.x + v.widthPx - 2;
        if (frogLeft < vRight && frogRight > vLeft) {
          killFrog();
          return;
        }
      }
    }

    if (isInRiverRow(frog.row) && frog.alive) {
      const plat = findPlatformUnder();
      if (!plat) {
        killFrog();
        return;
      }
      if (plat.submerged) {
        killFrog();
        return;
      }
    }

    if (frog.row === HOME_ROW && frog.alive) {
      const homeIdx = homes.findIndex((h) => h.col === frog.col);
      if (homeIdx >= 0 && !homes[homeIdx].occupied) {
        homes[homeIdx].occupied = true;
        score += 200 + Math.floor(timeLeft) * 20;
        timeLeft = TIME_LIMIT;
        frog.col = 5;
        frog.row = SAFE_ROW;
        frog.rideOffset = 0;
        minRowReached = SAFE_ROW;
        checkLevelComplete();
      } else {
        killFrog();
      }
    }
  }

  function moveObjects(dtMs: number) {
    for (const v of vehicles) {
      v.x += v.speed * (dtMs / 1000);
      if (v.speed > 0 && v.x > CANVAS_W + v.widthPx) v.x = -v.widthPx;
      if (v.speed < 0 && v.x < -v.widthPx) v.x = CANVAS_W;
    }
    for (const p of platforms) {
      p.x += p.speed * (dtMs / 1000);
      if (p.speed > 0 && p.x > CANVAS_W + p.widthPx) p.x = -p.widthPx;
      if (p.speed < 0 && p.x < -p.widthPx) p.x = CANVAS_W;
    }
  }

  function updateTurtles(dtMs: number) {
    for (const p of platforms) {
      if (p.type !== "turtle") continue;
      p.submergePhase = (p.submergePhase + dtMs) % TURTLE_CYCLE_MS;
      p.submerged = p.submergePhase >= TURTLE_SURFACE_MS + TURTLE_SINK_MS;
    }
  }

  function moveFrog(dir: "UP" | "DOWN" | "LEFT" | "RIGHT") {
    if (phase !== "playing" || !frog.alive) return;
    frog.lastDir = dir;
    frog.rideOffset = 0;

    if (dir === "UP") {
      const newRow = Math.max(0, frog.row - 1);
      if (newRow < minRowReached) {
        score += 10;
        minRowReached = newRow;
      }
      frog.row = newRow;
    } else if (dir === "DOWN") {
      frog.row = Math.min(SAFE_ROW, frog.row + 1);
    } else if (dir === "LEFT") {
      frog.col = Math.max(0, frog.col - 1);
    } else if (dir === "RIGHT") {
      frog.col = Math.min(COLS - 1, frog.col + 1);
    }
  }

  function forceGameOver() {
    phase = "gameover";
  }

  function getSnapshot(): FroggerSnapshot {
    return {
      score,
      lives,
      level,
      timeLeft: Math.ceil(Math.max(0, timeLeft)),
      gameOver: phase === "gameover",
    };
  }

  // ── Draw ─────────────────────────────────────────────────────────────────────

  function drawRowBackground(ctx: CanvasRenderingContext2D, p: FroggerPalette) {
    for (let row = 0; row < ROWS; row++) {
      const y = row * CELL;
      if (row === HOME_ROW) {
        ctx.fillStyle = p.bgRiver;
      } else if (isInRiverRow(row)) {
        ctx.fillStyle = p.bgRiver;
      } else if (row === MEDIAN_ROW || row === SAFE_ROW || row === ROWS - 1) {
        ctx.fillStyle = p.bgGrass;
      } else if (isInRoadRow(row)) {
        ctx.fillStyle = p.bgRoad;
      } else {
        ctx.fillStyle = p.bgGrass;
      }
      ctx.fillRect(0, y, CANVAS_W, CELL);
    }
  }

  function drawLaneMarkers(ctx: CanvasRenderingContext2D, p: FroggerPalette) {
    ctx.strokeStyle = p.laneMarker;
    ctx.lineWidth = 1;
    for (const row of ROAD_ROWS) {
      const y = row * CELL;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
    ctx.strokeStyle = p.riverGlow;
    for (const row of RIVER_ROWS) {
      const y = row * CELL + CELL / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
  }

  function drawHomeBases(ctx: CanvasRenderingContext2D, p: FroggerPalette) {
    for (const base of homes) {
      const x = base.col * CELL;
      const y = HOME_ROW * CELL;
      if (base.occupied) {
        ctx.fillStyle = p.baseLilypadOuter;
        ctx.beginPath();
        ctx.ellipse(
          x + CELL / 2,
          y + CELL / 2,
          CELL * 0.45,
          CELL * 0.35,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = p.baseLilypadInner;
        ctx.beginPath();
        ctx.ellipse(
          x + CELL / 2,
          y + CELL / 2,
          CELL * 0.4,
          CELL * 0.3,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = p.baseFrogMini;
        ctx.beginPath();
        ctx.arc(x + CELL / 2, y + CELL / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.baseFrogEyes;
        ctx.beginPath();
        ctx.arc(x + CELL / 2 - 3, y + CELL / 2 - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + CELL / 2 + 3, y + CELL / 2 - 3, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = p.baseEmptyBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, CELL - 8, CELL - 8);
      }
    }
  }

  function drawPlatforms(ctx: CanvasRenderingContext2D, p: FroggerPalette) {
    for (const plat of platforms) {
      const y = plat.row * CELL;
      const isSinking =
        plat.type === "turtle" &&
        plat.submergePhase >= TURTLE_SURFACE_MS &&
        plat.submergePhase < TURTLE_SURFACE_MS + TURTLE_SINK_MS;

      if (plat.type === "log") {
        ctx.fillStyle = p.logFill;
        ctx.fillRect(plat.x, y + 4, plat.widthPx, CELL - 8);
        ctx.strokeStyle = p.logBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, y + 4, plat.widthPx, CELL - 8);
        ctx.strokeStyle = p.logGrain;
        ctx.lineWidth = 1;
        for (let s = 1; s < plat.widthPx / CELL; s++) {
          ctx.beginPath();
          ctx.moveTo(plat.x + s * CELL, y + 6);
          ctx.lineTo(plat.x + s * CELL, y + CELL - 6);
          ctx.stroke();
        }
      } else {
        if (plat.submerged) {
          ctx.fillStyle = p.turtleRipple;
          ctx.fillRect(plat.x, y + 8, plat.widthPx, CELL - 16);
          continue;
        }
        ctx.globalAlpha = isSinking ? 0.4 : 1;
        const numTurtles = Math.floor(plat.widthPx / (CELL * 2));
        for (let t = 0; t < numTurtles; t++) {
          const tx = plat.x + t * CELL * 2;
          ctx.fillStyle = p.turtleShell;
          ctx.beginPath();
          ctx.ellipse(
            tx + CELL,
            y + CELL / 2,
            CELL * 0.8,
            CELL * 0.35,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.strokeStyle = p.turtleBorder;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.strokeStyle = p.turtlePattern;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tx + CELL, y + CELL / 2 - CELL * 0.35);
          ctx.lineTo(tx + CELL, y + CELL / 2 + CELL * 0.35);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(tx + CELL - CELL * 0.5, y + CELL / 2);
          ctx.lineTo(tx + CELL + CELL * 0.5, y + CELL / 2);
          ctx.stroke();
          ctx.fillStyle = p.turtleHead;
          ctx.beginPath();
          ctx.arc(tx + CELL * 1.7, y + CELL / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawVehicles(ctx: CanvasRenderingContext2D, p: FroggerPalette) {
    const rowColorMap: Record<number, string> = {
      7: p.vehicleRow7,
      8: p.vehicleRow8,
      9: p.vehicleRow9,
      10: p.vehicleRow10,
      11: p.vehicleRow11,
      12: p.vehicleRow12,
      13: p.vehicleRow13,
    };

    for (const v of vehicles) {
      const y = v.row * CELL;
      ctx.fillStyle = rowColorMap[v.row] ?? v.colorHex;
      ctx.fillRect(v.x + 2, y + 6, v.widthPx - 4, CELL - 12);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(v.x + 2, y + 6, v.widthPx - 4, CELL - 12);
      ctx.fillStyle = p.vehicleHeadlight;
      const facingRight = v.speed > 0;
      const lightX = facingRight ? v.x + v.widthPx - 8 : v.x + 2;
      ctx.fillRect(lightX, y + 10, 6, 6);
    }
  }

  function drawFrog(
    ctx: CanvasRenderingContext2D,
    p: FroggerPalette,
    ts: number,
  ) {
    if (!frog.alive) {
      const blinkOn = Math.floor(ts / 100) % 2 === 0;
      if (!blinkOn) return;
    }

    const fx = frog.col * CELL + frog.rideOffset;
    const fy = frog.row * CELL;
    const margin = 2;
    const size = CELL - margin * 2;

    if (p.frogGlow) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.frogGlow;
    }
    ctx.fillStyle = p.frogBody;
    ctx.fillRect(fx + margin, fy + margin, size, size);
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    ctx.fillStyle = p.frogEyes;
    const eyeR = 4;
    let eye1x = fx + CELL / 2 - 7;
    let eye1y = fy + CELL / 2 - 7;
    let eye2x = fx + CELL / 2 + 3;
    let eye2y = fy + CELL / 2 - 7;

    if (frog.lastDir === "DOWN") {
      eye1y = fy + CELL / 2 + 3;
      eye2y = fy + CELL / 2 + 3;
    } else if (frog.lastDir === "LEFT") {
      eye1x = fx + CELL / 2 - 12;
      eye1y = fy + CELL / 2 - 4;
      eye2x = fx + CELL / 2 - 12;
      eye2y = fy + CELL / 2 + 4;
    } else if (frog.lastDir === "RIGHT") {
      eye1x = fx + CELL / 2 + 8;
      eye1y = fy + CELL / 2 - 4;
      eye2x = fx + CELL / 2 + 8;
      eye2y = fy + CELL / 2 + 4;
    }

    ctx.beginPath();
    ctx.arc(eye1x, eye1y, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eye2x, eye2y, eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.frogPupils;
    ctx.beginPath();
    ctx.arc(eye1x + 1, eye1y + 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eye2x + 1, eye2y + 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTimerBar(ctx: CanvasRenderingContext2D, p: FroggerPalette) {
    const ratio = Math.max(0, timeLeft / TIME_LIMIT);
    const barW = CANVAS_W * ratio;
    ctx.fillStyle = p.timerBg;
    ctx.fillRect(0, 0, CANVAS_W, 6);
    const grad = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
    grad.addColorStop(0, p.timerFull);
    grad.addColorStop(1, p.timerLow);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, barW, 6);
  }

  function drawOverlay(
    ctx: CanvasRenderingContext2D,
    p: FroggerPalette,
    text: string,
  ) {
    ctx.fillStyle = p.overlayBg;
    ctx.fillRect(0, CANVAS_H / 2 - 40, CANVAS_W, 80);
    ctx.fillStyle = p.overlayText;
    ctx.font = "bold 28px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function draw(ctx: CanvasRenderingContext2D) {
    const p = FROGGER_PALETTES[activeSkin];
    const ts = performance.now();

    drawRowBackground(ctx, p);
    drawLaneMarkers(ctx, p);
    drawPlatforms(ctx, p);
    drawVehicles(ctx, p);
    drawHomeBases(ctx, p);
    drawFrog(ctx, p, ts);

    if (phase === "playing" || phase === "dying") {
      drawTimerBar(ctx, p);
    }

    if (phase === "levelComplete") {
      drawOverlay(ctx, p, `NIVEL ${level}`);
    }

    if (phase === "gameover") {
      drawOverlay(ctx, p, "GAME OVER");
    }

    if (p.scanlines) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      for (let sy = 0; sy < CANVAS_H; sy += 2) {
        ctx.fillRect(0, sy, CANVAS_W, 1);
      }
    }
  }

  return {
    initGame,
    update,
    moveFrog,
    draw,
    forceGameOver,
    getSnapshot,
    setSkin,
  };
}

export type FroggerEngine = ReturnType<typeof createEngine>;
