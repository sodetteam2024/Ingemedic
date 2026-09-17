# Auditoría de patrones visuales — Ingemedic

Alcance: todo `src/` (Next.js 15 / React 19 / Tailwind CSS v4, sin `tailwind.config.*` — el theme vive en `src/app/globals.css` vía `@theme inline`, que **no define ningún token de color de marca**; cada color es un hex arbitrario repetido a mano). Objetivo: servir de base exacta (archivo:línea) para reconstruir el sistema de diseño en Figma.

---

## 1. Colores

Se encontraron **72 valores hex distintos** en `src/` (71 de 6 dígitos + `#fff`, único valor de 3 dígitos usado — 7 apariciones). No existe ningún token CSS (`--color-*`) para estos colores; todos están hardcodeados como `bg-[#XXXXXX]`, `text-[#XXXXXX]`, `style={{color:'#XXXXXX'}}`, etc.

### 1.1 Rojo / marca

| Hex | Frecuencia | Archivos (file:line) | Estándar o inconsistencia |
|---|---|---|---|
| `#D81B43` | 356 | `src/app/admin/sin-acceso/page.js:15`; `src/components/Header.js:93`; `src/app/LandingPage.js:89`; `src/app/admin/(dashboard)/clientes/ClientesClient.js:646`; `src/components/layout/Sidebar.js:281` | **Rojo de marca oficial** (dominante por lejos). Botones primarios, focus states, iconografía de alerta. |
| `#B0172F` | 40 | `src/app/admin/sin-acceso/page.js:26`; `src/components/ui/ConfirmDialog.js:36`; `src/app/admin/(dashboard)/clientes/ClientesClient.js:646,1596`; `src/app/admin/(dashboard)/configuracion/ConfiguracionClient.js:142` | Hover/shade oscuro de `#D81B43`, usado consistentemente en **todo el panel admin**. |
| `#E53935` | 18 | `src/components/layout/Sidebar.js:259,262,289,309,346,371` (único archivo) | **Segundo rojo real**, distinto de `#D81B43`. Usado solo en `Sidebar.js` para el ítem de nav activo, el avatar de usuario y el indicador de paginación — mientras el mismo archivo usa `#D81B43` en el modal de confirmar logout (líneas 486, 496, código activo). (El botón "Tour del sistema" en línea 281 también usa `#D81B43`, pero todo ese bloque está envuelto en un comentario JSX `{/* ... */}` — líneas 278-285 — y no se renderiza; no cuenta como evidencia viva, solo el modal de logout sí.) Ver inconsistencia §1.5. |
| `#B51335` | 2 | `src/app/LandingPage.js:89`; `src/components/Header.js:93` | Hover del rojo de marca, pero **solo en el sitio público** (Landing/Header) — el panel admin usa `#B0172F` para el mismo rol. |
| `#C0392B` | 5 | `src/app/admin/(dashboard)/bitacora/BitacoraClient.js:11,15,162`; `src/app/admin/(dashboard)/inventario/InventarioClient.js:36` | Usado como color de "Con novedad"/"eliminar". Casi idéntico a `#D81B43` pero **no es el mismo valor** — ver inconsistencia §1.5. |
| `#FEF2F2` | 9 | `src/app/admin/(dashboard)/bitacora/BitacoraClient.js:11,15`; `src/app/admin/(dashboard)/dashboard/DashboardClient.js:25,123`; `src/app/admin/(dashboard)/inventario/InventarioClient.js:36` | Fondo claro rojo/danger, consistente. |
| `#FFF0F3` | 3 | `src/app/admin/(dashboard)/clientes/ClientesClient.js:710,1225`; `src/app/admin/(dashboard)/ordenes/OrdenesClient.js:1341` | Variante de fondo rojo claro, distinta de `#FEF2F2`. |
| `#FEE2E2` | 1 | `src/app/admin/(dashboard)/dashboard/DashboardClient.js:123` | One-off, coexiste con `#FEF2F2` en la misma línea/zona. |

### 1.2 Azul marino / navy

| Hex | Frecuencia | Archivos (file:line) | Estándar o inconsistencia |
|---|---|---|---|
| `#1B3A6B` | 42 | `src/app/admin/(auth)/login/page.js:77,102,108,120,134`; `src/components/ui/ConfirmDialog.js:26,37`; `src/components/layout/Sidebar.js` (dot colors) | **Navy oficial del panel admin.** Labels, botones secundarios navy, dona del dashboard. |
| `#0B2656` | 25 | `src/app/quienes-somos/page.js:16,35,48,52,76...`; `src/app/portafolio/page.js:142`; `src/app/contacto/page.js:37,110,111,224` | Navy **del sitio público** (marketing) — no coincide con `#1B3A6B` del admin. Dos "navy de marca" paralelos según superficie. |
| `#152D55` | 3 | `src/components/ui/ConfirmDialog.js:37`; `src/app/admin/(dashboard)/repartidor-preferencias/RepartidorPreferenciasClient.js:68,90` | Hover de `#1B3A6B`. |
| `#152D54` | 3 | `src/app/admin/(dashboard)/clientes/ClientesClient.js:774,1279`; `src/app/admin/(dashboard)/inventario/InventarioClient.js:1211` | Hover de `#1B3A6B` — **difiere de `#152D55` en un solo dígito**, mismo rol exacto. Ver §1.5. |
| `#1E4D8C` | 1 | `src/app/admin/(dashboard)/bitacora/BitacoraClient.js:114` | Tercer hover distinto para el mismo botón navy (`bg-[#1B3A6B] ... hover:bg-[#1E4D8C]`). One-off. |
| `#14315C` | 1 | `src/app/admin/(auth)/login/page.js:102` | Cuarto valor usado como sombra/hover de navy en login. One-off. |
| `#0D2E68`, `#0A2656`, `#071C40`, `#0D2247`, `#0B2A66`, `#071C44`, `#0F3B8C` | 3, 4, 4, 2, 1, 1, 1 | `src/app/portafolio/page.js:142,227`; `src/app/LandingPage.js:60,70,209`; `src/components/Footer.js:7`; `src/app/contacto/page.js:37` | Familia de variantes de navy para gradientes/sombras del sitio público (`shadow-[...rgba]`, `bg-gradient-to-*`). Ninguna reutiliza `#1B3A6B` ni `#0B2656` exactamente. |

