# 01 · MVP visual — pantallas

| Campo | Valor |
|---|---|
| **Spec** | `01-mvp-visual-pantallas` |
| **Estado** | `Approved` |
| **Fecha** | 2026-07-06 |
| **Dependencias** | Ninguna (primera spec del proyecto) |
| **Objetivo (una frase)** | Portar las 5 pantallas de `references/templates/` a Next.js 16 App Router como MVP puramente visual, con datos ficticios en `app/data` y sin lógica de juego real. |

---

## 1 · Alcance

**Dentro del alcance:**

- 5 pantallas como rutas de archivo del App Router:
  - `/` → Biblioteca (hero, buscador, filtros por categoría, grid de tarjetas con efecto tilt)
  - `/juego/[id]` → Detalle del juego (portada, info, stat-strip, leaderboard lateral)
  - `/jugar/[id]` → Reproductor (HUD, pantalla CRT con arena decorativa animada, modal de fin de juego) — **placeholder** hasta que existan los juegos reales
  - `/auth` → Acceso (tabs iniciar/crear, login falso, invitado, social decorativo)
  - `/salon` → Salón de la Fama (tabs por juego, podio, tabla de posiciones)
- `Nav` global (con menú móvil) y `footer`, integrados en `layout.tsx`.
- Datos ficticios en `app/data/` (juegos, jugadores, generador de puntuaciones sembrado).
- Sesión de usuario en memoria vía `AuthProvider` (Context) para que el `Nav` refleje login/logout en todas las rutas.
- Simulación decorativa del reproductor (score que sube por timer, pausa/fin) copiada tal cual de la plantilla.

**Fuera del alcance (explícito):**

- ❌ Cualquier juego real o lógica jugable (física, controles, colisiones).
- ❌ Backend, base de datos, API o persistencia real (localStorage incluido — la sesión es en memoria).
- ❌ Autenticación real (OAuth Google/GitHub son botones decorativos).
- ❌ Guardado real de puntuaciones (el "guardar" del reproductor es visual).
- ❌ Reescritura del CSS a Tailwind — `globals.css` ya está migrado y se reutiliza tal cual.
- ❌ Tests automatizados, i18n, SEO avanzado, modo claro/oscuro adicional.

---

## 2 · Modelo de datos

Todo vive en `app/data/` y se tipa con TypeScript. Eventualmente vendrá de una BD; por ahora son módulos estáticos.

**`app/data/types.ts`**

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;         // slug, ej. "bloque-buster"
  title: string;
  short: string;      // descripción de tarjeta
  long: string;       // descripción de detalle
  cat: GameCategory;
  cover: string;      // clase CSS de portada, ej. "cover-bricks"
  color: GameColor;   // color del botón JUGAR
  best: number;       // mejor puntuación global
  plays: string;      // partidas, ej. "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;       // "DD/MM/2026"
}

