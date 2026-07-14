# 14 · Controles táctiles Tetris

| Campo                    | Valor                                                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `14-controles-tactiles-tetris`                                                                                                                                               |
| **Estado**               | `Approved`                                                                                                                                                                      |
| **Fecha**                | 2026-07-13                                                                                                                                                                   |
| **Dependencias**         | SPEC 07 (juego Tetris), SPEC 13 (controles táctiles Snake — reutiliza `TouchDPad`)                                                                                           |
| **Objetivo (una frase)** | Agregar controles táctiles a Tetris (D-pad reutilizado de la spec 13 + botón extra de DROP) para mover, rotar y caer piezas sin teclado en dispositivos con pantalla táctil. |

---

## 1 · Alcance

**Dentro del alcance:**

- **Reutilización** de `components/games/shared/TouchDPad.tsx` (creado en spec 13) sin modificarlo.
- **Nuevo componente** `components/games/shared/TouchActionButton.tsx` (`"use client"`): botón de acción genérico y reutilizable (usado aquí como "DROP"), recibe `label`, `onPress` y `disabled`. Igual que `TouchDPad`, sin lógica de juego específico — pensado para reutilizarse en arkanoid/asteroides si aplica.
- **Integración en `TetrisCanvas.tsx`:**
  - `TouchDPad` con mapeo: `LEFT` → `engine.moveLeft()`, `RIGHT` → `engine.moveRight()`, `DOWN` → `engine.softDrop()`, `UP` → `engine.tryRotate()`.
  - `TouchActionButton` con label "DROP" → `engine.hardDrop()`, ubicado a la derecha del D-pad, misma fila.
  - Ambos deshabilitados (`disabled`) cuando el juego está en pausa o en game over — mismo patrón que Snake.
- **Layout:** franja de controles (D-pad + DROP) debajo del canvas de Tetris, visible solo en viewport < 768px (misma media query `.touch-dpad` / nueva `.touch-action-btn` en `app/globals.css`).
- **Ajuste del wrapper de Tetris** en `GamePlayer.tsx` para acomodar la franja de controles debajo del canvas sin afectar el layout de los demás juegos.

**Fuera del alcance (explícito):**

- ❌ Controles táctiles para arkanoid o asteroides — specs separados posteriores.
- ❌ Swipe / gestos sobre el canvas.
- ❌ Cambios al HUD superior (PAUSA/FIN/SALIR).
- ❌ Cambios al motor (`engine.ts`) de Tetris — los botones solo invocan métodos públicos ya existentes (`moveLeft`, `moveRight`, `softDrop`, `tryRotate`, `hardDrop`).
- ❌ Modificar `TouchDPad` — se usa tal cual salió de la spec 13.
- ❌ `viewport` de `app/layout.tsx` — ya se agregó en la spec 13, no se repite aquí.

---

## 2 · Modelo de datos

```ts
// components/games/shared/TouchActionButton.tsx

type TouchActionButtonProps = {
  label: string; // texto del botón, ej. "DROP"
  onPress: () => void;
  disabled?: boolean;
};
```

Sin estado propio — botón de presentación puro (`<button onClick={onPress} disabled={disabled}>`).

`TouchDPad` (de la spec 13) se usa sin cambios; `TetrisCanvas.tsx` mapea cada `DPadDirection` a un método del engine ya existente:

```ts
// dentro de TetrisCanvas.tsx
const handleDirection = (dir: DPadDirection) => {
  if (pausedRef.current || engine.state.gameOver) return;
  switch (dir) {
    case "LEFT":
      engine.moveLeft();
      break;
    case "RIGHT":
      engine.moveRight();
      break;
    case "DOWN":
      engine.softDrop();
      break;
    case "UP":
      engine.tryRotate();
      break;
  }
};
```

No hay cambios en `app/data/types.ts` ni en `components/games/tetris/engine.ts`.

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Componente `TouchActionButton`.** Crear `components/games/shared/TouchActionButton.tsx` con `label`, `onPress`, `disabled`.
   **Verificación:** `npx tsc --noEmit` limpio; componente importable de forma aislada.

2. **Estilos del botón de acción.** Agregar en `app/globals.css` la clase `.touch-action-btn` (estética pixel-art coherente con `.btn` y `.touch-dpad` existentes) y colocarla junto a `.touch-dpad` dentro de un contenedor flex `.touch-controls` (D-pad izquierda, botón derecha), oculto en `≥768px` igual que `.touch-dpad`.
   **Verificación:** revisar visualmente en DevTools con viewport móvil (<768px) y desktop (≥768px).

3. **Integración en `TetrisCanvas.tsx`.** Agregar `handleDirection` (mapeo descrito en el modelo de datos) y `handleDrop` (`engine.hardDrop()`), ambos con guard de pausa/game over. Renderizar `<div className="touch-controls"><TouchDPad onDirection={handleDirection} disabled={paused || engine.state.gameOver} /><TouchActionButton label="DROP" onPress={handleDrop} disabled={paused || engine.state.gameOver} /></div>` debajo del canvas.
   **Verificación:** en `/jugar/tetris` con DevTools en modo dispositivo móvil: IZQUIERDA/DERECHA mueven la pieza, ABAJO hace soft-drop, ARRIBA rota, DROP hace hard-drop instantáneo; los 5 controles se deshabilitan en pausa/game over.