### 1.3 Cian

| Hex | Frecuencia | Archivos (file:line) | Estándar o inconsistencia |
|---|---|---|---|
| `#0E86A0` | 28 | `src/app/admin/(dashboard)/clientes/ClientesClient.js:24,310,906,1336`; `src/components/dashboard/EntregaEnCursoBanner.js:11` | Cian de **texto** dominante ("En préstamo", "Jurídica"). |
| `#2EB5D4` | 19 | `src/app/admin/(auth)/login/page.js:128,143`; `src/app/admin/(dashboard)/bitacora/BitacoraClient.js:103,126`; `src/app/admin/(dashboard)/inventario/InventarioClient.js:17` (`CAMPO_FILTRO_STYLES.modelo`), línea 34 (`dot` de "En préstamo") | Cian de **focus-ring / dot**, usado en inputs de login y Bitácora, y como `dot` de "En préstamo" en `InventarioClient`. |
| `#25A9E0` | 16 | `src/components/tour/TourWidget.js:13`; `src/app/admin/(dashboard)/configuracion/ConfiguracionClient.js:888,889,980,1477`; `DashboardClient.js` (`dot` de "En préstamo"/"Entregada") | Tercer cian, usado como `dot` de "En préstamo" en `DashboardClient` — **mismo estado que en Inventario usa `#2EB5D4`**. Ver §1.5. |
| `#E8F7FB` | 19 | `src/app/admin/(dashboard)/clientes/ClientesClient.js:24,307`; `src/app/admin/(dashboard)/bitacora/BitacoraClient.js:10,17`; `src/app/admin/(dashboard)/configuracion/ConfiguracionClient.js:759` | Fondo claro cian, consistente. |
| `#0E7490` | 3 | `src/app/admin/(dashboard)/clientes/ClientesClient.js:307`; `src/app/admin/(dashboard)/inventario/InventarioClient.js:27,374` (`FILTRO_PALETTE`) | Cuarto cian, más oscuro, usado solo en la paleta de filtros de Inventario. |

### 1.4 Verde / Ámbar / Índigo / Otros

| Hex | Frecuencia | Archivos (file:line) | Estándar o inconsistencia |
|---|---|---|---|
| `#0F7B55` | 82 | `src/app/admin/(dashboard)/clientes/ClientesClient.js:233,308,310,315,317`; usado en todos los `ESTADO_STYLES` para "Disponible"/"Finalizada"/"Cerrado" | **Verde oficial** (éxito/disponible). |
| `#ECFDF5` | 21 | `ClientesClient.js:308,315`; `BitacoraClient.js:9,14`; `DashboardClient.js:21` | Fondo claro verde, consistente. |
| `#E7F6EF` | 1 | `ClientesClient.js:233` (`ICONO_EVENTO.entrega.bg`) | Fondo verde **casi idéntico** a `#ECFDF5` pero re-tipeado distinto — one-off. |
| `#0A5C3F` | 4 | `src/app/admin/(dashboard)/entregas/EntregasClient.js:859,1009,1212,1274` | Verde alterno, solo en Entregas. |
| `#0C6444` | 2 | `src/app/admin/(dashboard)/entregas/EntregasRepartidorClient.js:196,265` | Otro verde alterno, solo en la vista de repartidor. |
| `#16A472` | 1 | `src/components/dashboard/EntregaEnCursoBanner.js:14` | One-off, quinto verde "success". |
| `#059669` / `#047857` | 1 / 1 | `src/app/admin/(dashboard)/servicios/ServiciosClient.js:169` | Par de verdes usados juntos (probable gradiente), no reutilizan `#0F7B55`. |
| `#B45309` | 43 | `ClientesClient.js:234`; `BitacoraClient.js:16`; `TourWidget.js:15`; `Sidebar.js:267`; `HistorialCargas.js:9` | **Ámbar oficial** (texto/"Reservado"/"En mantenimiento"). |
| `#F59E0B` | 12 | `DashboardClient.js:22,24,433`; `EntregasClient.js:41,634` | Ámbar de `dot`, consistente con `#B45309`. |
| `#FFFBEB` | 15 | `BitacoraClient.js:16`; `DashboardClient.js:22,24,34,389` | Fondo claro ámbar, consistente. |
| `#FEF3E2` | 1 | `ClientesClient.js:234` (`ICONO_EVENTO.devolucion.bg`) | Fondo ámbar **casi idéntico** a `#FFFBEB`, re-tipeado — one-off. |
| `#3730A3` | 3 | `src/lib/municipios.js:10`; `DashboardClient.js:302,321` | **Índigo** — escala de color del mapa de municipios (feature nueva del dashboard). |
| `#818CF8`, `#C7D2FE`, `#EEF2FF`, `#312E81` | 1 c/u | `src/lib/municipios.js:10`; `DashboardClient.js:302,321` | Resto de la escala índigo (`COLOR_ESCALA_MUNICIPIOS = ['#E2E8F0','#C7D2FE','#818CF8','#3730A3']`, más `#312E81` hover y `#EEF2FF` fondo de badge) — **familia nueva, aislada, sin relación con el resto de la paleta** (ni rojo, ni navy, ni cian). |
| `#6D28D9` | 5 | `BitacoraClient.js:12`; `DashboardClient.js:18`; `EntregasClient.js:805`; `InventarioClient.js:20,25` | Púrpura secundario (login/registro, marca "Jurídica"). |
| `#94A3B8`, `#64748B`, `#475569`, `#334155`, `#1E293B`, `#0F172A`, `#F1F5F9` | 19,18,5,5,9,13,23 | Extendido por todo `src/` | Escala de grises/slate — razonablemente consistente con la paleta `slate` de Tailwind, aunque hardcodeada en hex en vez de usar `text-slate-500` etc. (mezcla ambos enfoques en el mismo archivo, p.ej. `ClientesClient.js:231` vs `:292`). |

