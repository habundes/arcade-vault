# 07 · Juego Tetris

| Campo                    | Valor                                                                                                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `07-juego-tetris`                                                                                                                                                                                                                                   |
| **Estado**               | `Approved`                                                                                                                                                                                                                                             |
| **Fecha**                | 2026-07-09                                                                                                                                                                                                                                          |
| **Dependencias**         | SPEC 06 (leaderboard y catálogo en Supabase)                                                                                                                                                                                                        |
| **Objetivo (una frase)** | Portar el juego Tetris de `references/started-games/03-tetris/` a un componente canvas de React, añadirlo al catálogo como nuevo juego "tetris" e integrarlo en `GamePlayer` con HUD real (score/lines/level) y controles de pausa/fin funcionales. |

---

## 1 · Alcance

**Dentro del alcance:**

- **INSERT en tabla `games`** (Supabase): fila `id: "tetris"` con todos sus campos — el catálogo ya lee de Supabase tras SPEC 06, no hay archivo estático que tocar.
- **Nuevo cover art** `.cover-tetris` en `app/globals.css`: degradado amarillo monocromático.
- **Puerto del motor del juego** desde `references/started-games/03-tetris/game.js` a un módulo TS en `components/games/tetris/engine.ts`: mismas constantes (`COLS`, `ROWS`, `BLOCK`, `COLORS`, `PIECES`, `LINE_SCORES`), mismas funciones (`collide`, `rotateCW`, `tryRotate`, `merge`, `clearLines`, `ghostY`, `hardDrop`, `softDrop`, `lockPiece`, `spawn`, `randomPiece`, `createBoard`) encapsuladas por instancia sin variables globales de módulo.
- **Componente cliente** `components/games/tetris/TetrisCanvas.tsx` (`"use client"`): canvas principal (300×600, resolución lógica interna fija) + canvas de preview de pieza siguiente (120×120), escalado visual vía CSS al contenedor, loop vía `requestAnimationFrame`, listeners de teclado con `preventDefault` en espacio solo mientras está montado.
- **Sincronización hacia React:** el canvas reporta `score`, `lines`, `level` y `gameOver` en cada frame mediante callback `onSnapshot`.
- **`GamePlayer.tsx` ramifica por `game.id === "tetris"`:** renderiza `TetrisCanvas` en vez de la arena decorativa, muestra score/lines/level reales en el HUD, conecta PAUSA (cancela RAF completo), FIN (fuerza game over en el motor) y JUGAR DE NUEVO (reinicia el motor completo).

**Fuera del alcance (explícito):**

- ❌ Modificar cualquier otro juego del catálogo.
- ❌ Soporte táctil/móvil o controles alternativos al teclado.
- ❌ Cambios en `/juego/[id]` — ya funciona genéricamente con cualquier `Game`.
- ❌ Animaciones de line-clear (flash, explosión) — el original no las tiene y no se agregan aquí.
- ❌ Persistencia de puntuaciones más allá del `insertScore` que ya maneja `GamePlayer.tsx` para todos los juegos.

---

## 2 · Modelo de datos

**Estado interno del motor** (encapsulado en `createEngine()`, portado 1:1 de `game.js`):

```ts
// components/games/tetris/engine.ts

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
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

// PIECES[1..8]: matrices 2D con índice de color
type Piece = { type: number; shape: number[][]; x: number; y: number };

type EngineState = {
  board: number[][]; // ROWS×COLS; 0 = vacío, 1–8 = índice de color
  current: Piece; // pieza activa
  next: Piece; // pieza siguiente (para preview)
  score: number;
  lines: number; // líneas eliminadas acumuladas
  level: number;
  gameOver: boolean;
};
```

**Puente hacia React** (prop callback de `TetrisCanvas`, no persistido):

```ts
// components/games/tetris/TetrisCanvas.tsx
type TetrisSnapshot = {
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
};
onSnapshot?: (s: TetrisSnapshot) => void; // invocado cada frame
```

**Props de `TetrisCanvas`:**

```ts
type TetrisCanvasProps = {
  paused: boolean; // true → cancela RAF; false → reanuda
  resetKey: number; // incrementar → llama initGame() y reinicia
  onSnapshot: (s: TetrisSnapshot) => void;
  onGameOver?: () => void; // llamado una sola vez al detectar gameOver
};
```

