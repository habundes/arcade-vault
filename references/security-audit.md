# Security Audit — Arcade Vault

Registro acumulativo de auditorías de seguridad. Solo lectura/append; fixes aplicados por el equipo de desarrollo.

---

## Auditoría 1 — 2026-07-17 (post SPEC 17 + SPEC 18)

**Auditor:** security-auditor agent  
**Rama:** spec-18-hardening-seguridad  
**Scope:** RLS/DB vía Supabase MCP, HTTP headers, auth, integridad de scores, open-redirect, XSS

### Confirmaciones positivas (DB vía MCP)

- `scores.user_id` NOT NULL confirmado (`information_schema`).
- FK `scores_user_id_fkey` → `auth.users.id` confirmada.
- RLS habilitado en `games` y `scores`.
- Policy `games_select_public`: SELECT público (qual=true, roles={public}).
- Policy `scores_select_public`: SELECT público (qual=true, roles={public}).
- Policy `scores insert own`: INSERT solo authenticated, `with_check (auth.uid() = user_id)`.
- Advisors NO listan `anon_security_definer_function_executable` ni `authenticated_security_definer_function_executable` → DROP de `public.rls_auto_enable()` confirmado exitoso.
- `service_role` no aparece en código ni env cliente (grep confirmado).
- `dangerouslySetInnerHTML` no aparece en código de la app (grep confirmado).
- `.from()` fuera de `lib/` es `Array.from()` en `app/about/page.tsx` (falso positivo).
- `process.env` solo expone `NEXT_PUBLIC_` keys (por diseño, son públicas).

---

## Tabla de hallazgos

| # | Fecha | Dominio | Hallazgo | Severidad | Archivo | Estado | Notas |
|---|-------|---------|----------|-----------|---------|--------|-------|
| 1 | 2026-07-17 | App | Content-Security-Policy ausente | Medio | `next.config.ts` | Abierto | SPEC 18 lo dejó fuera de alcance; sin CSP, XSS stored tendría mayor impacto |
| 2 | 2026-07-17 | App | Score e `player_name` 100% client-controlled sin validación server-side | Medio | `components/GamePlayer.tsx:196` / `lib/supabase/queries.ts:110` | Abierto | Gap inherente a diseño client-authoritative; RLS garantiza ownership pero no legitimidad del score |
| 3 | 2026-07-17 | App | Parámetro `next` en callback no validado contra ruta relativa segura | Bajo | `app/auth/callback/route.ts:7` | Abierto | `${origin}${next}` fija el host; no hay redirect externo real, pero rutas internas arbitrarias son posibles |
| 4 | 2026-07-17 | App | `Strict-Transport-Security` (HSTS) ausente | Bajo | `next.config.ts` | Abierto | SPEC 18 fuera de alcance; sin HSTS, downgrade a HTTP es posible en prod |
| 5 | 2026-07-17 | App | `Permissions-Policy` ausente | Bajo | `next.config.ts` | Abierto | SPEC 18 fuera de alcance; permite acceso a APIs de hardware sin restricción |
| 6 | 2026-07-17 | App | `player_name` sin constraint de longitud a nivel DB | Bajo | `lib/supabase/queries.ts:119` | Abierto | Truncado a 10 chars solo client-side; INSERT directo puede enviar nombres arbitrariamente largos |
| 7 | 2026-07-17 | DB | `scores insert own` re-evalúa `auth.uid()` por fila | Bajo | DB: policy `scores insert own` | Abierto | Reemplazar `auth.uid()` por `(select auth.uid())`; performance advisor WARN `auth_rls_initplan` |
| 8 | 2026-07-17 | DB | FKs sin índice cubriente: `scores_game_id_fkey` y `scores_user_id_fkey` | Info | DB: tabla `scores` | Abierto | Performance advisor INFO; impacto bajo a escala actual (4 filas) |
| 9 | 2026-07-17 | App | Render de `player_name` en HallOfFame sin `dangerouslySetInnerHTML` | Info | `components/HallOfFame.tsx:129` | Aceptado | React escapa por defecto; XSS mitigado en capa de render |
| 10 | 2026-07-17 | DB | `auth_leaked_password_protection` deshabilitado | Info | Supabase Auth (dashboard) | Aceptado | Requiere plan pago; N/A en plan free según SPEC 18 §7. Min-length 8 + complejidad aplicados. |
| 11 | 2026-07-17 | DB | RLS policies y `user_id` NOT NULL/FK confirmados correctos | Info | DB: `games`, `scores` | Aceptado | Verificado vía `pg_policies` + `information_schema` en vivo |
| 12 | 2026-07-17 | DB | `public.rls_auto_enable()` SECURITY DEFINER eliminada | Info | DB | Aceptado | Advisors no listan warnings de funciones SECURITY DEFINER; SPEC 18 paso 2 exitoso |
| 13 | 2026-07-17 | App | Config de Auth (password complexity, rate-limit signup) | — | Supabase dashboard | Verificar-en-dashboard | MCP no expone config de Auth; SPEC 18 paso 4 documenta como manual; `get_advisors` no puede confirmar rate-limit ni complejidad directamente |