### 1.5 Inconsistencias a unificar (variantes casi-duplicadas)

1. **`#D81B43` vs `#E53935`** — `src/components/layout/Sidebar.js` usa ambos como "rojo de marca" en el mismo archivo, en código activo: `#E53935` para el ítem de nav activo y el avatar (líneas 259, 289, 309, 346), `#D81B43` para el modal de confirmar logout (líneas 486, 496). Son visualmente casi indistinguibles — muy probablemente debían ser el mismo color. (Nota: línea 281 usa `#D81B43` también, pero está dentro de un bloque comentado `{/* ... */}` sin renderizar — no se cuenta como evidencia, la inconsistencia ya es real solo con el modal de logout.)
2. **`#B0172F` vs `#B51335`** — mismo rol ("hover oscuro del rojo de marca"): el panel admin usa `#B0172F` (40 veces) y el sitio público usa `#B51335` (`LandingPage.js:89`, `Header.js:93`).
3. **`#D81B43` vs `#C0392B`** — mismo estado "Con novedad"/"eliminar": `DashboardClient.js:25` (`ESTADO_EQUIPO_STYLES['Con novedad']`) usa `#D81B43`, pero `InventarioClient.js:36` (`ESTADO_STYLES['Con novedad']`, mismo label) usa `#C0392B`, y `BitacoraClient.js:11,15` (acciones "eliminar"/"desactivar") también usa `#C0392B`.
4. **`#2EB5D4` vs `#25A9E0`** — mismo estado "En préstamo" (`dot`): `InventarioClient.js:34` usa `#2EB5D4`, `DashboardClient.js:23` usa `#25A9E0`.
5. **`#152D55` vs `#152D54` vs `#1E4D8C` vs `#14315C`** — cuatro hex distintos usados como "hover del navy `#1B3A6B`" en cuatro lugares distintos (`ConfirmDialog.js:37`, `ClientesClient.js:774`, `BitacoraClient.js:114`, `login/page.js:102`).
6. **`#ECFDF5` vs `#E7F6EF`** y **`#FFFBEB` vs `#FEF3E2`** — fondos claros verde/ámbar re-tipeados con un dígito de diferencia en `ClientesClient.js:233-234` (`ICONO_EVENTO`), en vez de reutilizar las constantes ya usadas en el resto del archivo.
7. **`#1B3A6B` (admin) vs `#0B2656` (sitio público)** — dos "navy de marca" totalmente distintos según la superficie (panel interno vs páginas de marketing), sin ningún punto de unificación.

### 1.6 Valores que aparecen una sola vez (candidatos a eliminar/unificar)

`#0F3B8C`, `#0B2A66`, `#071C44` (`portafolio/page.js:227`, gradiente) · `#EAF2FF`, `#F3F7FF`, `#DCE9FE` (`LandingPage.js:60`, gradiente) · `#00B0FF` (`LandingPage.js:159`) · `#14315C` (`login/page.js:102`) · `#C7D2FE`, `#818CF8` (`lib/municipios.js:10`, ya contados en la escala índigo) · `#171717`, `#0A0A0A`, `#EDEDED`, `#CBD5E1` (`globals.css:7,19,20,32`) · `#E7F6EF`, `#FEF3E2` (`ClientesClient.js:233-234`) · `#16A472` (`EntregaEnCursoBanner.js:14`) · `#1E4D8C` (`BitacoraClient.js:114`) · `#FEE2E2` (`DashboardClient.js:123`) · `#312E81`, `#EEF2FF` (`DashboardClient.js:302,321`) · `#059669`, `#047857` (`ServiciosClient.js:169`) — 23 valores en total.

---

## 2. Tipografía

No hay ninguna escala tipográfica declarada (ni en `@theme`, ni en componentes reutilizables) — cada tamaño se escribe como clase arbitraria `text-[Npx]`.

### 2.1 Tamaños arbitrarios `text-[Npx]`

| Tamaño | Frecuencia | Archivos representativos |
|---|---|---|
| `text-[13px]` | 202 | `BitacoraClient.js:114,126,142`; `ClientesClient.js:641,664` |
| `text-[12px]` | 158 | `BitacoraClient.js:111,140,143,150,191`; `ConfiguracionClient.js:942,1169` |
| `text-[11px]` | 127 | `ClientesClient.js:21` (`labelCls`); `BitacoraClient.js:166` |
| `text-[12.5px]` | 95 | `BitacoraClient.js:205,213,214`; `ClientesClient.js:686,707,751` |
| `text-[11.5px]` | 57 | `BitacoraClient.js:255,258,261`; `ClientesClient.js:712` |
| `text-[10.5px]` | 42 | `BitacoraClient.js:178,208,244`; `ClientesClient.js:769` |
| `text-[13.5px]` | 33 | `ClientesClient.js:20` (`inputCls`); `ConfiguracionClient.js:128,206,884,1002` |
| `text-[14px]` | 32 | `login/page.js:120,134` |
| `text-[10px]` | 30 | `BitacoraClient.js:249`; `ClientesClient.js:1022,1435` |
| `text-[9.5px]` | 26 | `Sidebar.js:346` |
| `text-[15px]` | 24 | `login/page.js:112,168` |
| `text-[16px]` | 13 | `login/page.js:128,143,161` |
| `text-[9px]` | 12 | `IconosEquipo.js` (etiqueta bajo icono) |
| `text-[20px]` | 9 | varios headers de sección |
| `text-[18px]` | 9 | `BitacoraClient.js:110` |
| `text-[17px]` | 4 | esporádico |
| `text-[8px]` | 3 | esporádico |
| `text-[48px]` | 1 | one-off |
| `text-[25px]` | 1 | `login/page.js:108` |

