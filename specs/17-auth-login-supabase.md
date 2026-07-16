# 17 · Login y autenticación con Supabase

| Campo                    | Valor                     |
| ------------------------ | ------------------------- |
| **Spec**                 | `17-auth-login-supabase`  |
| **Estado**               | `Approved`                   |
| **Fecha**                | 2026-07-16                |
| **Dependencias**         | SPEC 04 (integración Supabase), SPEC 06 (leaderboard/scores) |
| **Objetivo (una frase)** | Reemplazar el auth mock por autenticación real de Supabase (email+password con confirmación, OAuth Google y GitHub) y atribuir cada score al usuario autenticado vía `user_id` + RLS. |

---

## 1 · Alcance

**Dentro del alcance:**

- Auth real con Supabase: email+password (con confirmación de correo), OAuth Google, OAuth GitHub.
- `AuthProvider` respaldado por `supabase.auth` (sesión persistente, `onAuthStateChange`).
- `middleware.ts` root que refresca la sesión en cada request (patrón `@supabase/ssr`).
- Ruta `app/auth/callback/route.ts` para intercambio code→session (OAuth y confirmación email).
- `player_name` derivado de `user_metadata.name` (máx 10, uppercase); OAuth lo toma del nombre del provider truncado.
- Columna `scores.user_id` NOT NULL (FK `auth.users`) + RLS: SELECT público, INSERT solo `auth.uid() = user_id`.
- Invitado puede jugar; al **guardar** score sin sesión se le pide login.
- `Nav` muestra nombre real y hace signOut real.

**Fuera del alcance (explícito):**

- ❌ Magic link / OTP.
- ❌ Tabla `profiles` separada (se usa `user_metadata`).
- ❌ Recuperación/reset de password (spec futura).
- ❌ Roles/permisos más allá de `authenticated`/`anon`; rate-limiting anti-spam (spec de hardening futura).
- ❌ Edición de perfil/avatar.
- ❌ UPDATE/DELETE de scores propios.

## 2 · Modelo de datos

**Auth (Supabase):** sin tablas nuevas de la app. En signup email+password se guarda `name` en `raw_user_meta_data`:

```ts
supabase.auth.signUp({
  email, password,
  options: { data: { name: playerName.toUpperCase().slice(0, 10) } },
});
```

OAuth deriva `name` del provider (`user_metadata.name | full_name | user_name`), truncado a 10 y uppercase al guardar el score.

**Tabla `scores` (migración vía Supabase MCP `apply_migration`):**

```sql
-- scores parte vacía (SPEC 06); si hubiera filas, se truncan antes.
alter table public.scores
  add column user_id uuid not null references auth.users(id) on delete cascade;

-- RLS: reemplaza el INSERT público anónimo de SPEC 06
drop policy if exists "scores public insert" on public.scores;   -- nombre real por confirmar
create policy "scores insert own"
  on public.scores for insert to authenticated
  with check (auth.uid() = user_id);
-- SELECT público se mantiene (leaderboard visible sin login).
```

`app/data/types.ts` `User` pasa de `{ name }` a incluir `id: string` (del usuario Supabase). `player_name` en `scores` se conserva como columna display (se llena desde `user_metadata.name`).

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Migración `scores.user_id` + RLS** vía Supabase MCP `apply_migration`; regenerar `lib/supabase/database.types.ts` con MCP. **Verificación:** `list_tables` muestra `user_id` NOT NULL y policy `scores insert own`; `npm run build` compila con los tipos nuevos.
2. **`middleware.ts` root** con `updateSession` (`@supabase/ssr`), matcher excluyendo estáticos. **Verificación:** navegar autenticado y refrescar; la sesión persiste server-side (`getUser()` en un Server Component devuelve el usuario).
3. **`app/auth/callback/route.ts`** que hace `exchangeCodeForSession`. **Verificación:** flujo OAuth y link de confirmación redirigen a `/games` con sesión activa.
4. **Reescribir `app/providers/auth-provider.tsx`** sobre `supabase.auth` (estado inicial vía `getUser`, suscripción `onAuthStateChange`, expone `signInWithPassword`, `signUp`, `signInWithOAuth`, `signOut`). **Verificación:** login/logout actualiza la UI sin refrescar; sobrevive a reload.
5. **`app/auth/page.tsx`**: cablear signup (con `data.name`) y signin reales; botones Google/GitHub llaman `signInWithOAuth`; botón invitado sigue yendo a `/games`. Mostrar errores (credenciales, email sin confirmar). **Verificación:** las tres vías crean/abren sesión; error visible en credenciales inválidas.
6. **`components/Nav.tsx`**: nombre desde sesión + signOut real. **Verificación:** tras login aparece el nombre; signOut limpia y vuelve a `/`.
7. **`components/GamePlayer.tsx` + `insertScore`**: si no hay sesión al guardar, se pide login (bloquea guardar); si hay, `insertScore` recibe `user.id` y `player_name` del metadata. **Verificación:** invitado no puede guardar; autenticado guarda y el leaderboard muestra su nombre.

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` sin errores.
- [ ] Signup email+password crea usuario en Supabase Auth con `user_metadata.name`.
- [ ] Con confirmación de email activa, el usuario no entra hasta confirmar; el callback abre sesión.
- [ ] Login email+password válido abre sesión; inválido muestra error.
- [ ] OAuth Google abre sesión y redirige a `/games`.
- [ ] OAuth GitHub abre sesión y redirige a `/games`.
- [ ] La sesión persiste tras refrescar la página (client y server).
- [ ] `middleware.ts` refresca la sesión; un Server Component ve el usuario vía `getUser()`.
- [ ] `scores.user_id` es NOT NULL y FK a `auth.users`.
- [ ] RLS: un usuario autenticado solo puede INSERT con su propio `auth.uid()`; SELECT es público.
- [ ] Invitado puede jugar pero al guardar score se le exige login.
- [ ] Score guardado por usuario autenticado aparece en el leaderboard con el nombre de su metadata.
- [ ] `Nav` muestra el nombre real y `signOut` cierra la sesión.

## 5 · Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Justificación |
| --- | --- | --- | --- |
| **Fuente del nombre** | `user_metadata.name` | Tabla `profiles` | Sin migración/JOIN extra; suficiente para leaderboard. |
| **Score de invitado** | Requiere login para guardar; `user_id` NOT NULL | user_id nullable | RLS más simple y estricta; scores atribuibles siempre. |
| **Confirmación email** | Requerida | Auto-confirm | Default seguro de Supabase; evita cuentas basura. |
| **Middleware sesión** | Crear `middleware.ts` | Solo client-side | Server Components necesitan la sesión (SPEC 04 lo dejó pendiente). |
| **Métodos** | email+pw + Google + GitHub | Magic link/OTP | Aprovecha botones OAuth ya presentes; alcance acotado. |
| **profiles/roles/reset** | Fuera de alcance | Incluirlos | Cada uno merece su propia spec. |

## 6 · Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Providers OAuth no configurados en el dashboard de Supabase | Documentar en el paso; la spec asume Google/GitHub habilitados con redirect URL del callback. |
| RLS mal aplicada rompe el guardado de scores | Probar INSERT autenticado y anónimo tras la migración; SELECT debe seguir público. |
| Scores previos sin `user_id` bloquean el `NOT NULL` | `scores` parte vacía (SPEC 06); truncar filas residuales antes del `alter`. |
| Falta de middleware causa sesión desincronizada server/client | Paso 2 dedicado + criterio de aceptación de persistencia. |
| Redirect URL del callback difiere entre local y prod | Usar URL relativa/env; configurar ambas en el dashboard. |
