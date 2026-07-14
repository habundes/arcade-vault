# Catálogo FROGGER

| Campo                    | Valor                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `frogger-catalogo`                                                                                                     |
| **Estado**               | `Approved`                                                                                                             |
| **Fecha**                | 2026-07-10                                                                                                             |
| **Dependencias**         | spec-A-juego-frogger, SPEC 06                                                                                          |
| **Objetivo (una frase)** | Insertar la fila `frogger` en la tabla `games` de Supabase para que aparezca en el catálogo y su leaderboard funcione. |

---

## 1 · Alcance

Solo un INSERT SQL en la tabla `games` existente. Sin cambios de schema, sin código, sin modificar filas existentes (incluida `ranaria`, que es un juego decorativo independiente y permanece intacto).

**Fuera del alcance:**

- ❌ Schema changes.
- ❌ Código en la app (ese es alcance de spec-A).
- ❌ Modificar la fila `ranaria` existente.
- ❌ Leaderboard inicial con datos ficticios (la tabla arranca vacía; los scores se insertan jugando).

---

## 2 · SQL

```sql
INSERT INTO games (id, title, short, long_desc, cat, cover, color)
VALUES (
  'frogger',
  'FROGGER',
  'Cruza la autopista y el río sin convertirte en papilla.',
  'Una rana solitaria frente a siete carriles de acero y cromo, y un río de troncos y tortugas que no esperan a nadie. Cada salto es una decisión; cada segundo perdido, una vida menos. Llena las cinco bases antes de que el reloj diga lo que ya sabes.',
  'ARCADE',
  'cover-frogger',
  'magenta'
);
```

_(Los campos `best` y `plays` no se insertan; se calculan en vivo desde la tabla `scores`.)_

---

## 3 · Plan de implementación

1. **Ejecutar el INSERT** vía `mcp_supabase_apply_migration`.
   **Verificación:** `SELECT * FROM games WHERE id = 'frogger'` devuelve la fila con todos los campos correctos.

2. **Verificar catálogo** navegando a `/games`.
   **Verificación:** la tarjeta "FROGGER" aparece con cover `.cover-frogger` y botón magenta; las demás tarjetas no cambian.

3. **Jugar y guardar puntuación** en `/jugar/frogger` (requiere spec-A implementada).
   **Verificación:** el modal "GUARDAR PUNTUACIÓN" no arroja error; `SELECT * FROM scores WHERE game_id = 'frogger'` devuelve la fila insertada.

4. **Verificar leaderboard** en `/salon` y `/juego/frogger`.
   **Verificación:** el score guardado aparece en la tabla de posiciones sin caché obsoleta.

---

## 4 · Criterios de aceptación

- [ ] La fila `frogger` existe en la tabla `games` con todos los campos correctos (`id`, `title`, `short`, `long_desc`, `cat`, `cover`, `color`).
- [ ] `/games` muestra la tarjeta "FROGGER" con cover `.cover-frogger` y botón magenta.
- [ ] La tarjeta `ranaria` sigue apareciendo sin cambios (no fue modificada).
- [ ] `/juego/frogger` renderiza el detalle genérico (portada, tags, stat-strip, leaderboard vacío) sin errores.
- [ ] `/jugar/frogger` carga el canvas del juego (requiere spec-A implementada).
- [ ] Guardar puntuación inserta una fila en `scores` con `game_id = 'frogger'` sin error.
- [ ] El score aparece en el leaderboard de `/juego/frogger` y en `/salon`.

---

## 5 · Decisiones

Usar `mcp_supabase_apply_migration` (consistente con SPEC 06, SPEC 08, SPEC 10, SPEC 12). No se insertan `best` ni `plays` (calculados en vivo desde `scores`). La fila `ranaria` no se toca: es un placeholder decorativo con mecánica distinta (arena falsa) que puede coexistir con el engine real de `frogger`.
