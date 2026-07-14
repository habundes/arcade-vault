# Juego FROGGER

| Campo                    | Valor                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Spec**                 | `frogger-juego`                                                                                                                                                                            |
| **Estado**               | `Approved`                                                                                                                                                                                   |
| **Fecha**                | 2026-07-10                                                                                                                                                                                 |
| **Dependencias**         | SPEC 06 (leaderboard y catálogo en Supabase)                                                                                                                                               |
| **Objetivo (una frase)** | Construir el juego FROGGER como componente canvas de React, añadirlo al catálogo como "frogger" e integrarlo en GamePlayer con HUD real (score/vidas/nivel/timer) y controles funcionales. |

---

## 1 · Alcance

**Dentro del alcance:**

- Cover art `.cover-frogger` en `app/globals.css`.
- Motor en `components/games/frogger/engine.ts` con `createEngine()` sin variables globales de módulo.
- Componente cliente `components/games/frogger/FroggerCanvas.tsx` (`"use client"`), canvas lógico 480×640 escalado vía CSS, loop `requestAnimationFrame`.
- Sincronización `onSnapshot` hacia React: `score`, `lives`, `level`, `timeLeft`, `gameOver`.
- Integración en `GamePlayer.tsx` por `game.id === "frogger"`: HUD real (score, vidas, nivel, temporizador), PAUSA, FIN, JUGAR DE NUEVO.

**Fuera del alcance:**

- ❌ Persistencia real de puntuaciones (sigue decorativa).
- ❌ Soporte táctil/móvil.
- ❌ Cambios en `/juego/[id]`.
- ❌ Modificar juegos existentes (incluido `ranaria`, que sigue como placeholder decorativo).
- ❌ Sprites externos — todo se dibuja con primitivas canvas (rectángulos, arcos, texto).
- ❌ Modo multijugador o cooperativo.

---

## 2 · Modelo de datos

### Constantes del mapa

```ts
// components/games/frogger/engine.ts

export const CELL = 40; // píxeles por celda
export const COLS = 12; // celdas de ancho  (480 px)
export const ROWS = 16; // celdas de alto   (640 px)
export const CANVAS_W = COLS * CELL; // 480
export const CANVAS_H = ROWS * CELL; // 640

// Disposición de filas (row 0 = arriba del canvas, row 15 = abajo)
//   row  0      → zona de llegada (5 bases + agua entre ellas)
//   rows 1–5    → río (5 carriles: troncos y tortugas)
//   row  6      → mediana segura (franja de hierba)
//   rows 7–13   → carretera (7 carriles de coches)
//   row  14     → zona segura de inicio (hierba)
//   row  15     → decoración inferior (sin juego)
export const HOME_ROW = 0;
export const RIVER_ROWS = [1, 2, 3, 4, 5] as const;
export const MEDIAN_ROW = 6;
export const ROAD_ROWS = [7, 8, 9, 10, 11, 12, 13] as const;
export const SAFE_ROW = 14;

export const HOME_COLS = [1, 3, 5, 7, 9] as const; // columnas de las 5 bases (de 0–11)
export const TIME_LIMIT = 30; // segundos por intento de cruce
```

### Clases del motor

```ts
// Posición discreta de la rana en la grilla
class Frog {
  col: number; // columna 0–11
  row: number; // fila 0–15 (empieza en row=14, col=5)
  alive: boolean; // false durante la animación de muerte
  dieTimer: number; // ms restantes de animación de muerte (0 cuando viva)
  rideOffset: number; // desplazamiento en px acumulado por la plataforma actual (reset al moverse)
}

// Vehículo en la carretera (filas 7–13)
class Vehicle {
  row: number; // fila donde circula
  x: number; // píxel x del borde izquierdo (float, puede ser negativo o > CANVAS_W)
  widthPx: number; // ancho en píxeles (1–3 celdas)
  speed: number; // px/seg — negativo = moviéndose hacia la izquierda
  colorHex: string; // color de relleno (magenta neón, cyan, amarillo…)
}

// Plataforma en el río (filas 1–5): tronco o tortuga
class Platform {
  type: "log" | "turtle";
  row: number; // fila donde flota
  x: number; // píxel x del borde izquierdo (float)
  widthPx: number; // ancho en píxeles (2–4 celdas)
  speed: number; // px/seg — positivo = derecha, negativo = izquierda
  // Solo para tortugas:
  submerged: boolean; // true → la rana se hunde si está encima
  submergeTimer: number; // ms hasta el próximo cambio de estado (surface ↔ submerge)
  submergePhase: number; // ms acumulados dentro del ciclo actual
}

// Base de llegada en row 0
class HomeBase {
  col: number; // columna del HOME_COLS set (1, 3, 5, 7, 9)
  occupied: boolean; // true cuando la rana llega aquí
}
```

