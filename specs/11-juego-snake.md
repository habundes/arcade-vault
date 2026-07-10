# 11 · Juego Snake

| Campo                    | Valor                                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `11-juego-snake`                                                                                                                                                                                        |
| **Estado**               | `Approved`                                                                                                                                                                                                 |
| **Fecha**                | 2026-07-10                                                                                                                                                                                              |
| **Dependencias**         | SPEC 06 (leaderboard y catálogo en Supabase)                                                                                                                                                            |
| **Objetivo (una frase)** | Implementar el juego Snake desde cero con motor TypeScript, sprites de frutas del atlas existente, 3 vidas y velocidad incremental, integrándolo en `GamePlayer` con HUD real y controles de pausa/fin. |

---

## 1 · Alcance

**Dentro del alcance:**

- **Copiar assets** de `references/assets/snake-assets/` a `public/games/snake/`
  (fruits.png + sprites.js).
- **Cover art** `.cover-snake` ya existe en `app/globals.css` — se usa sin cambios.
- **Motor del juego** `components/games/snake/engine.ts`: cuadrícula 40×40 sobre canvas
  800×800, lógica de movimiento por turnos (tick), colisión con paredes y cuerpo propio,
  sistema de 3 vidas, puntuación (+10 por fruta), velocidad incremental, fruta aleatoria
  del atlas de 22 sprites. Encapsulado en `createEngine()` sin variables globales.
- **Componente cliente** `components/games/snake/SnakeCanvas.tsx` (`"use client"`):
  canvas `800×800` escalado vía CSS al contenedor cuadrado, loop `requestAnimationFrame`
  con tick controlado por intervalo, listeners de teclado (flechas + WASD). PAUSA cancela
  el RAF completo; REANUDAR lo reinicia.
- **Sincronización hacia React:** callback `onSnapshot` con `score`, `lives`, `level` y
  `gameOver` en cada tick.
- **`GamePlayer.tsx` ramifica por `game.id === "snake"`:** renderiza `SnakeCanvas`,
  alimenta el HUD con datos reales, conecta PAUSA (cancela/reinicia RAF), FIN (fuerza
  game over en el motor) y JUGAR DE NUEVO (reinicia motor completo).

**Fuera del alcance (explícito):**

- ❌ Modificar cualquier otro juego del catálogo.
- ❌ Soporte táctil/móvil.
- ❌ Cambios en `/juego/[id]` — ya funciona genéricamente.
- ❌ Persistencia de puntuaciones más allá del `insertScore` que ya maneja `GamePlayer.tsx`.
- ❌ Modos multijugador o tablas de niveles predefinidos.

---

## 2 · Modelo de datos

**Estado interno del motor** (encapsulado en `createEngine()`):

```ts
// components/games/snake/engine.ts

const CANVAS_SIZE = 800;
const CELL_SIZE = 20;
const GRID = CANVAS_SIZE / CELL_SIZE; // 40×40

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

type Cell = { x: number; y: number }; // coordenadas de cuadrícula (0–39)

type FruitKey =
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

type Fruit = {
  cell: Cell;
  key: FruitKey; // qué sprite del atlas dibujar
};

type EngineState = {
  snake: Cell[]; // [0] = cabeza, último = cola
  dir: Direction; // dirección actual
  nextDir: Direction; // dirección encolada (para evitar giro inmediato inverso)
  fruit: Fruit; // fruta activa
  score: number;
  lives: number; // inicia en 3
  level: number; // sube cada 50 pts (5 frutas)
  tickMs: number; // intervalo de tick, decrece con el nivel
  gameState: "playing" | "dead" | "gameover";
  // "dead": perdió una vida, animación breve antes de respawn
};
```

**Puente hacia React** (prop callback de `SnakeCanvas`):

```ts
// components/games/snake/SnakeCanvas.tsx
type SnakeSnapshot = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean; // true cuando gameState === "gameover"
};
```

**Props de `SnakeCanvas`:**

```ts
type SnakeCanvasProps = {
  paused: boolean; // true → cancela RAF; false → lo reinicia
  resetKey: number; // incrementar → reinicia el motor completo
  onSnapshot: (s: SnakeSnapshot) => void;
  onGameOver?: () => void; // llamado una sola vez al detectar gameOver
};
```

