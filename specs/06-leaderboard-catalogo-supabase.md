# SPEC 06 — Leaderboard y catálogo de juegos en Supabase

> **Estado:** Aprobado
> **Depende de:** SPEC 04 (integración base de Supabase), SPEC 05 (juego Asteroides)
> **Fecha:** 2026-07-08
> **Objetivo:** Migrar el catálogo de juegos y las puntuaciones a tablas reales de Supabase (`games` y `scores`), para que `/games`, `/juego/[id]` y `/salon` lean datos reales y "GUARDAR PUNTUACIÓN" inserte puntuaciones de verdad en los 9 juegos.

---

## Alcance

**Dentro del alcance:**

- Tabla `games` en Supabase (id, title, short, long, cat, cover, color) poblada por migración desde `app/data/games.ts` (9 filas).
- Tabla `scores` en Supabase (id, game_id FK→games.id, player_name, score, played_at) — arranca vacía para los 9 juegos.
- RLS mínimo (solo lo necesario para que el flujo funcione): `SELECT` público en `games`/`scores` e `INSERT` público en `scores`, sin políticas de `update`/`delete`.
- `app/data/games.ts` y `getGame()` se eliminan; todo el código que los importaba pasa a leer de Supabase.
- `best` (mejor puntuación) y `plays` (nº de partidas) por juego se calculan en vivo con `MAX(score)`/`COUNT(*)` sobre `scores`, ya no son valores estáticos.
- `/games` (catálogo), `/juego/[id]` (detalle) y `/jugar/[id]` pasan a Server Components (o fetch server-side) que leen `games`/`scores` de Supabase.
- `/salon`: cada pestaña de juego lee sus scores reales de Supabase; si un juego no tiene filas en `scores`, se muestra un estado vacío ("Aún sin puntuaciones. ¡Sé el primero!") en vez de podio/tabla.
- `GamePlayer.tsx`: "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` (game_id, player_name = alias del input, score, played_at = ahora) para los 9 juegos, incluidos los 8 con motor decorativo.
- Tipos de Supabase (`lib/supabase/database.types.ts`) regenerados para incluir `games` y `scores`.

**Fuera del alcance (para specs futuras):**

- ❌ Endurecimiento de RLS (roles distintos de `anon`, rate-limiting, protección contra spam, políticas de `update`/`delete`) — spec dedicada de seguridad/RLS. Esta spec solo crea el mínimo (`select` público, `insert` público en `scores`) para que el leaderboard funcione end-to-end.
- ❌ "Actividad en vivo" y "top hoy" del home (`app/data/activity.ts`) — siguen usando `seededScores` ficticio, no leen de `scores` real.
- ❌ Auth real / login persistente — se sigue usando `auth-provider.tsx` fake y el alias de texto libre en el modal.
- ❌ Motores de juego reales para los 8 juegos restantes (siguen con timer decorativo; solo cambia que ahora SÍ guardan su score simulado como real).
- ❌ Edición/borrado de puntuaciones, moderación de nombres ofensivos, rate-limiting de inserts.
- ❌ Migrar `PLAYERS`/`seededScores` de `app/data/players.ts` — ese archivo puede quedar como helper no usado o se limpia, pero no se reemplaza por una tabla `players`.

---

## Modelo de datos

**Tabla `games`** (migrada desde `app/data/games.ts`, 9 filas fijas vía migración SQL):

```sql
create table games (
  id text primary key,        -- slug, ej. "asteroides"
  title text not null,
  short text not null,        -- descripción de tarjeta
  long_desc text not null,    -- descripción de detalle
  cat text not null,          -- "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS"
  cover text not null,        -- clase CSS de portada, ej. "cover-bricks"
  color text not null         -- "cyan" | "magenta" | "yellow" | "green"
);
```

**Tabla `scores`** (vacía al crearse, se llena solo con inserts reales desde el reproductor):

```sql
create table scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games(id),
  player_name text not null,   -- alias, máx 10 chars, mismo input que hoy
  score int not null,
  played_at timestamptz not null default now()
);
```

