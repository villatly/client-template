@AGENTS.md

---

# Villatly — Client Template

> Contexto general de la empresa: ver `../CLAUDE.md`

## Qué es este repo

Template de web + panel de gestión que se despliega como una instancia independiente por cada cliente de Villatly. Cada cliente tiene su propio proyecto en Vercel, su propio dominio y su propia base de datos en Supabase.

---

## Stack

| Herramienta | Uso |
|---|---|
| **Next.js 15** (App Router, Turbopack) | Framework |
| **Tailwind CSS v4** | Estilos |
| **TypeScript** | Lenguaje |
| **Supabase** | Base de datos (reservas, disponibilidad, contenido, admin) |
| **Stripe** | Cobro de reservas online |
| **Nodemailer** | Emails transaccionales (confirmaciones, alertas) |
| **Vercel** | Hosting — una instancia por cliente |

---

## Variables de entorno por instancia

```
# Supabase (obligatorio)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Auth del admin (obligatorio)
ADMIN_EMAIL            # Email de login al panel de admin
ADMIN_PASSWORD         # Contraseña del panel de admin

# Stripe (opcional — necesario para pagos online)
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# Email (obligatorio para notificaciones)
EMAIL_HOST
EMAIL_USER
EMAIL_PASS

# URL pública del sitio (obligatorio para Stripe + emails)
NEXT_PUBLIC_URL        # ej: https://villa-amara.vercel.app
```

---

## Arquitectura de datos: Supabase vs JSON

**CRÍTICO — leer antes de tocar contenido:**

En producción el sistema lee datos de **Supabase primero**. Los ficheros JSON en `src/content/property/` son solo seeds de primer arranque.

```
src/lib/storage.ts
  USE_SUPABASE = true en prod (cuando existen SUPABASE_URL + SERVICE_ROLE_KEY)

Lectura:  Supabase → si no existe la key → fallback a JSON
Escritura desde admin: siempre a Supabase, nunca a JSON
```

**Consecuencia directa:** si el cliente ha editado contenido desde el admin y luego se hace un nuevo deploy, Supabase sigue teniendo los datos del cliente. Los JSON nuevos del deploy no sobreescriben nada automáticamente.

Para sincronizar JSON → Supabase hay que usar el endpoint `POST /api/admin/reseed` (o el botón en Admin → Settings → "Sync Content from Deployment"). Esto sí sobreescribe todo — es destructivo.

---

## Estructura de ficheros de contenido

```
src/content/property/
  config.json          # PropertyConfig: slug, name, timezone, adminEmail, premiumLayouts
  branding.json        # BrandingConfig: colores, logo, favicon, layoutPreset, sectionColors
  booking.json         # BookingConfig: mode, currency, ctaLabel, bookingWhatsapp, showWhatsappButton
  sections.json        # SectionVisibility: qué secciones se muestran en la web pública
  availability.json    # AvailabilityData: precios y fechas bloqueadas por habitación
  locales/
    en.json            # PropertyContent: todo el contenido textual e imágenes
```

`locales/en.json` contiene: identity, hero, description, gallery, rooms, amenities, reviews, faq, location, nearbyAttractions, policies, contact, seo.

---

## Arquitectura del hero (Default layout)

El hero en el layout Default funciona así:

- Imagen de fondo + overlay negro (opacidad configurable 0–80%, campo `hero.overlayOpacity`)
- Eyebrow: `identity.location + " · " + identity.propertyType` (o `hero.tagline` si no hay location)
- Headline: `hero.headline`
- Subtitle: `hero.intro` — uppercase, tracking, máx 130 chars
- **Desktop:** barra de booking anclada al fondo del hero (`hidden sm:block absolute bottom-0`)
- **Mobile:** barra de booking debajo del hero en `PropertyPage` (`sm:hidden`)
- Flecha animada que apunta a `#about`
- Los campos `primaryCTA` y `secondaryCTA` del hero **solo se renderizan en los layouts Editorial y Resort**, no en Default

---

## WhatsApp — campo maestro vs fallback

Hay dos campos WhatsApp en el sistema:

| Campo | Fichero | Rol |
|---|---|---|
| `booking.bookingWhatsapp` | `booking.json` | **Master** — alimenta booking bar, botón flotante, contact CTA, toda la web |
| `content.contact.whatsapp` | `locales/en.json` | Fallback opcional — solo se usa si el master está vacío |

En `PropertyPage.tsx` se computa un `contact` unificado:
```ts
const contact = {
  ...content.contact,
  whatsapp: booking.bookingWhatsapp || content.contact.whatsapp || "",
};
```

Regla: siempre configurar WhatsApp en `booking.json`. El campo de `contact.whatsapp` raramente se necesita.

El botón flotante solo se muestra si `contact.whatsapp` (unificado) existe **y** `booking.showWhatsappButton !== false`.

---

## Layouts disponibles

| Layout | Estilo | Plan |
|---|---|---|
| **Default** | Limpio, full-screen hero con booking bar integrada | Gratuito |
| **Editorial** | Tipografía grande, boutique | Premium (`premiumLayouts: true` en config.json) |
| **Resort** | Cinematográfico, inmersivo | Premium |