No hay cambios en `app/data/types.ts`. La fila en `games` se inserta vía SQL (Spec 12).

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Copiar assets.** Copiar `references/assets/snake-assets/fruits.png` y `sprites.js`
   a `public/games/snake/`.
   **Verificación:** `fruits.png` accesible en `/games/snake/fruits.png` desde el navegador.

2. **Motor del juego.** Crear `components/games/snake/engine.ts` con `createEngine()`:
   - Cuadrícula 40×40, `CELL_SIZE = 20`, `CANVAS_SIZE = 800`.
   - Serpiente inicial de 3 celdas centrada, dirección RIGHT.
   - `tick()`: mueve la serpiente, detecta colisión con pared o cuerpo, gestiona vida
     perdida (respawn centrado) vs. game over (sin vidas), detecta comer fruta (+10 pts,
     crece, nueva fruta aleatoria, recalcula `tickMs`).
   - Velocidad: `tickMs = Math.max(80, 300 - (level - 1) * 20)` ms; `level` sube
     cada 50 pts.
   - `forceGameOver()`: fuerza `gameState = "gameover"` independientemente de las vidas.
   - `reset()`: devuelve el motor al estado inicial.
     **Verificación:** `npx tsc --noEmit` limpio; módulo importable.

3. **Componente canvas.** Crear `components/games/snake/SnakeCanvas.tsx` (`"use client"`):
   - `<canvas width={800} height={800}>` con `width: 100%; height: 100%` CSS.
   - Instancia de `createEngine()` en `useRef`; imagen `fruits.png` cargada en `useEffect`
     de mount; RAF arranca tras `onload`.
   - Loop RAF: llama `tick()` según `tickMs` acumulado con `dt`; llama `draw()` cada frame.
   - `draw()`: fondo de cuadrícula, cuerpo de la serpiente (rectángulos verdes), cabeza
     diferenciada, fruta dibujada con `ctx.drawImage` usando coordenadas del atlas
     (`sprites.js` portado como constante interna).
   - Listeners `keydown` para flechas y WASD: encolan `nextDir` sin permitir giro inverso.
   - Prop `paused`: `true` → cancela RAF con `cancelAnimationFrame`; `false` → lo reinicia.
   - Prop `resetKey`: `useEffect([resetKey])` llama `engine.reset()` y reinicia el RAF.
   - `onSnapshot` invocado en cada tick con datos actuales.
   - `onGameOver` llamado una sola vez al detectar `gameOver: true`.
     **Verificación:** montado en ruta temporal, la serpiente se mueve, come frutas con sprite
     correcto, crece, pierde vida al chocar, respawnea, y llega a game over tras 3 choques.

4. **Integración en `GamePlayer.tsx`.** Ramificar por `game.id === "snake"`:
   - Importar `SnakeCanvas` y tipos.
   - Añadir `isSnake`, `snakeRef`, `snakeResetKey` al componente.
   - Renderizar `<SnakeCanvas>` en el `crt-screen` con contenedor `aspect-ratio: 1/1`.
   - HUD: `lives` (corazones), `score` y `level` reales; excluir del fake score timer.
   - PAUSA → prop `paused={true}`; FIN → `snakeRef.current?.forceGameOver()`;
     JUGAR DE NUEVO → incrementa `snakeResetKey`.
     **Verificación:** en `/jugar/snake` el HUD refleja datos reales; PAUSA congela el juego;
     FIN abre el modal; JUGAR DE NUEVO reinicia sin recargar la página.

5. **Repaso y build.** Jugar hasta game over para confirmar flujo completo. Verificar que
   los demás juegos siguen sin cambios. `npm run lint` y `npm run build` limpios.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `fruits.png` accesible en `/games/snake/fruits.png` desde el navegador.
- [ ] `/games` muestra la tarjeta "SNAKE" con cover `.cover-snake` verde y botón green.
- [ ] `/juego/snake` carga sin errores y muestra estado vacío de leaderboard.
- [ ] `/jugar/snake` renderiza el canvas del juego (no la arena decorativa genérica).
- [ ] **Cuadrícula:** canvas 800×800 con celdas de 20×20 px, escalado proporcionalmente
      al contenedor cuadrado.
