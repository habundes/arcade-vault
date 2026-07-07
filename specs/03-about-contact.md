# 03 · About — página Acerca de + Contacto

| Campo | Valor |
|---|---|
| **Spec** | `03-about-contact` |
| **Estado** | `Implemented` |
| **Fecha** | 2026-07-07 |
| **Dependencias** | SPEC 01 (MVP visual — pantallas), SPEC 02 (Home — reemplaza el stub `/about`) |
| **Objetivo (una frase)** | Portar la página de `references/templates/home-about/about.jsx` a `/about`, reemplazando el stub, con la sección Acerca de (misión + 3 highlights) y un formulario de Contacto client-only decorativo que muestra una terminal de éxito falsa. |

---

## 1 · Alcance

**Dentro del alcance:**

- **Reemplazar el stub `/about`** (`app/about/page.tsx`) por la página real portada 1:1 de `about.jsx`, como `"use client"`.
- **Sección Acerca de:** kicker, título, párrafo de misión y `highlight-row` con 3 tarjetas (icono pixel SVG + texto), con delays escalonados.
- **Banner divisor** (`about-divider`) con píxeles animados entre las dos secciones.
- **Sección Contacto:** grid 2-columnas — intro (kicker, título, subtítulo, 3 `tips` con LEDs) + formulario (nombre, email, mensaje).
- **Formulario client-only decorativo:** validación básica (campos no vacíos → animación `shake`); al pasar, muestra la **terminal de éxito falsa** (`VAULT-OS`) con el nombre del usuario y botón "ENVIAR OTRO MENSAJE" que resetea. Email con `type="email"` nativo, sin regex.
- **Componentes nuevos en `components/about/`:** `ContactForm.tsx` (form + terminal) y `HighlightIcon.tsx` (SVG pixel HEART/BROWSER/PLANT).
- **Portar estilos** `about-*`, `highlight*`, `about-divider`/`div-*`, `contact-*`, `terminal-success`/`term-*`, `.tip*` desde `styles.css` a `app/globals.css`.
- **Reveal on-scroll** (IntersectionObserver) en las secciones marcadas `reveal`.
- **Metadata** de ruta: título "Acerca de · Arcade Vault".

**Fuera del alcance (explícito):**

- ❌ Envío real del mensaje (Server Action, email, API, persistencia). La terminal de éxito es 100% decorativa.
- ❌ Almacenamiento de mensajes (localStorage/DB).
- ❌ Validación de formato de email por regex o anti-spam/captcha.
- ❌ Cambios en Nav (ya apunta a `/about` desde SPEC 02) u otras rutas.
- ❌ Nuevas estructuras en `app/data` (la página no consume datos del proyecto).

---

## 2 · Modelo de datos

Esta spec **no introduce datos nuevos** en `app/data` ni tipos persistentes. El único estado es local del componente `ContactForm` (client-side, efímero):

```ts
// components/about/ContactForm.tsx — estado local (useState)
form:  { name: string; email: string; msg: string }  // campos controlados
sent:  string | null   // null = formulario visible; string = nombre → terminal de éxito
shake: boolean         // true durante ~400ms tras submit inválido
```

No hay persistencia, ni serialización, ni contrato con `app/data`. `HighlightIcon` recibe una prop `kind: "HEART" | "BROWSER" | "PLANT"`.

---

## 3 · Plan de implementación

Cada paso deja la app compilando y navegable.

1. **Portar estilos.** Copiar de `references/templates/home-about/styles.css` a `app/globals.css` los bloques: `about`/`about-hero`/`about-title`/`about-mission`, `highlight-row`/`highlight`(+`.cyan/.magenta/.green`)/`hl-icon`/`hl-text`, `about-divider`/`div-bar`/`div-pixels`, `about-contact`/`contact-grid`/`contact-intro`/`contact-title`/`contact-sub`, `contact-tips`/`tip`/`tip-led`(+`.y/.m`), `contact-form`(+`.shake`)/`field`/inputs/`textarea`, `terminal-success`/`term-bar`/`term-body`(+`.line/.prompt/.dim/.success/.caret`). Verificar que existan las keyframes usadas (`shake`, `blink`, `pxblink`); portar las que falten. **Verificación:** `npm run build` sin errores.

2. **`HighlightIcon.tsx`.** Crear `components/about/HighlightIcon.tsx` con los 3 SVG pixel (HEART/BROWSER/PLANT) portados 1:1, prop `kind`. **Verificación:** compila; importable.

3. **`ContactForm.tsx`.** Crear `components/about/ContactForm.tsx` (`"use client"`): estado `form/sent/shake`, `onSubmit` con validación de campos no vacíos (+`shake`), render condicional formulario ↔ terminal de éxito, botón reset. **Verificación:** submit vacío dispara shake; submit válido muestra la terminal con el nombre.