### Estado del motor

```ts
type EngineState = {
  frog: Frog;
  vehicles: Vehicle[]; // todos los coches de todos los carriles
  platforms: Platform[]; // todos los troncos/tortugas de todos los carriles río
  homes: HomeBase[]; // exactamente 5 bases
  score: number;
  lives: number; // empieza en 3
  level: number; // empieza en 1; sube al llenar las 5 bases
  timeLeft: number; // segundos restantes (cuenta regresiva desde TIME_LIMIT)
  phase: "playing" | "dying" | "levelComplete" | "gameover";
};
```

### Snapshot y props del canvas

```ts
// components/games/frogger/FroggerCanvas.tsx

export type FroggerSnapshot = {
  score: number;
  lives: number;
  level: number;
  timeLeft: number; // entero redondeado hacia arriba, 0–30
  gameOver: boolean;
};

// Ref handle expuesto hacia GamePlayer
export type FroggerHandle = {
  reset: () => void; // reinicia partida completa (score=0, lives=3, level=1)
  forceGameOver: () => void; // fuerza phase="gameover" de inmediato
};

// Props del componente
type FroggerCanvasProps = {
  paused: boolean;
  onSnapshot: (s: FroggerSnapshot) => void;
};
```

---

## 3 · Plan de implementación

### Paso 1 — Cover art

Añadir `.cover-frogger` en `app/globals.css`. La portada muestra tres franjas horizontales que evocan el mapa: franja inferior oscura verde-neon (carretera), franja central magenta-oscura (mediana), franja superior azul-oscura con destellos cyan (río). Una silueta píxel de rana 🐸 verde brillante centrada. Sin imágenes externas: todo CSS gradient + pseudo-elemento o SVG inline en el CSS.

Ejemplo de punto de partida:

```css
.cover-frogger {
  background: linear-gradient(
    to bottom,
    #001428 0%,
    #002a50 25%,
    /* río — azul oscuro */ #0a1f0a 25%,
    #0a1f0a 35%,
    /* mediana — verde oscuro */ #1a0028 35%,
    #2d0047 70%,
    /* carretera — magenta oscuro */ #0a1f0a 70%,
    #0a1f0a 100% /* base — verde oscuro */
  );
  position: relative;
  overflow: hidden;
}
.cover-frogger::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 38px,
    rgba(255, 0, 255, 0.12) 38px,
    rgba(255, 0, 255, 0.12) 40px
  );
}
.cover-frogger::after {
  content: "🐸";
  position: absolute;
  font-size: 3rem;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 0 8px #00ff88);
}
```

**Verificación:** la tarjeta "FROGGER" aparece en `/games` con la cover y el botón magenta visible.

---

### Paso 2 — Motor del juego (`components/games/frogger/engine.ts`)

Implementar la función `createEngine()` que devuelve un objeto con los métodos siguientes. **No hay variables fuera de `createEngine()`**; todo el estado vive en el closure.

#### 2a · Inicialización (`initGame` / `initLevel`)

- `initGame()`: score=0, lives=3, level=1; llama a `initLevel()`.
- `initLevel()`: respawn de rana en (col=5, row=14), timeLeft=TIME_LIMIT, vacía homes (occupied=false en las 5), regenera vehicles y platforms con velocidades del nivel actual.

**Generación de carriles (nivel `n`):**

```
velocidadBase = 80 + (n - 1) * 15  // px/seg
```

