# NN+1 · Catálogo [TÍTULO]

| Campo                    | Valor                                                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `NN+1-catalogo-[slug]`                                                                                                                                           |
| **Estado**               | `Draft`                                                                                                                                                          |
| **Fecha**                | YYYY-MM-DD                                                                                                                                                       |
| **Dependencias**         | SPEC NN (`NN-juego-[slug]`), SPEC 06 (tablas `games`/`scores` y queries en Supabase)                                                                             |
| **Objetivo (una frase)** | Insertar la entrada del juego "[slug]" en la tabla `games` de Supabase para que aparezca en el catálogo, el detalle y el salón de la fama sin cambios de código. |

---

## Alcance

**Dentro del alcance:**

- **INSERT en tabla `games`:** una fila nueva con los campos `id`, `title`, `short`, `long_desc`, `cat`, `cover`, `color` del juego "[slug]".
- **Verificación del catálogo** (`/games`): la tarjeta "[TÍTULO]" aparece con portada, botón de color correcto y enlace al detalle.
- **Verificación del detalle** (`/juego/[slug]`): `best` y `plays` se calculan en vivo vía `MAX(score)`/`COUNT(*)` sobre `scores` (ambos en 0 hasta la primera partida guardada).
- **Verificación del reproductor** (`/jugar/[slug]`): `GamePlayer` carga correctamente el juego desde Supabase.
- **Verificación del salón** (`/salon`): la pestaña "[TÍTULO]" muestra el estado vacío ("Aún sin puntuaciones. ¡Sé el primero!") hasta que se guarden puntuaciones reales.
- **Verificación end-to-end:** jugar una partida en `/jugar/[slug]`, perder, guardar puntuación con un alias, y confirmar que la fila aparece en `scores` y se refleja en `/salon` y `/juego/[slug]`.

**Fuera del alcance (explícito):**

- ❌ Cambios de código en `lib/supabase/queries.ts`, `GamePlayer.tsx`, `/salon`, `/juego/[id]` — la infraestructura ya existe y es genérica.
- ❌ Cambios de schema en Supabase (`games`/`scores` ya existen con el schema correcto).
- ❌ RLS adicional — el mínimo ya está configurado desde SPEC 06.
- ❌ Cover art CSS — cubierto en SPEC NN (`NN-juego-[slug]`).
- ❌ Motor del juego o componente canvas — cubiertos en SPEC NN.

---

## Modelo de datos

No hay cambios de schema. Solo se inserta una fila en `games`:

```sql
INSERT INTO games (id, title, short, long_desc, cat, cover, color)
VALUES (
  '[slug]',
  '[TÍTULO]',
  '[short: descripción de tarjeta, ≈80 chars]',
  '[long_desc: descripción larga, tono arcade retro]',
  '[ARCADE|PUZZLE|SHOOTER|VERSUS]',
  'cover-[slug]',
  '[cyan|magenta|yellow|green]'
);
```

`best` y `plays` no son columnas en `games` — se calculan en vivo con `MAX(score)`/`COUNT(*)` sobre `scores` en `getGameWithStats()`.

---

## Plan de implementación

Cada paso deja la app compilando y navegable.

1. **INSERT en Supabase.** Ejecutar el INSERT SQL de arriba via `mcp_supabase_execute_sql`. **Verificación:** `SELECT * FROM games WHERE id = '[slug]'` devuelve exactamente 1 fila con los campos correctos.

2. **Verificar catálogo y detalle.** Abrir `/games` — la tarjeta "[TÍTULO]" aparece con portada `.cover-[slug]` y botón [color]. Abrir `/juego/[slug]` — renderiza el detalle genérico con `best: 0` y `plays: 0` (no hay scores aún). **Verificación:** sin errores en consola ni en `npm run build`.

3. **Verificar reproductor.** Abrir `/jugar/[slug]` — `GamePlayer` carga el juego correctamente (el canvas del motor real, no la arena decorativa). **Verificación:** idéntico al comportamiento ya verificado en SPEC NN.

4. **Verificación end-to-end.** Jugar una partida completa de [TÍTULO], perder, introducir un alias y pulsar "GUARDAR PUNTUACIÓN". **Verificación:** la fila nueva aparece en `scores` (via `execute_sql` o recargando `/salon` y `/juego/[slug]`); `best` y `plays` se actualizan en vivo en el detalle.

---

## Criterios de aceptación

- [ ] `SELECT * FROM games WHERE id = '[slug]'` devuelve exactamente 1 fila.
- [ ] `/games` muestra la tarjeta "[TÍTULO]" (N juegos en total) con `.cover-[slug]` y botón [color].
- [ ] `/juego/[slug]` renderiza el detalle genérico sin errores; `best` y `plays` muestran valores calculados en vivo (0 inicialmente).
- [ ] `/juego/[slug]` sin puntuaciones muestra el estado vacío en la sección de mejores puntuaciones.
- [ ] `/jugar/[slug]` carga `GamePlayer` con el motor real (sin errores).
- [ ] Jugar, perder y guardar puntuación inserta una fila real en `scores` con `game_id = '[slug]'`.
- [ ] Tras guardar, la puntuación aparece en `/salon` (pestaña "[TÍTULO]") y en `/juego/[slug]` sin recargar caché obsoleta.
- [ ] Los otros juegos del catálogo siguen sin cambios de comportamiento.
- [ ] `npm run build` y `npm run lint` terminan sin errores.

---

## Decisiones tomadas y descartadas

| Decisión                               | Elegida                                                                          | Descartada                                               | Justificación                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Solo INSERT, sin cambios de código** | La infraestructura de SPEC 06 es completamente genérica; un INSERT es suficiente | Añadir lógica especial por juego en queries o GamePlayer | Evita divergencia de comportamiento entre juegos; el diseño genérico de SPEC 06 lo previó.         |
| **`best`/`plays` en vivo**             | Calculados vía `MAX`/`COUNT` sobre `scores`; arrancan en 0                       | Valores ficticios en la fila de `games`                  | Consistente con el resto del catálogo post-SPEC 06; los valores falsos se descontinuaron entonces. |