**Tamaños con clase nombrada de Tailwind (usados en paralelo, sobre todo en el sitio público y componentes puntuales):** `text-xs` (70), `text-sm` (40), `text-2xl` (17), `text-3xl` (17), `text-lg` (15), `text-base` (11), `text-xl` (7). Es decir, el panel admin usa casi exclusivamente tamaños arbitrarios en px, mientras el sitio público (`LandingPage.js`, `quienes-somos`, `contacto`, `portafolio`) mezcla clases nombradas de Tailwind — dos convenciones tipográficas distintas conviviendo en el mismo repo.

### 2.2 Casi-duplicados que cumplen el mismo rol

Comparando usos reales dentro de un mismo archivo (`BitacoraClient.js` es el ejemplo más claro, usa las seis variantes de "texto pequeño" en la misma pantalla):
- **Body/label secundario:** `text-[12px]` (línea 111, 140, 143), `text-[12.5px]` (línea 205, 213) y `text-[11.5px]` (línea 255, 258, 261) se usan indistintamente para texto secundario gris (`text-slate-400/500`) dentro del mismo componente — no hay diferencia de jerarquía visual perceptible entre ellas.
- **Inputs/selects:** `text-[13px]` (`BitacoraClient.js:103,126,142`) vs `text-[13.5px]` (el `inputCls` compartido en Clientes/Configuracion/Inventario/Mantenimientos/Ordenes) vs `text-[14px]` (`RepartidorPreferenciasClient.js:7`, variante local del mismo `inputCls`) — tres tamaños para el mismo control de formulario.
- **Labels uppercase de formulario:** `text-[11px] font-bold uppercase tracking-[0.07em]` (`ClientesClient.js:21`) vs `text-[10.5px] font-bold uppercase tracking-[0.07em]` (`BitacoraClient.js:178`) — mismo patrón visual, un valor de diferencia.

Recomendación implícita: colapsar a una escala de 4-5 pasos (p. ej. 10 / 11 / 12.5 / 13.5 / 15) en vez de los 14 tamaños arbitrarios actuales.

### 2.3 Pesos de fuente

| Clase | Frecuencia | Contexto típico observado |
|---|---|---|
| `font-bold` | 294 | Muy variado: títulos de sección (`BitacoraClient.js:110`), labels de login (`login/page.js:120`), botones (`login/page.js:161`), encabezados de tabla uppercase (`BitacoraClient.js:178`). Es el peso "default" para casi cualquier texto que deba destacar. |
| `font-semibold` | 189 | Casi siempre **labels de botón y badges**: botones primarios/secundarios (`ClientesClient.js:646`, `BitacoraClient.js:114`), tabs activos (`ClientesClient.js:664,668`), pills de estado. |
| `font-medium` | 108 | Texto de body con algo de énfasis: labels de filtro (`BitacoraClient.js:140,143`), nombres en tablas (`BitacoraClient.js:201`), botones secundarios (`ClientesClient.js:641`). |
| `font-extrabold` | 35 | **Casi exclusivamente números grandes de KPI** (`text-2xl font-extrabold tabular-nums`): `DashboardClient.js:209,467`; `ClientesClient.js:910,1332,1336,1340`; `InventarioClient.js:675`; `OrdenesClient.js:864`. Único uso claro y consistente de los cuatro pesos. |

---

## 3. Espaciado y radios de borde

### 3.1 Radios arbitrarios `rounded-[Npx]`

| Radio | Frecuencia | Archivos representativos |
|---|---|---|
| `rounded-[9px]` | 141 | `inputCls` compartido (`ClientesClient.js:20`, `ConfiguracionClient.js:39`, `InventarioClient.js:40`, `MantenimientosClient.js:57`, `OrdenesClient.js:64`); botones primarios (`ClientesClient.js:646`) |
| `rounded-[8px]` | 51 | `login/page.js:112`; `ClientesClient.js:686,774`; `ConfiguracionClient.js:110,191` |
| `rounded-[7px]` | 27 | `ConfiguracionClient.js:942,1169`; `EntregasClient.js:36,853` |
| `rounded-[10px]` | 24 | `login/page.js:128,143`; `ClientesClient.js:1294,1628` |
| `rounded-[6px]` | 13 | `ConfiguracionClient.js:770,771,893,894` (botones-icono pequeños) |
| `rounded-[22px]` | 6 | `quienes-somos/page.js:179,199,219,239` (tarjetas del sitio público) |
| `rounded-[14px]` | 3 | `ConfiguracionClient.js:...`; `Sidebar.js:403,417` |
| `rounded-[12px]` | 3 | `ConfiguracionClient.js:1208,1230`; `Sidebar.js:346` |
| `rounded-[24px]` | 2 | `login/page.js:107`; `Sidebar.js:387` (panel móvil) |
| `rounded-[28px]` | 1 | `portafolio/page.js:225` |

### 3.2 Radios con clase nombrada de Tailwind

| Clase | Frecuencia | Uso típico |
|---|---|---|
| `rounded-full` | 173 | Avatares, pills de badge de estado, botones flotantes (FAB), tabs de filtro. |
| `rounded-xl` | 90 | Tarjetas blancas (contenedores, KPI cards, filas de tabla en tarjeta). |
| `rounded-2xl` | 34 | Modales/drawers en su esquina superior móvil (`rounded-t-2xl`), tarjetas de logout. |
| `rounded-lg` | 24 | Iconos circulares/cuadrados pequeños dentro de tarjetas (`DashboardClient.js:206`). |
| `rounded-3xl` | 10 | Esporádico en sitio público. |
| `rounded-md` | 2 | `InventarioClient.js:778`; `Skeleton.js:6` — outlier, único uso fuera del resto de la escala. |
| `rounded-sm` | 1 | `DashboardClient.js:331` (barra de leyenda) — one-off. |
| `rounded` (bare) | 14 | `BitacoraClient.js:255`; `EntregasClient.js:810`; `InventarioClient.js:977,1025`; `MantenimientosClient.js:643` — radio por defecto de Tailwind (4px), mezclado sin razón aparente entre los mismos módulos que usan `rounded-[Npx]`. |

