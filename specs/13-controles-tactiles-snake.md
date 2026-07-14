# 13 · Controles táctiles Snake

| Campo                    | Valor                                                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `13-controles-tactiles-snake`                                                                                                                                                            |
| **Estado**               | `Implemented`                                                                                                                                                                            |
| **Fecha**                | 2026-07-13                                                                                                                                                                               |
| **Dependencias**         | SPEC 11 (juego Snake)                                                                                                                                                                    |
| **Objetivo (una frase)** | Agregar un D-pad táctil reutilizable debajo del canvas de Snake (visible en viewports móviles) para que la serpiente se pueda controlar sin teclado en dispositivos con pantalla táctil. |

---

## 1 · Alcance

**Dentro del alcance:**

- **Componente compartido** `components/games/shared/TouchDPad.tsx` (`"use client"`): D-pad genérico de 4 botones de dirección (↑ ↓ ← →), recibe un callback `onDirection(dir)` por prop, sin lógica de ningún juego específico. Reutilizable por los specs de asteroides/tetris/arkanoid más adelante.
- **Integración en `SnakeCanvas.tsx`:** renderizar `<TouchDPad>` debajo del canvas, cada botón invoca la misma función interna que hoy usan los listeners de teclado para encolar `nextDir` (un tap = un cambio de dirección, sin repetición al mantener presionado).
- **Visibilidad responsive:** el D-pad se muestra solo cuando el viewport es angosto (media query CSS, breakpoint `768px`), oculto en desktop.
- **`app/layout.tsx`:** agregar `export const viewport` con `width=device-width, initial-scale=1` (actualmente ausente), necesario para que el D-pad y el canvas escalen correctamente en dispositivos reales.
- **Estilos** en `app/globals.css`: apariencia del D-pad coherente con la estética retro/neón (botones pixel-art, feedback visual al presionar).

**Fuera del alcance (explícito):**

- ❌ Controles táctiles para asteroides, tetris o arkanoid — cada uno será su propio spec, reutilizando `TouchDPad`.
- ❌ Swipe / gestos sobre el canvas.
- ❌ Cambios al HUD superior (PAUSA/FIN/SALIR) — se deja igual, ya usa `flex-wrap`.
- ❌ Modo hold-to-repeat en los botones.
- ❌ Cambios al motor (`engine.ts`) de Snake — el D-pad solo invoca la misma función de cambio de dirección que ya existe para el teclado.

---

## 2 · Modelo de datos

```ts
// components/games/shared/TouchDPad.tsx

type DPadDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";

type TouchDPadProps = {
  onDirection: (dir: DPadDirection) => void;
  disabled?: boolean; // true cuando el juego está en pausa o game over
};
```

No introduce estado propio — es un componente de presentación puro (4 `<button>`), cada `onClick`/`onTouchStart` llama `onDirection(dir)`. `SnakeCanvas.tsx` traduce `DPadDirection` a su `Direction` interno (son el mismo set de valores, sin transformación) y llama a la misma función que ya usa el handler de teclado para encolar `nextDir`.

No hay cambios en `app/data/types.ts` ni en el motor (`engine.ts`).

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Viewport meta.** Agregar `export const viewport: Viewport = { width: "device-width", initialScale: 1 }` en `app/layout.tsx`.
   **Verificación:** `npx tsc --noEmit` limpio; inspeccionar el `<meta name="viewport">` generado en el HTML servido.

2. **Componente `TouchDPad`.** Crear `components/games/shared/TouchDPad.tsx`:
   - 4 botones en cruz (↑ ↓ ← →) con `aria-label` descriptivo.
   - Prop `onDirection` invocada en `onClick` (funciona tanto con tap táctil como con click de mouse, sin listeners `touchstart` separados).
   - Prop `disabled` deshabilita los 4 botones (`disabled` attribute) cuando es `true`.
     **Verificación:** `npx tsc --noEmit` limpio; componente importable de forma aislada.

3. **Estilos del D-pad.** Agregar en `app/globals.css` la clase `.touch-dpad` (grid 3×3, botón central vacío) con estética pixel-art coherente con `.btn` existentes, y una media query `@media (min-width: 768px) { .touch-dpad { display: none; } }`.
   **Verificación:** revisar visualmente en DevTools con viewport móvil (< 768px) y desktop (≥ 768px).

4. **Integración en `SnakeCanvas.tsx`.** Extraer la lógica actual de "encolar `nextDir` sin permitir giro de 180°" (hoy dentro del listener `keydown`) a una función interna reutilizable `queueDirection(dir: Direction)`. Los listeners de teclado y el nuevo `<TouchDPad onDirection={queueDirection} disabled={paused || gameOver} />` llaman a la misma función. Ajustar el wrapper de Snake en `GamePlayer.tsx` para que el canvas y el D-pad se apilen en columna (en vez del `position: absolute` actual) sin afectar el layout de los demás juegos.
   **Verificación:** en `/jugar/snake` con DevTools en modo dispositivo móvil, tocar los 4 botones mueve la serpiente igual que las flechas del teclado; no se permite giro de 180°; los botones se deshabilitan en pausa/game over.

