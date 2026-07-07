# 02 · Home — landing page

| Campo | Valor |
|---|---|
| **Spec** | `02-home-landing` |
| **Estado** | `Approved` |
| **Fecha** | 2026-07-07 |
| **Dependencias** | SPEC 01 (MVP visual — pantallas) |
| **Objetivo (una frase)** | Portar la landing de `references/templates/home-about/home.jsx` a `/` como Client Component de Next.js 16, moviendo la Biblioteca a `/games` y alimentando la sección "Actividad en vivo" desde `app/data`. |

---

## 1 · Alcance

**Dentro del alcance:**

- **Nueva landing en `/`** (`app/page.tsx`), portada 1:1 de `home.jsx`: hero con siluetas flotantes, sección "¿Por qué Arcade Vault?" (feature-grid), preview de juegos (mini-rail con 6 juegos de `GAMES`), stats, "Actividad en vivo" (ticker + top jugadores), precios/FAQ y CTA final.
- **Mover la Biblioteca actual de `/` a `/games`** (`app/games/page.tsx`), sin cambios de contenido.
- **Actualizar todos los enlaces internos** que apuntaban a `/` como Biblioteca (Nav, back-links de detalle `/juego/[id]` y reproductor `/jugar/[id]`, CTAs) para que apunten a `/games`.
- **Nav actualizado** a 4 links: Inicio (`/`), Biblioteca (`/games`), Salón (`/salon`), Acerca de (`/about`); el logo lleva a `/`; lógica `active` recalculada.
- **Stub placeholder `/about`** (`app/about/page.tsx`): página mínima "próximamente" para que el link no quede roto. La página real de About es otra spec.
- **Datos "Actividad en vivo" derivados de `app/data`** en un nuevo módulo `app/data/activity.ts`: `RECENT_SCORES` (ticker) y `TOP_TODAY` (top jugadores), construidos de forma determinista desde `PLAYERS`, `GAMES` y `seededScores`. Etiquetas de tiempo estáticas decorativas.
- **Portar los estilos del home** desde `references/templates/home-about/styles.css` a `app/globals.css` (bloques `home-*`, `feature-*`, `mini-*`, `activity-*`, `pricing-*`, `reveal`, siluetas, etc.).
- **Efecto reveal on-scroll** (IntersectionObserver) y navegación con `next/navigation`.

**Fuera del alcance (explícito):**

- ❌ Página About/Contacto real (formulario, terminal de éxito) — spec futura; sólo el stub.
- ❌ Datos live reales/en tiempo real (WebSocket, backend). El ticker es estático derivado de datos ficticios.
- ❌ Tiempos calculados con `Date` real (se usan etiquetas fijas para evitar no-determinismo/hidratación).
- ❌ Cambios de lógica en Biblioteca, Detalle, Reproductor, Salón o Auth más allá de la ruta y enlaces.
- ❌ Redirección de compatibilidad de `/` viejo → `/games` (no había URLs públicas previas).

---

## 2 · Modelo de datos

Sólo se introduce un módulo nuevo; el resto reutiliza tipos de SPEC 01.

**`app/data/activity.ts`** — datos decorativos derivados de forma determinista de `PLAYERS`, `GAMES` y `seededScores` (nada de `Date`, nada aleatorio en runtime).

```ts
import type { ScoreRow } from "./types";

export interface RecentScore {
  player: string;   // de PLAYERS
  game: string;     // title de GAMES
  score: number;    // de seededScores
  time: string;     // etiqueta fija: "hace 2 min", "hace 5 min", …
  color: GameColor; // g.color del juego, para el neón
}

export interface TopPlayer {
  rank: number;     // 1..5
  player: string;
  score: number;
}

export const RECENT_SCORES: RecentScore[]; // 7 filas (ticker)
export const TOP_TODAY: TopPlayer[];        // 5 filas (top jugadores hoy)
```

Conventions:

- `RECENT_SCORES` y `TOP_TODAY` se calculan en el módulo (top-level), tomando los primeros N de `PLAYERS`/`GAMES` y puntuaciones de `seededScores(seed, count)`. Al ser deterministas, SSR y cliente coinciden (sin mismatch de hidratación).
- Las etiquetas `time` son un array fijo de strings (`["hace 2 min", "hace 5 min", …]`) asignado por índice.
- Las secciones estáticas de la plantilla (feature-grid, stats, precios, FAQ) **no** son datos: quedan como contenido literal dentro del componente Home (igual que en `home.jsx`).

Ningún otro tipo o estructura cambia; el `mini-rail` usa el `Game` existente y `AuthProvider`/`User` de SPEC 01 se reutiliza sin tocar.

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Mover Biblioteca a `/games`.** Crear `app/games/page.tsx` con el contenido actual de `app/page.tsx` (sin cambios). Aún no se toca `/`. Verificación: `/games` renderiza la Biblioteca completa (buscador, chips, grid).

2. **Portar estilos del home.** Copiar de `references/templates/home-about/styles.css` a `app/globals.css` los bloques del home (`home-hero`, `home-silos`/`silo`, `feature-grid`/`feature-card`/`ft-*`, `mini-rail`/`mini-card`, `home-stats`/`stat-*`, `activity-grid`/`activity-card`/`ticker`/`tick-row`/`top-*`, `pricing-grid`/`price-card`/`pc-*`/`faq-*`, `home-final`/`final-*`, `reveal`/`.in`, `kicker`, `section-head`/`section-title`/`section-rule`). Verificación: `npm run build` sin errores; clases disponibles.

3. **Datos live.** Crear `app/data/activity.ts` con `RECENT_SCORES` (7) y `TOP_TODAY` (5) derivados de `PLAYERS`/`GAMES`/`seededScores`, etiquetas de tiempo fijas. Verificación: importar en un test rápido/consola compila y devuelve arrays con datos.

4. **Componentes auxiliares del home.** Crear `components/home/FloatingSilhouettes.tsx`, `components/home/FeatureIcon.tsx` y `components/home/MiniCard.tsx` (SVG pixel + tarjeta, portados 1:1). Sin montarlos aún.

5. **Landing en `/`.** Reemplazar `app/page.tsx` por el Home (`"use client"`): hero + CTAs (`/games`, `/auth`), feature-grid, mini-rail (`GAMES.slice(0,6)` → `/juego/[id]`), stats, actividad en vivo (`RECENT_SCORES`/`TOP_TODAY`, link a `/salon`), precios/FAQ (CTA `/auth`) y CTA final (`/games`). Incluir hook `useReveal` (IntersectionObserver) en un `useEffect`. Verificación: `/` muestra la landing y el scroll dispara los reveals.

6. **Stub `/about`.** Crear `app/about/page.tsx` con una página mínima "ACERCA DE — próximamente" (reusa `fade-in`/`kicker`). Verificación: `/about` renderiza sin 404.

7. **Nav a 4 links.** Actualizar `components/Nav.tsx`: añadir "Inicio" (`/`) y "Acerca de" (`/about`), cambiar "Biblioteca" a `/games`; recalcular `active` (Inicio sólo en `/`; Biblioteca en `/games`, `/juego`, `/jugar`); logo → `/`. Actualizar panel móvil igual. Verificación: los 4 links navegan y marcan activo correctamente.

8. **Corregir back-links.** En `app/juego/[id]/page.tsx` y `app/jugar/[id]/page.tsx`, cambiar los enlaces "volver"/CTA que apuntaban a `/` (Biblioteca) por `/games`. Verificación: desde detalle/reproductor, "volver" cae en `/games`.