### 3.3 Convención observada

Hay una convención **bastante clara pero no impuesta por ningún token**: `rounded-[9px]` para inputs y botones de tamaño estándar, `rounded-[7px]`/`rounded-[8px]` para botones/controles compactos, `rounded-[6px]` para botones-icono diminutos, `rounded-xl` para contenedores/tarjetas, `rounded-full` para pills/avatares/FAB. Los contraejemplos concretos que rompen la convención: `rounded-md` en `InventarioClient.js:778` y `Skeleton.js:6` (debería ser `rounded-[6px]` o `rounded-lg` según el resto del archivo), `rounded-sm` en `DashboardClient.js:331`, y los 14 usos de `rounded` a secas que conviven con `rounded-[7px]`/`rounded-[9px]` en los mismos archivos (`InventarioClient.js`, `BitacoraClient.js`).

---

## 4. Componentes recurrentes

### 4.1 Badges de estado

Se encontraron **8 objetos `*_STYLES` distintos** que definen pills de estado, cada uno redefiniendo sus propios colores en vez de importar uno compartido:

| Objeto | Archivo:línea | Estados definidos |
|---|---|---|
| `ESTADO_EQUIPO_STYLES` | `DashboardClient.js:20-27` | Disponible, Reservado, En préstamo, En mantenimiento, Con novedad, Baja |
| `ESTADO_OS_STYLES` | `DashboardClient.js:31-37` | Borrador, Programada, En reparto, Entregada, Finalizada |
| `ESTADO_STYLES` (inventario) | `InventarioClient.js:31-38` | Disponible, Reservado, En préstamo, En mantenimiento, Con novedad, Baja |
| `ESTADO_STYLES` (mantenimientos) | `MantenimientosClient.js:26-30` | Abierto, En proceso, Cerrado |
| `ESTADO_STYLES` (órdenes) | `OrdenesClient.js:27-34` | Borrador, Programada, En reparto, Entregada, Finalizada, Cancelada |
| `TIPO_STYLES` | `ClientesClient.js:23-26` | Jurídica, Natural |
| `ACCION_STYLES` | `BitacoraClient.js:8-18` | crear, editar, eliminar, login, logout, activar, desactivar, cerrar, avanzar |
| `CAMPO_FILTRO_STYLES` / `FILTRO_PALETTE` | `InventarioClient.js:16-28` | modelo, serie, código, marca, tipo (no son "estados" pero siguen el mismo patrón `{color, Icon}`) |

**Cruce de valores para el mismo estado — SÍ hay drift:**

| Estado | `DashboardClient.ESTADO_EQUIPO_STYLES` (línea 20-27) | `InventarioClient.ESTADO_STYLES` (línea 31-38) | ¿Coincide? |
|---|---|---|---|
| Disponible | `bg:#ECFDF5 color:#0F7B55 dot:#0F7B55` | `bg:#ECFDF5 color:#0F7B55 dot:#0F7B55` | ✅ idéntico |
| Reservado | `bg:#FFFBEB color:#B45309 dot:#F59E0B` | `bg:#FFFBEB color:#B45309 dot:#F59E0B` | ✅ idéntico |
| En préstamo | `bg:#E8F7FB color:#0E86A0 dot:#25A9E0` | `bg:#E8F7FB color:#0E86A0 dot:#2EB5D4` | ❌ `dot` distinto |
| Con novedad | `bg:#FEF2F2 color:#D81B43 dot:#D81B43` | `bg:#FEF2F2 color:#C0392B dot:#C0392B` | ❌ `color`/`dot` distintos |
| Baja | `bg:#F1F5F9 color:#64748B dot:#94A3B8` | `bg:#F1F5F9 color:#64748B dot:#94A3B8` | ✅ idéntico |

Los estados compartidos entre `DashboardClient.ESTADO_OS_STYLES` (línea 31-37) y `OrdenesClient.ESTADO_STYLES` (línea 27-34) sí coinciden exactamente en `bg`/`color` para Borrador, Programada, En reparto, Entregada y Finalizada — este par está bien sincronizado, a diferencia del par Dashboard/Inventario de arriba.

### 4.2 Botones primarios (rojo sólido)

| # | Archivo:línea | Clases | Padding | Radio | Hover |
|---|---|---|---|---|---|
| 1 | `ClientesClient.js:646` | `px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F]` | `px-4 py-2` | `9px` | `#B0172F` |
| 2 | `ConfiguracionClient.js:1147` | `px-5 py-2.5 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F]` | `px-5 py-2.5` | `9px` | `#B0172F` |
| 3 | `OrdenesClient.js:833` | `px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F]` | `px-4 py-2` | `9px` | `#B0172F` |
| 4 | `InventarioClient.js:632` | `px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F]` | `px-4 py-2` | `9px` | `#B0172F` |
| 5 | `MantenimientosClient.js:658,716` | `px-3 py-1.5/px-2.5 py-1 bg-[#D81B43] text-white text-[11px] font-bold rounded-[7px] hover:bg-[#B0172F]` | `px-2.5-3 py-1-1.5` | `7px` (**radio distinto**) | `#B0172F` |
| 6 | `EntregasClient.js:853` | `px-3 py-1.5 bg-[#D81B43] text-white text-[12px] font-semibold rounded-[7px] hover:bg-[#B0172F]` | `px-3 py-1.5` | `7px` (**radio distinto**) | `#B0172F` |
| 7 | `login/page.js:161` | `w-full py-3.5 rounded-full text-[16px] font-bold`, `style={{background:'#1B3A6B'}}` | `py-3.5` | `full` (**forma distinta, navy no rojo**) | inline `#94A3B8` (disabled) |
| 8 | `LandingPage.js:89` / `Header.js:93,140` | `h-11/h-[52px] rounded-full text-xs/text-sm font-bold text-white bg-[#D81B43] hover:bg-[#B51335]` | altura fija, no `py-*` | `full` (**forma distinta del admin**) | `#B51335` (**hover distinto**, ver §1.5) |

