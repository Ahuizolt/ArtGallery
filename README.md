# ArtGallery — Documentación del Proyecto

Aplicación web tipo Pinterest para gestión y descubrimiento de imágenes. Los usuarios pueden registrarse, subir imágenes, organizarlas en tableros personales y explorar la galería pública de la comunidad.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| Base de datos | MySQL + Sequelize ORM |
| Autenticación | JWT (Access Token + Refresh Token) |
| Subida de archivos | Multer |
| Estilos | CSS puro (sin frameworks) |

---

## Estructura del proyecto

```
proyecto/
├── frontend/          # Aplicación React (Vite)
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── context/       # Estado global (AuthContext)
│   │   ├── hooks/         # Hooks personalizados
│   │   └── services/      # Llamadas a la API
│   └── index.html
│
└── backend/           # API REST (Express)
    └── src/
        ├── routes/        # Definición de endpoints
        ├── controllers/   # Lógica de cada endpoint
        ├── services/      # Lógica de negocio
        ├── models/        # Modelos Sequelize (MySQL)
        ├── middleware/    # Auth middleware, upload
        ├── validators/    # Validación de inputs
        ├── migrations/    # Migraciones de base de datos
        └── seeders/       # Datos de prueba
```

---

## Instalación y arranque

### Requisitos previos
- Node.js 18+
- MySQL corriendo localmente

### Backend

```bash
cd backend
npm install
```

Crea el archivo `.env` basándote en `.env.example`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=artgallery
DB_USER=root
DB_PASSWORD=tu_password
JWT_ACCESS_SECRET=secreto_access
JWT_REFRESH_SECRET=secreto_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Corre las migraciones para crear las tablas:

```bash
npx sequelize-cli db:migrate
```

Arranca el servidor:

```bash
npm run dev
```

El backend corre en `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
```

Crea el archivo `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Arranca Vite:

```bash
npm run dev
```

El frontend corre en `http://localhost:5173`.

---

## Backend — Explicación detallada

### `src/app.js`
Configura la aplicación Express:
- Habilita CORS para permitir peticiones desde el frontend
- Parsea el body como JSON
- Sirve la carpeta `uploads/` como archivos estáticos (las imágenes subidas)
- Registra las tres rutas principales: `/auth`, `/images`, `/boards`

### `src/server.js`
Punto de entrada. Conecta a MySQL usando Sequelize y arranca el servidor HTTP en el puerto configurado.

---

### Autenticación — `/auth`

#### `routes/auth.routes.js`
Define tres endpoints:
- `POST /auth/register` — registro de usuario (pasa por validadores antes del controller)
- `POST /auth/login` — inicio de sesión
- `POST /auth/refresh` — renovar el access token usando el refresh token

#### `controllers/auth.controller.js`
Recibe las peticiones HTTP, delega la lógica al service y devuelve la respuesta JSON con el código HTTP correcto.

#### `services/auth.service.js`
Contiene toda la lógica de negocio de autenticación:

- **`createUser(username, email, password)`** — verifica que el email no exista, hashea la contraseña con bcrypt (10 salt rounds) y crea el usuario en MySQL.
- **`loginUser(email, password)`** — busca el usuario por email, compara la contraseña con `bcrypt.compare`, y si es correcta genera dos tokens JWT.
- **`generateAccessToken(userId)`** — genera un JWT de corta duración (15 minutos por defecto) firmado con `JWT_ACCESS_SECRET`.
- **`generateRefreshToken(userId)`** — genera un JWT de larga duración (7 días) firmado con `JWT_REFRESH_SECRET`.
- **`refreshToken(token)`** — verifica el refresh token y genera un nuevo access token.

#### `validators/auth.validator.js`
Usa `express-validator` para validar los inputs antes de llegar al controller:
- `username`: entre 3 y 30 caracteres
- `email`: formato RFC 5322 válido
- `password`: mínimo 6 caracteres

#### `middleware/auth.middleware.js`
Middleware que protege rutas privadas:
1. Lee el header `Authorization: Bearer <token>`
2. Verifica el token con `jwt.verify`
3. Si es válido, adjunta `req.userId` y llama a `next()`
4. Si no, retorna HTTP 401