Cada carril road/river define:

- dirección: alternar (+1, -1) por fila
- velocidad: velocidadBase × factorCarril (varía 0.8–1.4 por fila, hardcodeado)
- densidad: 2–4 vehículos/plataformas por carril, separados al menos `1.5 × widthPx` para no crear bloques imposibles de cruzar

Tabla de carriles **carretera** (row 7–13):

| row | dir | factorVel | widthCeldas | vehículos |
| --- | --- | --------- | ----------- | --------- |
| 7   | →   | 1.0       | 2           | 3         |
| 8   | ←   | 1.2       | 1           | 4         |
| 9   | →   | 0.9       | 2           | 3         |
| 10  | ←   | 1.4       | 3           | 2         |
| 11  | →   | 1.1       | 1           | 4         |
| 12  | ←   | 0.8       | 2           | 3         |
| 13  | →   | 1.3       | 1           | 4         |

Tabla de carriles **río** (row 1–5):

| row | tipo   | dir | factorVel | widthCeldas | objetos |
| --- | ------ | --- | --------- | ----------- | ------- |
| 1   | log    | →   | 1.0       | 3           | 3       |
| 2   | turtle | ←   | 0.8       | 2           | 3       |
| 3   | log    | →   | 1.2       | 4           | 2       |
| 4   | turtle | ←   | 1.0       | 2           | 4       |
| 5   | log    | →   | 0.9       | 3           | 3       |

**Tortugas:** ciclo de inmersión cada 4–6 seg (configurable). Fase emergida: 3 seg, fase hundiéndose: 1 seg (parpadeo), fase sumergida: 1.5 seg. La rana puede posarse en la fase emergida y hundiéndose (pero si `submerged=true` la rana cae).

**Distribución inicial aleatoria:** los objetos del mismo carril se inicializan con `x` repartidas uniformemente por el ancho del carril para evitar agrupaciones iniciales.

#### 2b · Update (`update(dtMs: number)`)

Recibe el delta de tiempo en milisegundos. Acciones por orden:

1. **Si `phase !== "playing"`:** no procesar física (solo decrementar `dieTimer` si `phase === "dying"`; al expirar, ejecutar `respawnFrog()`).
2. **Mover vehículos:** `vehicle.x += vehicle.speed * (dtMs / 1000)`. Wrap toroidal: si se va por la derecha (`x > CANVAS_W + vehicle.widthPx`) → `x = -vehicle.widthPx`; análogo para la izquierda.
3. **Mover plataformas:** mismo wrap toroidal.
4. **Ciclos de inmersión de tortugas:** actualizar `submergePhase += dtMs`; cambiar `submerged` según el ciclo.
5. **Arrastrar rana:** si la rana está en una fila del río (rows 1–5) y está viva, buscar la plataforma bajo ella; si la hay → `frog.rideOffset += platform.speed * (dtMs / 1000)`. Aplicar desplazamiento en px → traducir a columna actual: si la rana sale del canvas lateralmente → muere (caída al agua).
6. **Cuenta regresiva:** `timeLeft -= dtMs / 1000`. Si `timeLeft ≤ 0` → `killFrog("timeout")`.
7. **Colisión coches:** si la rana está en road row y su celda solapas con algún vehículo (AABB en píxeles) → `killFrog("car")`.
8. **Colisión agua:** si la rana está en river row (1–5) y **no** está sobre ninguna plataforma (y no está ya muriendo) → `killFrog("water")`.
9. **Colisión plataforma sumergida:** si la plataforma bajo la rana tiene `submerged=true` → `killFrog("water")`.
10. **Detección de llegada:** si `frog.row === 0` → verificar si `frog.col` pertenece a `HOME_COLS`. Sí: marcar base como occupied, sumar puntos, comprobar si las 5 están llenas (`checkLevelComplete()`). No: `killFrog("water")` (cayó en agua entre bases).

#### 2c · Movimiento de la rana (`moveFrog(dir)`)

Llamado desde el componente canvas en respuesta a teclas; ignorado si `phase !== "playing"` o `frog.alive === false`.

