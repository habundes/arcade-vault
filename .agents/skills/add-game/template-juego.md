# NN · Juego [TÍTULO]

| Campo                    | Valor                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Spec**                 | `NN-juego-[slug]`                                                                                                                                                                                                                                                  |
| **Estado**               | `Draft`                                                                                                                                                                                                                                                            |
| **Fecha**                | YYYY-MM-DD                                                                                                                                                                                                                                                         |
| **Dependencias**         | SPEC 06 (catálogo y leaderboard en Supabase)                                                                                                                                                                                                                       |
| **Objetivo (una frase)** | Portar el juego [Título] de `references/started-games/[dir]/` a un componente canvas de React, añadirlo al catálogo como nuevo juego "[slug]" y conectarlo al reproductor (`/jugar/[slug]`) con HUD real (score/vidas/nivel) y controles de pausa/fin funcionales. |

---

## 1 · Alcance

**Dentro del alcance:**

- **Nueva entrada en el catálogo** `app/data/games.ts` → ya no aplica post-SPEC 06; la entrada va directamente en Supabase (ver Spec B `NN+1-catalogo-[slug]`).
- **Nuevo cover art** `.cover-[slug]` en `app/globals.css`, [descripción de la paleta y estilo visual].
- **Puerto del motor del juego** desde `references/started-games/[dir]/game.js` a un módulo TS reutilizable en `components/games/[slug]/`: mismas clases ([ClaseA], [ClaseB], …), mismo game loop, [mecánica clave 1], [mecánica clave 2] — 1:1 con el original.
- **Componente cliente** `components/games/[slug]/[Slug]Canvas.tsx` (`"use client"`): monta el canvas con resolución lógica interna (`W=[ancho], H=[alto]`), escala visualmente mediante CSS (`width: 100%; height: 100%`) para llenar el contenedor responsivo, corre el loop vía `requestAnimationFrame`, captura teclado con `preventDefault` en [teclas] solo mientras está montado, limpia listeners/loop al desmontar.
- **Sincronización de estado hacia React:** el canvas reporta `score`, `lives`, `level` y `gameOver` hacia arriba (`onSnapshot`) en cada frame o cambio relevante, para que el HUD externo de `GamePlayer` los muestre en vivo.
- **`GamePlayer.tsx` ramifica por `game.id === "[slug]"`:** en ese caso renderiza `[Slug]Canvas` en vez de la arena decorativa, usa el score/vidas/nivel reales, y conecta:
  - **PAUSA** → congela el loop del canvas (deja de llamar `update`, sigue dibujando el frame actual).
  - **FIN** → fuerza game over en el motor y abre el modal existente con el score real.
  - **JUGAR DE NUEVO** → reinicia el motor completo además del estado React existente.
- Los otros juegos del catálogo **no cambian**: siguen usando su comportamiento actual.

**Fuera del alcance (explícito):**

- ❌ Persistencia real de puntuaciones (la maneja `GamePlayer` existente con `insertScore()`).
- ❌ Modificar otros juegos del catálogo.
- ✅ Canvas responsivo: resolución lógica interna fija (`[ancho]×[alto]`), escalado visual vía CSS — el motor no cambia coordenadas.
- ❌ Soporte táctil/móvil o controles alternativos al teclado.
- ❌ Cambios en `/juego/[id]` (detalle) — ya funciona genéricamente.
- ❌ Leaderboard real por juego en `/salon` — la Spec B lo cubre; aquí solo el motor y el canvas.

---

## 2 · Modelo de datos

**Estado interno del motor** (vive dentro de `[Slug]Canvas.tsx`, clases portadas 1:1 de `game.js`):

```ts
// components/games/[slug]/engine.ts
class [ClaseA] {
  // campos del original
}
class [ClaseB] {
  // campos del original
}
// … otras clases

type EngineState = {
  // campos del estado global del motor
  score: number;
  lives: number;
  level: number;
  state: "playing" | "dead" | "gameover";
};
```

**Puente hacia React** (prop callback de `[Slug]Canvas`, no persistido):

```ts
// components/games/[slug]/[Slug]Canvas.tsx
type [Slug]Snapshot = { score: number; lives: number; level: number; gameOver: boolean };
onSnapshot?: (s: [Slug]Snapshot) => void; // se invoca cada frame
```

No hay persistencia nueva ni cambios en tipos globales.

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Cover art.** Crear `.cover-[slug]` en `app/globals.css` ([descripción del estilo]). **Verificación:** la clase CSS existe y es visualmente distinta de otros covers.

2. **Motor del juego.** Crear `components/games/[slug]/engine.ts` portando 1:1 las clases y funciones de `game.js` más una función `createEngine()` que encapsula el estado, `initGame()`, `nextLevel()` (si aplica), `update(dt)`, `draw(ctx)`, `handleInput(keys, justPressed)` — sin variables globales de módulo. **Verificación:** `npx tsc --noEmit` limpio; el módulo es importable.

