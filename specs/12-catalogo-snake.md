# 12 · Catálogo Snake

| Campo                    | Valor                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `12-catalogo-snake`                                                                                                                      |
| **Estado**               | `Draft`                                                                                                                                  |
| **Fecha**                | 2026-07-10                                                                                                                               |
| **Dependencias**         | SPEC 11 (juego Snake), SPEC 06 (leaderboard y catálogo en Supabase)                                                                      |
| **Objetivo (una frase)** | Insertar la fila `snake` en la tabla `games` de Supabase para que el juego aparezca en el catálogo y su leaderboard funcione end-to-end. |

---

## Alcance

**Dentro del alcance:**

- **INSERT SQL** de una fila en la tabla `games` de Supabase con todos los campos del juego Snake.
- **Verificación** de que `/games` muestra la tarjeta "SNAKE" leyendo de Supabase.
- **Verificación** de que `/juego/snake` y `/jugar/snake` cargan sin errores.
- **Verificación** de que "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` y aparece
  en `/salon` y `/juego/snake`.

**Fuera del alcance (explícito):**

- ❌ Cambios de código — todo el código necesario lo aporta SPEC 11.
- ❌ Cambios de esquema en Supabase — las tablas `games` y `scores` ya existen con RLS
  configurado (SPEC 06).
- ❌ Modificar filas existentes en `games`.

---

## Modelo de datos

Fila a insertar en la tabla `games`:

```sql
INSERT INTO games (id, title, short, long_desc, cat, cover, color)
VALUES (
  'snake',
  'SNAKE',
  'Come, crece, sobrevive. Una serpiente, tres vidas y un tablero que no perdona.',
  'Antes de que los gráficos importaran, los reflejos lo eran todo. Guía a tu serpiente por el tablero, devora frutas y crece hasta que el espacio se agote — o hasta que cometas un error. Tres vidas entre tú y el olvido; la velocidad aumenta con cada bocado.',
  'ARCADE',
  'cover-snake',
  'green'
);
```

No hay cambios de esquema. Las columnas `best` y `plays` no existen en la tabla (se calculan
en vivo con `MAX(score)` / `COUNT(*)` sobre `scores` — SPEC 06).

---

## Plan de implementación

1. **INSERT SQL.** Ejecutar el INSERT de la fila `snake` en la tabla `games` de Supabase
   vía `mcp_supabase_apply_migration`.
   **Verificación:** `execute_sql SELECT * FROM games WHERE id = 'snake'` devuelve la fila.

2. **Verificar catálogo.** Abrir `/games` y confirmar que la tarjeta "SNAKE" aparece con
   cover verde y botón green. Abrir `/juego/snake` y confirmar que el detalle carga sin
   errores (portada, tags, stat-strip, estado vacío de leaderboard).

3. **Jugar y guardar.** Abrir `/jugar/snake`, jugar una partida hasta game over y usar
   "GUARDAR PUNTUACIÓN" con un alias.
   **Verificación:** `execute_sql SELECT * FROM scores WHERE game_id = 'snake'` devuelve
   la fila insertada.

4. **Verificar leaderboard.** Recargar `/salon` (pestaña SNAKE) y `/juego/snake` y
   confirmar que la puntuación guardada aparece en el podio/tabla sin caché obsoleta.

---

## Criterios de aceptación

- [ ] La tabla `games` contiene una fila con `id = 'snake'` y todos sus campos correctos.
- [ ] `/games` muestra la tarjeta "SNAKE" con cover `.cover-snake` verde y botón green.
- [ ] `/juego/snake` carga sin errores y muestra estado vacío de leaderboard
      ("Aún sin puntuaciones. ¡Sé el primero!").
- [ ] `/jugar/snake` carga el canvas del juego sin errores.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id = 'snake'`.
- [ ] `/salon` (pestaña SNAKE) y `/juego/snake` reflejan la puntuación guardada sin
      recargar caché obsoleta.

---

## Decisiones tomadas y descartadas

| Decisión                       | Elegida                                                               | Descartada                                       | Justificación                                                                                               |
| ------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Mecanismo de inserción**     | `apply_migration` vía MCP de Supabase                                 | INSERT manual desde el dashboard de Supabase     | Consistente con el enfoque de SPEC 06, 08 y 10; queda trazado en el historial de migraciones.               |
| **`best` y `plays` iniciales** | No se insertan — se calculan en vivo desde `scores` (vacío al inicio) | Insertar valores ficticios en columnas estáticas | La tabla `games` no tiene columnas `best`/`plays` tras SPEC 06; los valores se derivan siempre de `scores`. |