- `"UP"`: `frog.row = Math.max(0, frog.row - 1)`. Si `frog.row` bajó respecto al máximo alcanzado en este intento → no puntuar. Si avanzó → `score += 10`.
- `"DOWN"`: `frog.row = Math.min(SAFE_ROW, frog.row + 1)`.
- `"LEFT"`: `frog.col = Math.max(0, frog.col - 1)`.
- `"RIGHT"`: `frog.col = Math.min(COLS - 1, frog.col + 1)`.

En todos los casos, `frog.rideOffset = 0` (la rana se reposiciona discretamente; el arrastre de plataforma recomienza desde cero en el siguiente frame).

#### 2d · Puntuación

| Evento                    | Puntos                      |
| ------------------------- | --------------------------- |
| Avanzar una celda (row-1) | +10                         |
| Llegar a una base libre   | +200                        |
| Bonus de tiempo al llegar | `Math.floor(timeLeft) × 20` |
| Completar nivel (5 bases) | +1000                       |

#### 2e · Muertes y vidas (`killFrog(cause)`)

```
phase = "dying"
frog.alive = false
frog.dieTimer = 800  // ms de animación
lives -= 1
if (lives <= 0) → al expirar dieTimer: phase = "gameover"
else → al expirar dieTimer: respawnFrog()
```

`respawnFrog()`: `frog.col=5`, `frog.row=14`, `frog.alive=true`, `frog.rideOffset=0`, `timeLeft=TIME_LIMIT`, `phase="playing"` (sin resetear score ni homes del nivel).

#### 2f · Nivel completo (`checkLevelComplete`)

Si `homes.every(h => h.occupied)`:

```
score += 1000
phase = "levelComplete"  // pausa breve de 1500 ms (manejada con un timer interno)
→ al expirar: level++; initLevel()
```

#### 2g · API pública de `createEngine()`

```ts
export function createEngine() {
  // ... estado interno ...

  return {
    initGame,
    update(dtMs: number): void,
    moveFrog(dir: "UP" | "DOWN" | "LEFT" | "RIGHT"): void,
    draw(ctx: CanvasRenderingContext2D): void,
    forceGameOver(): void,   // pone phase="gameover" de inmediato
    getSnapshot(): FroggerSnapshot,
  };
}
```

#### 2h · Dibujo (`draw(ctx)`)

Todo con primitivas canvas 2D; sin imágenes externas. Paleta neon-CRT:

| Zona           | Color de fondo | Acento                       |
| -------------- | -------------- | ---------------------------- |
| Hierba/mediana | `#0a1f0a`      | `#00ff44` (borde de celda)   |
| Carretera      | `#1a0028`      | `#ff00ff` (líneas de carril) |
| Río            | `#001428`      | `#00ccff` (brillo agua)      |
| Bases vacías   | `#001428`      | `#444`                       |
| Bases ocupadas | `#001428`      | `#00ff44` (nenúfar verde)    |

Elementos dibujados por frame (orden de capas):

1. Fondo de cada fila según zona.
2. Marcas de carriles (líneas `#ffffff22` entre filas de carretera).
3. Plataformas: troncos (`#5a3300` relleno, `#8b5e27` borde); tortugas emergidas (`#3aff8a`, hexágono de 3 celdas dividido en secciones); tortugas hundiéndose (parpadeo α 0.4); tortugas sumergidas (no dibujadas — sí dibujadas como wave `#00ccff55`).
4. Vehículos: rectángulo de color + borde negro + faros blancos rectangulares.
5. Bases de llegada: nenúfar verde (`#00ff44`) si libre; rana-mini (`#00ff88` con punto rojo como ojo) si occupied.
6. Rana: cuadrado verde-neón `#00ff44` de `CELL-4` de lado, con dos ojos (círculos blancos) apuntando en la dirección del último movimiento.
   - Animación de muerte: rana parpadea (α alterna 1/0 cada 100 ms) durante `dieTimer`.
7. Timer overlay: barra de progreso horizontal en la parte superior del canvas (`height=6px`), de verde a rojo según `timeLeft/TIME_LIMIT`.
8. Overlay "NIVEL X" centrado durante la fase `levelComplete`.
9. Overlay "GAME OVER" durante `phase="gameover"` (el modal de React tomará el control, pero si hay lag se muestra en canvas).