No hay cambios en `app/data/types.ts`. La fila en `games` se inserta vía SQL (Spec B).

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Cover art.** Crear `.cover-tetris` en `app/globals.css` (degradado amarillo monocromático).
   **Verificación:** clase visible en el inspector; no rompe otros covers existentes.

2. **Motor del juego.** Crear `components/games/tetris/engine.ts` portando 1:1 las constantes
   (`COLS`, `ROWS`, `BLOCK`, `COLORS`, `PIECES`, `LINE_SCORES`) y funciones (`collide`,
   `rotateCW`, `tryRotate`, `merge`, `clearLines`, `ghostY`, `hardDrop`, `softDrop`,
   `lockPiece`, `spawn`, `randomPiece`, `createBoard`) dentro de una función `createEngine()`
   que devuelve el estado (`EngineState`) y los métodos necesarios — sin variables globales
   de módulo.
   **Verificación:** `npx tsc --noEmit` limpio; el módulo es importable.

3. **Componente canvas.** Crear `components/games/tetris/TetrisCanvas.tsx` (`"use client"`):
   - Canvas principal `<canvas width={300} height={600}>` + canvas preview
     `<canvas width={120} height={120}>` para la pieza siguiente.
   - CSS `width: 100%; height: 100%` en el canvas principal para escalar al contenedor.
   - Instancia de `createEngine()` en un `useRef`; loop `requestAnimationFrame` con `dt`
     capado a 50 ms.
   - Listeners de teclado (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `X`, `ArrowDown`, `Space`)
     con `preventDefault` en `Space`; agregados en mount, removidos en cleanup.
   - Prop `paused`: cancela RAF con `cancelAnimationFrame` sin llamar `update` ni `draw`.
   - Prop `resetKey`: `useEffect([resetKey])` llama `initGame()` y reinicia el loop.
   - `onSnapshot({score, lines, level, gameOver})` invocado cada frame.
     **Verificación:** montado en ruta temporal, el juego es jugable (piezas caen, rotan,
     líneas se eliminan, pieza siguiente se muestra en el preview).

4. **Integración en `GamePlayer.tsx`.** Ramificar por `game.id === "tetris"`:
   - Renderizar `<TetrisCanvas>` en lugar de la arena decorativa.
   - Eliminar el timer falso de score para este caso.
   - Alimentar `score`/`lines`/`level` del HUD desde `onSnapshot`
     (el HUD mostrará los tres valores).
   - PAUSA → `paused={true}` cancela RAF completo; REANUDAR → `paused={false}` lo retoma.
   - FIN → fuerza `gameOver` en el motor y abre el modal con el score real.
   - JUGAR DE NUEVO → incrementa `resetKey` para reiniciar el motor, además de resetear
     estados React (`saved`, etc.).
     **Verificación:** en `/jugar/tetris` el HUD refleja score/lines/level reales; PAUSA
     congela el juego; FIN abre el modal con el score alcanzado; JUGAR DE NUEVO reinicia
     desde cero.

