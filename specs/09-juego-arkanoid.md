# 09 · Juego Arkanoid

| Campo                    | Valor                                                                                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `09-juego-arkanoid`                                                                                                                                                                                                                                       |
| **Estado**               | `Implemented`                                                                                                                                                                                                                                             |
| **Fecha**                | 2026-07-09                                                                                                                                                                                                                                                |
| **Dependencias**         | SPEC 06 (leaderboard y catálogo en Supabase)                                                                                                                                                                                                              |
| **Objetivo (una frase)** | Portar el juego Arkanoid de `references/started-games/04-arkanoid/` a un componente canvas de React, añadirlo al catálogo como nuevo juego "arkanoid" e integrarlo en `GamePlayer` con HUD real (score/level/lives) y controles de pausa/fin funcionales. |

---

## 1 · Alcance

**Dentro del alcance:**

- **Copiar assets** de `references/started-games/04-arkanoid/assets/` a `public/games/arkanoid/` (spritesheet PNG + dos MP3).
- **Cover art** `.cover-arkanoid` en `app/globals.css`: degradado verde oscuro con pelota y paleta en CSS puro.
- **Puerto del motor** desde `references/started-games/04-arkanoid/game.js` y `levels.js` a `components/games/arkanoid/engine.ts`: mismas constantes (`PADDLE_SPEED`, `BLOCK_COLS`, `BLOCK_ROWS`, `BLOCK_W`, `BLOCK_H`, `BLOCK_COLORS`, `BASE_BALL_VX`, `BASE_BALL_VY`), mismos cinco niveles de `LEVELS` con sus `speed` y `blocks[]`, misma lógica de colisiones AABB, rebotes de pared/paleta/bloque, explosiones animadas (4 frames vía spritesheet), efectos de sonido (`ball-bounce`, `break-sound`) y condición de victoria (nivel 5 completado) — encapsulados en `createEngine()` sin variables globales de módulo. La lógica de sprites (`drawSprite`, `drawFrame`) se porta desde `assets/spritesheet.js` como utilidades internas del motor.
- **Componente cliente** `components/games/arkanoid/ArkanoidCanvas.tsx` (`"use client"`): canvas único `800×600` lógico escalado vía CSS al contenedor, loop `requestAnimationFrame`, listeners de teclado (`←`/`→`) y `mousemove` sobre el canvas. Pausa detiene solo `update()` — el RAF sigue llamando `draw()`.
- **Sincronización hacia React:** el canvas reporta `score`, `level`, `lives` y `gameOver` en cada frame mediante callback `onSnapshot`. El estado `win` (nivel 5 completado) se reporta como `gameOver: true` al `GamePlayer`.
- **`GamePlayer.tsx` ramifica por `game.id === "arkanoid"`:** renderiza `ArkanoidCanvas`, alimenta el HUD con `score`/`level`/`lives` reales, conecta PAUSA (prop `paused`), FIN (fuerza `gameOver` en el motor) y JUGAR DE NUEVO (reinicia el motor completo).

**Fuera del alcance (explícito):**

- ❌ Modificar cualquier otro juego del catálogo.
- ❌ Los botones de "saltar nivel" del overlay de pausa del original — la pausa la gestiona `GamePlayer` externamente.
- ❌ Soporte táctil/móvil.
- ❌ Cambios en `/juego/[id]` — ya funciona genéricamente.
- ❌ Persistencia de puntuaciones más allá del `insertScore` que ya maneja `GamePlayer.tsx`.

---

## 2 · Modelo de datos

**Estado interno del motor** (encapsulado en `createEngine()`, portado 1:1 de `game.js` y `levels.js`):

```ts
// components/games/arkanoid/engine.ts

const PADDLE_SPEED = 400;
const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCK_COLORS = [
  "red",
  "yellow",
  "cyan",
  "magenta",
  "hotpink",
  "green",
] as const;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;

type BlockColor = (typeof BLOCK_COLORS)[number];

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
};
type Explosion = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  elapsed: number;
};

type EngineState = {
  paddle: { x: number; y: number; w: number; h: number };
  ball: { x: number; y: number; w: number; h: number; vx: number; vy: number };
  blocks: Block[];
  explosions: Explosion[];
  lives: number; // inicia en 3
  score: number;
  currentLevel: number; // 1-indexed, 1–5
  gameState: "playing" | "gameover" | "win";
};

// LEVELS: portado 1:1 desde levels.js
// [{ speed: number, blocks: { col, row, color }[] }, …] × 5 niveles
```

**Puente hacia React** (prop callback de `ArkanoidCanvas`):

```ts
// components/games/arkanoid/ArkanoidCanvas.tsx
type ArkanoidSnapshot = {
  score: number;
  level: number; // currentLevel del motor
  lives: number;
  gameOver: boolean; // true tanto en 'gameover' como en 'win'
};
```

**Props de `ArkanoidCanvas`:**

```ts
type ArkanoidCanvasProps = {
  paused: boolean; // true → detiene update(); draw() sigue
  resetKey: number; // incrementar → reinicia el motor completo
  onSnapshot: (s: ArkanoidSnapshot) => void;
  onGameOver?: () => void; // llamado una sola vez al detectar gameOver
};
```

