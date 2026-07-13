# Spec de skins — Asteroides

| Campo        | Valor                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| Juego        | `asteroides` (carpeta de código: `components/games/asteroids/`)                                             |
| Estado       | Implementado                                                                                                |
| Skins        | `neon`, `retro`, `clasico` (default)                                                                        |
| Fuente leída | `components/games/asteroids/engine.ts`, `components/games/asteroids/AsteroidsCanvas.tsx`, `app/globals.css` |

> Nota de naming: el `game-id`/slug de catálogo es `asteroides` (español), pero el código vive en `components/games/asteroids/` (inglés, ya existente). Este spec es solo de diseño; no se toca el código.

## 1. Tipo y paletas por skin

```ts
type Skin = "clasico" | "neon" | "retro";

type AsteroidesPalette = {
  bg: string; // fondo del canvas
  ship: string; // contorno de la nave
  shipGlow: string | null; // sombra/glow de la nave (null = sin glow)
  thruster: string; // llama del propulsor
  bullet: string; // proyectiles
  asteroid: string; // contorno de asteroides
  powerup: string; // contorno + texto "3x" del power-up
  particle: string; // color base de partículas de explosión (alpha se anima en engine)
  hudText: string; // texto HUD general (score)
  hudAccentLevel: string; // texto "NIVEL n"
  hudAccentLives: string; // icono de vidas
  hudAccentTriple: string; // texto/timer de triple disparo
  overlayTitle: string; // "GAME OVER"
  overlaySub: string; // subtítulo del overlay
};

const PALETTES: Record<Skin, AsteroidesPalette> = {
  clasico: {
    bg: "#000000",
    ship: "#ffffff",
    shipGlow: null,
    thruster: "#cfd2d8", // gris claro parpadeante, SIN color (sugerencia: reemplaza el naranja actual del engine)
    bullet: "#ffffff",
    asteroid: "#e6e9ff", // gris-blanco de trazo
    powerup: "#ffffff",
    particle: "#ffffff",
    hudText: "#ffffff",
    hudAccentLevel: "#ffffff",
    hudAccentLives: "#ffffff",
    hudAccentTriple: "#ffffff",
    overlayTitle: "#ffffff",
    overlaySub: "rgba(255,255,255,0.65)",
  },
  neon: {
    bg: "#000000",
    ship: "#00f5ff", // --cyan
    shipGlow: "rgba(0, 245, 255, 0.6)",
    thruster: "#ff006e", // --magenta, llama de propulsión
    bullet: "#f5ff00", // --yellow
    asteroid: "#ff006e", // --magenta
    powerup: "#00ff88", // --green
    particle: "#00f5ff", // --cyan (fading via alpha en engine)
    hudText: "#00f5ff",
    hudAccentLevel: "#f5ff00",
    hudAccentLives: "#ff006e",
    hudAccentTriple: "#00ff88",
    overlayTitle: "#ff006e",
    overlaySub: "rgba(245, 255, 0, 0.75)",
  },
  retro: {
    bg: "#0d0800", // negro cálido
    ship: "#ffb000",
    shipGlow: "rgba(255, 176, 0, 0.5)",
    thruster: "#ff4d00",
    bullet: "#ffd27f",
    asteroid: "#ff7b00",
    powerup: "#ffd27f",
    particle: "#ffb000",
    hudText: "#ffb000",
    hudAccentLevel: "#ff7b00",
    hudAccentLives: "#ffb000",
    hudAccentTriple: "#ffd27f",
    overlayTitle: "#ff7b00",
    overlaySub: "rgba(255, 176, 0, 0.7)",
  },
};
```

Notas de diseño:

- **`clasico`** replica el vector monocromo original (fila de origen, ver §2). La única desviación sugerida frente al engine actual es el color de la llama del propulsor (hoy `rgba(255,130,0,0.85)`, naranja): para respetar el canon "sin glow / monocromo" se propone un gris claro parpadeante (`#cfd2d8`). **Marcado como sugerencia** — si se prefiere conservar el naranja de origen por fidelidad al arcade clásico, es una decisión de producto a confirmar antes de implementar.
- **`neon`** reutiliza literalmente las 4 variables de `app/globals.css` (`--cyan`, `--magenta`, `--yellow`, `--green`) para quedar consistente con el chrome de la app.
- **`retro`** usa la rampa ámbar/naranja del canon (`#ffb000` / `#ff7b00` / `#ffd27f`) sobre negro cálido, evocando vector-monitor ámbar de arcade 80s.

## 2. Mapa elemento → valor por skin

Fila "Origen" = valor hardcodeado actual en `engine.ts` (solo referencia, no se modifica).

