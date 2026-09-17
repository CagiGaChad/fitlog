# FitLog

App personal de macros y entrenamientos. Next.js (App Router) + TypeScript +
Tailwind, exportada como sitio estático y publicada en GitHub Pages —
instálala en tu iPhone como PWA.

## Qué incluye

- **Hoy**: resumen de macros del día vs tu objetivo, y el entreno programado
  — si el día tiene ejercicios, aparecen como checklist individual.
- **Comidas**: busca alimentos en Open Food Facts (base pública gratuita),
  escanea el código de barras con la cámara, crea tus propios alimentos
  frecuentes, marca favoritos con la estrella, y ve tus alimentos recientes
  sin rebuscar. Registra cantidades por comida (desayuno/comida/merienda/
  cena).
- **Entrenos**: plantilla semanal simple (día + nombre + notas), con una
  lista opcional de ejercicios (uno por línea). Se repite cada semana.
- **Progreso**: registro de peso corporal con gráfica de evolución,
  historial de calorías de los últimos 14 días vs tu objetivo, y una racha
  de los últimos 28 días de entreno (completo/parcial/nada) con el detalle
  de qué ejercicios hiciste cada día.
- **Ajustes**: tus datos (peso, altura, edad, sexo, actividad, objetivo) →
  calcula calorías y macros automáticamente (fórmula Mifflin-St Jeor), y
  puedes ajustarlos a mano si quieres afinar. Copia de seguridad
  exportar/importar en JSON.

Todos tus datos se guardan **solo en tu navegador** (localStorage). No hay
servidor, no hay cuenta, no se envía nada a ningún sitio excepto la
búsqueda de alimentos a Open Food Facts.

## Desarrollo local

```
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Build y despliegue

Se despliega como export estático en GitHub Pages
(`cagigachad.github.io/fitlog`) mediante el workflow de
`.github/workflows/deploy.yml`: cada push a `master` compila con
`npm run build` (genera la carpeta `out/`) y lo publica automáticamente.

Para generar el export a mano:

```
npm run build
```

## Instalar en el iPhone

1. Abre la URL desplegada en **Safari** (tiene que ser Safari, no Chrome).
2. Toca el icono de compartir (el cuadrado con la flecha hacia arriba).
3. "Añadir a pantalla de inicio".
4. Listo: te queda un icono como cualquier app, se abre a pantalla completa
   y funciona sin conexión (excepto la búsqueda de alimentos nuevos, que
   necesita internet).

## Sobre Garmin Connect

De momento no está incluido (lo dejamos para más adelante, como acordamos).
Cuando quieras retomarlo, las dos vías realistas son:
- Programa oficial de desarrolladores de Garmin (requiere solicitud y
  aprobación, pensado para empresas/partners).
- Librería no oficial que emula el login de la app — funciona, pero
  necesita un servidor propio (esto ya no es un export estático) y guardar
  tus credenciales de Garmin ahí.

## Estructura del proyecto

```
app/
  page.tsx           Pestaña "Hoy"
  comidas/page.tsx    Pestaña "Comidas"
  entrenos/page.tsx   Pestaña "Entrenos"
  progreso/page.tsx   Pestaña "Progreso"
  ajustes/page.tsx    Pestaña "Ajustes"
  layout.tsx          Layout raíz (fuentes, tab bar, service worker)
  manifest.ts          Manifest de la PWA
components/           UI compartida (Card, MacroBar, TabBar, Modal, iconos, gráficas)
lib/
  storage.ts           Lectura/escritura en localStorage (mismas claves que la versión anterior)
  macros.ts            Cálculo de TMB/TDEE/objetivos de macros
  foodApi.ts            Búsqueda en Open Food Facts
  barcodeScanner.ts     Escaneo de código de barras (@zxing/browser)
  state.ts              Helpers de estado compartido
public/
  sw.js                 Service worker (cache runtime, offline)
  icons/                Iconos de la app
```