---

### Imágenes — `/images`

#### `routes/image.routes.js`
- `GET /images/gallery` — **pública**, no requiere autenticación. Devuelve todas las imágenes marcadas como públicas.
- `POST /images` — **protegida**. Sube una imagen usando Multer (multipart/form-data).
- `GET /images/my` — **protegida**. Devuelve las imágenes del usuario autenticado.
- `PATCH /images/:id` — **protegida**. Actualiza título, descripción o visibilidad de una imagen.
- `DELETE /images/:id` — **protegida**. Elimina la imagen de la base de datos y del disco.

#### `services/image.service.js`
- **`saveImage`** — guarda los metadatos de la imagen en MySQL (filename, título, descripción, visibilidad).
- **`getPublicImages`** — obtiene imágenes públicas con JOIN al modelo User para incluir el username del autor.
- **`getMyImages`** — obtiene las imágenes del usuario ordenadas por fecha.
- **`updateImage`** — actualiza campos de una imagen verificando que pertenece al usuario.
- **`deleteImage`** — elimina el registro de MySQL y el archivo físico del disco.

#### `middleware/upload.middleware.js`
Configura Multer para:
- Guardar archivos en la carpeta `uploads/`
- Generar nombres únicos con hash MD5
- Aceptar solo tipos de imagen (JPG, PNG, WEBP, GIF, SVG, BMP, AVIF)
- Limitar el tamaño a 5MB

---

### Tableros — `/boards`

Todas las rutas requieren autenticación.

#### `routes/board.routes.js`
- `GET /boards` — lista los tableros del usuario con conteo de imágenes
- `POST /boards` — crea un nuevo tablero
- `GET /boards/:boardId/images` — obtiene las imágenes de un tablero
- `POST /boards/:boardId/images` — guarda una imagen en un tablero
- `DELETE /boards/:boardId` — elimina un tablero

#### `services/board.service.js`
- **`getMyBoards(userId)`** — consulta SQL con LEFT JOIN para obtener tableros y conteo de imágenes.
- **`createBoard(userId, name)`** — inserta un nuevo tablero validando que el nombre no esté vacío.
- **`saveImageToBoard(boardId, imageId, userId)`** — verifica que el tablero pertenece al usuario y que la imagen existe, luego inserta en la tabla `board_images`. Maneja el error de duplicado (imagen ya guardada).
- **`getBoardImages(boardId, userId)`** — obtiene las imágenes de un tablero con JOIN.
- **`deleteBoard(boardId, userId)`** — elimina el tablero verificando propiedad.

---

## Frontend — Explicación detallada

### `src/main.jsx`
Punto de entrada de React. Monta la aplicación en el `div#root` del HTML.

### `src/App.jsx`
Define el sistema de rutas con React Router:
- `/` → redirige a `/login`
- `/login` → formulario de login
- `/register` → formulario de registro
- `/gallery` → galería pública (accesible sin login)
- `/dashboard` → tablero personal (ruta protegida, requiere login)
- `*` → redirige a `/`

El componente `ProtectedRoute` verifica `isAuthenticated` del contexto y redirige a `/login` si no hay sesión activa.

---

### `src/context/AuthContext.jsx`
Estado global de autenticación usando React Context + useState:

**Estado:**
- `accessToken` — token JWT de corta duración, guardado solo en memoria (no en localStorage)
- `isAuthenticated` — booleano que indica si hay sesión activa
- `loading` — true mientras se verifica la sesión al cargar la app

**Acciones:**
- `login(accessToken, refreshToken)` — guarda el refresh token en localStorage, el access token en memoria, y marca la sesión como activa
- `logout()` — elimina el refresh token de localStorage, limpia el access token en memoria
- `refreshAccessToken()` — llama a `POST /auth/refresh` con el refresh token almacenado para obtener un nuevo access token sin que el usuario tenga que volver a iniciar sesión

**Al montar la app:** lee localStorage, si hay refresh token llama a `refreshAccessToken()` para restaurar la sesión automáticamente.

