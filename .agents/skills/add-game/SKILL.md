---
name: add-game
description: |
  Diseña las dos specs necesarias para agregar un nuevo juego real al Arcade Vault:
  Spec A (motor + componente canvas, patrón de SPEC 05) y Spec B (entrada en Supabase,
  patrón simplificado post-SPEC 06). El juego puede venir de references/started-games/
  o ser nuevo desde cero. Sigue el mismo flujo que /spec: preguntas por bloques,
  sección por sección con confirmación, guardado con nombre confirmado. Nunca escribe
  código — solo archivos .md en specs/.
disable-model-invocation: true
argument-hint: "<nombre o slug del juego, ej. arkanoid>"
---

# /add-game — Diseñar specs para un nuevo juego en Arcade Vault

Este skill es una especialización de `/spec` para agregar juegos al vault. Sigue **el mismo flujo que `/spec`** (preguntas → sección por sección → confirmación → guardar) pero ya tiene las preguntas y la estructura de las dos specs predefinidas, para no tener que deducirlas desde cero.

Produce **dos specs encadenadas**:

- **Spec A** `NN-juego-[slug].md` — motor portado a TS + componente canvas React + integración en `GamePlayer`
- **Spec B** `NN+1-catalogo-[slug].md` — fila nueva en tabla `games` de Supabase + verificación de leaderboard

**Idioma:** responder siempre en el mismo idioma que el prompt del usuario.

Seguir las fases en orden. No generar código. No asumir decisiones no confirmadas por el usuario.

---

## FASE 1 — Leer contexto del proyecto

Antes de hacer ninguna pregunta, leer:

1. `CLAUDE.md` — tech stack, convenciones, path aliases
2. `specs/` — listar todos los archivos para determinar el próximo número de spec; **leer las dos más recientes** para captar convenciones de estilo y formato del proyecto
3. `references/started-games/` — listar directorios disponibles como fuente de juegos
4. `app/data/types.ts` — forma del tipo `Game`, `GameCategory`, `GameColor`
5. `lib/supabase/queries.ts` — funciones disponibles (`getGames`, `getGame`, `getTopScores`, `insertScore`)
6. `components/games/` — estructura de juegos ya implementados (p. ej. `asteroids/`)
7. `components/GamePlayer.tsx` — cómo ramifica por `game.id`, qué props expone el canvas, cómo conecta PAUSA/FIN
8. `app/globals.css` — clases `.cover-*` existentes para entender el patrón de cover art

Al terminar, anunciar brevemente:

- Número siguiente de spec (ej. "La próxima spec será la 07")
- Juegos disponibles en `references/started-games/`
- Juegos ya implementados en `components/games/`

Si el argumento `$ARGUMENTS` llega vacío, pedir al usuario una descripción en una frase del juego que quiere agregar. Si no cabe en una frase o involucra más de tres áreas del sistema, proponer dividirlo antes de continuar.

---

## FASE 2 — Preguntas por bloques

Hacer **un bloque a la vez**. Esperar respuesta completa antes de continuar con el siguiente. Usar preguntas concretas, numeradas, una por línea. No usar frases de disculpa ("si no te importa…", "¿podrías quizás…"). El usuario invocó este skill precisamente para que se le pregunten estas cosas.

**Cuándo parar de preguntar:** cuando se puedan responder las tres sin asumir nada:

1. ¿Qué archivos aparecen o cambian?
2. ¿Cuál es el primer paso ejecutable y cuál el último?
3. ¿Cómo verificar que el juego está listo?

### Bloque 1 — Identidad y fuente

1. ¿El juego viene de `references/started-games/`? Si sí, ¿cuál de los disponibles?  
   Si no, ¿es nuevo desde cero? (describir brevemente la mecánica principal)
2. `slug` del juego (minúsculas, sin espacios, ej. `arkanoid`)
3. `title` para mostrar en el catálogo (MAYÚSCULAS, ej. `ARKANOID`)
4. `cat`: `ARCADE` | `PUZZLE` | `SHOOTER` | `VERSUS`
5. `color`: `cyan` | `magenta` | `yellow` | `green`

### Bloque 2 — Motor del juego

1. ¿Cuáles son los controles de teclado? (tecla → acción)
2. ¿Cuáles son las mecánicas principales? (física, colisiones, condición de victoria por nivel)
3. ¿Qué estado interno tiene el motor? (¿vidas? ¿nivel? ¿puntuación? ¿algún estado especial?)
4. ¿Cuál es la condición de game over? (sin vidas, tiempo agotado, etc.)
5. ¿Tiene power-ups u objetos especiales?

### Bloque 3 — Canvas y HUD

