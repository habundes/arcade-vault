# 10 · Catálogo Arkanoid

| Campo                    | Valor                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `10-catalogo-arkanoid`                                                                                                                      |
| **Estado**               | `Draft`                                                                                                                                     |
| **Fecha**                | 2026-07-09                                                                                                                                  |
| **Dependencias**         | SPEC 09 (juego Arkanoid), SPEC 06 (leaderboard y catálogo en Supabase)                                                                      |
| **Objetivo (una frase)** | Insertar la fila `arkanoid` en la tabla `games` de Supabase para que el juego aparezca en el catálogo y su leaderboard funcione end-to-end. |

---

## Alcance

**Dentro del alcance:**

- **INSERT SQL** de una fila en la tabla `games` de Supabase con todos los campos del juego Arkanoid.
- **Verificación** de que `/games` muestra la tarjeta "ARKANOID" leyendo de Supabase.
- **Verificación** de que `/juego/arkanoid` y `/jugar/arkanoid` cargan sin errores.
- **Verificación** de que "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` y aparece en `/salon` y `/juego/arkanoid`.

**Fuera del alcance (explícito):**

- ❌ Cambios de código — todo el código necesario lo aporta SPEC 09.
- ❌ Cambios de esquema en Supabase — las tablas `games` y `scores` ya existen con RLS configurado (SPEC 06).
- ❌ Modificar filas existentes en `games`.

---

## Modelo de datos

Fila a insertar en la tabla `games`:

```sql
INSERT INTO games (id, title, short, long_desc, cat, cover, color)
VALUES (
  'arkanoid',
  'ARKANOID',
  'Revienta bloques, salva la pelota, sobrevive cinco niveles. Un clásico sin piedad.',
  'Antes de los joysticks analógicos y los mundos abiertos, existía esto: una paleta, una pelota y una pared de bloques que no pide disculpas. Cinco niveles de velocidad creciente ponen a prueba tus reflejos y tu precisión milimétrica. Sin vidas de sobra, sin segunda oportunidad — solo tú contra el tablero.',
  'ARCADE',
  'cover-arkanoid',
  'green'
);
```

No hay cambios de esquema. Las columnas `best` y `plays` no existen en la tabla (se calculan
en vivo con `MAX(score)` / `COUNT(*)` sobre `scores` — SPEC 06).

---

## Plan de implementación

1. **INSERT SQL.** Ejecutar el INSERT de la fila `arkanoid` en la tabla `games` de Supabase
   vía `mcp_supabase_apply_migration`.
   **Verificación:** `execute_sql SELECT * FROM games WHERE id = 'arkanoid'` devuelve la fila.

2. **Verificar catálogo.** Abrir `/games` y confirmar que la tarjeta "ARKANOID" aparece con
   cover verde y botón green. Abrir `/juego/arkanoid` y confirmar que el detalle carga
   sin errores (portada, tags, stat-strip, estado vacío de leaderboard).

3. **Jugar y guardar.** Abrir `/jugar/arkanoid`, jugar una partida hasta game over y usar
   "GUARDAR PUNTUACIÓN" con un alias.
   **Verificación:** `execute_sql SELECT * FROM scores WHERE game_id = 'arkanoid'` devuelve
   la fila insertada.

4. **Verificar leaderboard.** Recargar `/salon` (pestaña ARKANOID) y `/juego/arkanoid` y
   confirmar que la puntuación guardada aparece en el podio/tabla sin caché obsoleta.

---

## Criterios de aceptación

- [ ] La tabla `games` contiene una fila con `id = 'arkanoid'` y todos sus campos correctos.
- [ ] `/games` muestra la tarjeta "ARKANOID" con cover `.cover-arkanoid` verde y botón green.
- [ ] `/juego/arkanoid` carga sin errores y muestra estado vacío de leaderboard ("Aún sin puntuaciones. ¡Sé el primero!").
- [ ] `/jugar/arkanoid` carga el canvas del juego sin errores.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id = 'arkanoid'`.
- [ ] `/salon` (pestaña ARKANOID) y `/juego/arkanoid` reflejan la puntuación guardada sin recargar caché obsoleta.

---

## Decisiones tomadas y descartadas

| Decisión                       | Elegida                                                               | Descartada                                       | Justificación                                                                                               |
| ------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Mecanismo de inserción**     | `apply_migration` vía MCP de Supabase                                 | INSERT manual desde el dashboard de Supabase     | Consistente con el enfoque de SPEC 06 y SPEC 08; queda trazado en el historial de migraciones.              |
| **`best` y `plays` iniciales** | No se insertan — se calculan en vivo desde `scores` (vacío al inicio) | Insertar valores ficticios en columnas estáticas | La tabla `games` no tiene columnas `best`/`plays` tras SPEC 06; los valores se derivan siempre de `scores`. |