5. **Repaso y build.** Confirmar que el teclado sigue funcionando igual que antes (sin regresión) y que los demás juegos no cambiaron. `npm run lint` y `npm run build` limpios.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `app/layout.tsx` exporta `viewport` con `width=device-width, initial-scale=1`; el HTML servido incluye el `<meta name="viewport">` correspondiente.
- [ ] `components/games/shared/TouchDPad.tsx` existe, es genérico (sin lógica de Snake), y expone `onDirection` + `disabled`.
- [ ] En viewport < 768px, el D-pad es visible debajo del canvas de Snake.
- [ ] En viewport ≥ 768px, el D-pad no se muestra.
- [ ] Tocar cada uno de los 4 botones del D-pad mueve la serpiente en la dirección correspondiente.
- [ ] Un tap en un botón produce un único cambio de dirección (no repite al mantener presionado).
- [ ] El D-pad no permite encolar un giro de 180° (misma regla que el teclado).
- [ ] El teclado (flechas + WASD) sigue funcionando exactamente igual que antes de este spec.
- [ ] El D-pad se deshabilita visualmente y no responde a taps cuando el juego está en pausa o en game over.
- [ ] Los demás juegos del catálogo (asteroides, tetris, arkanoid) y el HUD superior siguen sin cambios de comportamiento.

---

## 5 · Decisiones tomadas y descartadas

| Decisión                              | Elegida                                            | Descartada                                                           | Justificación                                                                                                                                                         |
| ------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **División del trabajo**              | Un spec por juego, empezando por Snake como piloto | Un solo spec para los 4 juegos                                       | Cada juego tiene un esquema de control distinto (4 direcciones vs. 1 eje vs. 4-5 botones); dividir permite implementar y verificar cada uno sin bloquear a los demás. |
| **Mecanismo de control**              | D-pad de 4 botones en pantalla                     | Swipe sobre el canvas / ambos combinados                             | El D-pad es predecible y sin ambigüedad de gestos; el swipe puede generar giros accidentales o chocar con el scroll de la página.                                     |
| **Ubicación del D-pad**               | Franja fija debajo del canvas                      | Botones superpuestos en las esquinas del canvas                      | No se superpone al tablero de juego; más simple de estilizar y de hacer accesible.                                                                                    |
| **Detección de visibilidad**          | Media query CSS por ancho de viewport (`768px`)    | Detección JS de soporte táctil (`pointer: coarse`) / mostrar siempre | Simple, sin JS extra, funciona igual en cualquier dispositivo con pantalla angosta (incluye desktop con ventana redimensionada para pruebas).                         |
| **Repetición al mantener presionado** | Solo tap (un toque = un cambio de dirección)       | Hold repite el input                                                 | Coherente con el comportamiento actual del teclado; la serpiente ya avanza sola por tick, mantener presionado no aporta nada nuevo.                                   |
| **Reutilización del componente**      | `TouchDPad` genérico y compartido desde ahora      | Específico de Snake, extraído después                                | Los siguientes 3 specs (asteroides, tetris, arkanoid) reutilizarán el mismo componente; evita duplicar CSS/lógica táctil 4 veces y un refactor posterior.             |
| **`viewport` en `layout.tsx`**        | Se agrega en este spec                             | Se deja fuera de alcance                                             | Sin `width=device-width, initial-scale=1` el D-pad y el canvas pueden escalar mal en dispositivos reales; es un cambio de una línea, necesario para el resto.         |
| **HUD superior**                      | Sin cambios (ya usa `flex-wrap`)                   | Ajustar tamaño de botones/tipografía para móvil                      | Fuera del alcance de este spec; si se detectan problemas visuales reales, sería un spec de ajuste aparte.                                                             |

---

## 6 · Riesgos identificados

| Riesgo                                                                                                                                                                                       | Mitigación                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El contenedor de `SnakeCanvas` en `GamePlayer.tsx` usa `position: absolute` con `aspectRatio: 1/1`; agregar el D-pad debajo del canvas puede requerir cambiar ese contenedor a flujo normal. | Ajustar el wrapper de Snake en `GamePlayer.tsx` a flujo normal (columna: canvas + D-pad) solo para este juego, sin tocar el layout de los demás.                              |
| `onClick` en botones táctiles puede disparar un evento fantasma (`click` retrasado ~300ms) en algunos navegadores móviles antiguos, duplicando el input.                                     | Aceptable para Snake: un cambio de dirección duplicado no rompe el juego (la segunda invocación con la misma dirección es un no-op). Riesgo conocido, sin debounce adicional. |
| El breakpoint de `768px` puede no coincidir con el punto donde el layout del `crt-screen` ya se reacomoda, dejando un salto visual brusco.                                                   | Verificar visualmente en DevTools en anchos intermedios (600–800px) durante el paso 3 del plan; ajustar el breakpoint si se ve mal.                                           |
