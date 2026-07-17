# 18 · Hardening de seguridad

| Campo                    | Valor                     |
| ------------------------ | ------------------------- |
| **Spec**                 | `18-hardening-seguridad`  |
| **Estado**               | `Approved`                   |
| **Fecha**                | 2026-07-16                |
| **Dependencias**         | SPEC 04 (integración Supabase), SPEC 17 (auth/RLS) |
| **Objetivo (una frase)** | Aplicar las medidas del checklist de seguridad —headers HTTP en Next.js, eliminación de la función `SECURITY DEFINER` expuesta, y endurecimiento de Auth (leaked-password, min-length, complejidad, signup-rate) con validación de password en el UI— dejando los advisors de Supabase sin warnings. |

---

## 1 · Alcance

**Dentro del alcance:**

- Headers de seguridad en `next.config.ts` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) vía `headers()` async sobre `source: '/(.*)'`.
- Migración Supabase: `drop function if exists public.rls_auto_enable();` (función `SECURITY DEFINER` ejecutable por `anon`/`authenticated`, sin usos en la app).
- Verificación (no cambio) de RLS ya existente en `games`/`scores`.
- Config manual de Supabase Auth: leaked password protection ON, min password length = 8, password requirements = **lowercase + uppercase + dígitos + símbolos**, límite de signup rate por IP.
- Validación client-side en `app/auth/page.tsx`: regex (`PASSWORD_REGEX`) que refleja el requisito de Supabase (≥8, minúscula, mayúscula, dígito, símbolo). Si no cumple, muestra error inline y **bloquea** el submit — no se llama a `signUp`.

**Fuera del alcance (explícito):**

- ❌ Validación regex en signin (solo signup); Supabase valida al autenticar.
- ❌ CSP / `Strict-Transport-Security` / `Permissions-Policy` (más allá del checklist).
- ❌ Cambios a las policies RLS (ya correctas — solo se verifican).
- ❌ Rate-limiting propio a nivel app/middleware (se usa el nativo de Supabase).
- ❌ CAPTCHA / verificación anti-bot adicional.

## 2 · Modelo de datos

Sin estructuras nuevas. La migración **elimina** la función `public.rls_auto_enable()`.

Constante nueva en cliente: `PASSWORD_REGEX` — única fuente de verdad para la validación de signup, espejo exacto del requisito configurado en Supabase:

```ts
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
```

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Headers en `next.config.ts`** — array `securityHeaders` + `headers()` async sobre `source: '/(.*)'`. **Verificación:** `curl -I http://localhost:3000` muestra los 3 headers; `npm run build` compila.
2. **Migración DROP función** vía Supabase MCP `apply_migration` (`drop function if exists public.rls_auto_enable();`). **Verificación:** `get_advisors(security)` ya no lista los 2 warnings `*_security_definer_function_executable`.
3. **Verificar RLS** (sin cambios) — `list_tables` + `pg_policies`. **Verificación:** policies presentes (`games_select_public`; `scores_select_public`; `scores insert own` con `with_check (auth.uid() = user_id)`); INSERT anónimo en `scores` rechazado, SELECT público OK.
4. **Config manual Auth (dashboard Supabase)** — Authentication → Sign In / Providers → Password: leaked password protection ON, min length 8, password requirements = lowercase + uppercase + dígitos + símbolos. Authentication → Rate Limits → signup por IP. **Verificación:** `get_advisors(security)` sin warning `auth_leaked_password_protection`.
5. **Validación regex en `app/auth/page.tsx`** (usar `/frontend-design` para el UI) — definir `PASSWORD_REGEX`; en el submit de signup, si el password no cumple → error inline con las reglas y `return` sin llamar `signUp`. **Verificación:** password inválido muestra error y NO dispara request de auth; válido procede al `signUp`.

## 4 · Proteccion de rutas con proxy Next.js

## 5 · Criterios de aceptación

- [ ] La respuesta HTTP incluye `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] `npm run build` y `npm run lint` sin errores.
- [ ] `get_advisors(security)` NO lista `anon_security_definer_function_executable` ni `authenticated_security_definer_function_executable`.
- [ ] `get_advisors(security)` NO lista `auth_leaked_password_protection`.
- [ ] RLS activo en `games` y `scores` con las policies verificadas.
- [ ] Signup con password < 8 chars rechazado por Supabase.
- [ ] Signup con password sin minúscula/mayúscula/dígito/símbolo rechazado por Supabase.
- [ ] UI de signup: password que no cumple `PASSWORD_REGEX` muestra error inline y NO envía request de auth.
- [ ] UI de signup: password válido pasa la validación local y procede al `signUp`.
- [ ] Signups masivos desde una IP limitados (rate limit configurado).

## 6 · Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Justificación |
| --- | --- | --- | --- |
| **`rls_auto_enable`** | DROP función | REVOKE EXECUTE / SECURITY INVOKER | Nada en la app la llama (`grep` solo la halla en el checklist); borrar de raíz elimina ambos warnings. |
| **Ítems de Auth** | Pasos manuales documentados | Omitir | No hay MCP para config de Auth; se documentan y verifican con `get_advisors`. |
| **Alcance** | Una spec de hardening | Separar código vs config | Coherente; es el hardening que SPEC 17 difirió. |
| **Rate limit** | Nativo de Supabase | Middleware propio | Menos superficie; suficiente para anti-bot básico. |
| **Password** | Regex en cliente + config Supabase | Solo validación en servidor | UX inmediata y evita request condenado; Supabase sigue como validación autoritativa (el cliente no es la barrera de seguridad). |

## 7 · Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `X-Frame-Options: DENY` rompe embeds/iframes | La app no usa iframes; aceptable. |
| Config de Auth manual no versionada en git | Documentada en esta spec + verificación con `get_advisors` tras aplicar. |
| DROP de función con dependencia oculta | `grep` confirma sin usos; `if exists` evita fallo si ya no existe. |
| Regex de cliente desincronizado con la config de Supabase | `PASSWORD_REGEX` como única fuente y espejo exacto del dashboard; el servidor valida siempre. |