El layout se configura en `branding.json → layoutPreset`. Los layouts premium requieren `config.json → premiumLayouts: true`.

---

## Panel de administración

Acceso en `/admin`. Secciones:

| Ruta | Propósito |
|---|---|
| `/admin` (dashboard) | Vista general con acceso a todas las secciones |
| `/admin/bookings` | Gestión de reservas (aceptar, rechazar, cancelar) |
| `/admin/availability` | Calendario, precios base, temporadas, iCal sync |
| `/admin/content` | Todo el contenido: hero, descripción, amenities, reviews, FAQ, ubicación, políticas, contacto, SEO |
| `/admin/rooms` | Tipos de habitación: fotos, descripción, specs, highlights |
| `/admin/gallery` | Galería de fotos de la propiedad |
| `/admin/branding` | Colores, logo, favicon, layout, colores por sección |
| `/admin/sections` | Mostrar/ocultar secciones de la web |
| `/admin/booking` | Modo de reserva, moneda, WhatsApp, botón flotante, CTA label |
| `/admin/settings` | Email de notificaciones, nombre en emails, timezone, reseed |

---

## Property Name — duplicidad importante

El nombre de la propiedad está almacenado en **dos sitios separados**:

| Ubicación | Fichero | Usado en |
|---|---|---|
| `content.identity.name` | `locales/en.json` | Web pública: header, hero, footer |
| `config.name` | `config.json` | Admin panel header, asuntos de email |

Hay que actualizar ambos cuando se cambia el nombre. Desde el admin: Content → Property Info (web) y Settings → Property Name in Emails (emails/admin).

---

## Estrategia de ramas Git

**Ramas activas:**

| Rama | Contenido | Uso |
|---|---|---|
| `main` | Template limpio + contenido Jumbo Homestay | Base de producción — desplegada en Vercel |
| `demo/thejumbohomestay-kutalombok` | Contenido Jumbo Homestay completo | Rama de trabajo principal para desarrollo |
| `demo/villa-amara` | Contenido Villa Amara | Demo alternativa |
| `demo/pitch` | Placeholder neutro, solo hero visible | Capturas rápidas para venta fría |

**Workflow de cambios de código:**
1. Trabajar en `demo/thejumbohomestay-kutalombok`
2. Commit en demo
3. `git cherry-pick <hash>` a `main`
4. `git merge main` en `demo/villa-amara`
5. Push de las tres ramas

**Workflow de cambios de contenido (JSON en `src/content/property/`):**
- Los cambios de contenido son **específicos de cada demo** — no van a main ni se cherry-pick
- Commit en la rama demo correspondiente y punto
- **SIEMPRE** hacer `git diff src/content/property/` antes de cambiar de rama — los cambios sin commitear en JSONs se pierden con `git restore`

---

## Tipos principales (`src/lib/types.ts`)

```ts
PropertyConfig      // config.json
BrandingConfig      // branding.json — colores, layout, logo, favicon, sectionColors
BookingConfig       // booking.json — mode, currency, ctaLabel, bookingWhatsapp, showWhatsappButton
SectionVisibility   // sections.json — qué secciones se ven
PropertyContent     // locales/en.json — todo el contenido
  PropertyIdentity  //   identity
  HeroContent       //   hero (+ overlayOpacity)
  DescriptionContent
  GalleryItem[]
  RoomUnit[]
  Amenity[]
  Review[]
  FAQItem[]
  LocationContent
  NearbyAttraction[]
  PoliciesContent
  ContactInfo       //   contact (+ ctaButtons[])
  SEOContent
ResolvedProperty    // config + branding + sections + content + booking (todo junto)
```

---

## Endpoints API relevantes

```
GET  /api/admin/config          Leer PropertyConfig
PUT  /api/admin/config          Guardar PropertyConfig
PUT  /api/admin/branding        Guardar BrandingConfig
PUT  /api/admin/booking         Guardar BookingConfig
PUT  /api/admin/sections        Guardar SectionVisibility
PUT  /api/admin/hero            Guardar HeroContent
PUT  /api/admin/content         Guardar sección de content (body: { section, data })
GET  /api/admin/rooms           Listar habitaciones
POST /api/admin/rooms           Crear habitación
PUT  /api/admin/rooms/[id]      Actualizar habitación
DELETE /api/admin/rooms/[id]    Eliminar habitación
POST /api/admin/reseed          Forzar escritura de todos los JSON seeds a Supabase
POST /api/upload                Subir imagen (devuelve URL /uploads/...)
```

---

## Estado actual

- ✅ Template funcional con admin, reservas y Stripe
- ✅ Primer cliente real: The Jumbo Homestay (Kuta, Lombok) — desplegado en Vercel
- ✅ Demo Villa Amara disponible en rama `demo/villa-amara`
- ✅ Rama `demo/pitch` para capturas de venta rápida
- 🔄 Pendiente: el cliente Jumbo necesita hacer Sync en Admin → Settings para que Supabase refleje el contenido actual del deploy