**Verificación paso 2:** `npx tsc --noEmit` limpio; `import { createEngine } from ".../engine"` funciona sin errores de tipos.

---

### Paso 3 — Componente canvas (`components/games/frogger/FroggerCanvas.tsx`)

```
"use client"

const LOGICAL_W = 480;
const LOGICAL_H = 640;
```

**Estructura del componente:**

```tsx
const FroggerCanvas = forwardRef<FroggerHandle, FroggerCanvasProps>(
  ({ paused, onSnapshot }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef(createEngine());
    const rafRef = useRef<number>(0);
    const lastTsRef = useRef<number>(0);

    // Imperativo hacia GamePlayer
    useImperativeHandle(ref, () => ({
      reset: () => engineRef.current.initGame(),
      forceGameOver: () => engineRef.current.forceGameOver(),
    }));

    // Loop principal
    useEffect(() => {
      engineRef.current.initGame();
      const ctx = canvasRef.current!.getContext("2d")!;

      const tick = (ts: number) => {
        const dt = Math.min(ts - lastTsRef.current, 50); // cap 50 ms
        lastTsRef.current = ts;
        if (!paused) engineRef.current.update(dt);
        engineRef.current.draw(ctx);
        onSnapshot(engineRef.current.getSnapshot());
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }, []); // paused se cierra en el tick; ver nota abajo

    // Teclado — solo teclas de movimiento de la rana
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (
          !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        )
          return;
        e.preventDefault();
        if (paused) return;
        const dir = e.key.replace("Arrow", "") as
          "Up" | "Down" | "Left" | "Right";
        engineRef.current.moveFrog(
          dir.toUpperCase() as "UP" | "DOWN" | "LEFT" | "RIGHT",
        );
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [paused]);

    return (
      <canvas
        ref={canvasRef}
        width={LOGICAL_W}
        height={LOGICAL_H}
        style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
      />
    );
  },
);
FroggerCanvas.displayName = "FroggerCanvas";
export default FroggerCanvas;
```

**Nota sobre `paused`:** el `tick` lee `paused` desde el closure. Para que el efecto lea la prop más reciente sin re-montar el loop, se puede usar un `useRef<boolean>` sincronizado con `paused` via un efecto separado (mismo patrón que en `AsteroidsCanvas`).

**Verificación paso 3:** montar en una ruta temporal (ej. `/test-frogger`); la rana es controlable con flechas; los troncos y tortugas se mueven; los coches circulan; la rana muere al caer al agua o ser atropellada; el timer decrece.

---

### Paso 4 — Integración en `GamePlayer.tsx`

Agregar la rama `game.id === "frogger"` al switch/if existente:

```tsx
// Importar al inicio del archivo
import FroggerCanvas, {
  type FroggerHandle,
  type FroggerSnapshot,
} from "@/components/games/frogger/FroggerCanvas";

// Estado adicional solo para frogger
const froggerRef = useRef<FroggerHandle>(null);
const [froggerSnap, setFroggerSnap] = useState<FroggerSnapshot>({
  score: 0,
  lives: 3,
  level: 1,
  timeLeft: 30,
  gameOver: false,
});

// Dentro del renderizado, en lugar de la arena decorativa:
{
  game.id === "frogger" && (
    <FroggerCanvas
      ref={froggerRef}
      paused={isPaused}
      onSnapshot={(s) => {
        setFroggerSnap(s);
        if (s.gameOver && !modalOpen) openModal(s.score);
      }}
    />
  );
}
```

**HUD para frogger** — en la sección de HUD del `GamePlayer`, añadir una rama extra que muestre:

- Score: `froggerSnap.score`
- Vidas: `froggerSnap.lives` (iconos de rana o `♥` × lives)
- Nivel: `froggerSnap.level`
- Timer: `froggerSnap.timeLeft`s (mostrado en rojo si `timeLeft ≤ 10`)

**Botón PAUSA:** ya manejado por la prop `paused` del canvas.