- [ ] **Controles:** flechas y WASD mueven la serpiente; no se permite giro de 180°
      (dirección inversa inmediata).
- [ ] **Movimiento:** la serpiente avanza un tick a la vez; la velocidad aumenta con el nivel.
- [ ] **Frutas:** una fruta activa a la vez, sprite aleatorio del atlas de 22 frutas,
      reaparece en celda libre al ser comida.
- [ ] **Puntuación:** +10 pts por fruta; el level sube cada 50 pts.
- [ ] **Velocidad:** `tickMs` decrece con el nivel; mínimo 80 ms entre ticks.
- [ ] **Colisión con pared:** la serpiente pierde una vida y respawnea centrada.
- [ ] **Colisión consigo misma:** la serpiente pierde una vida y respawnea centrada.
- [ ] **3 vidas:** tras la tercera colisión, `gameOver: true` → modal de fin con score real.
- [ ] **HUD real:** score, lives (corazones) y level actualizados en vivo.
- [ ] **PAUSA:** cancela el RAF (juego congelado); REANUDAR lo reinicia exactamente donde quedó.
- [ ] **FIN:** fuerza game over en el motor y abre el modal con el score alcanzado.
- [ ] **JUGAR DE NUEVO:** reinicia desde cero sin recargar la página.
- [ ] Los demás juegos del catálogo siguen sin cambios de comportamiento.

---

## 5 · Decisiones tomadas y descartadas

| Decisión                          | Elegida                                                                      | Descartada                                 | Justificación                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprites vs formas geométricas** | Sprites del atlas `fruits.png` para la fruta; rectángulos CSS para el cuerpo | Cuerpo con sprites también                 | Los sprites de frutas aportan identidad visual sin coste; el cuerpo geométrico es más legible y evita dependencias de un segundo spritesheet.   |
| **Tamaño de celda**               | 20×20 px sobre canvas 800×800 (cuadrícula 40×40)                             | Celdas más grandes (25×25, 32×32)          | 20×20 da suficiente espacio para maniobrar y permite que los sprites de fruta (escalados a 40×40) sean visibles sin distorsión.                 |
| **Sistema de vidas**              | 3 vidas con respawn centrado al chocar                                       | Game over inmediato al primer choque       | Reduce la frustración del jugador casual; mantiene tensión al incrementar velocidad.                                                            |
| **Pausa**                         | Cancela RAF completo                                                         | Solo detener `update()`                    | Snake no tiene animaciones en curso al pausar (a diferencia de Arkanoid con explosiones); cancelar el RAF es más simple y coherente con Tetris. |
| **Velocidad incremental**         | `tickMs = max(80, 300 − (level−1)×20)`                                       | Velocidad fija o vinculada al score lineal | Escala suavemente; el tope de 80 ms evita que el juego sea injugable en niveles altos.                                                          |
| **Encapsulamiento del motor**     | `createEngine()` sin variables globales                                      | Variables globales de módulo               | Evita fugas de estado entre partidas en el ciclo de vida de React — mismo patrón que Asteroides, Tetris y Arkanoid.                             |

---

## 6 · Riesgos identificados

| Riesgo                                                                                                                               | Mitigación                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fruits.png` se carga asincrónamente; si el RAF arranca antes del `onload`, los sprites de fruta aparecerán en blanco.               | El RAF solo arranca dentro del callback `onload` de la imagen; el motor se inicializa antes pero `draw()` no dibuja la fruta hasta que la imagen esté disponible. |
| React Strict Mode monta/desmonta efectos dos veces, pudiendo duplicar el RAF o los listeners de teclado.                             | El cleanup del `useEffect` cancela el frame pendiente y remueve todos los listeners; verificado en `npm run dev`.                                                 |
| El escalado CSS de 800×800 a un contenedor más estrecho puede distorsionar la cuadrícula si el contenedor no respeta proporción 1:1. | El contenedor en `GamePlayer` impone `aspect-ratio: 1/1`; el canvas `width: 100%; height: 100%` garantiza escala proporcional.                                    |
| Al perder una vida y respawnear, la nueva fruta podría aparecer sobre el cuerpo de la serpiente.                                     | `spawnFruit()` filtra celdas ocupadas por la serpiente antes de elegir aleatoriamente.                                                                            |
