# 📚 Librarium - Gestor de Lecturas y Estadísticas

Una aplicación web moderna, elegante y responsive para llevar el seguimiento de tus lecturas personales, ver tus libros leídos en periodos de tiempo personalizados, registrar portadas automáticamente mediante **Google Books API** y analizar tu progreso con un **Dashboard de estadísticas completo**.

---

## ✨ Características Principales

1. **Búsqueda Automática de Libros (Google Books API)**:
   - Busca cualquier libro por título, autor o ISBN.
   - Consulta Google Books, Open Library e Internet Archive para encontrar ediciones, portadas, ISBN y metadatos bibliográficos.

2. **Registro Manual de Fechas y Progreso**:
   - Introduce manualmente la **fecha de inicio** y la **fecha de fin de lectura**.
   - Calcula automáticamente la duración de lectura (ej. *17 días*).
   - Marca libros como **Terminado (Leído)**, **En Lectura** (con registro de página actual y barra de progreso) o **Por Leer**.

3. **Valoraciones y Reseñas Personales**:
   - Puntuación interactiva de 1 a 5 estrellas.
   - Espacio para notas, citas favoritas y reflexiones personales sobre cada libro.

4. **Filtro Avanzado por Periodos de Tiempo**:
   - Filtra fácilmente tus lecturas por:
     - **Este año** (año en curso).
     - **Este mes**.
     - **Año específico** (selector desplegable con los años de tus lecturas).
     - **Rango personalizado** (elige fecha inicio y fecha fin exactas).
     - **Historial completo**.

5. **Dashboard de Estadísticas**:
   - **Reto de Lectura Anual**: Configura tu meta de libros al año (ej. 20 libros) y sigue tu progreso en tiempo real con barra de porcentaje y felicitaciones.
   - **Métricas clave**: Total de libros leídos, total de páginas leídas, ritmo de lectura (días promedio por libro) y valoración media.
   - **Gráficos interactivos**:
     - Lecturas por mes (gráfico de barras de libros y páginas leídas).
     - Distribución de valoraciones (cuántos libros tienen 5★, 4★, 3★...).

6. **Almacenamiento Híbrido (Local + Supabase)**:
   - **Modo Local (por defecto)**: Funciona al instante en tu navegador sin necesidad de crear cuentas ni configurar nada (incluye libros de ejemplo para probar la app de inmediato).
   - **Base compartida de Librarium**: el administrador configura una única instancia de Supabase para la aplicación. Cada lector crea solo su cuenta de usuario y sus libros quedan aislados mediante **Row Level Security (RLS)**. No debe crear un proyecto Supabase ni introducir claves.
   - **Acceso**: registro con correo y contraseña. Se acepta cualquier dirección, incluidas Gmail y Hotmail.
   - **Copia de seguridad**: Exporta e importa tus lecturas en formato JSON en cualquier momento con un solo clic.

---

## 🚀 Cómo ejecutar la aplicación

En la terminal de la carpeta del proyecto, ejecuta:

```bash
# Iniciar el servidor de desarrollo
npm run dev
```

Abre tu navegador en la URL que aparecerá en pantalla (por defecto `http://localhost:5173`).

Para compilar la aplicación para producción:

```bash
npm run build
```

---

## ☁️ Configuración de la instancia compartida de Supabase (administrador)

La aplicación usa una instancia única de Supabase para todos los usuarios. El administrador configura sus credenciales en el despliegue; los usuarios finales no crean proyectos Supabase.

1. Configura una única instancia de Supabase y ejecuta **todo** `supabase_schema.sql`, también al actualizar una instancia existente. Incluye las columnas de edición y sesiones, `reading_goals`, las políticas RLS y `replace_my_library`. Vercel no aplica este SQL automáticamente. Antes de publicar, comprueba con una cuenta de prueba que puedes guardar un libro, cambiar el objetivo e importar una copia de seguridad.
2. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel para Production y Preview, después vuelve a desplegar: Vite incorpora estos valores durante la compilación. Usa únicamente la clave pública anon/publishable, nunca service_role ni claves secretas. Para Preview utiliza una instancia de prueba con el mismo esquema. La compilación en Vercel falla si falta alguna variable; en local puedes omitir ambas para usar almacenamiento local.
3. En **Authentication > URL Configuration**, añade los dominios de producción y preview de Vercel a los redirect URLs permitidos (por ejemplo, `https://tu-app.vercel.app/**`).
4. Configura **Site URL** con la URL de producción y permite sus dominios en las URLs de redirección para los correos de confirmación.
5. Los lectores pueden crear una cuenta con cualquier correo y contraseña. Gmail y Hotmail funcionan como direcciones de correo normales.

---

## 🛠️ Tecnologías Utilizadas

- **React 19** + **TypeScript**
- **Vite 6**
- **Tailwind CSS v4**
- **Lucide Icons** (iconografía limpia y moderna)
- **Recharts** (gráficos interactivos para el dashboard)
- **Canvas Confetti** (celebración de metas anuales)
- **Google Books API**, **Open Library Search API** e **Internet Archive Advanced Search API**
- **Supabase JS** (autenticación y base de datos PostgreSQL en la nube)