### `src/hooks/useAuth.js`
Hook wrapper que consume `AuthContext`. Lanza error si se usa fuera del `AuthProvider`.

---

### `src/pages/Gallery.jsx`
Galería pública visible para todos:
- Carga imágenes públicas desde `GET /images/gallery`
- Muestra un grid masonry con skeleton loading
- Al clicar una imagen abre el `ImageViewer`
- Navbar con botones de login/registro (si no autenticado) o "Mi tablero" + logout (si autenticado)

### `src/pages/Dashboard.jsx`
Tablero personal del usuario autenticado:
- Dos pestañas: **Mis imágenes** y **Mis tableros**
- **Mis imágenes:** grid masonry con las imágenes propias, toggle público/privado, eliminar
- **Mis tableros:** lista de tableros expandibles. Al expandir carga las imágenes del tablero. Permite eliminar tableros.
- Modal de subida con drag & drop, título, descripción y toggle de visibilidad
- FAB flotante (+) para abrir el modal de subida rápidamente

---

### `src/components/ImageViewer.jsx`
Modal de vista expandida al clicar una imagen:
- **Zoom/Pan** usando la librería `react-zoom-pan-pinch` — rueda del ratón, pellizco en móvil, doble clic
- **Controles de zoom** flotantes (+, −, ↺)
- **Botón Guardar** (solo si autenticado) — abre panel para seleccionar tablero o crear uno nuevo
- **Botón Descargar** — descarga la imagen original
- **Navegación** entre imágenes con flechas o teclas ← →
- **Sidebar** con miniaturas de otras imágenes para navegar rápido
- Cierre con botón ✕ o tecla Escape

### `src/components/LoginForm.jsx`
Formulario de inicio de sesión:
- Validación frontend (email válido, password presente)
- Llama a `POST /auth/login`
- Guarda tokens en el contexto y redirige a `/gallery`
- Muestra errores del servidor sin limpiar los campos

### `src/components/RegisterForm.jsx`
Formulario de registro:
- Validación frontend (username 3-30 chars, email válido, password min 6 chars)
- Llama a `POST /auth/register`
- Redirige a `/login` en éxito

---

### `src/services/`

| Archivo | Descripción |
|---------|-------------|
| `authApi.js` | Funciones para `/auth/register`, `/auth/login`, `/auth/refresh` |
| `imageApi.js` | Funciones para subir, listar, actualizar y eliminar imágenes |
| `boardApi.js` | Funciones para crear tableros, listar, guardar imágenes y eliminar |

Todas usan `fetch` nativo y manejan errores leyendo el campo `error` del body de la respuesta.

---

## Base de datos — Tablas

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios registrados (username, email, password hash) |
| `images` | Imágenes subidas (filename, título, descripción, visibilidad, user_id) |
| `boards` | Tableros de usuario (name, user_id) |
| `board_images` | Relación muchos-a-muchos entre tableros e imágenes |

---

## Seguridad

- Las contraseñas se hashean con **bcrypt** (10 salt rounds), nunca se guardan en texto plano
- El **access token** (JWT) vive solo en memoria del frontend — no en localStorage ni cookies — para reducir riesgo XSS
- El **refresh token** se guarda en localStorage y se usa únicamente para renovar el access token
- Todas las rutas privadas del backend verifican el JWT antes de procesar la petición
- Los errores de credenciales devuelven siempre el mismo mensaje genérico para evitar enumeración de usuarios
- Multer valida el tipo MIME y limita el tamaño de archivos a 5MB

---

## Scripts disponibles

### Backend
```bash
npm run dev          # Arranca con nodemon (hot reload)
npm start            # Arranca sin hot reload
npm test             # Corre los tests con Jest
npx sequelize-cli db:migrate          # Aplica migraciones
npx sequelize-cli db:migrate:undo     # Revierte última migración
npx sequelize-cli db:seed:all         # Inserta datos de prueba
```

### Frontend
```bash
npm run dev          # Arranca Vite en modo desarrollo
npm run build        # Compila para producción
npm test             # Corre los tests con Vitest
```