**Mayoría (1-4):** `px-4 py-2`, `rounded-[9px]`, `text-[13px] font-semibold`, `hover:bg-[#B0172F]`. Desvíos: Mantenimientos/Entregas usan `rounded-[7px]` para botones compactos (consistente con la escala de §3.3 pero no con el "botón primario" estándar); el sitio público usa `rounded-full` en vez de `rounded-[9px]` y un hover distinto (`#B51335`); el botón de login es navy, no rojo, y usa `style` inline en vez de clase Tailwind arbitraria.

### 4.3 Botones secundarios (gris/outline)

| # | Archivo:línea | Clases | Padding | Radio |
|---|---|---|---|---|
| 1 | `ClientesClient.js:641` | `px-3 py-2 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-[9px] hover:border-slate-300` | `px-3 py-2` | `9px` |
| 2 | `ClientesClient.js:1594` (Cancelar) | `px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300` | `px-4 py-2.5` | `9px` |
| 3 | `ConfiguracionClient.js:1506` (Cancelar) | idéntico a #2 | `px-4 py-2.5` | `9px` |
| 4 | `ConfiguracionClient.js:110` | `px-3 py-2 border border-slate-200 rounded-[8px] text-[12.5px] font-medium text-slate-600 hover:border-[#D81B43] hover:text-[#D81B43]` | `px-3 py-2` | `8px` (**radio y texto distintos**) |
| 5 | `ConfiguracionClient.js:1169` (preview) | `px-3 py-1.5 border border-slate-200 rounded-[7px] text-[12px] font-medium text-slate-600 hover:border-[#D81B43] hover:text-[#D81B43]` | `px-3 py-1.5` | `7px` |
| 6 | `BitacoraClient.js` (select) | `px-3 py-2 border border-slate-200 rounded-[9px] text-[13px] ... bg-white text-slate-600` (usa `selectCls`, no botón real pero mismo lenguaje visual) | `px-3 py-2` | `9px` |