**Botón FIN:** llamar `froggerRef.current?.forceGameOver()`.

**Botón JUGAR DE NUEVO (modal):** llamar `froggerRef.current?.reset()` + resetear `froggerSnap` + cerrar modal.

**Verificación paso 4:** en `/jugar/frogger`:

- HUD muestra score/vidas/nivel/timer en vivo.
- PAUSA congela la rana y los vehículos.
- FIN abre el modal con el score real.
- JUGAR DE NUEVO reinicia desde cero sin recargar la página.

---

### Paso 5 — Repaso y build

1. Jugar una partida completa: cruzar la carretera, llegar al río, llenar al menos una base.
2. Verificar que el timer agota una vida y respawnea correctamente.
3. Verificar que perder 3 vidas abre el modal de fin con el score correcto.
4. Verificar que los otros juegos (`asteroides`, `arkanoid`, `snake`) siguen funcionando sin cambios.
5. `npm run lint` y `npm run build` sin errores.

**Verificación:** build limpio, todos los juegos existentes sin regresión.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores ni warnings.
- [ ] `/games` muestra la tarjeta "FROGGER" con cover `.cover-frogger` y botón magenta.
- [ ] `/juego/frogger` renderiza el detalle genérico (portada, tags, stat-strip, leaderboard) sin errores.
- [ ] `/jugar/frogger` renderiza el canvas del juego (no la arena decorativa genérica).
- [ ] **Controles:** `↑` mueve la rana una celda hacia arriba, `↓` hacia abajo, `←` a la izquierda, `→` a la derecha; las flechas no hacen scroll de la página mientras se juega.
- [ ] **Carretera:** los coches circulan en carriles horizontales a velocidades distintas y alternando dirección; la colisión con un coche hace perder una vida con animación de muerte.
- [ ] **Río:** la rana viaja arrastrada por troncos y tortugas; caer al agua (sin soporte) hace perder una vida; las tortugas que se sumergen hunden a la rana.
- [ ] **Timer:** la barra de tiempo decrece de 30 a 0; al agotarse, la rana pierde una vida y reaparece con el timer reiniciado; el timer también se reinicia al llegar a una base.
- [ ] **Bases:** al llegar a una de las 5 bases, se marca como ocupada (visual de nenúfar verde con rana) y no puede repetirse; caer entre bases mata a la rana.
- [ ] **Level up:** al llenar las 5 bases se muestra overlay "NIVEL X", el nivel sube, las bases se resetean, los vehículos aumentan de velocidad y la rana reaparece en la posición inicial.
- [ ] **HUD real:** score, vidas (♥), nivel y timeLeft actualizados en vivo desde el motor; el timer se muestra en rojo cuando quedan ≤ 10 segundos.
- [ ] **PAUSA:** congela el juego (rana, vehículos y plataformas dejan de moverse); REANUDAR continúa exactamente donde quedó.
- [ ] **FIN:** fuerza fin de partida y abre el modal con el score real.
- [ ] **JUGAR DE NUEVO:** reinicia una partida nueva (score 0, 3 vidas, nivel 1, 5 bases vacías) sin recargar la página.
- [ ] Los juegos existentes (`asteroides`, `arkanoid`, `snake`, y los decorativos) siguen sin cambios de comportamiento.

---

## 5 · Decisiones tomadas y descartadas

