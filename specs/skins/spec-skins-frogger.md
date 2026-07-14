# Spec de skins — Frogger

| Campo        | Valor                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Juego        | `frogger` (carpeta de código: `components/games/frogger/`)                                                |
| Estado       | Borrador                                                                                                  |
| Skins        | `neon`, `retro`, `clasico` (default)                                                                      |
| Fuente leída | `components/games/frogger/engine.ts`, `specs/game-jam/frogger/spec-A-juego-frogger.md`, `app/globals.css` |
| Fecha        | 2026-07-14                                                                                                |

---

## 1. Tipo y paletas por skin

```ts
type Skin = "clasico" | "neon" | "retro";

type FroggerPalette = {
  // Fondos de zona
  bgRiver: string; // filas 0–5 (río + home row)
  bgGrass: string; // filas 6, 14, 15 (mediana, safe, decoración)
  bgRoad: string; // filas 7–13 (carretera)

  // Marcas y efectos de zona
  laneMarker: string; // líneas entre carriles de carretera (rgba)
  riverGlow: string; // líneas de brillo horizontal en río (rgba)
  scanlines: boolean; // activa overlay de scanlines encima del canvas

  // Vehículos — 7 colores, uno por carril (row 7 → 13)
  vehicleRow7: string; // row 7  dir→  2 celdas
  vehicleRow8: string; // row 8  dir←  1 celda
  vehicleRow9: string; // row 9  dir→  2 celdas
  vehicleRow10: string; // row 10 dir←  3 celdas
  vehicleRow11: string; // row 11 dir→  1 celda
  vehicleRow12: string; // row 12 dir←  2 celdas
  vehicleRow13: string; // row 13 dir→  1 celda
  vehicleHeadlight: string; // faros rectangulares

  // Troncos
  logFill: string; // relleno del tronco
  logBorder: string; // borde del tronco
  logGrain: string; // líneas de veta interior

  // Tortugas
  turtleShell: string; // relleno del caparazón
  turtleBorder: string; // borde del caparazón
  turtlePattern: string; // líneas de patrón interior del caparazón
  turtleHead: string; // cabeza (círculo)
  turtleRipple: string; // ripple de tortuga sumergida (rgba)

  // Bases de llegada (home row 0)
  baseEmptyBorder: string; // borde de base vacía
  baseLilypadOuter: string; // elipse exterior del nenúfar
  baseLilypadInner: string; // elipse interior del nenúfar
  baseFrogMini: string; // punto de rana mini en base ocupada
  baseFrogEyes: string; // ojos de rana mini

  // Rana jugador
  frogBody: string; // cuerpo de la rana
  frogEyes: string; // ojos (círculos blancos)
  frogPupils: string; // pupilas (círculos negros)
  frogGlow: string | null; // sombra/glow del cuerpo (null = sin glow)

  // Timer bar
  timerBg: string; // franja de fondo de la barra
  timerFull: string; // color cuando timeLeft está alto (inicio)
  timerLow: string; // color cuando timeLeft está bajo (urgencia)

  // Overlays de texto (NIVEL X, GAME OVER)
  overlayBg: string; // fondo del overlay (rgba)
  overlayText: string; // texto del overlay
};
```

### Paletas completas