9. **Repaso visual y build.** Recorrer `/`, `/games`, `/juego/[id]`, `/jugar/[id]`, `/salon`, `/auth`, `/about`; comparar el home contra la plantilla; probar responsive/menú móvil. `npm run lint` y `npm run build` limpios.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/` muestra la landing (hero, feature-grid, mini-rail, stats, actividad, precios/FAQ, CTA final), **no** la Biblioteca.
- [ ] `/games` muestra la Biblioteca completa (buscador filtra por nombre, chips por categoría, mensaje "NO HAY RESULTADOS", tarjetas con tilt y navegación al detalle).
- [ ] **Hero:** botón "EXPLORAR JUEGOS" va a `/games` y "CREAR CUENTA" a `/auth`.
- [ ] **Mini-rail:** muestra 6 juegos de `GAMES`; hacer click en uno abre `/juego/[id]`; "VER TODOS LOS JUEGOS" va a `/games`.
- [ ] **Actividad en vivo:** el ticker lista las 7 filas de `RECENT_SCORES` (jugador, juego, puntuación, tiempo) y el top lista las 5 de `TOP_TODAY`; ambos provienen de `app/data/activity.ts` (derivados de `PLAYERS`/`GAMES`/`seededScores`); "VER SALÓN" va a `/salon`.
- [ ] **Reveal:** las secciones marcadas `reveal` aparecen al hacer scroll (clase `in` añadida por IntersectionObserver); no hay error de hidratación en consola.
- [ ] **CTAs de precios/FAQ y final:** "EMPEZAR GRATIS" → `/auth`, "INSERTAR MONEDA" → `/games`.
- [ ] **Nav:** 4 links (Inicio `/`, Biblioteca `/games`, Salón `/salon`, Acerca de `/about`); el logo lleva a `/`; el link activo se resalta según la ruta (Biblioteca activa en `/games`, `/juego`, `/jugar`); el menú móvil replica los 4 links.
- [ ] **Back-links:** desde `/juego/[id]` y `/jugar/[id]`, los enlaces de "volver"/CTA a la biblioteca caen en `/games` (no en `/`).
- [ ] `/about` renderiza un stub "próximamente" sin 404.
- [ ] El home coincide visualmente con `references/templates/home-about/home.jsx` (neón, siluetas, animaciones) y funciona en viewport angosto.

---

## 5 · Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Justificación |
|---|---|---|---|
| **Ruta del Home** | Home en `/`, Biblioteca a `/games` | Home en `/inicio`, Biblioteca en `/` | La portada del sitio debe ser la landing; coincide con la plantilla (Inicio ≠ Biblioteca) y da URLs semánticas. |
| **Alcance About** | Sólo Home + stub `/about` | Home + About completo | El usuario pidió sólo el home; el About real (form/terminal) merece su propia spec. El stub evita el link roto. |
| **Datos "Actividad en vivo"** | Derivar de `app/data` (`activity.ts`) | Hardcode inline como la plantilla | Coherencia con el resto del proyecto; una sola fuente de datos ficticia sustituible luego por BD. |
| **Tiempos del ticker** | Etiquetas estáticas por índice | Calcular con `new Date()` | Evita no-determinismo y mismatch de hidratación SSR; el dato es decorativo. |
| **Componentes del home** | `components/home/*` (silhouettes, feature-icon, mini-card) | Todo inline en `page.tsx` | Sigue la convención de `components/` de SPEC 01 y mantiene `page.tsx` legible. |
| **CSS** | Portar bloques `home-*` a `globals.css` | Reescribir a Tailwind | Igual criterio que SPEC 01: portar 1:1 preserva neón/CRT/reveal sin riesgo. |
| **Home client vs server** | `"use client"` | Server Component | Necesita IntersectionObserver (reveal) y `useRouter`/`onClick` de navegación. |

---

## 6 · Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Mismatch de hidratación si los datos live variaran entre SSR y cliente | `activity.ts` es 100% determinista (sin `Date`/`random`); mismo resultado en server y cliente. |
| Enlaces `/` (Biblioteca) olvidados tras el movimiento a `/games` | El paso 8 los audita explícitamente (detalle, reproductor, Nav); criterio de aceptación lo verifica. |
| Colisión/duplicación de reglas CSS al portar `styles.css` | Portar sólo los bloques `home-*` listados en el paso 2; el resto de `globals.css` no se toca. |

---

## Lo que **no** entra en esta spec

- Página About/Contacto real (formulario, validación, terminal de éxito) — otra spec; aquí sólo el stub `/about`.
- Datos live reales o en tiempo real (WebSocket/backend).
- Persistencia real de puntuaciones o sesión.
- Cambios funcionales en Biblioteca/Detalle/Reproductor/Salón/Auth más allá de ruta y enlaces.
