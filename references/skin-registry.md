# Registro de skins — Arcade Vault

Registro de juegos con las 3 skins obligatorias (`neon`, `retro`, `clasico`/default) especificadas por el agente `skin-designer`. Cada entrada apunta a `specs/skins/spec-skins-[game-id].md`.

| Juego      | neon | retro | clasico | dark-mode OK | Estado       | Notas                                                                                                                                                  |
| ---------- | ---- | ----- | ------- | ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| asteroides | ✅   | ✅    | ✅      | ✅           | Implementado | Ver `specs/skins/spec-skins-asteroides.md`. Engine (`engine.ts`), canvas y dropdown de selección en `GamePlayer.tsx` implementados. Fecha: 2026-07-13  |
| frogger    | ✅   | ✅    | ✅      | ✅           | Spec listo   | Ver `specs/skins/spec-skins-frogger.md`. 37 elementos coloreables mapeados. Scanlines en skin retro. Persistencia `av-skin-frogger`. Fecha: 2026-07-14 |