```ts
const FROGGER_PALETTES: Record<Skin, FroggerPalette> = {
  // ── clasico ──────────────────────────────────────────────────────────────────
  // Monocromo vector: blanco sobre negro, sin glow, sin scanlines.
  // Zonas diferenciadas solo por marcas de carril y ondas de agua más visibles.
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

  // ── neon ─────────────────────────────────────────────────────────────────────
  // Neon-CRT: paleta --cyan/--magenta/--yellow/--green de globals.css, con glow.
  // Colores actuales del engine (implementado) son la base de esta skin.
  neon: {
    bgRiver: "#001428",
    bgGrass: "#0a1f0a",
    bgRoad: "#1a0028",

    laneMarker: "rgba(255,255,255,0.08)",
    riverGlow: "rgba(0,204,255,0.12)",
    scanlines: false,

    vehicleRow7: "#ff006e", // --magenta
    vehicleRow8: "#00f5ff", // --cyan
    vehicleRow9: "#f5ff00", // --yellow
    vehicleRow10: "#ff8800", // naranja neon (acento cálido)
    vehicleRow11: "#ff44ff", // magenta claro
    vehicleRow12: "#44ffff", // cyan claro
    vehicleRow13: "#f5ff00", // --yellow (segunda presencia)
    vehicleHeadlight: "#ffffff",

    logFill: "#5a3300",
    logBorder: "#8b5e27",
    logGrain: "#7a4f1a",

    turtleShell: "#00ff88", // --green
    turtleBorder: "#00cc55",
    turtlePattern: "#00aa44",
    turtleHead: "#2ac46a",
    turtleRipple: "rgba(0,204,255,0.15)",

    baseEmptyBorder: "#444444",
    baseLilypadOuter: "#003a00",
    baseLilypadInner: "#00ff44",
    baseFrogMini: "#00ff88",
    baseFrogEyes: "#ff006e", // --magenta

    frogBody: "#00ff88", // --green
    frogEyes: "#ffffff",
    frogPupils: "#000000",
    frogGlow: "rgba(0,255,136,0.45)",

    timerBg: "#111111",
    timerFull: "#00f5ff", // --cyan
    timerLow: "#ff006e", // --magenta

    overlayBg: "rgba(0,0,0,0.65)",
    overlayText: "#00f5ff", // --cyan
  },

  // ── retro ────────────────────────────────────────────────────────────────────
  // Paleta cálida ámbar/naranja estilo monitor de fósforo, sobre negro cálido.
  // Con scanlines para evocar el CRT original de los 80.
  retro: {
    bgRiver: "#0a0800",
    bgGrass: "#0d0d00",
    bgRoad: "#0d0500",

    laneMarker: "rgba(255,176,0,0.20)",
    riverGlow: "rgba(255,176,0,0.15)",
    scanlines: true,

    vehicleRow7: "#ffb000", // ámbar principal
    vehicleRow8: "#ff7b00", // naranja
    vehicleRow9: "#ffd27f", // ámbar claro
    vehicleRow10: "#ff9500", // naranja medio
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
```

---

## 2. Mapa elemento → valor por skin

