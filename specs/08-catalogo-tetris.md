# 08 · Catálogo Tetris

| Campo                    | Valor                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `08-catalogo-tetris`                                                                                                                      |
| **Estado**               | `Approved`                                                                                                                                   |
| **Fecha**                | 2026-07-09                                                                                                                                |
| **Dependencias**         | SPEC 07 (juego Tetris), SPEC 06 (leaderboard y catálogo en Supabase)                                                                      |
| **Objetivo (una frase)** | Insertar la fila `tetris` en la tabla `games` de Supabase para que el juego aparezca en el catálogo y su leaderboard funcione end-to-end. |

---

## Alcance

**Dentro del alcance:**

- **INSERT SQL** de una fila en la tabla `games` de Supabase con todos los campos del juego Tetris.
- **Verificación** de que `/games` muestra la tarjeta "TETRIS" leyendo de Supabase.
- **Verificación** de que `/juego/tetris` y `/jugar/tetris` cargan sin errores.
- **Verificación** de que "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` y aparece en `/salon` y `/juego/tetris`.

**Fuera del alcance (explícito):**

- ❌ Cambios de código — todo el código necesario lo aporta SPEC 07.
- ❌ Cambios de esquema en Supabase — las tablas `games` y `scores` ya existen con RLS configurado (SPEC 06).
- ❌ Modificar filas existentes en `games`.

---

## Modelo de datos

Fila a insertar en la tabla `games`:

```sql
INSERT INTO games (id, title, short, long_desc, cat, cover, color)
VALUES (
  'tetris',
  'TETRIS',
  'Apila piezas, elimina líneas y sobrevive al caos del tablero.',
  'Siete piezas, veinte filas, cero margen de error. Rota, desliza y encaja cada bloque antes de que el tablero te ahogue. Los niveles escalan sin piedad — la velocidad es la única condición de victoria.',
  'PUZZLE',
  'cover-tetris',
  'yellow'
);
```

No hay cambios de esquema. Las columnas `best` y `plays` no existen en la tabla (se calculan
en vivo con `MAX(score)` / `COUNT(*)` sobre `scores` — SPEC 06).

---

## Plan de implementación

1. **INSERT SQL.** Ejecutar el INSERT de la fila `tetris` en la tabla `games` de Supabase
   vía `mcp_supabase_apply_migration`.
   **Verificación:** `execute_sql SELECT * FROM games WHERE id = 'tetris'` devuelve la fila.

2. **Verificar catálogo.** Abrir `/games` y confirmar que la tarjeta "TETRIS" aparece con
   cover amarillo y botón yellow. Abrir `/juego/tetris` y confirmar que el detalle carga
   sin errores (portada, tags, stat-strip, estado vacío de leaderboard).

3. **Jugar y guardar.** Abrir `/jugar/tetris`, jugar una partida hasta game over y usar
   "GUARDAR PUNTUACIÓN" con un alias.
   **Verificación:** `execute_sql SELECT * FROM scores WHERE game_id = 'tetris'` devuelve
   la fila insertada.

4. **Verificar leaderboard.** Recargar `/salon` (pestaña TETRIS) y `/juego/tetris` y
   confirmar que la puntuación guardada aparece en el podio/tabla sin caché obsoleta.

---

## Criterios de aceptación

- [ ] La tabla `games` contiene una fila con `id = 'tetris'` y todos sus campos correctos.
- [ ] `/games` muestra la tarjeta "TETRIS" con cover `.cover-tetris` amarillo y botón yellow.
- [ ] `/juego/tetris` carga sin errores y muestra estado vacío de leaderboard ("Aún sin puntuaciones. ¡Sé el primero!").
- [ ] `/jugar/tetris` carga el canvas del juego sin errores.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id = 'tetris'`.
- [ ] `/salon` (pestaña TETRIS) y `/juego/tetris` reflejan la puntuación guardada sin recargar caché obsoleta.

---

## Decisiones tomadas y descartadas

| Decisión                       | Elegida                                                               | Descartada                                       | Justificación                                                                                               |
| ------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Mecanismo de inserción**     | `apply_migration` vía MCP de Supabase                                 | INSERT manual desde el dashboard de Supabase     | Consistente con el enfoque de SPEC 06; queda trazado en el historial de migraciones.                        |
| **`best` y `plays` iniciales** | No se insertan — se calculan en vivo desde `scores` (vacío al inicio) | Insertar valores ficticios en columnas estáticas | La tabla `games` no tiene columnas `best`/`plays` tras SPEC 06; los valores se derivan siempre de `scores`. |
