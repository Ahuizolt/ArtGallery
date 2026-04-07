# Art Gallery — Aplicación de Autenticación

Aplicación web fullstack con sistema de autenticación JWT. Incluye registro, login, protección de rutas y renovación automática de sesión.

---

## Tecnologías

**Backend**
- Node.js + Express
- MySQL + Sequelize ORM
- Sequelize CLI — migraciones y seeders
- JSON Web Tokens (JWT) — access token (15min) + refresh token (7d)
- bcryptjs para hash de contraseñas
- express-validator para validación de inputs
- Jest + Supertest + SQLite (tests en memoria)

**Frontend**
- React 18 + Vite
- React Router DOM v6
- Context API para manejo de estado de autenticación
- Vitest + Testing Library para tests

---

## Estructura del proyecto

```
/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Configuración Sequelize (dev/test/prod)
│   │   ├── controllers/
│   │   │   └── auth.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js   # Verificación JWT
│   │   ├── migrations/
│   │   │   └── 20240101000001-create-users.js
│   │   ├── models/
│   │   │   ├── index.js             # Instancia Sequelize
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   └── auth.routes.js
│   │   ├── seeders/
│   │   │   └── 20240101000001-demo-users.js
│   │   ├── services/
│   │   │   └── auth.service.js
│   │   ├── validators/
│   │   │   └── auth.validator.js
│   │   └── __tests__/
│   │       └── auth.test.js
│   ├── .env.example
│   ├── .sequelizerc                 # Rutas para Sequelize CLI
│   ├── package.json
│   └── server.js
└── frontend/
    └── src/
        ├── components/   # LoginForm, RegisterForm
        ├── pages/        # Dashboard
        ├── context/      # AuthContext
        ├── hooks/        # useAuth
        └── services/     # authApi
```

---

## Despliegue local

### Requisitos previos

- Node.js >= 18
- MySQL corriendo localmente (o una instancia remota)

---

### 1. Backend

```bash
cd backend
npm install
```

Crea el archivo de variables de entorno:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=artgallery
DB_USER=root
DB_PASSWORD=tu_password_aqui

JWT_ACCESS_SECRET=tu_secreto_de_acceso
JWT_REFRESH_SECRET=tu_secreto_de_refresco
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Crea la base de datos en MySQL:

```sql
CREATE DATABASE artgallery;
```

Ejecuta las migraciones y seeders:

```bash
npm run db:migrate      # Crea las tablas
npm run db:seed         # Inserta usuarios de prueba
```

Inicia el servidor:

```bash
npm run dev     # Desarrollo con nodemon
npm start       # Producción
```

El backend queda disponible en `http://localhost:5000`.

---

### 2. Frontend

```bash
cd frontend
npm install
```

Crea el archivo de variables de entorno:

```bash
cp .env.example .env
```

Edita `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

---

## Migraciones y Seeders

| Comando | Descripción |
|---------|-------------|
| `npm run db:migrate` | Ejecuta todas las migraciones pendientes |
| `npm run db:migrate:undo` | Revierte la última migración |
| `npm run db:seed` | Inserta los datos de prueba |
| `npm run db:seed:undo` | Elimina los datos de prueba |
| `npm run db:reset` | Revierte todo, migra y siembra de nuevo |

### Usuarios de prueba (seeders)

| Usuario | Email | Password |
|---------|-------|----------|
| admin | admin@artgallery.com | password123 |
| demo_user | demo@artgallery.com | password123 |

---

## Cómo funciona

### Flujo de autenticación

1. **Registro** — El usuario envía `username`, `email` y `password`. El backend valida los datos, hashea la contraseña con bcrypt y guarda el usuario en MySQL.

2. **Login** — El usuario envía `email` y `password`. Si las credenciales son válidas, el backend devuelve un `access_token` (JWT de 15 min) y un `refresh_token` (JWT de 7 días).

3. **Sesión persistente** — El `refresh_token` se almacena en `localStorage`. Al recargar la app, el `AuthContext` lo usa automáticamente para obtener un nuevo `access_token`.

4. **Rutas protegidas** — El componente `ProtectedRoute` verifica `isAuthenticated`. Si no hay sesión activa, redirige a `/login`.

5. **Logout** — Elimina el `refresh_token` del `localStorage` y limpia el estado de autenticación.

### Endpoints del API

**Auth**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Registrar nuevo usuario |
| POST | `/auth/login` | No | Iniciar sesión |
| POST | `/auth/refresh` | No | Renovar access token |

**Imágenes**

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/images` | Sí | Subir imagen (`multipart/form-data`) |
| GET | `/images/my` | Sí | Obtener mis imágenes |
| PATCH | `/images/:id` | Sí | Actualizar título, descripción o visibilidad |
| DELETE | `/images/:id` | Sí | Eliminar imagen |
| GET | `/images/gallery` | No | Galería pública de todos los usuarios |
| GET | `/uploads/:filename` | No | Servir archivo de imagen |

**Campos para subir imagen (`POST /images`)**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `image` | file | Sí | Archivo de imagen (jpg, png, webp, gif — máx 5MB) |
| `title` | string | No | Título de la imagen |
| `description` | string | No | Descripción |
| `is_public` | boolean | No | Si `true`, aparece en la galería pública |

---

## Tests

Los tests del backend usan SQLite en memoria, no requieren MySQL instalado.

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```
