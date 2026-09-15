# FitLog

App personal de macros y entrenamientos. Es una web estática (sin build, sin
Node, sin dependencias) que instalas en tu iPhone como PWA.

## Qué incluye

- **Hoy**: resumen de macros del día vs tu objetivo, y el entreno programado
  — si el día tiene ejercicios, aparecen como checklist individual.
- **Comidas**: busca alimentos en Open Food Facts (base pública gratuita),
  crea tus propios alimentos frecuentes (se guardan en el teléfono), marca
  favoritos con la estrella, y ve tus alimentos recientes sin rebuscar.
  Registra cantidades por comida (desayuno/comida/merienda/cena).
- **Entrenos**: plantilla semanal simple (día + nombre + notas), con una
  lista opcional de ejercicios (uno por línea). Se repite cada semana.
- **Progreso**: registro de peso corporal con gráfica de evolución,
  historial de calorías de los últimos 14 días vs tu objetivo, y una racha
  de los últimos 28 días de entreno (completo/parcial/nada) con el detalle
  de qué ejercicios hiciste cada día.
- **Ajustes**: tus datos (peso, altura, edad, sexo, actividad, objetivo) →
  calcula calorías y macros automáticamente (fórmula Mifflin-St Jeor), y
  puedes ajustarlos a mano si quieres afinar.

Todos tus datos se guardan **solo en tu iPhone** (localStorage del
navegador). No hay servidor, no hay cuenta, no se envía nada a ningún sitio
excepto la búsqueda de alimentos a Open Food Facts.

## Desplegar (elige uno, los tres son gratis)

### Vercel
1. Crea un repo nuevo en GitHub y sube esta carpeta (o usa `vercel` CLI
   directamente sobre la carpeta).
2. En vercel.com → "Add New Project" → importa el repo.
3. Framework preset: **Other** (no hay build). Build command: vacío. Output
   directory: `.` (la raíz).
4. Deploy. Te da una URL tipo `fitlog-tuusuario.vercel.app`.

### Netlify
1. netlify.com → "Add new site" → "Deploy manually" → arrastra esta carpeta
   completa (o conecta el repo de GitHub).
2. No hace falta build command ni carpeta de publicación especial (deja la
   raíz).

### GitHub Pages
1. Sube esta carpeta a un repo de GitHub.
2. Settings → Pages → Deploy from branch → rama `main`, carpeta `/root`.
3. Te da una URL tipo `tuusuario.github.io/fitlog`.

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
  necesita un servidor propio (esto ya no es una web estática) y guardar tus
  credenciales de Garmin ahí.

## Estructura del proyecto

```
index.html          Punto de entrada
styles.css           Estilos (una sola hoja, con variables de color)
manifest.json        Configuración de la PWA (icono, nombre, colores)
sw.js                Service worker (cache offline del "shell" de la app)
icons/               Iconos de la app
js/
  app.js             Navegación entre pestañas
  storage.js         Lectura/escritura en localStorage
  macros.js          Cálculo de TMB/TDEE/objetivos de macros
  foodApi.js         Búsqueda en Open Food Facts
  state.js           Helpers de estado compartido
  views/
    today.js         Pestaña "Hoy"
    comidas.js        Pestaña "Comidas"
    entrenos.js       Pestaña "Entrenos"
    progreso.js       Pestaña "Progreso"
    ajustes.js        Pestaña "Ajustes"
```

No hay build ni dependencias que instalar — es HTML/CSS/JS puro con módulos
ES nativos del navegador, así que cualquiera de los tres despliegues de
arriba funciona subiendo la carpeta tal cual.
