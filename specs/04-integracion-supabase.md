# 04 · Integración base de Supabase

| Campo                    | Valor                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**                 | `04-integracion-supabase`                                                                                                                                                                     |
| **Estado**               | `Implementado`                                                                                                                                                                                |
| **Fecha**                | 2026-07-08                                                                                                                                                                                    |
| **Dependencias**         | Ninguna (base transversal; specs posteriores de Auth/Datos dependerán de ésta)                                                                                                                |
| **Objetivo (una frase)** | Cablear Supabase en la app (clientes browser + server con `@supabase/ssr`, middleware de sesión y tipos de DB generados) dejando la conexión verificable, sin tocar auth ni datos existentes. |

---go

**Nota de alcance:** esta spec es solo _fundación_. No implementa login real, ni migra `GAMES`/`PLAYERS`/puntuaciones, ni cambia el Salón. Real-time y Edge Functions quedan registrados como necesidades futuras (specs propias).

---

## 1 · Alcance

**Dentro del alcance:**

- **Cliente browser** en `lib/supabase/client.ts` (`createBrowserClient<Database>`), para Client Components.
- **Cliente server** en `lib/supabase/server.ts` (`createServerClient<Database>` con `cookies()` de `next/headers`), para Server Components, Server Actions y Route Handlers.
- **`middleware.ts`** en la raíz: refresca la sesión de Supabase en cada request (patrón canónico `@supabase/ssr`), con `matcher` que excluye estáticos.
- **Tipos de DB** en `lib/supabase/database.types.ts`, generados con el MCP de Supabase; ambos clientes tipados como `SupabaseClient<Database>`.
- **Ambos clientes leen** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` de `.env.local`.
- **Ruta de verificación temporal** `app/health-supabase/page.tsx` (Server Component) que llama a `supabase.auth.getSession()` y muestra "conexión OK / sin sesión", marcada explícitamente como borrable.

**Fuera del alcance (explícito):**

- ❌ Auth real (login/registro, OAuth, invitado): el `auth-provider.tsx` actual **no se toca**. Spec futura.
- ❌ Tablas, RLS, migraciones o `profiles`: 0 tablas; los tipos generados saldrán casi vacíos a propósito.
- ❌ Migrar `GAMES`/`PLAYERS`/`seededScores` ni cambiar Salón / "Actividad en vivo".
- ❌ Real-time (subscripciones) y Edge Functions: necesidades futuras anotadas, no implementadas aquí.
- ❌ Seeding de datos.

---

## 2 · Modelo de datos

Esta spec **no introduce tablas ni estructuras de datos** en la base. La base sigue con 0 tablas.

El único artefacto "de datos" es el tipo generado:

```ts
// lib/supabase/database.types.ts — generado por el MCP de Supabase
// Con 0 tablas, el tipo sale casi vacío pero deja el patrón listo:
export type Database = {
  public: {
    Tables: Record<string, never>; // vacío hoy; se re-genera al crear tablas
    Views: Record<string, never>;
    Functions: Record<string, never>;
    // …
  };
};
```

Convenciones:

- Los clientes se tipan como `SupabaseClient<Database>`; al crear tablas en specs futuras, se **re-genera** este archivo (no se edita a mano).
- Sin persistencia nueva, sin cambios en `app/data/*` ni en `app/data/types.ts`.

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Tipos de DB.** Generar `lib/supabase/database.types.ts` con el MCP de Supabase (`generate_typescript_types`). Con 0 tablas el `Database` sale casi vacío. **Verificación:** el archivo existe y exporta `Database`; `npx tsc --noEmit` limpio.

2. **Cliente browser.** Crear `lib/supabase/client.ts` con `createBrowserClient<Database>(url, key)` leyendo las dos env vars. **Verificación:** importable desde un Client Component sin error de tipos.

3. **Cliente server.** Crear `lib/supabase/server.ts`: función `async` que usa `cookies()` de `next/headers` y `createServerClient<Database>` con los handlers `getAll`/`setAll` de cookies (patrón `@supabase/ssr` para Next 16). **Verificación:** importable desde un Server Component; compila.

4. **Middleware de sesión.** Crear `middleware.ts` en la raíz que refresca la sesión en cada request (crea un server client sobre `request`/`response` y llama `getUser`/`getClaims`), con `config.matcher` excluyendo `_next/static`, `_next/image`, `favicon.ico` y assets. Seguir la guía de Next 16 (`node_modules/next/dist/docs/`) para la firma de middleware. **Verificación:** `npm run dev` levanta y navegar cualquier ruta no rompe (sin loops de redirección — el middleware solo refresca, no protege).

5. **Ruta de verificación.** Crear `app/health-supabase/page.tsx` (Server Component) que usa el cliente server, llama `supabase.auth.getSession()` y renderiza "✅ CONEXIÓN OK — sin sesión" o el error capturado. Comentario en el archivo: _"Ruta temporal de verificación — borrable tras confirmar la integración"_. **Verificación:** `/health-supabase` muestra el estado OK sin lanzar excepción.

6. **Build final.** `npm run lint` y `npm run build` limpios. Confirmar que las env vars están presentes y que ninguna clave sensible se filtró al bundle client (solo `NEXT_PUBLIC_*`).

---

## 4 · Criterios de aceptación

- [x] `npm run build` y `npm run lint` terminan sin errores.
- [x] Existe `lib/supabase/database.types.ts` exportando `Database`, generado por el MCP (no editado a mano).
- [x] Existe `lib/supabase/client.ts` con `createBrowserClient<Database>`, tipado, leyendo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [x] Existe `lib/supabase/server.ts` con `createServerClient<Database>` usando `cookies()` de `next/headers` (handlers `getAll`/`setAll`).
- [~] ~~Existe `middleware.ts` en la raíz que refresca la sesión...~~ — fuera de alcance final; excluido de la implementación (ver nota abajo).
- [x] `/health-supabase` renderiza "✅ CONEXIÓN OK — sin sesión" (sesión `null`) sin lanzar excepción.
- [x] Ambos clientes están tipados como `SupabaseClient<Database>`.
- [x] Ningún secreto no-`NEXT_PUBLIC_*` aparece en el bundle client.
- [x] `auth-provider.tsx`, `app/data/*`, Salón y "Actividad en vivo" quedan **sin cambios**.
- [ ] La ruta `/health-supabase` está comentada como temporal/borrable.

---

## 5 · Decisiones tomadas y descartadas

| Decisión              | Elegida                                         | Descartada                             | Justificación                                                                                                                                             |
| --------------------- | ----------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Alcance**           | Solo integración base (plumbing)                | Auth + datos + leaderboard en una spec | Feature demasiado grande; el usuario pidió dejar la base para specs separadas. Menos riesgo.                                                              |
| **Patrón de cliente** | Browser + server + middleware (`@supabase/ssr`) | Solo cliente browser                   | Es la base completa que auth/RLS necesitarán; añadir server/middleware ahora evita retrabajo.                                                             |
| **Ubicación**         | `lib/supabase/*` + `middleware.ts` en raíz      | `app/lib/supabase/*`                   | `middleware.ts` debe ir en la raíz sí o sí; `lib/` fuera de `app/` es la convención estándar de Supabase para Next y mantiene el código no-ruta separado. |
| **Tipos de DB**       | Generar `database.types.ts` (aun con 0 tablas)  | Clientes sin tipar / `any`             | Deja el patrón `SupabaseClient<Database>` listo; solo hay que re-generar al crear tablas.                                                                 |
| **Verificación**      | Ruta temporal `/health-supabase`                | Solo `npm run build` / log             | Prueba la conexión real (cookies + `getSession`) end-to-end, no solo que compila. Se borra después.                                                       |
| **Env var**           | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`          | `...ANON_KEY` (nomenclatura vieja)     | Confirmado por el usuario; es la nomenclatura nueva de Supabase ya presente en `.env.local`.                                                              |
| **Middleware**        | Solo refresca sesión                            | Middleware que protege rutas           | No hay auth aún; proteger rutas es responsabilidad de la spec de Auth. Evita loops de redirección.                                                        |

---

## 6 · Riesgos identificados

| Riesgo                                                                        | Mitigación                                                                                                                                                         |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Firma de middleware / API de cookies distinta en Next.js 16 vs. entrenamiento | Paso 4 obliga a leer la guía en `node_modules/next/dist/docs/` antes de escribir; `cookies()` se usa como `async` según Next 16.                                   |
| Loop de redirección o request colgado por middleware mal configurado          | El middleware **solo refresca** (no redirige); `matcher` excluye estáticos; se verifica navegando en `npm run dev`.                                                |
| Fuga de secretos al bundle client                                             | Solo se usan claves `NEXT_PUBLIC_*` (publishable, pensada para el cliente); criterio de aceptación lo verifica. `SUPABASE_DB_PASSWORD` nunca se importa en código. |
| `generate_typescript_types` con 0 tablas produce un tipo vacío que confunde   | Comentario en el archivo indicando que se re-genera al crear tablas; es el estado esperado.                                                                        |
| Olvidar borrar `/health-supabase` y dejar una ruta pública de diagnóstico     | Comentada como temporal; la spec de Auth (o un cleanup) la elimina. No expone datos sensibles (sesión siempre `null` hoy).                                         |

---

## Lo que **no** entra en esta spec

- Auth real: login/registro, OAuth (Google/GitHub), flujo de invitado. El `auth-provider.tsx` no se toca.
- Tablas, RLS, migraciones, `profiles` o cualquier esquema en la base.
- Migrar `GAMES`/`PLAYERS`/`seededScores` a la DB o cambiar Salón / "Actividad en vivo".
- Real-time (subscripciones) y Edge Functions.
- Seeding de datos.

Cada una de éstas, si llega, va en su propia spec.