5. **Repaso y build.** Jugar una partida completa hasta game over para confirmar que el
   flujo `playing → gameOver` del motor coincide con el modal de React sin duplicarse.
   Confirmar que los demás juegos siguen sin cambios. `npm run lint` y `npm run build`
   limpios.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/games` muestra la tarjeta "TETRIS" con cover `.cover-tetris` amarillo y botón yellow.
- [ ] `/juego/tetris` renderiza el detalle genérico (portada, tags, stat-strip, leaderboard) sin errores.
- [ ] `/jugar/tetris` renderiza el canvas del juego (no la arena decorativa genérica).
- [ ] **Preview:** el canvas secundario muestra la pieza siguiente en todo momento.
- [ ] **Controles:** `←`/`→` mueven la pieza; `↑`/`X` rotan en sentido horario con wall kicks; `↓` hace soft drop (+1 pt/fila); `Espacio` hace hard drop (+2 pt/celda) sin hacer scroll de página.
- [ ] **Ghost piece:** se dibuja la proyección semitransparente de dónde caerá la pieza actual.
- [ ] **Líneas:** al completar una fila se elimina y las superiores bajan; el score sube según `LINE_SCORES[n] × level`; el nivel sube cada 10 líneas; la velocidad de caída aumenta con el nivel.
- [ ] **Pieza tuerca (N):** aparece en la rotación aleatoria y se comporta igual que las demás (colisión, rotación, merge).
- [ ] **HUD real:** el HUD externo de `GamePlayer` muestra `score`, `lines` y `level` actualizados en vivo.
- [ ] **PAUSA:** cancela el RAF completo (piezas y loop detenidos); REANUDAR retoma exactamente donde quedó.
- [ ] **FIN:** fuerza game over en el motor y abre el modal con el score real alcanzado.
- [ ] **JUGAR DE NUEVO:** desde el modal reinicia una partida nueva (score 0, lines 0, level 1) sin recargar la página.
- [ ] Los demás juegos del catálogo siguen usando la arena decorativa sin cambios de comportamiento.

---

## 5 · Decisiones tomadas y descartadas

| Decisión                        | Elegida                                                                      | Descartada                                         | Justificación                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Pieza tuerca (N)**            | Se mantiene la pieza N del original (8 tipos en total)                       | Solo las 7 piezas clásicas del Tetris estándar     | El original la incluye como elemento diferenciador; eliminarla requeriría reescribir `PIECES`/`COLORS` sin ganancia clara.                                         |
| **Resolución del canvas**       | 300×600 lógico (bloques de 30px), escalado vía CSS al contenedor             | 400×800 (bloques de 40px)                          | Mantiene paridad 1:1 con el original; el escalado CSS absorbe la diferencia visual sin tocar coordenadas del motor.                                                |
| **HUD: tres métricas**          | `score`, `lines` y `level` visibles en el HUD externo de `GamePlayer`        | Solo `score` y `level` (como Asteroides)           | `lines` es una métrica central en Tetris (condiciona el nivel y la velocidad); ocultarla empobrece la información de juego.                                        |
| **Canvas de preview**           | Canvas secundario `120×120` dentro de `TetrisCanvas` para la pieza siguiente | Preview en DOM puro (divs)                         | El original usa canvas para el preview; mantenerlo evita reimplementar `drawBlock` en dos sistemas distintos.                                                      |
| **Pausa**                       | Cancela RAF completo (`cancelAnimationFrame`)                                | Solo detener `update()`, seguir llamando `draw()`  | El original cancela el RAF; en Tetris la pieza no necesita redibujo continuo mientras está pausada (no hay animaciones de partículas ni movimiento autónomo).      |
| **Encapsulamiento del motor**   | `createEngine()` devuelve estado y métodos; sin variables globales de módulo | Portar `game.js` con variables globales de archivo | Mismo razonamiento que en Asteroides: múltiples montajes/desmontajes de React causarían fugas de estado entre partidas.                                            |
| **`preventDefault` en teclado** | Solo en `Space`; las flechas no previenen default                            | `preventDefault` en todas las teclas de juego      | El original solo previene `Space`; las flechas en Tetris son tan frecuentes que bloquear su default globalmente podría interferir con navegación fuera del canvas. |

---

## 6 · Riesgos identificados

| Riesgo                                                                                                                                              | Mitigación                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Strict Mode (dev) monta/desmonta efectos dos veces, pudiendo duplicar el RAF o los listeners de teclado                                       | El cleanup del `useEffect` cancela el frame pendiente y remueve los listeners explícitamente antes de cada remontaje; se verifica en `npm run dev` que la velocidad de caída y los controles sean normales. |
| El canvas CSS scaling puede distorsionar los bloques si el contenedor no respeta la relación 1:2 (300×600)                                          | El contenedor en `GamePlayer` impone `aspect-ratio: 1/2`; el canvas `width: 100%; height: 100%` garantiza escala proporcional sin distorsión.                                                               |
| `resetKey` incrementado desde `GamePlayer` puede disparar el `useEffect` de reinicio antes de que el modal de fin se cierre, causando un frame roto | El reinicio mediante `resetKey` solo se dispara al pulsar "JUGAR DE NUEVO" (después de cerrar el modal); el orden React garantiza que el efecto corre tras el render con el nuevo valor.                    |
| La pieza tuerca (N, 3×3 con hueco central) puede comportarse de forma inesperada con los wall kicks `[0, ±1, ±2]` en columnas extremas              | El algoritmo `tryRotate` del original ya maneja este caso; se verifica manualmente rotando la tuerca en las columnas 0 y 9 durante las pruebas del paso 3.                                                  |
| `dropInterval` mínimo de 100 ms (nivel alto) puede generar frames de caída más frecuentes que el RAF (~16 ms), acumulando drops múltiples por frame | `dropAccum` acumula el dt real y solo descuenta `dropInterval` cuando supera el umbral — comportamiento idéntico al original, verificado en niveles altos.                                                  |
