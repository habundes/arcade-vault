# 05 · Juego Asteroides

| Campo                    | Valor                                                                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `05-juego-asteroides`                                                                                                                                                                                                                                                              |
| **Estado**               | `Implementado`                                                                                                                                                                                                                                                                     |
| **Fecha**                | 2026-07-08                                                                                                                                                                                                                                                                         |
| **Dependencias**         | SPEC 01 (MVP visual — pantallas: catálogo, detalle, reproductor placeholder)                                                                                                                                                                                                       |
| **Objetivo (una frase)** | Portar el juego Asteroids de `references/started-games/02-asteroids/` a un componente canvas de React, añadirlo al catálogo como nuevo juego "asteroides" y conectarlo al reproductor (`/jugar/asteroides`) con HUD real (score/vidas/nivel) y controles de pausa/fin funcionales. |

---

## 1 · Alcance

**Dentro del alcance:**

- **Nueva entrada en el catálogo** `app/data/games.ts`: `id: "asteroides"`, `title: "ASTEROIDES"`, `cat: "SHOOTER"`, `color: "cyan"`, textos ya acordados, `cover: "cover-asteroides"` (9º juego; `"rocas"` queda sin cambios).
- **Nuevo cover art** `.cover-asteroides` en `app/globals.css`, monocromático (blanco/negro/cyan) para diferenciarlo de `.cover-rocas`.
- **Puerto del motor del juego** desde `references/started-games/02-asteroids/game.js` a un módulo TS reutilizable en `components/games/asteroids/`: mismas clases (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`), mismo game loop, wrap toroidal, power-up de disparo triple, splits de asteroides, partículas — 1:1 con el original.
- **Componente cliente** `components/games/asteroids/AsteroidsCanvas.tsx` (`"use client"`): monta el canvas con resolución lógica interna (e.g. 800×600), escala visualmente mediante CSS (`width: 100%; height: 100%`) para llenar el contenedor responsivo, corre el loop vía `requestAnimationFrame`, captura teclado con `preventDefault` en flechas/espacio solo mientras está montado, limpia listeners/loop al desmontar.
- **Sincronización de estado hacia React:** el canvas reporta `score`, `lives`, `level` y `gameOver` hacia arriba (callback/estado) en cada frame o cambio relevante, para que el HUD externo de `GamePlayer` los muestre en vivo.
- **`GamePlayer.tsx` ramifica por `game.id === "asteroides"`:** en ese caso renderiza `AsteroidsCanvas` en vez de la arena decorativa, usa el score/vidas/nivel reales (sin el timer falso), y conecta:
  - **PAUSA** → congela el loop del canvas (deja de llamar `update`, sigue dibujando el frame actual).
  - **FIN** → fuerza game over en el motor (vidas a 0) y abre el modal existente con el score real.
  - **JUGAR DE NUEVO** → reinicia el motor completo (nueva partida desde cero) además del estado React existente.
- Los otros 8 juegos del catálogo **no cambian**: siguen usando la arena decorativa y el timer falso de `GamePlayer`.

**Fuera del alcance (explícito):**

- ❌ Persistencia real de puntuaciones (Supabase). "GUARDAR PUNTUACIÓN" sigue siendo decorativo, igual que hoy.
- ❌ Modificar `"rocas"` o cualquier otro juego del catálogo.
- ✅ Canvas responsivo: resolución lógica interna fija (800×600), escalado visual vía CSS para adaptarse al contenedor — el motor no cambia coordenadas.
- ❌ Soporte táctil/móvil o controles alternativos al teclado.
- ❌ Cambios en `/juego/[id]` (detalle) — ya funciona genéricamente con cualquier `Game`, no requiere tocarse.
- ❌ Leaderboard real por juego en `/salon` para "asteroides" — sigue usando `seededScores` ficticio como los demás.

---

## 2 · Modelo de datos

**Catálogo (`app/data/games.ts` — extiende el tipo `Game` ya existente, sin cambios de forma):**

```ts
{
  id: "asteroides",
  title: "ASTEROIDES",
  short: "Sobrevive al campo de rocas en gravedad cero.",
  long: "Nave triangular a la deriva en el vacío. Rota, propulsa y dispara para partir asteroides en fragmentos cada vez más pequeños. Tres vidas, invencibilidad breve al reaparecer, y niveles que escalan sin piedad.",
  cat: "SHOOTER",
  cover: "cover-asteroides",
  color: "cyan",
  best: 41200,   // valor ficticio, mismo orden de magnitud que "rocas"
  plays: "1",    // juego nuevo, arranca en 1
}
```

**Estado interno del motor** (vive dentro de `AsteroidsCanvas.tsx`, no en `app/data`; son clases portadas 1:1 de `game.js`, sin cambios de forma):

```ts
// components/games/asteroids/engine.ts
class Bullet {
  x;
  y;
  vx;
  vy;
  ttl;
  radius;
  dead;
}
class Asteroid {
  x;
  y;
  size;
  radius;
  vx;
  vy;
  rot;
  rotSpeed;
  verts;
  dead;
}
class PowerUp {
  x;
  y;
  vx;
  vy;
  radius;
  ttl;
  dead;
}
class Ship {
  x;
  y;
  angle;
  vx;
  vy;
  radius;
  thrusting;
  invincible;
  shootCooldown;
  tripleShot;
  dead;
}
class Particle {
  x;
  y;
  vx;
  vy;
  life;
  ttl;
  dead;
}

// Estado global del motor (equivalente a los "globals" de game.js, encapsulado por instancia)
type EngineState = {
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  particles: Particle[];
  powerUps: PowerUp[];
  score: number;
  lives: number;
  level: number;
  state: "playing" | "dead" | "gameover";
};
```

**Puente hacia React** (prop callback de `AsteroidsCanvas`, no persistido):

```ts
// components/games/asteroids/AsteroidsCanvas.tsx
type AsteroidsSnapshot = { score: number; lives: number; level: number; gameOver: boolean };
onSnapshot?: (s: AsteroidsSnapshot) => void; // se invoca cada frame
```

No hay persistencia nueva ni cambios en `app/data/types.ts` — `Game` ya tiene todos los campos necesarios.

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Catálogo y cover art.** Añadir la entrada `asteroides` a `app/data/games.ts` y crear `.cover-asteroides` en `app/globals.css` (monocromático, distinto de `.cover-rocas`). **Verificación:** la tarjeta "ASTEROIDES" aparece en `/games` con su cover; `/juego/asteroides` renderiza el detalle genérico sin errores.

2. **Motor del juego.** Crear `components/games/asteroids/engine.ts` portando 1:1 las clases y funciones de `game.js` (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, `wrap`, `dist`, `rand`, `randInt`, constantes) más una función `createEngine()` que encapsula el estado (`ship/bullets/asteroids/...`), `initGame()`, `nextLevel()`, `update(dt)`, `draw(ctx)`, `handleInput(keys, justPressed)` — sin variables globales de módulo, todo dentro de la instancia devuelta por `createEngine()`. **Verificación:** `npx tsc --noEmit` limpio; el módulo es importable.

3. **Componente canvas.** Crear `components/games/asteroids/AsteroidsCanvas.tsx` (`"use client"`): monta `<canvas width={W} height={H}>` con resolución lógica interna (e.g. `W=800, H=600`) y CSS `width: 100%; height: 100%` para escalar responsivamente al contenedor padre (que impone `aspect-ratio` equivalente), crea una instancia de `createEngine()` en un `useRef`, corre `requestAnimationFrame` con el mismo `dt` capado a 50ms, listeners de teclado con `preventDefault` en `ArrowLeft/ArrowRight/ArrowUp/Space` (agregados en mount, removidos en cleanup), prop `paused` que detiene `update()` sin detener `draw()`, prop `resetKey` (o método via `ref`) para forzar `initGame()`, y `onSnapshot({score, lives, level, gameOver})` invocado cada frame. **Verificación:** montado en una página de prueba temporal, el juego es jugable con teclado (nave rota/propulsa/dispara, asteroides se destruyen y parten) y el canvas escala al ancho del viewport.

4. **Integración en `GamePlayer.tsx`.** Ramificar por `game.id === "asteroides"`: reemplazar la arena decorativa por `<AsteroidsCanvas>`, eliminar el timer falso de score para este caso, alimentar `score/lives/level` del HUD desde `onSnapshot`, conectar `paused` al botón PAUSA, `FIN` fuerza `gameOver` (vía prop/ref del canvas) y abre el modal existente con el score real, "JUGAR DE NUEVO" reinicia el motor (`resetKey`) además de los estados React (`saved`, etc.). **Verificación:** en `/jugar/asteroides` el HUD refleja score/vidas/nivel reales; PAUSA congela el juego; FIN abre el modal con el score alcanzado; JUGAR DE NUEVO reinicia todo desde cero.

5. **Repaso y build.** Jugar una partida completa (perder las 3 vidas) para confirmar que el flujo `playing → dead → gameover` del motor coincide con el modal de fin de React sin duplicarse ni quedar en estados inconsistentes. Confirmar que los otros 8 juegos siguen sin cambios. `npm run lint` y `npm run build` limpios.

---

## 4 · Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] `/games` muestra la tarjeta "ASTEROIDES" (9 juegos en total) con el cover `.cover-asteroides` y botón cyan; `/juego/asteroides` renderiza el detalle genérico (portada, tags, stat-strip, leaderboard) sin errores.
- [x] `/jugar/asteroides` renderiza el canvas del juego (no la arena decorativa genérica) dentro de la pantalla CRT.
- [x] **Controles:** `←`/`→` rotan la nave, `↑` propulsa (con llama visible), `Espacio` dispara; las flechas y espacio no hacen scroll de la página mientras se juega.
- [x] **Física del juego:** los asteroides grandes se parten en medianos y estos en pequeños al ser destruidos por una bala; los pequeños desaparecen sin dividirse; todo envuelve toroidalmente los bordes del canvas.
- [x] **Power-up:** aparece ocasionalmente un power-up de disparo triple tras destruir asteroides; recogerlo activa disparo triple temporal.
- [x] **HUD real:** el HUD externo (arriba del CRT) muestra score, vidas y nivel actualizados en vivo desde el motor del juego — no valores simulados por timer.
- [x] **PAUSA:** congela el juego (nave/asteroides/balas dejan de moverse); REANUDAR lo continúa exactamente donde quedó.
- [x] **FIN:** fuerza el fin de partida y abre el modal existente con el score real alcanzado hasta ese momento.
- [x] **Pérdida de vida:** al chocar con un asteroide, la nave explota, pierde una vida y reaparece con invencibilidad temporal (parpadeo); a la 3ª vida perdida se abre el modal de fin con el score final.
- [x] **JUGAR DE NUEVO:** desde el modal, reinicia una partida nueva (score 0, 3 vidas, nivel 1) sin recargar la página.
- [x] Los otros 8 juegos del catálogo (incluido "rocas") siguen usando la arena decorativa y el timer falso, sin cambios de comportamiento.
- [x] "GUARDAR PUNTUACIÓN" en el modal sigue siendo decorativo (sin llamadas de red ni persistencia).

---

## 5 · Decisiones tomadas y descartadas

| Decisión                       | Elegida                                                                                                               | Descartada                                                | Justificación                                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Slot en el catálogo**        | Nuevo id `asteroides` (9º juego)                                                                                      | Reemplazar `"rocas"`                                      | El usuario prefirió no tocar `"rocas"` y sumar el juego real como entrada independiente.                                                                                  |
| **Cover art**                  | `.cover-asteroides` nuevo, monocromático/cyan                                                                         | Reutilizar `.cover-rocas`                                 | Diferenciación visual explícita entre el juego ficticio existente y el real nuevo.                                                                                        |
| **Color de acento**            | `cyan`                                                                                                                | `yellow` (como "rocas") / `magenta` / `green`             | El juego real es blanco/negro; cyan da un acento frío distinto y no repite el amarillo ya usado por "rocas".                                                              |
| **Alcance del placeholder**    | Solo `asteroides` usa el motor real; los otros 7 juegos mantienen `GamePlayer` decorativo sin cambios                 | Reemplazar el placeholder genérico para todos los juegos  | Menor riesgo; los demás juegos no tienen motor real aún — eso es alcance de specs futuras.                                                                                |
| **Tamaño del canvas**          | Responsivo: resolución lógica interna fija (800×600), CSS `width: 100%; height: 100%` escala el display al contenedor | Reescribir coordenadas del motor para resolución dinámica | CSS display scaling no afecta coordenadas lógicas ni física del motor; el contenedor impone `aspect-ratio: 4/3` eliminando distorsión.                                    |
| **Teclado**                    | `preventDefault` en flechas/espacio mientras el canvas está montado                                                   | Sin interceptar                                           | Evita que la página haga scroll durante el juego; se limpia el listener al desmontar.                                                                                     |
| **Control HUD ↔ motor**        | PAUSA/FIN controlan el motor real (loop y game over)                                                                  | Motor autónomo, HUD de solo lectura                       | Consistencia con la UX ya existente del reproductor (botones funcionales), evita un HUD "de mentira" sobre un juego real.                                                 |
| **Estado del motor**           | Encapsulado por instancia (`createEngine()`), sin variables globales de módulo                                        | Portar `game.js` tal cual con variables globales          | El original usa globals de archivo (válido en standalone); en un componente React montado/desmontado varias veces eso causaría fugas de estado entre partidas/instancias. |
| **Persistencia de puntuación** | Sigue decorativa (sin Supabase)                                                                                       | Guardar puntuaciones reales                               | No existen tablas en la DB aún (ver SPEC 04); implementarlo aquí expandiría demasiado el alcance.                                                                         |

---

## 6 · Riesgos identificados

| Riesgo                                                                                                                                                                 | Mitigación                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Strict Mode (dev) monta/desmonta efectos dos veces, pudiendo duplicar el loop `requestAnimationFrame` o los listeners de teclado                                 | El cleanup del `useEffect` cancela el frame pendiente y remueve los listeners explícitamente antes de cada remontaje; se verifica jugando en `npm run dev` que no haya doble velocidad ni doble disparo.                |
| El canvas CSS scaling puede verse borroso si el contenedor no respeta la relación 4:3 del motor lógico                                                                 | El contenedor `.crt-screen` impone `aspect-ratio: 4/3` (igual que la resolución lógica 800×600); el CSS `width: 100%; height: 100%` en el canvas garantiza escala proporcional sin distorsión.                          |
| `preventDefault` en flechas/espacio podría interferir con otros elementos interactivos de la página (inputs, botones del HUD) si el listener queda global              | El listener se agrega a nivel de `window` solo mientras `AsteroidsCanvas` está montado (ruta `/jugar/asteroides`) y se remueve al desmontar/salir.                                                                      |
| Desincronización entre el `state` interno del motor (`playing/dead/gameover`) y el modal externo de React si FIN se presiona en medio del respawn (`state === "dead"`) | El motor expone un único punto de verdad (`gameOver` en el snapshot); FIN fuerza `lives = 0` y `state = "gameover"` directamente en el motor antes de que React lea el snapshot, evitando estados intermedios visibles. |