**RLS mínimo:** `select` público (`using (true)`) en `games` y `scores`; `insert` público (`with check (true)`) solo en `scores`. Sin `update`/`delete`, sin roles diferenciados, sin rate-limiting — el endurecimiento queda para la spec de seguridad/RLS futura.

**Tipos TS (`Game`, en `app/data/types.ts`):** se ajusta `long` → se mantiene el nombre de campo `long` en el tipo TS aunque la columna SQL sea `long_desc` (mapeo en la capa de lectura), para no romper el resto del código que ya usa `game.long`. `best` y `plays` se calculan aparte (no vienen de la tabla `games`):

```ts
// lib/supabase/queries.ts (nuevo)
type GameRow = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: GameColor;
};
type GameWithStats = GameRow & { best: number; plays: number }; // best/plays via MAX/COUNT sobre scores
```

`app/data/types.ts` no cambia de forma (`Game`, `ScoreRow`, `User` siguen igual); solo cambia de dónde se obtienen los datos.

---

## Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Migración SQL.** Crear tablas `games` y `scores` vía `mcp_supabase_apply_migration`, con el RLS mínimo (`select` público en ambas, `insert` público solo en `scores`), y un `insert` seed con las 9 filas actuales de `app/data/games.ts` en `games`. **Verificación:** `list_tables` muestra ambas tablas; `games` tiene 9 filas, `scores` tiene 0.

2. **Tipos regenerados.** Regenerar `lib/supabase/database.types.ts` con `generate_typescript_types`. **Verificación:** exporta tipos para `games` y `scores`; `npx tsc --noEmit` limpio.

3. **Capa de queries.** Crear `lib/supabase/queries.ts` con `getGames()`, `getGame(id)`, `getGameWithStats(id)` (best/plays vía `MAX`/`COUNT` sobre `scores`), `getTopScores(gameId, limit)`, `insertScore(gameId, playerName, score)`. **Verificación:** módulo importable, `tsc` limpio.

4. **Catálogo `/games`.** Convertir `app/games/page.tsx` en Server Component que llama `getGames()` y pasa los datos a un nuevo `GamesGrid.tsx` (`"use client"`) que mantiene el filtro/búsqueda actual. **Verificación:** `/games` muestra las 9 tarjetas leídas de Supabase.

5. **Detalle `/juego/[id]`.** Reemplazar `getGame` + `seededScores` por `getGameWithStats(id)` y `getTopScores(id, 10)`. Si no hay scores, la sección "MEJORES PUNTUACIONES" muestra el mismo mensaje de vacío que el salón. **Verificación:** `/juego/asteroides` compila y muestra `best`/`plays` reales (0 si aún no hay partidas guardadas).

6. **Reproductor `/jugar/[id]`.** Reemplazar `getGame` (de `app/data/games`) por `getGame` de `lib/supabase/queries.ts` en `app/jugar/[id]/page.tsx`. **Verificación:** `/jugar/asteroides` sigue cargando `GamePlayer` sin errores.

7. **Guardar puntuación real.** En `GamePlayer.tsx`, el botón "GUARDAR PUNTUACIÓN" llama `insertScore(game.id, name, score)` (cliente browser de Supabase) en vez de solo `setSaved(true)`; en éxito muestra el toast actual, en error muestra un mensaje corto de fallo sin bloquear "JUGAR DE NUEVO". **Verificación:** jugar ASTEROIDES, perder, guardar puntuación con un alias, y confirmar la fila nueva en la tabla `scores` (via `list_tables`/`execute_sql` o recargando `/salon`).

8. **Salón `/salon`.** Convertir en Server Component que llama `getGames()` para las pestañas, y un client component `HallOfFame.tsx` que al cambiar de pestaña llama `getTopScores(gameId, 12)` (cliente browser); si la lista viene vacía, se oculta podio/tabla y se muestra "Aún sin puntuaciones. ¡Sé el primero!". **Verificación:** pestañas con scores reales (ej. ASTEROIDES tras el paso 7) muestran podio/tabla; las otras 8 muestran el estado vacío.