Los botones "Cancelar" de modal están perfectamente estandarizados (#2, #3, idénticos carácter por carácter). El resto sigue la misma micro-escala de radio por tamaño que los primarios (9/8/7px), pero con **dos tratamientos de hover distintos**: unos oscurecen el borde a gris (`hover:border-slate-300`), otros lo tiñen de rojo de marca (`hover:border-[#D81B43] hover:text-[#D81B43]`) — sin regla aparente de cuándo usar cada uno.

### 4.4 Modales / Drawers

| Patrón | Archivo:línea | Overlay | Z-index overlay | Panel | Z-index panel |
|---|---|---|---|---|---|
| Modal centrado | `ClientesClient.js:1489` | `bg-black/40 backdrop-blur-sm` | `z-40` | centrado, `max-w` variable | — |
| Modal centrado | `ConfiguracionClient.js:1257` | `bg-black/40` | `z-40` | centrado | — |
| Modal centrado | `EntregasClient.js:883,1093` | `bg-black/40` | `z-40` | centrado | — |
| Modal "éxito" | `EntregasClient.js:1224` | `bg-black/50` | `z-[80]` | centrado | — |
| Modal registro (repartidor) | `EntregasRepartidorClient.js:165` | `bg-black/50` (**sin** `backdrop-blur-sm**`) | `z-[60]` | centrado | — |
| Drawer lateral — Entregas | `EntregasClient.js:972-973` | `bg-black/30` | `z-20` | `md:w-[480px]`, `h-[92vh]` móvil (bottom sheet) | `z-30` |
| Drawer lateral — Inventario | `InventarioClient.js:1061-1062` | `bg-black/30` | `z-[45]` | `md:w-[500px]` | `z-[50]` |
| Drawer lateral — Órdenes | `OrdenesClient.js:1533-1534` | `bg-black/30` | `z-[45]` | `md:w-[500px]` | `z-[50]` |
| Drawer lateral — Mantenimientos | `MantenimientosClient.js:739-740` | `bg-black/30` | `z-20` | `md:w-[520px]` | `z-30` |
| Master-detail panel — Clientes | `ClientesClient.js:679,1192` | (sin overlay, panel fijo en layout) | — | `md:w-[380px]` fijo, `md:border-r`, sin overlay/z-index (no es modal, es panel persistente de dos columnas) | — |
| Confirm dialog reutilizable | `src/components/ui/ConfirmDialog.js:19` | `bg-black/50 backdrop-blur-sm` | `z-[60]` | tarjeta `max-w-[340px]` centrada | — |
| Confirm logout — Sidebar (propio, no reusa `ConfirmDialog`) | `Sidebar.js:482,484` | `bg-black/50 backdrop-blur-sm` | `z-[100]` | `max-w-[340px]` centrada | — |

No hay uso de `createPortal` de React en ningún archivo (`grep createPortal` → 0 resultados); todos los modales se montan inline dentro del árbol del componente. Hallazgos: **tres opacidades de overlay distintas** (`/30`, `/40`, `/50`) sin regla clara de cuándo usar cada una; **z-index totalmente ad-hoc** (20, 30, 40, 45, 50, 60, 80, 100) en vez de una escala fija; el drawer de detalle tiene **tres anchos distintos** (480px / 500px / 520px) para el mismo patrón de "panel de detalle lateral"; y `Sidebar.js` reimplementa su propio modal de confirmación en vez de reusar el componente `ConfirmDialog` ya existente en `src/components/ui/ConfirmDialog.js`.

### 4.5 Tarjetas de KPI

| Módulo | Archivo:línea | Contenedor | Número |
|---|---|---|---|
| Dashboard | `DashboardClient.js:204` | `bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all` | `text-2xl font-extrabold tabular-nums` |
| Inventario | `InventarioClient.js:674` | `bg-white rounded-xl border border-slate-200 p-4 shadow-sm` | `text-2xl font-extrabold tabular-nums` (línea 675) |
| Órdenes | `OrdenesClient.js:858` | `bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-4` | `text-2xl font-extrabold tabular-nums leading-none` (línea 864) |
| Clientes | `ClientesClient.js:909` | `bg-white rounded-xl border border-slate-200 p-4 shadow-sm` | `text-2xl font-extrabold tabular-nums` (línea 910) |
| Bitácora | `BitacoraClient.js:164` | `bg-white rounded-xl border border-slate-200 p-3 shadow-sm` (**padding `p-3`, no `p-4`**) | `text-xl font-extrabold tabular-nums` (**`text-xl`, no `text-2xl`** — única desviación real) |

Este es el patrón **más consistente del repo**: 4 de 5 implementaciones son carácter-por-carácter idénticas (`bg-white rounded-xl border border-slate-200 p-4 shadow-sm` + `text-2xl font-extrabold tabular-nums`). La única desviación real es `BitacoraClient.js:164-165`, que usa `p-3` y `text-xl` en vez de `p-4`/`text-2xl`.

### 4.6 Inputs de texto

| Archivo:línea | Clase | Radio | Tamaño texto | Focus | Fondo |
|---|---|---|---|---|---|
| `ClientesClient.js:20` (`inputCls`) | `w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] text-slate-800 outline-none focus:border-[#D81B43] bg-white transition-colors placeholder:text-slate-400` | `9px` | `13.5px` | `#D81B43` | blanco |
| `ConfiguracionClient.js:39` | idéntico byte-a-byte a `ClientesClient.js:20` | `9px` | `13.5px` | `#D81B43` | blanco |
| `InventarioClient.js:40` | idéntico | `9px` | `13.5px` | `#D81B43` | blanco |
| `MantenimientosClient.js:57` | idéntico | `9px` | `13.5px` | `#D81B43` | blanco |
| `OrdenesClient.js:64` | idéntico | `9px` | `13.5px` | `#D81B43` | blanco |
| `RepartidorPreferenciasClient.js:7` | `w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[14px] text-slate-800 outline-none focus:border-[#D81B43] bg-white` (**sin** `transition-colors placeholder:text-slate-400`, `text-[14px]` en vez de `13.5px`) | `9px` | `14px` (**distinto**) | `#D81B43` | blanco |
| `login/page.js:128,143` | `w-full px-4 py-3.5 border border-slate-200 rounded-[10px] text-[16px] bg-white outline-none transition-all focus:border-[#2EB5D4]` | `10px` (**distinto**) | `16px` (**distinto**) | `#2EB5D4` (**cian, no rojo — distinto**) | blanco |
| `BitacoraClient.js:126` (buscador) | `w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#2EB5D4] bg-slate-50` | `9px` | `13px` (**distinto**) | `#2EB5D4` (**cian, no rojo**) | `bg-slate-50` (**distinto**) |

El `inputCls` compartido (5 archivos, string idéntico) es el estándar real del panel admin. Se desvían: `RepartidorPreferenciasClient` (tamaño de texto y falta de transición/placeholder), `login/page.js` (radio, tamaño y color de focus totalmente distintos — cian en vez de rojo), y el buscador de `BitacoraClient.js` (focus cian, fondo gris en vez de blanco).

---

## 5. Iconografía

### 5.1 Galería SVG custom — `src/components/inventario/IconosEquipo.js`

Archivo dedicado: "Galería de 20 iconos médicos/técnicos para tipos de equipo" (comentario en línea 1). Estructura: array `ICONOS_EQUIPO` (línea 4) de 20 objetos `{ clave, nombre, svg(size, color) }`, cada uno con su propio `<svg viewBox="0 0 48 48">` dibujado a mano (líneas 4-290). Se consume vía:
- `IconoEquipo({ clave, size=32, color='#D81B43' })` (línea 291) — busca el icono por `clave` con `.find()` y ejecuta `icono.svg(size, color)`.
- `GaleriaIconos({ seleccionado, onSeleccionar, color })` (al final del archivo) — grid `grid-cols-5` para elegir icono en el formulario de tipo de equipo.
- Reexportado a través de `src/components/inventario/IconoTipo.js`, que decide entre imagen subida (`imagen_url`), icono de esta galería (`icono:<clave>`), icono heredado de la categoría, o iniciales como placeholder — comentario explícito: "Único lugar con esta lógica... para no divergir entre Inventario y el wizard de Órdenes".

### 5.2 `lucide-react`

**22 archivos** importan de `lucide-react`, sumando **64 componentes de icono distintos**: `AlertTriangle, ArrowDownLeft, ArrowUpRight, Award, Ban, Box, Building, Building2, Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardCheck, ClipboardList, Clock, Cpu, Download, Edit3, Eye, FileText, Filter, FlaskConical, GraduationCap, Hash, Headphones, HeartPulse, Inbox, Layers, Loader2, Lock, LogOut, Mail, Map, MapPin, Menu, MessageSquare, Package, Paperclip, Phone, Plus, Save, Search, Send, Settings, ShieldCheck, SkipForward, SlidersHorizontal, Smartphone, Tag, Target, ToggleLeft, ToggleRight, Trash2, TrendingUp, Truck, Upload, User, UserPlus, Users, Wrench, X`.

Principales consumidores: `ClientesClient.js:6-11` (22 iconos), `ConfiguracionClient.js:5-10` (19), `OrdenesClient.js:10-14` (20), `InventarioClient.js:7` (17), `DashboardClient.js:6-10` (14), `EntregasClient.js:6-10` (15), `MantenimientosClient.js:6-10` (13), `BitacoraClient.js:5` (5), y varios más en el sitio público (`LandingPage.js:6-8`, `quienes-somos/page.js:5-8`, `contacto/page.js:4`, `Footer.js:3`).

### 5.3 SVG inline ad-hoc (un tercer sistema, y un cuarto disperso)

`src/components/layout/Sidebar.js:49-64` define su **propio** objeto `ICONS` con **14 iconos dibujados a mano** en estilo Feather/Lucide (`grid, truck, pulse, file, users, tool, book, settings, logout, map, chevronL, chevronR, grip, alert`) — pese a que el mismo archivo no importa `lucide-react` en absoluto, mientras el resto del panel admin sí lo usa masivamente para los mismos conceptos (camión, engranaje, archivo, etc.). Es, en la práctica, una reimplementación manual de iconos que ya existen en la librería que el proyecto ya usa en otros 21 archivos.

Además, se encontraron `<svg>` inline sueltos (ni de `IconosEquipo.js` ni del objeto `ICONS` de Sidebar) en **7 archivos más**:
- `src/app/admin/(auth)/login/page.js:113,148` (icono de error, toggle mostrar/ocultar contraseña — este último duplica `Eye`/`EyeOff` de lucide, que el proyecto ya usa en `MantenimientosClient.js`).
- `src/app/admin/(dashboard)/inventario/InventarioClient.js:1002,1066,1067,1309` (chevrons y "ojo tachado" duplicando `ChevronUp/ChevronDown`/`EyeOff` de lucide).
- `src/app/admin/(dashboard)/configuracion/ConfiguracionClient.js` (chevrons inline similares).
- `src/app/admin/sin-acceso/page.js:15` (icono de candado/escudo a mano).
- `src/app/contacto/page.js`, `src/app/LandingPage.js`, `src/app/portafolio/page.js`, `src/app/quienes-somos/page.js`, `src/components/Header.js` — logo, icono de WhatsApp y decorativos del sitio público (fuera de cualquiera de los dos sistemas, justificable porque son gráficos de marca, no iconografía funcional).

### 5.4 Conclusión

**No hay una regla consistente.** Conviven cuatro fuentes de iconos: (1) la galería custom de 20 SVG para tipos de equipo médico — bien encapsulada y con una única razón de ser (necesita iconos médicos que no existen en ninguna librería); (2) `lucide-react`, usado como sistema por defecto en 22 archivos con 64 iconos distintos; (3) el objeto `ICONS` hand-rolled de `Sidebar.js`, que debería ser `lucide-react` y no lo es; y (4) SVG sueltos en al menos 7 archivos más, varios de los cuales duplican iconos (`Eye`, `EyeOff`, `ChevronUp`, `ChevronDown`) que `lucide-react` ya provee y que otros archivos del mismo módulo ya importan.

---

## Resumen ejecutivo

- **No existe ningún token de color/tipografía/radio en `globals.css`** — los 72 hex, 18 tamaños de texto y 10 radios arbitrarios están hardcodeados y repetidos a mano en decenas de archivos; es la causa raíz de casi todas las inconsistencias listadas abajo y el primer paso obligatorio antes de migrar a Figma (definir tokens `brand-red`, `navy`, `cyan`, `green`, `amber`, con sus variantes hover/bg).
- **`Sidebar.js` mezcla dos rojos de marca en el mismo archivo** (`#D81B43` y `#E53935`) para el mismo rol de "activo/marca" — es la inconsistencia de color más visible porque ocurre dentro de un único componente que todo usuario ve permanentemente.
- **El mismo estado de negocio tiene colores distintos según el archivo**: "Con novedad" es `#D81B43` en `DashboardClient.js` pero `#C0392B` en `InventarioClient.js`; el `dot` de "En préstamo" es `#25A9E0` en Dashboard pero `#2EB5D4` en Inventario — los 8 objetos `*_STYLES` deberían derivar de una única fuente compartida.
- **Cuatro shades distintos de "hover navy"** (`#152D55`, `#152D54`, `#1E4D8C`, `#14315C`) y **dos de "hover rojo"** (`#B0172F` admin vs `#B51335` sitio público) resuelven el mismo rol visual sin ninguna razón funcional para diferir.
- **El drawer de detalle lateral (el patrón de UI más repetido del panel admin) tiene tres anchos distintos** (480px / 500px / 520px) y un z-index/overlay ad-hoc por módulo (20-30, 30-30, 45-50) en vez de una escala fija — alto impacto porque es la base de casi toda pantalla de detalle.
- **Tipografía: 18 tamaños arbitrarios en px** donde 5-6 harían el mismo trabajo — `BitacoraClient.js` por sí solo usa seis variantes (10 / 10.5 / 11 / 11.5 / 12 / 12.5px) para lo que visualmente son 2-3 roles (label, body secundario, dato).
- **`Sidebar.js` reimplementa a mano 14 iconos** que ya existen en `lucide-react` (dependencia ya usada en otros 21 archivos), y varios formularios duplican `Eye`/`EyeOff`/chevrons de lucide como SVG inline en vez de importarlos.
- **`Sidebar.js` reimplementa su propio modal de confirmación de logout** en vez de reusar el componente `ConfirmDialog` ya existente en `src/components/ui/ConfirmDialog.js`, duplicando markup y divergiendo en z-index (`z-[100]` vs `z-[60]`).
- **El `inputCls` compartido (idéntico en 5 archivos) es el mejor ejemplo de patrón bien resuelto** — pero `login/page.js` y el buscador de `BitacoraClient.js` usan un focus cian (`#2EB5D4`) en vez del rojo de marca del resto del formulario admin, rompiendo la única regla de focus-state que sí está bien establecida.
- **El panel admin (px arbitrarios) y el sitio público de marketing (clases nombradas `text-sm/text-2xl` + navy `#0B2656` propio) son, en la práctica, dos sistemas de diseño paralelos** que comparten muy poco vocabulario visual — vale la pena decidir explícitamente si el rediseño en Figma los unifica o los trata como dos librerías de componentes separadas.