| Elemento (engine.ts)                           | Origen (actual)           | clasico (default)                   | neon                                  | retro                                 |
| ---------------------------------------------- | ------------------------- | ----------------------------------- | ------------------------------------- | ------------------------------------- |
| Fondo del canvas (`draw`)                      | `#000`                    | `#000000`                           | `#000000`                             | `#0d0800`                             |
| Nave — contorno (`Ship.draw`)                  | `#fff`                    | `#ffffff`                           | `#00f5ff` + glow `rgba(0,245,255,.6)` | `#ffb000` + glow `rgba(255,176,0,.5)` |
| Nave — llama del propulsor (`Ship.draw`)       | `rgba(255,130,0,0.85)`    | `#cfd2d8` _(sugerido, ver nota §1)_ | `#ff006e`                             | `#ff4d00`                             |
| Icono de vida en HUD (`drawLifeIcon`)          | `#fff`                    | `#ffffff`                           | `#ff006e`                             | `#ffb000`                             |
| Balas (`Bullet.draw`)                          | `#fff`                    | `#ffffff`                           | `#f5ff00`                             | `#ffd27f`                             |
| Asteroides — contorno (`Asteroid.draw`)        | `#fff`                    | `#e6e9ff`                           | `#ff006e`                             | `#ff7b00`                             |
| Power-up — marco + texto "3x" (`PowerUp.draw`) | `#0ff`                    | `#ffffff`                           | `#00ff88`                             | `#ffd27f`                             |
| Partículas de explosión (`Particle.draw`)      | `rgba(255,255,255,alpha)` | `rgba(255,255,255,alpha)`           | `rgba(0,245,255,alpha)`               | `rgba(255,176,0,alpha)`               |
| HUD — `SCORE n` (`drawHUD`)                    | `#fff`                    | `#ffffff`                           | `#00f5ff`                             | `#ffb000`                             |
| HUD — `NIVEL n` (`drawHUD`)                    | `#fff`                    | `#ffffff`                           | `#f5ff00`                             | `#ff7b00`                             |
| HUD — timer triple disparo (`drawHUD`)         | `#0ff`                    | `#ffffff`                           | `#00ff88`                             | `#ffd27f`                             |
| Overlay — título `GAME OVER` (`drawOverlay`)   | `#fff`                    | `#ffffff`                           | `#ff006e`                             | `#ff7b00`                             |
| Overlay — subtítulo (`drawOverlay`)            | `rgba(255,255,255,0.65)`  | `rgba(255,255,255,0.65)`            | `rgba(245,255,0,0.75)`                | `rgba(255,176,0,0.7)`                 |

El juego dibuja todo con formas vectoriales de `ctx.strokeStyle`/`fillStyle` (sin sprites/imágenes). Por lo tanto la estrategia de skin es **100% color de trazo/relleno vía constantes**, no tintado de sprites.

## 3. Estrategia de aplicación (implementado)

- `components/games/asteroids/engine.ts` exporta `type Skin`, `PALETTES: Record<Skin, AsteroidsPalette>` y `DEFAULT_SKIN = "clasico"`. `createEngine(initialSkin?: Skin)` guarda la skin activa en closure y expone `setSkin(next: Skin)` en el objeto retornado.
- Cada clase (`Ship`, `Bullet`, `Asteroid`, `PowerUp`, `Particle`) y las funciones `drawHUD`/`drawOverlay` reciben la paleta activa (`PALETTES[skin]`) como parámetro en su `draw()` en vez de usar colores literales.
- El glow (`shipGlow`) se aplica en `Ship.draw` vía `ctx.shadowColor` + `ctx.shadowBlur = 10` antes de `stroke()`; en `clasico`, `shadowBlur = 0` (sin glow, por canon).
- `AsteroidsCanvas.tsx` recibe un prop `skin?: Skin` (default `DEFAULT_SKIN`): se pasa a `createEngine(skin)` en el mount y se sincroniza vía `engine.setSkin(skin)` en un `useEffect` cuando cambia.
- **Selector de skin (dropdown)**: `components/GamePlayer.tsx` agrega un `<select className="skin-select">` dentro de `.hud-actions`, visible solo cuando `game.id === "asteroides"`, con opciones `clasico | neon | retro` (`SKIN_LABELS`). La selección se persiste en `localStorage` bajo la clave `av-skin-asteroides` y se restaura al montar; `clasico` es el default cuando no hay nada guardado.
- Estilo del `<select>`: clase `.skin-select` en `app/globals.css`, consistente con `.btn` (paleta `--bg-2`/`--ink`/`--cyan` en hover/focus).

## 4. Checklist de verificación dark-mode

Para las 3 skins, sobre el fondo oscuro de cada paleta:

- [ ] **Nave**: contraste ship-vs-bg ≥ legible a simple vista (blanco/cian/ámbar sobre negro — todas cumplen por diseño).
- [ ] **Asteroides**: contorno distinguible del fondo y de la nave (evitar mismo hue que `ship` en la misma skin — verificado: `neon` separa cian/nave de magenta/asteroide; `retro` separa ámbar/nave de naranja/asteroide; `clasico` usa blanco/gris, ambos sobre negro puro).
- [ ] **Balas**: visibles en vuelo rápido (alto contraste, sin depender de glow para ser legibles).
- [ ] **HUD** (`score`, `nivel`, `vidas`, `triple disparo`): texto legible sobre `#000`/`#0d0800` en las 3 skins, tamaño de fuente sin cambios (14–15px monospace).
- [ ] **Power-up**: distinguible de asteroides y balas en las 3 skins (no comparte color con ningún otro elemento dentro de la misma skin).
- [ ] **Overlay Game Over**: título y subtítulo con contraste suficiente sobre fondo oscuro; el overlay se dibuja sobre el campo de juego ya oscuro, no sobre fondo claro.
- [ ] Ninguna skin usa fondo claro; las 3 parten de negro o negro cálido (`#000000` / `#0d0800`).
- [ ] `clasico` no depende de glow (`shadowBlur = 0`) — cumple canon "sin glow".