3. **Componente canvas.** Crear `components/games/[slug]/[Slug]Canvas.tsx` (`"use client"`): monta `<canvas width={W} height={H}>` con CSS `width: 100%; height: 100%`, crea instancia de `createEngine()` en `useRef`, corre `requestAnimationFrame` con `dt` capado a 50ms, listeners de teclado con `preventDefault` en [teclas], prop `paused` que detiene `update()` sin detener `draw()`, prop `resetKey` para forzar `initGame()`, y `onSnapshot` invocado cada frame. **Verificación:** jugable con teclado, canvas escala al ancho del viewport.

4. **Integración en `GamePlayer.tsx`.** Ramificar por `game.id === "[slug]"`: reemplazar arena decorativa por `<[Slug]Canvas>`, alimentar HUD desde `onSnapshot`, conectar `paused`, `FIN` fuerza gameOver y abre modal con score real, "JUGAR DE NUEVO" reinicia motor y estados React. **Verificación:** HUD refleja valores reales; PAUSA congela; FIN abre modal; JUGAR DE NUEVO reinicia.

5. **Repaso y build.** Jugar una partida completa (perder todas las vidas) para confirmar el flujo `playing → dead → gameover` sin estados inconsistentes. Confirmar que los otros juegos no cambian. `npm run lint` y `npm run build` limpios.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/games` muestra la tarjeta "[TÍTULO]" con el cover `.cover-[slug]` y botón [color].
- [ ] `/juego/[slug]` renderiza el detalle genérico sin errores.
- [ ] `/jugar/[slug]` renderiza el canvas del juego (no la arena decorativa genérica) dentro de la pantalla CRT.
- [ ] **Controles:** [tecla] → [acción]; [tecla] → [acción]; las flechas y espacio no hacen scroll mientras se juega.
- [ ] **Física del juego:** [criterio de mecánica principal 1]; [criterio 2]; todo envuelve toroidalmente / colisiones funcionan correctamente.
- [ ] **HUD real:** el HUD externo muestra score, vidas y nivel actualizados en vivo desde el motor.
- [ ] **PAUSA:** congela el juego; REANUDAR lo continúa exactamente donde quedó.
- [ ] **FIN:** fuerza el fin de partida y abre el modal con el score real alcanzado.
- [ ] **Pérdida de vida:** al [condición de muerte], la nave/personaje [comportamiento de respawn]; a la última vida perdida se abre el modal de fin.
- [ ] **JUGAR DE NUEVO:** desde el modal, reinicia una partida nueva (score 0, [vidas] vidas, nivel 1) sin recargar la página.
- [ ] Los otros juegos del catálogo siguen sin cambios de comportamiento.
- [ ] "GUARDAR PUNTUACIÓN" en el modal sigue siendo decorativo en esta spec (la Spec B no lo requiere; `GamePlayer` ya lo implementa).

---

## 5 · Decisiones tomadas y descartadas

| Decisión                | Elegida                                                              | Descartada                                      | Justificación                                                                                           |
| ----------------------- | -------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Slot en el catálogo** | Nuevo id `[slug]` en Supabase (Spec B)                               | Archivo estático                                | Post-SPEC 06, la única fuente de verdad es Supabase.                                                    |
| **Cover art**           | `.cover-[slug]` nuevo, [descripción]                                 | Reutilizar cover existente                      | Diferenciación visual entre juegos del catálogo.                                                        |
| **Color de acento**     | `[color]`                                                            | Otros colores disponibles                       | [Justificación breve].                                                                                  |
| **Tamaño del canvas**   | Responsivo: `[ancho]×[alto]` lógico, CSS `width: 100%; height: 100%` | Reescribir coordenadas para resolución dinámica | CSS display scaling no afecta la física del motor.                                                      |
| **Teclado**             | `preventDefault` en [teclas] mientras el canvas está montado         | Sin interceptar                                 | Evita scroll de página durante el juego.                                                                |
| **Estado del motor**    | Encapsulado por instancia (`createEngine()`), sin variables globales | Variables globales como en el original          | El original usa globals válidos en standalone; en React montado/desmontado varias veces causaría fugas. |

---

## 6 · Riesgos identificados

| Riesgo                                                                                                      | Mitigación                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Strict Mode monta/desmonta efectos dos veces, pudiendo duplicar el loop o los listeners de teclado    | El cleanup del `useEffect` cancela el frame pendiente y remueve los listeners antes de cada remontaje.                                              |
| El canvas CSS scaling puede verse borroso si el contenedor no respeta la relación de aspecto del motor      | El contenedor `.crt-screen` impone `aspect-ratio` equivalente a `[ancho]/[alto]`; el CSS `width: 100%; height: 100%` garantiza escala proporcional. |
| `preventDefault` en teclas podría interferir con otros elementos si el listener queda global tras desmontar | El listener se agrega a `window` solo mientras `[Slug]Canvas` está montado y se remueve al desmontar.                                               |