export interface User {
  name: string;       // iniciales/alias en mayúsculas, máx 10
}
```

- **`app/data/games.ts`** — array `GAMES: Game[]` (los 8 juegos de la plantilla), `CATEGORIES: readonly string[]` (`["TODOS", ...]`) y `getGame(id)`.
- **`app/data/players.ts`** — `PLAYERS: string[]` (18 alias) y `seededScores(seed, count): ScoreRow[]` (generador determinista, portado tal cual de `data.jsx`).
- **Sesión (no es data ficticia, es estado de UI):** `app/providers/auth-provider.tsx` expone un Context con `{ user: User | null, login(user), signOut() }`, en memoria.

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Datos y tipos.** Crear `app/data/types.ts`, `app/data/games.ts` (8 juegos + `CATEGORIES` + `getGame`) y `app/data/players.ts` (`PLAYERS` + `seededScores`). Sin UI todavía.

2. **Sesión + layout.** Crear `app/providers/auth-provider.tsx` (Context en memoria) y `components/Nav.tsx` (client, con menú móvil). Envolver `layout.tsx` con `AuthProvider`, montar `<Nav>` y el `<footer>`. La app queda con navegación global aunque las páginas estén vacías.

3. **Biblioteca (`/`).** Reemplazar `app/page.tsx` por la Biblioteca: hero, buscador y filtros (client), grid con `components/GameCard.tsx` (efecto tilt). Enlaza a `/juego/[id]`.

4. **Detalle (`/juego/[id]`).** Crear `app/juego/[id]/page.tsx`: portada, tags, `stat-strip`, acciones y leaderboard lateral con `seededScores`. Enlaza a `/jugar/[id]` y `/`.

5. **Reproductor (`/jugar/[id]`).** Crear `app/jugar/[id]/page.tsx` (client): HUD, pantalla CRT con arena decorativa, simulación de score por timer, pausa/fin y modal de game over. Portado tal cual como placeholder.

6. **Salón de la Fama (`/salon`).** Crear `app/salon/page.tsx` (client): tabs por juego, podio (oro/plata/bronce) y tabla de posiciones; fila "tu marca" si hay usuario.

7. **Acceso (`/auth`).** Crear `app/auth/page.tsx` (client): tabs iniciar/crear, formulario de login falso (llama a `login()` del Context), botón invitado y social decorativo. Redirige a `/`.

8. **Repaso visual.** Recorrer las 5 rutas, comparar contra las plantillas y verificar responsive/menú móvil. `npm run lint` y `npm run build` limpios.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] Existen las rutas `/`, `/juego/[id]`, `/jugar/[id]`, `/auth`, `/salon` y todas renderizan.
- [ ] `Nav` y `footer` aparecen en todas las rutas; el logo lleva a `/`.
- [ ] **Biblioteca:** el buscador filtra por nombre y los chips filtran por categoría; sin resultados muestra el mensaje "NO HAY RESULTADOS"; las tarjetas tienen efecto tilt y "JUGAR"/click llevan al detalle.
- [ ] **Detalle:** muestra portada, tags, descripción larga, `stat-strip` (partidas/mejor/dificultad) y leaderboard de 10 filas; "JUGAR AHORA" va a `/jugar/[id]` y "VOLVER AL VAULT" a `/`.
- [ ] **Reproductor:** el score sube solo por timer; PAUSA congela y muestra overlay "EN PAUSA"; FIN abre el modal con puntuación final, campo de iniciales y "GUARDAR" (visual); "JUGAR DE NUEVO" reinicia.
- [ ] **Salón:** tabs por juego cambian los datos; podio muestra top 3; la tabla lista 12 filas; con usuario logueado aparece la fila "TU MEJOR MARCA".
- [ ] **Acceso:** tabs iniciar/crear (el correo solo aparece en "crear"); enviar el formulario loguea y redirige a `/`; "JUGAR COMO INVITADO" entra sin usuario.
- [ ] Tras loguear, el `Nav` muestra el nombre del usuario en todas las rutas; logout lo revierte (estado en memoria).
- [ ] El diseño coincide visualmente con las plantillas (neón, CRT, animaciones) y el menú móvil funciona en viewport angosto.
- [ ] No existe lógica de juego real ni persistencia (localStorage/BD).

---

## 5 · Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Justificación |
|---|---|---|---|
| **CSS** | Reutilizar `globals.css` ya migrado; Tailwind para lo nuevo | Reescribir todo a Tailwind | El CSS ya está portado 1:1; reescribir arriesga perder efectos CRT/flicker/tilt sin ganancia visual. |
| **Ruteo** | Rutas de archivo del App Router | SPA con hash routing (como la plantilla) | Aprovecha Next.js, URLs limpias y navegación nativa. |
| **Reproductor** | Copiar la simulación decorativa tal cual | Placeholder estático | Es un placeholder temporal hasta los juegos reales; conservar el HUD vivo da mejor sensación. |
| **Sesión** | `AuthProvider` (Context) en memoria | localStorage / backend | El `Nav` en el layout necesita el usuario en todas las rutas; "eventualmente vendrá de una BD", así que sin persistencia por ahora. |
| **Datos** | Módulos estáticos tipados en `app/data/` | Mezclarlos en los componentes | Aísla la fuente de datos ficticia para sustituirla luego por la BD sin tocar la UI. |
| **Definición** | Spec detallada con clarificación previa | Definición rápida | Se respondieron las 4 decisiones clave antes de redactar. |