No hay cambios en `app/data/types.ts`. La fila en `games` se inserta vía SQL (Spec B).

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Copiar assets.** Copiar `references/started-games/04-arkanoid/assets/` a
   `public/games/arkanoid/` (spritesheet PNG + dos MP3).
   **Verificación:** los archivos son accesibles en `/games/arkanoid/spritesheet-breakout.png`
   desde el navegador.

2. **Cover art.** Crear `.cover-arkanoid` en `app/globals.css`: degradado verde oscuro
   con pelota (círculo blanco) y paleta (rectángulo) en `::before`/`::after`.
   **Verificación:** clase visible en el inspector; no rompe otros covers existentes.

3. **Motor del juego.** Crear `components/games/arkanoid/engine.ts` portando 1:1 constantes,
   `LEVELS`, tipos (`Block`, `Explosion`, `EngineState`) y funciones (`initPaddle`, `initBall`,
   `loadLevel`, `collideAABB`, `update`) dentro de `createEngine()` sin variables globales.
   Portar `drawSprite`/`drawFrame`/`loadSpritesheet` desde `assets/spritesheet.js` como
   utilidades internas. Exponer `forceGameOver()` para el botón FIN.
   **Verificación:** `npx tsc --noEmit` limpio; módulo importable.

4. **Componente canvas.** Crear `components/games/arkanoid/ArkanoidCanvas.tsx` (`"use client"`):
   - `<canvas width={800} height={600}>` con `width: 100%; height: 100%` CSS para escalar
     al contenedor.
   - Instancia de `createEngine()` en `useRef`; spritesheet cargado en `useEffect` de mount.
   - Loop `requestAnimationFrame` con `dt` capado a 50 ms.
   - Listeners `keydown`/`keyup` para `←`/`→` y `mousemove` sobre el canvas; agregados en
     mount, removidos en cleanup.
   - Prop `paused`: cuando `true`, el RAF sigue corriendo pero `update()` no se llama.
   - Prop `resetKey`: `useEffect([resetKey])` llama `loadLevel(1)` e `initPaddle()`/`initBall()`.
   - `onSnapshot({ score, level, lives, gameOver })` invocado cada frame.
     **Verificación:** montado en ruta temporal, el juego es jugable (paleta se mueve con mouse
     y teclado, pelota rebota, bloques se rompen con explosión animada, sonidos suenan, nivel
     avanza al limpiar todos los bloques).

5. **Integración en `GamePlayer.tsx`.** Ramificar por `game.id === "arkanoid"`:
   - Importar `ArkanoidCanvas` y su `ArkanoidCanvasHandle`.
   - Añadir `isArkanoid`, `arkanoidRef`, `arkanoidResetKey` al componente.
   - Renderizar `<ArkanoidCanvas>` en el `crt-screen` con contenedor de `aspect-ratio: 4/3`.
   - HUD: mostrar `lives` (corazones) en lugar de `tetrisLines`; ocultar líneas Tetris.
   - PAUSA → prop `paused={true}`; FIN → `arkanoidRef.current?.forceGameOver()`;
     JUGAR DE NUEVO → incrementa `arkanoidResetKey`.
   - Excluir Arkanoid del fake score timer (junto a Asteroides y Tetris).
     **Verificación:** en `/jugar/arkanoid` el HUD refleja score/level/lives reales; PAUSA
     congela la física; FIN abre el modal; JUGAR DE NUEVO reinicia desde nivel 1.

6. **Repaso y build.** Jugar una partida completa hasta game over para confirmar el flujo
   `playing → gameOver`. Verificar que los demás juegos siguen sin cambios.
   `npm run lint` y `npm run build` limpios.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] Los assets son accesibles en `/games/arkanoid/spritesheet-breakout.png`,
      `/games/arkanoid/sounds/ball-bounce.mp3` y `/games/arkanoid/sounds/break-sound.mp3`.
- [ ] `/games` muestra la tarjeta "ARKANOID" con cover `.cover-arkanoid` verde y botón green.
- [ ] `/juego/arkanoid` carga sin errores y muestra estado vacío de leaderboard.
- [ ] `/jugar/arkanoid` renderiza el canvas del juego (no la arena decorativa genérica).
- [ ] **Controles:** `←`/`→` mueven la paleta; `mousemove` sobre el canvas mueve la paleta
      en tiempo real; ambos modos funcionan simultáneamente.
- [ ] **Física:** la pelota rebota en paredes izquierda, derecha y techo; rebota en la paleta
      con corrección de posición; al salir por la parte inferior se pierde una vida.
- [ ] **Bloques:** al colisionar con la pelota el bloque desaparece, suma 10 pts al score y
      dispara la animación de explosión (4 frames del spritesheet).
- [ ] **Sonidos:** `ball-bounce.mp3` suena al rebotar en pared o paleta; `break-sound.mp3`
      suena al romper un bloque.
- [ ] **Niveles:** al limpiar todos los bloques del nivel actual se carga el siguiente (1→2→…→5);
      la velocidad de la pelota aumenta según el `speed` de cada nivel.