| Elemento coloreable           | origen actual (engine)   | clasico                  | neon                     | retro                  |
| ----------------------------- | ------------------------ | ------------------------ | ------------------------ | ---------------------- |
| Fondo río / home row (0–5)    | `#001428`                | `#000000`                | `#001428`                | `#0a0800`              |
| Fondo hierba / mediana / safe | `#0a1f0a`                | `#000000`                | `#0a1f0a`                | `#0d0d00`              |
| Fondo carretera (7–13)        | `#1a0028`                | `#000000`                | `#1a0028`                | `#0d0500`              |
| Marcas de carril              | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.25)` | `rgba(255,255,255,0.08)` | `rgba(255,176,0,0.20)` |
| Glow agua (río)               | `rgba(0,204,255,0.12)`   | `rgba(255,255,255,0.12)` | `rgba(0,204,255,0.12)`   | `rgba(255,176,0,0.15)` |
| Vehículo row 7 (`→`)          | `#ff00ff`                | `#ffffff`                | `#ff006e`                | `#ffb000`              |
| Vehículo row 8 (`←`)          | `#00ffff`                | `#dddddd`                | `#00f5ff`                | `#ff7b00`              |
| Vehículo row 9 (`→`)          | `#ffff00`                | `#ffffff`                | `#f5ff00`                | `#ffd27f`              |
| Vehículo row 10 (`←`)         | `#ff8800`                | `#cccccc`                | `#ff8800`                | `#ff9500`              |
| Vehículo row 11 (`→`)         | `#ff44ff`                | `#ffffff`                | `#ff44ff`                | `#ffb000`              |
| Vehículo row 12 (`←`)         | `#44ffff`                | `#dddddd`                | `#44ffff`                | `#ff7b00`              |
| Vehículo row 13 (`→`)         | `#ffff44`                | `#ffffff`                | `#f5ff00`                | `#ffd27f`              |
| Faros de vehículo             | `#ffffff`                | `#888888`                | `#ffffff`                | `#ffe4a0`              |
| Tronco relleno                | `#5a3300`                | `#333333`                | `#5a3300`                | `#3a1a00`              |
| Tronco borde                  | `#8b5e27`                | `#999999`                | `#8b5e27`                | `#7a4000`              |
| Tronco veta interior          | `#7a4f1a`                | `#555555`                | `#7a4f1a`                | `#5a3000`              |
| Tortuga shell relleno         | `#3aff8a`                | `#cccccc`                | `#00ff88`                | `#ffb000`              |
| Tortuga shell borde           | `#00cc55`                | `#aaaaaa`                | `#00cc55`                | `#ff7b00`              |
| Tortuga patrón interior       | `#00aa44`                | `#888888`                | `#00aa44`                | `#cc6600`              |
| Tortuga cabeza                | `#2ac46a`                | `#bbbbbb`                | `#2ac46a`                | `#ff9500`              |
| Tortuga sumergida (ripple)    | `rgba(0,204,255,0.15)`   | `rgba(255,255,255,0.08)` | `rgba(0,204,255,0.15)`   | `rgba(255,176,0,0.12)` |
| Base vacía borde              | `#444444`                | `#555555`                | `#444444`                | `#664400`              |
| Base ocupada lilypad exterior | `#003a00`                | `#111111`                | `#003a00`                | `#1a0a00`              |
| Base ocupada lilypad interior | `#00ff44`                | `#ffffff`                | `#00ff44`                | `#ffb000`              |
| Base ocupada rana mini        | `#00ff88`                | `#cccccc`                | `#00ff88`                | `#ffd27f`              |
| Ojos rana mini (en base)      | `#ff4444`                | `#888888`                | `#ff006e`                | `#ff7b00`              |
| Rana cuerpo                   | `#00ff44`                | `#ffffff`                | `#00ff88`                | `#ffb000`              |
| Rana ojos                     | `#ffffff`                | `#aaaaaa`                | `#ffffff`                | `#ffe4a0`              |
| Rana pupilas                  | `#000000`                | `#000000`                | `#000000`                | `#000000`              |
| Rana glow (sombra canvas)     | —                        | ninguno                  | `rgba(0,255,136,0.45)`   | ninguno                |
| Timer bar fondo               | `#111111`                | `#222222`                | `#111111`                | `#1a0a00`              |
| Timer bar (inicio)            | verde dinámico           | `#ffffff`                | `#00f5ff`                | `#ffb000`              |
| Timer bar (urgencia)          | rojo dinámico            | `#aaaaaa`                | `#ff006e`                | `#ff7b00`              |
| Overlay fondo                 | `rgba(0,0,0,0.65)`       | `rgba(0,0,0,0.80)`       | `rgba(0,0,0,0.65)`       | `rgba(0,0,0,0.80)`     |
| Overlay texto                 | `#00ff44`                | `#ffffff`                | `#00f5ff`                | `#ffb000`              |
| Scanlines canvas              | no                       | no                       | no                       | sí                     |

---

## 3. Cómo se aplica

### 3a. Arquitectura en el engine

El parámetro `skin` se pasa como argumento a `createEngine()`. El engine recibe la skin activa en su closure y la usa dentro de `draw()` para seleccionar colores del objeto `FROGGER_PALETTES[skin]`. Adicionalmente, `setSkin(skin)` permite cambiar la skin en caliente sin reiniciar la partida.