| Decisión                       | Elegida                                                                                 | Descartada                                         | Justificación                                                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Canvas orientation**         | Portrait 480×640 (3:4), aspect-ratio 3:4 en el contenedor CRT para este juego           | Landscape 640×480 o cuadrado 480×480               | El mapa de Frogger es naturalmente vertical (16 filas de carretera + río + zonas safe); portrait da más espacio legible a cada carril.      |
| **Movimiento de rana**         | Discreto célula a célula, sin animación de deslizamiento                                | Movimiento suave con tweening entre celdas         | Fidelidad al arcade original; simplifica la detección de colisiones (siempre en unidades de celda); reduce complejidad del motor.           |
| **Arrastre en río**            | Acumulado en `rideOffset` (float px), aplicado cada frame, rana se reposiciona al mover | Mover `frog.col` fraccional                        | Mantiene la posición de la rana en coordenadas enteras de celda para colisiones; el offset es solo visual hasta que la rana decide moverse. |
| **Sin sprites externos**       | Todo dibujado con primitivas canvas (rect, arc, texto)                                  | Spritesheet PNG con el tileset clásico             | Evita dependencia de assets; estética neon-CRT coherente con arkanoid/asteroides; sin spec extra de assets.                                 |
| **Tortugas con inmersión**     | Ciclo surface→sink→submerged con parpadeo en fase sink                                  | Tortugas siempre emergidas (solo como plataformas) | La mecánica de inmersión es parte definitoria del Frogger original; aumenta la tensión sin complejidad de implementación excesiva.          |
| **Encapsulamiento motor**      | `createEngine()` factory, todo en closure, sin globals de módulo                        | Variables globales de módulo (como el JS original) | Consistente con el patrón de `asteroides`, `tetris`, `arkanoid`, `snake`; evita fugas de estado entre partidas en React Strict Mode.        |
| **Control de pausa**           | Prop `paused` del componente; el RAF sigue corriendo pero `update()` no se llama        | Cancelar/reiniciar RAF al pausar                   | Permite que `draw()` siga llamándose en pausa (pantalla no se congela visualmente en negro); más simple que gestionar RAF cancelado.        |
| **color del botón**            | `magenta` (libre en engines reales; `ranaria` decorativo usa `green`)                   | `green` (duplicaría `ranaria`) / `cyan` / `yellow` | Magenta diferencia el engine real del placeholder; coherente con la estética neon del juego.                                                |
| **Timer en snapshot**          | `timeLeft` incluido en `FroggerSnapshot` (4 campos vs 3 de otros juegos)                | Mostrar timer solo en el canvas, fuera del HUD     | El timer es información crítica para el jugador; el HUD externo de `GamePlayer` debe reflejarlo en vivo.                                    |
| **Persistencia de puntuación** | Decorativa (sin Supabase en el motor)                                                   | Guardar puntuaciones reales en `insertScore`       | `insertScore` ya lo maneja `GamePlayer` genéricamente cuando el jugador pulsa "GUARDAR"; no hace falta lógica extra en el engine.           |

---

## 6 · Riesgos identificados

| Riesgo                                                                                                                                                            | Mitigación                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **React Strict Mode** monta/desmonta efectos dos veces en dev, pudiendo duplicar el loop RAF o los listeners de teclado                                           | El `useEffect` del loop cancela `rafRef.current` en su cleanup; el `useEffect` del teclado remueve el listener en cleanup. Verificar en `npm run dev` que no hay doble velocidad ni doble input. |
| **CSS scaling portrait** (3:4) puede verse distorsionado si el contenedor CRT no soporta aspect-ratio variable por juego                                          | Añadir rama en los estilos del contenedor de `GamePlayer` para `game.id === "frogger"` con `aspect-ratio: 3/4`; el canvas CSS `width:100%; height:100%` rellena sin deformar.                    |
| **AABB en píxeles vs celda discreta**: la rana está en (col, row) pero los vehículos tienen posición continua; una celda podría parecer libre pero haber colisión | Usar hitbox reducida para la rana (`CELL * 0.7` centrada en la celda) y hitbox reducida para vehículos (`widthPx - 4`); da margen visual sin sacrificar fairness.                                |
| **Arrastre lateral fuera del canvas**: si una plataforma lenta arrastra la rana más allá de COLS=0 o COLS=11, puede salir del mapa sin que el jugador lo vea      | Detectar en `update()` si `frog.col < 0 \|\| frog.col >= COLS` después de aplicar `rideOffset`; en ese caso llamar `killFrog("water")` inmediatamente.                                           |
| **Fase `levelComplete`**: si el usuario pulsa JUGAR DE NUEVO justo durante la pausa de nivel, el motor podría quedar en estado inconsistente                      | `reset()` llama a `initGame()` que siempre fuerza `phase="playing"` y reinicia todo el estado desde cero, independientemente de la fase actual.                                                  |