- [ ] **Game over:** sin vidas restantes → `gameOver: true` en el snapshot → modal de fin
      con score real.
- [ ] **Victoria:** completar nivel 5 → `gameOver: true` en el snapshot → mismo modal de fin.
- [ ] **HUD real:** el HUD externo de `GamePlayer` muestra `score`, `level` y `lives`
      (corazones) actualizados en vivo.
- [ ] **PAUSA:** detiene `update()` (física congelada); el canvas sigue dibujando; REANUDAR
      retoma exactamente donde quedó.
- [ ] **FIN:** fuerza game over en el motor y abre el modal con el score alcanzado.
- [ ] **JUGAR DE NUEVO:** reinicia desde nivel 1 con score 0 y 3 vidas sin recargar la página.
- [ ] Los demás juegos del catálogo siguen sin cambios de comportamiento.

---

## 5 · Decisiones tomadas y descartadas

| Decisión                                   | Elegida                                                                      | Descartada                                                   | Justificación                                                                                                                                                                                                          |
| ------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprites vs formas geométricas**          | Spritesheet del original (`spritesheet-breakout.png`) copiado a `public/`    | Reimplementar bloques/paleta/pelota como formas canvas puras | Los assets ya existen y son parte de la identidad visual del juego; copiarlos evita reescribir el sistema de dibujo y mantiene la fidelidad al original.                                                               |
| **Efectos de sonido**                      | Incluidos (`ball-bounce.mp3`, `break-sound.mp3`) copiados a `public/`        | Silencio (como se hace en otros ports)                       | El original los usa y están disponibles en la carpeta de referencia; aportan experiencia arcade sin coste de implementación.                                                                                           |
| **Overlay de pausa con selector de nivel** | Eliminado del port                                                           | Mantenerlo igual que el original                             | La pausa la gestiona `GamePlayer` externamente (botón PAUSA/REANUDAR en el HUD); añadir un selector de nivel dentro del canvas crearía dos sistemas de pausa paralelos e inconsistentes con la arquitectura del vault. |
| **Control de pausa**                       | `update()` se detiene; `draw()` sigue corriendo (RAF activo)                 | Cancelar RAF completo (como Tetris)                          | Arkanoid tiene explosiones en curso que deben seguir animándose visualmente al pausar; cancelar el RAF congela los frames de explosión a mitad.                                                                        |
| **Condición `win`**                        | Se reporta como `gameOver: true` en el snapshot; abre el mismo modal de fin  | Modal de victoria diferenciado                               | Simplifica `GamePlayer` — ya maneja un solo estado de fin; el texto "FIN DEL JUEGO" es suficiente en este contexto arcade.                                                                                             |
| **Resolución del canvas**                  | `800×600` lógico, escalado vía CSS al contenedor                             | Reducir resolución (ej. 400×300)                             | Paridad 1:1 con el original; el escalado CSS absorbe la diferencia sin tocar coordenadas del motor.                                                                                                                    |
| **Encapsulamiento del motor**              | `createEngine()` devuelve estado y métodos; sin variables globales de módulo | Portar `game.js` con variables globales de archivo           | Múltiples montajes/desmontajes de React causarían fugas de estado entre partidas (mismo razonamiento que Asteroides y Tetris).                                                                                         |

---

## 6 · Riesgos identificados

| Riesgo                                                                                                                                                                            | Mitigación                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El spritesheet se carga de forma asíncrona (`loadSpritesheet(cb)`); si el RAF empieza antes de que la imagen esté lista, los primeros frames dibujarán sprites rotos o en blanco. | El RAF solo arranca dentro del callback de `onload` de la imagen — igual que el original. El estado del motor se inicializa antes de la carga, pero `draw()` no se llama hasta que el spritesheet esté disponible. |
| React Strict Mode (dev) monta/desmonta efectos dos veces, pudiendo duplicar el RAF o los listeners de teclado/ratón.                                                              | El cleanup del `useEffect` cancela el frame pendiente y remueve todos los listeners explícitamente antes de cada remontaje; se verifica en `npm run dev` que la velocidad y los controles sean normales.           |
| El escalado CSS de `800×600` a un contenedor más estrecho puede distorsionar los sprites si el contenedor no respeta la relación 4:3.                                             | El contenedor en `GamePlayer` impone `aspect-ratio: 4/3`; el canvas `width: 100%; height: 100%` garantiza escala proporcional.                                                                                     |
| `Audio.cloneNode().play()` (patrón del original para sonidos simultáneos) puede generar warnings en navegadores que bloquean autoplay sin interacción previa del usuario.         | El primer sonido se dispara siempre tras una acción del usuario (mover la paleta o rebotar la pelota), lo que cuenta como interacción; se acepta que en carga inicial sin acción no haya sonido.                   |
| La colisión AABB simple (un bloque por frame) puede "atravesar" bloques a velocidades muy altas (nivel 5, `speed: 1.46`).                                                         | Comportamiento idéntico al original — ya existe esta limitación y no genera bugs visibles en la práctica; no se corrige en este port.                                                                              |