9. **Desacoplar `activity.ts`.** `app/data/activity.ts` deja de importar `GAMES` de `app/data/games`; en su lugar recibe la lista de juegos (id/title/color) como parámetro desde donde se usa (`app/page.tsx`, que ya puede llamar `getGames()` como Server Component), manteniendo `seededScores` para los valores de puntuación ficticios. **Verificación:** `/` (home) sigue mostrando el ticker de actividad y "top hoy" sin cambios visuales.

10. **Limpieza y build.** Eliminar `app/data/games.ts`. `npm run lint` y `npm run build` limpios. Jugar una partida completa de ASTEROIDES y confirmar que aparece en `/salon` y en el detalle `/juego/asteroides`.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] Existen las tablas `games` (9 filas) y `scores` (0 filas iniciales) en Supabase, con RLS mínimo (`select` público en ambas, `insert` público en `scores`).
- [ ] `app/data/games.ts` y su `getGame()` ya no existen; ningún archivo los importa.
- [ ] `/games` muestra las 9 tarjetas leyendo de Supabase (`getGames()`), con búsqueda y filtro por categoría funcionando igual que antes.
- [ ] `/juego/[id]` muestra `best`/`plays` calculados con `MAX(score)`/`COUNT(*)` sobre `scores` (no valores estáticos).
- [ ] `/juego/[id]` sin puntuaciones muestra el mismo estado vacío que `/salon` en vez de una tabla rota o vacía.
- [ ] `/salon`: la pestaña de un juego sin filas en `scores` muestra "Aún sin puntuaciones. ¡Sé el primero!" sin podio ni tabla.
- [ ] Jugar ASTEROIDES, perder, y usar "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` (verificable con `execute_sql` o recargando `/salon`/`/juego/asteroides`).
- [ ] "GUARDAR PUNTUACIÓN" funciona igual (inserta) en los otros 8 juegos con motor decorativo.
- [ ] Tras guardar una puntuación en cualquiera de los 9 juegos, esa puntuación aparece reflejada en `/salon` y en `/juego/[id]` sin recargar caché obsoleta.
- [ ] `app/data/activity.ts` sigue funcionando (`/` muestra ticker y "top hoy") usando datos de juegos reales (título/color) pero puntuaciones ficticias (`seededScores`), sin depender de `app/data/games.ts`.
- [ ] Ningún secreto no-`NEXT_PUBLIC_*` aparece en el bundle client (los inserts desde `GamePlayer.tsx` usan el cliente browser con la clave publishable).

---

## Decisiones tomadas y descartadas