4. **Ajuste de layout en `GamePlayer.tsx`.** Modificar el wrapper de Tetris (`aspectRatio: "unset", padding: "12px 8px"`) para que la franja `.touch-controls` quede en flujo normal debajo del canvas, sin afectar el layout de asteroides/arkanoid/snake.
   **Verificación:** en móvil, el canvas de Tetris y la franja de controles se apilan sin solaparse ni recortarse.

5. **Repaso y build.** Confirmar que el teclado (flechas + Espacio + X) sigue funcionando igual que antes y que los demás juegos no cambiaron. `npm run lint` y `npm run build` limpios.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `components/games/shared/TouchActionButton.tsx` existe, es genérico (sin lógica de Tetris), y expone `label`, `onPress`, `disabled`.
- [ ] En viewport < 768px, aparece la franja `.touch-controls` (D-pad + DROP) debajo del canvas de Tetris.
- [ ] En viewport ≥ 768px, la franja `.touch-controls` no se muestra.
- [ ] Tocar IZQUIERDA/DERECHA del D-pad mueve la pieza una columna por tap.
- [ ] Tocar ABAJO hace soft-drop de una fila por tap.
- [ ] Tocar ARRIBA rota la pieza (`tryRotate`).
- [ ] Tocar DROP ejecuta hard-drop inmediato (`hardDrop`).
- [ ] El teclado (flechas, Espacio, X) sigue funcionando exactamente igual que antes de este spec.
- [ ] Los 5 controles táctiles (4 direcciones + DROP) se deshabilitan visualmente y no responden a taps cuando el juego está en pausa o en game over.
- [ ] Los demás juegos del catálogo (asteroides, arkanoid, snake) y el HUD superior siguen sin cambios de comportamiento.
- [ ] `TouchDPad` no fue modificado respecto a la spec 13.

---

## 5 · Decisiones tomadas y descartadas

| Decisión                            | Elegida                                                       | Descartada                                                               | Justificación                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Botón de hard-drop**              | 5º botón separado (`TouchActionButton`), fuera de `TouchDPad` | Extender `TouchDPad` con botones extra opcionales / sin hard-drop táctil | Mantiene `TouchDPad` genérico y reutilizable sin acoplarlo a necesidades específicas de un juego; el patrón "D-pad + botón(es) de acción" es estándar en gamepads móviles.                              |
| **Hold en IZQUIERDA/DERECHA/ABAJO** | Solo tap (un toque = un movimiento)                           | Hold repite el movimiento mientras se mantiene presionado                | Consistente con el criterio ya fijado en la spec de Snake para `TouchDPad`; introducir hold-repeat requeriría modificar el componente compartido, lo cual se descartó para no acoplarlo.                |
| **Mapeo de ARRIBA**                 | Rota la pieza (`tryRotate`)                                   | Sin uso, rotar en botón aparte                                           | Coincide con el mapeo de teclado actual (ArrowUp/KeyX rota); mantiene la misma semántica direccional que el jugador ya conoce del teclado.                                                              |
| **Ubicación del botón DROP**        | A la derecha del D-pad, misma fila                            | Debajo del D-pad, ancho completo                                         | Sigue el layout estándar de gamepad móvil (direccionales de un lado, acción del otro); ocupa menos alto vertical que apilarlo debajo.                                                                   |
| **Reutilización de `TouchDPad`**    | Se usa tal cual, sin modificarlo                              | Modificar `TouchDPad` para aceptar botones extra                         | Preserva el componente compartido genérico definido en la spec 13; el layout combinado (D-pad + acción) se resuelve en un contenedor `.touch-controls` a nivel de cada juego, no dentro del componente. |

---

## 6 · Riesgos identificados

| Riesgo                                                                                                                                                                                                                               | Mitigación                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El wrapper de Tetris en `GamePlayer.tsx` ya usa `padding: "12px 8px"` con `aspectRatio: "unset"`; agregar la franja `.touch-controls` debajo puede reducir el espacio vertical disponible para el canvas en pantallas móviles bajas. | Verificar en DevTools con alturas de viewport reducidas (ej. landscape móvil) durante el paso 4; si el canvas se recorta, ajustar el padding o dejar que el canvas escale con `max-height`. |
| Un doble-tap accidental en DROP puede hacer hard-drop de dos piezas consecutivas sin que el jugador lo note (a diferencia de mover/rotar, el hard-drop es irreversible e instantáneo).                                               | Riesgo aceptado y documentado: mismo comportamiento ya existe con la barra espaciadora en teclado; no se agrega debounce para mantener consistencia entre ambos métodos de entrada.         |
| La franja `.touch-controls` combinada (D-pad + botón DROP) es más ancha que el `.touch-dpad` solo de Snake; en pantallas muy angostas (<360px) podría no entrar en una sola fila.                                                    | Verificar visualmente en DevTools con un viewport de referencia estrecho (360px) durante el paso 2; si no entra, permitir que `.touch-controls` haga wrap con `flex-wrap`.                  |