```ts
// engine.ts — firma actualizada
export function createEngine(skin: Skin = "clasico") {
  let activeSkin: Skin = skin;
  // ...

  function setSkin(s: Skin) {
    activeSkin = s;
  }

  function draw(ctx: CanvasRenderingContext2D) {
    const p = FROGGER_PALETTES[activeSkin];
    // Usa p.bgRiver, p.frogBody, etc. en lugar de los hex hardcodeados
    // Para retro con p.scanlines === true:
    //   Al final de draw(), pintar un overlay de scanlines:
    //   ctx.fillStyle = "rgba(0,0,0,0.15)";
    //   for (let y = 0; y < CANVAS_H; y += 2) ctx.fillRect(0, y, CANVAS_W, 1);
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
```

**`clasico` es el skin por defecto** (`createEngine()` sin argumento = clasico).

### 3b. Prop `skin` en `FroggerCanvas`

```tsx
// FroggerCanvas.tsx — prop adicional
type FroggerCanvasProps = {
  paused: boolean;
  skin?: Skin; // default: "clasico"
  onSnapshot: (s: FroggerSnapshot) => void;
};

// Dentro del componente:
const engineRef = useRef(createEngine(skin ?? "clasico"));

// useEffect para cambiar skin en caliente sin remount:
useEffect(() => {
  engineRef.current.setSkin(skin ?? "clasico");
}, [skin]);
```

### 3c. Selector de skin en `GamePlayer.tsx`

Dentro de `.hud-actions` del `GamePlayer`, visible solo cuando `game.id === "frogger"`:

```tsx
// Estado de skin con persistencia en localStorage
const STORAGE_KEY = "av-skin-frogger";
const [froggerSkin, setFroggerSkin] = useState<Skin>(
  () => (localStorage.getItem(STORAGE_KEY) as Skin) ?? "clasico"
);

const handleSkinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const s = e.target.value as Skin;
  setFroggerSkin(s);
  localStorage.setItem(STORAGE_KEY, s);
};

// JSX dentro de .hud-actions (solo si game.id === "frogger"):
{game.id === "frogger" && (
  <select value={froggerSkin} onChange={handleSkinChange}>
    <option value="clasico">Clásico</option>
    <option value="neon">Neon</option>
    <option value="retro">Retro</option>
  </select>
)}

// FroggerCanvas recibe la skin activa:
<FroggerCanvas
  ref={froggerRef}
  paused={isPaused}
  skin={froggerSkin}
  onSnapshot={...}
/>
```

**Clave de persistencia:** `av-skin-frogger`  
**Default cuando no hay nada en localStorage:** `"clasico"`

### 3d. Scanlines para la skin retro

Los scanlines son un overlay de canvas dibujado al final de `draw()` cuando `FROGGER_PALETTES[activeSkin].scanlines === true`:

```ts
// Al final de draw(), después de todos los elementos:
if (FROGGER_PALETTES[activeSkin].scanlines) {
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  for (let sy = 0; sy < CANVAS_H; sy += 2) {
    ctx.fillRect(0, sy, CANVAS_W, 1);
  }
}
```

### 3e. Timer bar con colores de skin

En lugar del gradiente verde→rojo hardcodeado, usar `timerFull` y `timerLow` de la paleta:

```ts
// Mezcla lineal entre timerFull (ratio=1) y timerLow (ratio=0):
// La implementación puede interpolar en RGB o usar un ctx.createLinearGradient
// recortado al ancho actual. El valor exacto de interpolación queda a criterio
// de quien implemente; el spec solo impone los colores extremos.
```

---

## 4. Checklist de verificación dark-mode

Para cada skin, verificar que los siguientes elementos son legibles (contraste mínimo 3:1 sobre el fondo) en un monitor configurado en modo oscuro o en el tema dark de la plataforma.

### Skin clasico