| Decisión                                     | Elegida                                                                                                                                                                       | Descartada                                                                   | Justificación                                                                                                                                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identidad del jugador**                    | Alias de texto libre en el modal (ya existe en `GamePlayer.tsx`), usa `user.name` como valor por defecto si hay sesión fake                                                   | Requerir auth real primero / usar solo `user.name` sin input                 | No hay auth real ni persistente hoy; bloquear el leaderboard hasta tener auth habría inflado el alcance. El input ya existía, solo se conecta a Supabase.                                                               |
| **Alcance de juegos con tabla real**         | Los 9 juegos del catálogo migran a `games`, y los 9 pueden insertar en `scores`                                                                                               | Solo ASTEROIDES                                                              | El usuario prefirió una migración completa del catálogo en vez de dejar 8 juegos en un archivo estático y 1 en Supabase — evita mantener dos fuentes de verdad.                                                         |
| **Puntuaciones de los 8 juegos decorativos** | Sus scores simulados (timer falso) también se guardan como reales al pulsar "GUARDAR PUNTUACIÓN"                                                                              | Bloquear el guardado hasta tener motor real                                  | Consistencia: los 9 juegos comparten el mismo componente `GamePlayer`; diferenciar el comportamiento del botón por juego habría sido una excepción ad-hoc. Se documenta como limitación conocida (§Riesgos).            |
| **RLS**                                      | Mínimo: `select` público en `games`/`scores`, `insert` público solo en `scores`; sin roles/rate-limiting                                                                      | RLS completo (roles, rate-limiting, protección anti-spam) en esta misma spec | El endurecimiento de RLS es un tema propio (seguridad) que merece su propia spec; aquí solo se habilita lo mínimo para que el leaderboard funcione end-to-end.                                                          |
| **`best`/`plays`**                           | Calculados en vivo (`MAX`/`COUNT` sobre `scores`)                                                                                                                             | Columnas estáticas migradas de `app/data/games.ts`                           | Si son columnas estáticas, se desincronizan en cuanto exista una puntuación real; calcularlos en vivo es la única forma consistente con un leaderboard real.                                                            |
| **`app/data/games.ts`**                      | Se elimina; todo pasa a leer de Supabase vía `lib/supabase/queries.ts`                                                                                                        | Mantenerlo como fuente de verdad con Supabase como espejo                    | Tener dos fuentes de verdad (archivo + tabla) generaría desincronización inmediata en cuanto se guarde una puntuación real.                                                                                             |
| **Estado vacío del salón**                   | Mensaje "Aún sin puntuaciones. ¡Sé el primero!", oculta podio/tabla                                                                                                           | Podio/tabla vacíos con guiones/ceros                                         | Evita un layout roto (podio necesita al menos 3 filas) y comunica mejor que el juego simplemente no tiene partidas guardadas aún.                                                                                       |
| **`app/data/activity.ts`**                   | Queda fuera de esta spec para las puntuaciones (`seededScores` ficticio), pero recibe los juegos reales (título/color) como parámetro en vez de importar el archivo eliminado | Migrar también el ticker a scores reales                                     | El ticker de "actividad en vivo" es decorativo por diseño (SPEC 04 ya lo dejó fuera); migrarlo habría expandido el alcance sin pedirlo el usuario. Solo se resuelve la dependencia rota por borrar `app/data/games.ts`. |

---

## Riesgos identificados

| Riesgo                                                                                                                                                                                    | Mitigación                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS mínimo de `insert` público en `scores` permite que cualquiera con la clave publishable llene la tabla con datos basura/spam                                                           | Aceptado temporalmente; el endurecimiento (roles, rate-limiting, moderación) se hace en la spec dedicada de RLS/seguridad, fuera de esta spec.                                                                                               |
| Los 8 juegos decorativos guardan puntuaciones de un timer simulado como si fueran reales, mezclándose con la partida real de ASTEROIDES en el mismo `game_id` una vez tengan motor propio | Al día de hoy no hay colisión porque cada `game_id` es único por juego; cuando un juego decorativo obtenga motor real (spec futura), sus scores "falsos" ya guardados quedarán mezclados con los reales — se documenta para limpieza futura. |
| `getTopScores`/`getGameWithStats` sin caché pueden generar muchas queries a Supabase si `/salon` o `/juego/[id]` reciben tráfico alto                                                     | Fuera de alcance optimizar caché en esta spec; dataset pequeño (arcade demo), no es crítico ahora.                                                                                                                                           |
| Migración SQL con seed de 9 filas debe correr una sola vez; re-ejecutarla duplicaría `games`                                                                                              | El `insert` de seed usa `id` como PK (conflicto en re-ejecución falla explícito en vez de duplicar silenciosamente).                                                                                                                         |
| Romper `app/page.tsx`/`activity.ts` al eliminar `app/data/games.ts` si se pasa por alto algún import                                                                                      | Paso 9 del plan aísla explícitamente ese cambio antes del paso de limpieza final (paso 10), con verificación manual del home.                                                                                                                |

---

## Lo que **no** entra en esta spec

- "Actividad en vivo" y "top hoy" del home migrados a datos reales.
- Auth real / login persistente.
- Motores de juego reales para los 8 juegos restantes.
- Edición/borrado de puntuaciones, moderación, rate-limiting.
- Tabla `players` en Supabase.

Cada una de éstas, si llega, va en su propia spec.