4. **Página `/about`.** Reemplazar `app/about/page.tsx` por la página completa (`"use client"`): hero (kicker, título, misión, `highlight-row` con `HighlightIcon`), banner divisor, sección contacto (intro + tips + `<ContactForm />`). Añadir hook reveal (IntersectionObserver en `useEffect`) para las secciones `reveal`. **Verificación:** `/about` renderiza las dos secciones y el scroll dispara los reveals sin error de hidratación.

5. **Metadata.** Añadir título de ruta "Acerca de · Arcade Vault". Como la página es `"use client"`, `export const metadata` no está permitido; resolver mediante un `app/about/layout.tsx` Server Component con `metadata`, o `document.title` en efecto, según la guía de Next 16 (`node_modules/next/dist/docs/`). **Verificación:** la pestaña muestra el título.

6. **Repaso visual y build.** Comparar `/about` contra la plantilla (neón, iconos, divisor animado, shake, terminal). Probar responsive (`highlight-row` y `contact-grid` a 1 columna). `npm run lint` y `npm run build` limpios.

---

## 4 · Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/about` muestra la sección Acerca de: kicker "▸ ACERCA DE", título "ACERCA DE ARCADE VAULT", párrafo de misión y 3 highlights (HEART/BROWSER/PLANT) con sus colores (magenta/cyan/green) e iconos pixel.
- [ ] Aparece el banner divisor con los píxeles animados entre ambas secciones.
- [ ] Sección Contacto: intro (kicker "▸ CONTACTO", título "CONTÁCTANOS", subtítulo) + 3 tips con LEDs (verde/amarillo/magenta) y el formulario a la derecha.
- [ ] **Submit inválido:** con algún campo vacío, el formulario dispara la animación `shake` y **no** avanza.
- [ ] **Submit válido:** con nombre/email/mensaje llenos, se oculta el formulario y aparece la terminal de éxito `VAULT-OS` con el nombre del usuario en mayúsculas.
- [ ] El botón "ENVIAR OTRO MENSAJE" vuelve al formulario vacío.
- [ ] Ningún mensaje se envía ni persiste (sin llamadas de red ni escritura de estado global).
- [ ] Las secciones `reveal` aparecen al hacer scroll (clase `in`); sin error de hidratación en consola.
- [ ] La pestaña muestra el título "Acerca de · Arcade Vault".
- [ ] Responsive: `highlight-row` y `contact-grid` colapsan a 1 columna en viewport angosto.
- [ ] Coincide visualmente con `references/templates/home-about/about.jsx`.

---

## 5 · Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Justificación |
|---|---|---|---|
| **Envío del formulario** | Client-only decorativo (terminal falsa) | Server Action real / API / email | No hay backend ni DB en el proyecto; la plantilla ya define esa UX. Un envío real es infra propia de otra spec. |
| **Validación** | Campos no vacíos + `shake`, `type="email"` nativo | Regex de email / anti-spam / captcha | Coincide 1:1 con la plantilla; suficiente para UX decorativa. |
| **Estructura** | `components/about/ContactForm.tsx` + `HighlightIcon.tsx`; página `"use client"` | Todo inline en `page.tsx` | Sigue la convención `components/home/*` de SPEC 02 y mantiene la página legible. |
| **CSS** | Portar bloques `about-*/contact-*/term-*` a `globals.css` | Reescribir a Tailwind | Mismo criterio que SPEC 01/02: portar 1:1 preserva neón/CRT/animaciones sin riesgo. |
| **Metadata en página client** | `layout.tsx` Server Component o `document.title` (según guía Next 16) | `export const metadata` en el archivo `"use client"` | No permitido en Client Components; se resuelve por layout o efecto. |
| **Reveal on-scroll** | Replicar IntersectionObserver de la plantilla | Sin animación de entrada | Coherencia visual con Home/plantilla. |

---

## 6 · Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| `export const metadata` no permitido en archivo `"use client"` (rompe build) | Paso 5: resolver por `app/about/layout.tsx` Server Component o `document.title` en efecto, según la guía de Next 16. |
| Mismatch de hidratación por el efecto reveal (clases añadidas en cliente) | El estado inicial del render coincide en SSR y cliente; la clase `in` sólo se añade tras montar vía IntersectionObserver (mismo patrón ya validado en SPEC 02). |
| Keyframes faltantes (`shake`/`blink`/`pxblink`) al portar sólo bloques del About | Paso 1 verifica y porta las keyframes ausentes en `globals.css`. |
| Colisión/duplicación de reglas CSS al portar | Portar sólo los bloques `about-*/contact-*/term-*/highlight*/tip*` listados; no tocar el resto de `globals.css`. |

---

## Lo que **no** entra en esta spec

- Envío o entrega real del mensaje de contacto (Server Action, email, API).
- Persistencia de mensajes (localStorage/DB) o estado global.
- Validación de formato de email por regex, anti-spam o captcha.
- Cambios en Nav u otras rutas más allá de reemplazar el stub `/about`.