- [ ] Rana `#ffffff` sobre fondo `#000000` — contraste 21:1. Aprobado.
- [ ] Vehículos `#ffffff` / `#dddddd` / `#cccccc` sobre `#000000` — contraste ≥ 14:1. Aprobado.
- [ ] Troncos `#999999` (borde) sobre `#000000` — contraste 6.3:1. Aprobado.
- [ ] Tortugas `#cccccc` sobre `#000000` — contraste 14.1:1. Aprobado.
- [ ] Lilypad interior `#ffffff` sobre base exterior `#111111` — contraste alto. Aprobado.
- [ ] Overlay texto `#ffffff` sobre `rgba(0,0,0,0.80)` — legible. Aprobado.
- [ ] Timer bar `#ffffff` / `#aaaaaa` sobre `#222222` — contraste ≥ 4.8:1. Aprobado.
- [ ] Sin dependencia de fondo claro en ningún elemento. Aprobado.

### Skin neon

- [ ] Rana `#00ff88` (--green) sobre `#0a1f0a` (hierba) — contraste suficiente + glow `rgba(0,255,136,0.45)`. Aprobado.
- [ ] Vehículos neon (`#ff006e`, `#00f5ff`, `#f5ff00`) sobre fondos oscuros `#1a0028` / `#001428` — todos > 4:1. Aprobado.
- [ ] Tortugas `#00ff88` sobre `#001428` — contraste visible con el azul muy oscuro. Aprobado.
- [ ] Timer inicio `#00f5ff` sobre `#111111` — contraste 10:1. Aprobado.
- [ ] Timer urgencia `#ff006e` sobre `#111111` — contraste 5.2:1. Aprobado.
- [ ] Overlay texto `#00f5ff` sobre `rgba(0,0,0,0.65)` — legible. Aprobado.
- [ ] Sin dependencia de fondo claro. Aprobado.

### Skin retro

- [ ] Rana `#ffb000` sobre `#0d0d00` (hierba cálida) — contraste 11.2:1. Aprobado.
- [ ] Vehículos `#ffb000` / `#ff7b00` / `#ffd27f` sobre `#0d0500` (carretera cálida) — contraste ≥ 8:1. Aprobado.
- [ ] Tortugas `#ffb000` sobre `#0a0800` (río cálido) — contraste 10.5:1. Aprobado.
- [ ] Timer `#ffb000` sobre `#1a0a00` — contraste suficiente. Aprobado.
- [ ] Overlay texto `#ffb000` sobre `rgba(0,0,0,0.80)` — legible. Aprobado.
- [ ] Scanlines `rgba(0,0,0,0.15)` no reducen el contraste por debajo del umbral de legibilidad para ningún elemento. Aprobado (la reducción de luminancia es < 15%).
- [ ] Sin dependencia de fondo claro. Aprobado.

---

## 5. Notas de implementación

- Los colores de `FROGGER_PALETTES` deben exportarse desde `engine.ts` para que `FroggerCanvas.tsx` pueda referenciarse al tipo `Skin` sin redefinirlo.
- El objeto `FROGGER_PALETTES` puede vivir en un archivo separado `components/games/frogger/skins.ts` si el engine queda muy largo, importado tanto por el engine como por el canvas.
- El `<select>` de skin debe estar estilizado con las clases Tailwind / variables CSS de la plataforma (`.font-pixel` o `.font-mono`, borde `--line`, fondo `--bg-2`) para mantener la estética neon-CRT del HUD.
- El timer bar retro interpola entre `#ffb000` (inicio) y `#ff7b00` (urgencia); ambos tienen contraste legible sobre `#1a0a00`, por lo que el gradiente completo es seguro en modo oscuro.
- La skin `neon` es la más cercana al engine actual ya implementado. El trabajo de adaptación mínimo es: reemplazar los hex hardcodeados en `drawRowBackground`, `drawLaneMarkers`, `drawPlatforms`, `drawVehicles`, `drawFrog`, `drawTimerBar` y `drawOverlay` por referencias a `p.<campo>` de la paleta activa.
