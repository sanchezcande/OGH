# Automation & Process Improvement Blog | OpenGateHub

Este proyecto es una plataforma de blog moderna con un sistema de gestión de contenidos (CMS) integrado, optimizada para SEO y diseñada para un rendimiento máximo con Next.js, Prisma y MySQL.

## 🛠️ Comandos de Base de Datos

Para facilitar el desarrollo local y el despliegue, se han incluido scripts específicos para la gestión de la base de datos:

- `npm run db:setup`: **Comando recomendado para nuevas instalaciones.** Sincroniza el esquema de Prisma con tu base de datos y carga los artículos iniciales (seed) en español e inglés.
- `npm run db:push`: Sincroniza los cambios en `schema.prisma` con la base de datos sin necesidad de migraciones manuales.
- `npm run db:seed`: Carga o actualiza los artículos del blog desde los archivos JSON de traducciones.
- `npm run db:studio`: Abre una interfaz web interactiva (`localhost:5555`) para explorar y editar los datos de la base de datos de forma visual.

## 🚀 Guía de Despliegue en Vercel

### 1. Variables de Entorno
Debes configurar las siguientes variables en el panel de Vercel (**Project Settings > Environment Variables**):

| Variable | Descripción | Ejemplo / Observación |
| :--- | :--- | :--- |
| `DATABASE_URL` | Conexión a la DB de producción | `mysql://user:pass@host:port/dbname` |
| `ADMIN_PASSWORD` | Contraseña para acceder al CMS | Una clave segura de tu elección |
| `JWT_SECRET` | Secreto para firmar sesiones | Una cadena larga y aleatoria |
| `BLOB_READ_WRITE_TOKEN` | Token para gestión de imágenes | Se genera al crear el Storage en Vercel |

### 2. Pasos para el Despliegue Inicial
1. **Provisionar Base de Datos:** Crea tu base de datos MySQL/PostgreSQL.
2. **Conectar Vercel Blob:** En la pestaña **Storage** de Vercel, crea un nuevo **Blob store**.
3. **Sincronizar DB:** Antes del primer despliegue, ejecuta `npx prisma db push` apuntando a la URL de producción para crear las tablas.
4. **Cargar Datos:** Ejecuta `node scripts/seed-blog.js` (asegurándote de que `DATABASE_URL` apunte a producción) para cargar los posts iniciales.

## 📁 Estructura del Blog

- `/blog`: Listado público con paginación y filtros.
- `/admin/login`: Acceso seguro para administradores.
- `/admin/new-post`: Formulario para crear o editar artículos con subida de imágenes.

## 📖 Otros Comandos

- `npm run dev`: Inicia el servidor de desarrollo en `localhost:3000`.
- `npm run build`: Genera la versión de producción optimizada.
- `npm run generate-sitemap`: Actualiza el sitemap para motores de búsqueda.