1. ¿Resolución lógica interna preferida? (por defecto `800×600` salvo razón para cambiar)
2. ¿Qué datos reporta el motor al HUD externo? (score, lives, level — ¿falta o sobra algo?)
3. Comportamiento de **PAUSA**: ¿congela todo el loop o solo el `update()`?
4. Comportamiento de **FIN**: ¿fuerza `gameOver` en el motor o espera que el jugador pierda?
5. ¿Hay un estado de victoria (nivel completado) distinto al game over?

### Bloque 4 — Catálogo y presentación

1. `short`: descripción de tarjeta (1–2 frases, ≈ 80 chars)
2. `long`: descripción larga para el detalle (2–3 frases, tono arcade retro)
3. Cover art: ¿alguna idea para `.cover-[slug]`? (paleta, elementos visuales). Si no, se usará monocromático con el color de acento.
4. `best` ficticio inicial (mismo orden de magnitud que juegos similares del catálogo)

---

## FASE 3 — Generar Spec A (juego)

Usar `template-juego.md` (en este mismo directorio) como guía estructural. Si el juego viene de `references/started-games/`, leer su `game.js` antes de generar §2 (modelo de datos) para que las clases reflejen el original.

Generar **una sección a la vez** siguiendo este patrón por cada sección:

1. Mostrar la sección en markdown formateado
2. Preguntar: "¿Esta sección queda así o quieres ajustarla?"
3. Si hay cambios, aplicarlos y mostrar de nuevo
4. Solo avanzar a la siguiente sección cuando el usuario confirme

Orden de secciones:

1. Header (tabla de metadatos: Spec, Estado=Draft, Fecha, Dependencias, Objetivo en una frase)
2. § 1 · Alcance (dentro y fuera — el "fuera" debe ser explícito)
3. § 2 · Modelo de datos (clases del motor, `EngineState`, `[Slug]Snapshot`)
4. § 3 · Plan de implementación (pasos numerados, cada uno deja el sistema funcional)
5. § 4 · Criterios de aceptación (checklist booleano, verificable, no aspiracional)
6. § 5 · Decisiones tomadas y descartadas
7. § 6 · Riesgos identificados

Al confirmar todas las secciones, pasar a guardar (ver §Guardar Spec A).

---

## FASE 4 — Generar Spec B (catálogo)

Usar `template-catalogo.md` (en este mismo directorio). Misma dinámica sección por sección.

Premisas a aplicar en Spec B (ya verdaderas en el proyecto tras SPEC 06):

- Las tablas `games` y `scores` ya existen en Supabase con RLS configurado
- `lib/supabase/queries.ts` ya tiene todas las funciones necesarias
- `GamePlayer.tsx` ya llama `insertScore()` al guardar puntuación
- `/salon` y `/juego/[id]` ya leen de Supabase sin cambios de código
- **El único cambio de datos** es un INSERT en `games`

El plan de Spec B es corto: INSERT SQL → verificar catálogo → jugar y guardar → verificar leaderboard.

Orden de secciones:

1. Header (Spec, Estado=Draft, Fecha, Dependencias=Spec A + SPEC 06, Objetivo)
2. § Alcance
3. § Modelo de datos (la fila SQL a insertar)
4. § Plan de implementación
5. § Criterios de aceptación
6. § Decisiones tomadas y descartadas

---

## GUARDAR SPECS

Para cada spec (A y B), al confirmar todas las secciones:

1. Proponer el nombre de archivo: `specs/NN-juego-[slug].md` (Spec A) y `specs/NN+1-catalogo-[slug].md` (Spec B)
2. **Confirmar con el usuario** antes de escribir el archivo: "¿El nombre `specs/NN-juego-[slug].md` te parece bien?"
3. Crear el archivo con todas las secciones aprobadas
4. Confirmar al usuario:
   - Ruta del archivo creado
   - Recordatorio: la spec queda en estado `Draft`. Cámbialo a `Approved` una vez que la hayas releído.
   - Sugerencia para el siguiente paso: _"Para implementarla: `/spec-impl NN-juego-[slug]` o indícale a Claude que implemente la spec paso a paso, pausando tras cada paso del plan de implementación para revisar el diff."_

Guardar Spec A completa antes de empezar Spec B.

---

## REGLAS DURAS

- **Nunca escribir código** — solo archivos `.md` en `specs/`
- **Nunca asumir** nombre de archivo, control de teclado, mecánica, o decisión de diseño sin confirmación del usuario
- **Nunca generar el spec completo de una vez** — siempre sección por sección con confirmación
- **Confirmar el nombre de archivo antes de escribirlo**
- **Spec B depende de Spec A** — el header de Spec B referencia a Spec A como dependencia
- Si el juego cabe mal en el modelo estándar (sin vidas, sin niveles, etc.), anotar la diferencia en §5 Decisiones de Spec A y adaptar el snapshot y los criterios acordemente
- Si la feature es demasiado grande (no cabe en una frase, toca más de tres áreas del sistema), proponer dividirla antes de continuar
