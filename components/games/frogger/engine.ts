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

export function createEngine() {
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
      // Still move vehicles/platforms so background stays alive
      moveObjects(dtMs);
      return;
    }

    if (phase === "gameover") return;

    // phase === "playing"
    moveObjects(dtMs);
    updateTurtles(dtMs);

    // Drag frog on river platforms
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

    // Countdown timer
    timeLeft -= dtMs / 1000;
    if (timeLeft <= 0) {
      timeLeft = 0;
      killFrog();
      return;
    }

    // Car collision (road rows)
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

    // Water collision (river rows with no platform)
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

    // Home row arrival
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
        // Landed in water between bases or on an already-occupied base
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

  function drawRowBackground(ctx: CanvasRenderingContext2D) {
    for (let row = 0; row < ROWS; row++) {
      const y = row * CELL;
      if (row === HOME_ROW) {
        ctx.fillStyle = "#001428";
      } else if (isInRiverRow(row)) {
        ctx.fillStyle = "#001428";
      } else if (row === MEDIAN_ROW || row === SAFE_ROW || row === ROWS - 1) {
        ctx.fillStyle = "#0a1f0a";
      } else if (isInRoadRow(row)) {
        ctx.fillStyle = "#1a0028";
      } else {
        ctx.fillStyle = "#0a1f0a";
      }
      ctx.fillRect(0, y, CANVAS_W, CELL);
    }
  }

  function drawLaneMarkers(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (const row of ROAD_ROWS) {
      const y = row * CELL;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
    // River glow lines
    ctx.strokeStyle = "rgba(0,204,255,0.12)";
    for (const row of RIVER_ROWS) {
      const y = row * CELL + CELL / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
  }

  function drawHomeBases(ctx: CanvasRenderingContext2D) {
    for (const base of homes) {
      const x = base.col * CELL;
      const y = HOME_ROW * CELL;
      if (base.occupied) {
        // Lilypad + mini frog
        ctx.fillStyle = "#003a00";
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
        ctx.fillStyle = "#00ff44";
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
        // Mini frog dot
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(x + CELL / 2, y + CELL / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff4444";
        ctx.beginPath();
        ctx.arc(x + CELL / 2 - 3, y + CELL / 2 - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + CELL / 2 + 3, y + CELL / 2 - 3, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Empty base outline
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, CELL - 8, CELL - 8);
      }
    }
  }

  function drawPlatforms(ctx: CanvasRenderingContext2D) {
    for (const p of platforms) {
      const y = p.row * CELL;
      const isSinking =
        p.type === "turtle" &&
        p.submergePhase >= TURTLE_SURFACE_MS &&
        p.submergePhase < TURTLE_SURFACE_MS + TURTLE_SINK_MS;

      if (p.type === "log") {
        ctx.fillStyle = "#5a3300";
        ctx.fillRect(p.x, y + 4, p.widthPx, CELL - 8);
        ctx.strokeStyle = "#8b5e27";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, y + 4, p.widthPx, CELL - 8);
        // Wood grain lines
        ctx.strokeStyle = "#7a4f1a";
        ctx.lineWidth = 1;
        for (let s = 1; s < p.widthPx / CELL; s++) {
          ctx.beginPath();
          ctx.moveTo(p.x + s * CELL, y + 6);
          ctx.lineTo(p.x + s * CELL, y + CELL - 6);
          ctx.stroke();
        }
      } else {
        // Turtle
        if (p.submerged) {
          // Submerged: draw water ripple only
          ctx.fillStyle = "rgba(0,204,255,0.15)";
          ctx.fillRect(p.x, y + 8, p.widthPx, CELL - 16);
          continue;
        }
        ctx.globalAlpha = isSinking ? 0.4 : 1;
        // Draw each turtle segment (2-cell wide per turtle)
        const numTurtles = Math.floor(p.widthPx / (CELL * 2));
        for (let t = 0; t < numTurtles; t++) {
          const tx = p.x + t * CELL * 2;
          // Shell
          ctx.fillStyle = "#3aff8a";
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
          ctx.strokeStyle = "#00cc55";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Shell pattern lines
          ctx.strokeStyle = "#00aa44";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tx + CELL, y + CELL / 2 - CELL * 0.35);
          ctx.lineTo(tx + CELL, y + CELL / 2 + CELL * 0.35);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(tx + CELL - CELL * 0.5, y + CELL / 2);
          ctx.lineTo(tx + CELL + CELL * 0.5, y + CELL / 2);
          ctx.stroke();
          // Head
          ctx.fillStyle = "#2ac46a";
          ctx.beginPath();
          ctx.arc(tx + CELL * 1.7, y + CELL / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawVehicles(ctx: CanvasRenderingContext2D) {
    for (const v of vehicles) {
      const y = v.row * CELL;
      // Body
      ctx.fillStyle = v.colorHex;
      ctx.fillRect(v.x + 2, y + 6, v.widthPx - 4, CELL - 12);
      // Black border
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(v.x + 2, y + 6, v.widthPx - 4, CELL - 12);
      // Headlights (white rectangles on leading edge)
      ctx.fillStyle = "#ffffff";
      const facingRight = v.speed > 0;
      const lightX = facingRight ? v.x + v.widthPx - 8 : v.x + 2;
      ctx.fillRect(lightX, y + 10, 6, 6);
    }
  }

  function drawFrog(ctx: CanvasRenderingContext2D, ts: number) {
    if (!frog.alive) {
      // Death blink: alternate alpha every 100ms
      const blinkOn = Math.floor(ts / 100) % 2 === 0;
      if (!blinkOn) return;
    }

    const fx = frog.col * CELL + frog.rideOffset;
    const fy = frog.row * CELL;
    const margin = 2;
    const size = CELL - margin * 2;

    // Body
    ctx.fillStyle = "#00ff44";
    ctx.fillRect(fx + margin, fy + margin, size, size);

    // Eyes based on lastDir
    ctx.fillStyle = "#ffffff";
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

    // Pupils
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(eye1x + 1, eye1y + 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eye2x + 1, eye2y + 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTimerBar(ctx: CanvasRenderingContext2D) {
    const ratio = Math.max(0, timeLeft / TIME_LIMIT);
    const barW = CANVAS_W * ratio;
    // Background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, CANVAS_W, 6);
    // Bar: green to red
    const r = Math.floor(255 * (1 - ratio));
    const g = Math.floor(255 * ratio);
    ctx.fillStyle = `rgb(${r},${g},0)`;
    ctx.fillRect(0, 0, barW, 6);
  }

  function drawOverlay(ctx: CanvasRenderingContext2D, text: string) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, CANVAS_H / 2 - 40, CANVAS_W, 80);
    ctx.fillStyle = "#00ff44";
    ctx.font = "bold 28px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function draw(ctx: CanvasRenderingContext2D) {
    // Use a timestamp trick for blink animations
    const ts = performance.now();

    // 1. Row backgrounds
    drawRowBackground(ctx);

    // 2. Lane markers
    drawLaneMarkers(ctx);

    // 3. Platforms
    drawPlatforms(ctx);

    // 4. Vehicles
    drawVehicles(ctx);

    // 5. Home bases
    drawHomeBases(ctx);

    // 6. Frog
    drawFrog(ctx, ts);

    // 7. Timer bar
    if (phase === "playing" || phase === "dying") {
      drawTimerBar(ctx);
    }

    // 8. Level complete overlay
    if (phase === "levelComplete") {
      drawOverlay(ctx, `NIVEL ${level}`);
    }

    // 9. Game over overlay
    if (phase === "gameover") {
      drawOverlay(ctx, "GAME OVER");
    }
  }

  return {
    initGame,
    update,
    moveFrog,
    draw,
    forceGameOver,
    getSnapshot,
  };
}

export type FroggerEngine = ReturnType<typeof createEngine>;
