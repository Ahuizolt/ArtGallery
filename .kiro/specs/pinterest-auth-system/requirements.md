# Requirements Document

## Introduction

Sistema de autenticación completo para una aplicación web tipo Pinterest. Incluye registro e inicio de sesión de usuarios con JWT, encriptación de contraseñas con bcrypt, protección de rutas en el backend (Node.js/Express/MongoDB) y formularios en el frontend (React) con manejo de estado, almacenamiento del token y redirección post-login.

## Glossary

- **Auth_Service**: Módulo backend responsable del registro, login y generación de tokens JWT.
- **User_Model**: Esquema de MongoDB que representa a un usuario con campos username, email y password encriptada.
- **Access_Token**: JSON Web Token de corta duración (15 minutos a 1 hora) generado al autenticarse, usado para autorizar acceso a rutas protegidas.
- **Refresh_Token**: Token de larga duración (7 días) generado al autenticarse, usado exclusivamente para obtener nuevos Access_Token sin requerir credenciales.
- **JWT_Token**: Término genérico para referirse a Access_Token o Refresh_Token según el contexto.
- **Auth_Middleware**: Middleware de Express que valida el Access_Token en rutas protegidas.
- **Register_Form**: Componente React que presenta el formulario de registro al usuario.
- **Login_Form**: Componente React que presenta el formulario de inicio de sesión al usuario.
- **Auth_State**: Estado global de autenticación gestionado con useState en React.
- **Input_Validator**: Módulo que valida los campos de entrada antes de procesarlos.

## Requirements

### Requirement 1: Registro de usuario

**User Story:** Como visitante, quiero registrarme con username, email y contraseña, para poder acceder a la aplicación.

#### Acceptance Criteria

1. WHEN el endpoint POST /auth/register recibe username, email y password válidos, THE Auth_Service SHALL crear un nuevo documento en User_Model con la password encriptada mediante bcrypt (salt rounds >= 10).
2. WHEN el endpoint POST /auth/register es invocado, THE Input_Validator SHALL verificar que username, email y password están presentes y que email tiene formato válido.
3. IF el email ya existe en la base de datos, THEN THE Auth_Service SHALL retornar un error HTTP 409 con el mensaje "El email ya está registrado".
4. IF algún campo requerido está ausente o inválido, THEN THE Auth_Service SHALL retornar un error HTTP 400 con un mensaje descriptivo del campo fallido.
5. WHEN el registro es exitoso, THE Auth_Service SHALL retornar HTTP 201 con un objeto JSON que contenga el campo message confirmando la creación.

### Requirement 2: Inicio de sesión

**User Story:** Como usuario registrado, quiero iniciar sesión con email y contraseña, para obtener acceso autenticado a la aplicación.

#### Acceptance Criteria

1. WHEN el endpoint POST /auth/login recibe email y password, THE Auth_Service SHALL buscar el usuario en User_Model por email.
2. IF el email no existe en la base de datos, THEN THE Auth_Service SHALL retornar HTTP 401 con el mensaje "Credenciales inválidas".
3. WHEN el usuario es encontrado, THE Auth_Service SHALL comparar la password recibida con el hash almacenado usando bcrypt.compare.
4. IF la comparación de password falla, THEN THE Auth_Service SHALL retornar HTTP 401 con el mensaje "Credenciales inválidas".
5. WHEN las credenciales son válidas, THE Auth_Service SHALL generar un Access_Token firmado con el userId como payload y una expiración de entre 15 minutos y 1 hora.
6. WHEN las credenciales son válidas, THE Auth_Service SHALL generar un Refresh_Token firmado con el userId como payload y una expiración de 7 días.
7. WHEN ambos tokens son generados, THE Auth_Service SHALL retornar HTTP 200 con un objeto JSON que contenga los campos access_token y refresh_token.

### Requirement 3: Renovación de Access Token

**User Story:** Como usuario autenticado, quiero que mi sesión se renueve automáticamente usando un refresh token, para no tener que volver a iniciar sesión cada vez que el access token expira.

#### Acceptance Criteria

1. WHEN el endpoint POST /auth/refresh recibe un Refresh_Token válido en el body, THE Auth_Service SHALL verificar su firma y expiración usando la clave secreta JWT.
2. IF el Refresh_Token está ausente en el body, THEN THE Auth_Service SHALL retornar HTTP 400 con el mensaje "Refresh token requerido".
3. IF el Refresh_Token es inválido o ha expirado, THEN THE Auth_Service SHALL retornar HTTP 401 con el mensaje "Refresh token inválido o expirado".
4. WHEN el Refresh_Token es válido, THE Auth_Service SHALL generar un nuevo Access_Token firmado con el userId como payload y una expiración de entre 15 minutos y 1 hora.
5. WHEN el nuevo Access_Token es generado, THE Auth_Service SHALL retornar HTTP 200 con un objeto JSON que contenga el campo access_token.

### Requirement 4: Protección de rutas con middleware

**User Story:** Como desarrollador, quiero proteger rutas privadas con un middleware JWT, para que solo usuarios autenticados puedan acceder a ellas.

#### Acceptance Criteria

1. WHEN una petición llega a una ruta protegida, THE Auth_Middleware SHALL leer el header Authorization con formato "Bearer <access_token>".
2. IF el header Authorization está ausente o no tiene formato Bearer, THEN THE Auth_Middleware SHALL retornar HTTP 401 con el mensaje "Token no proporcionado".
3. WHEN el Access_Token es extraído, THE Auth_Middleware SHALL verificar su firma y expiración usando la clave secreta JWT.
4. IF el Access_Token es inválido o ha expirado, THEN THE Auth_Middleware SHALL retornar HTTP 401 con el mensaje "Token inválido o expirado".
5. WHEN el Access_Token es válido, THE Auth_Middleware SHALL adjuntar el userId decodificado al objeto request y llamar a next().

### Requirement 5: Modelo de usuario

**User Story:** Como desarrollador, quiero un modelo de usuario bien definido en MongoDB, para almacenar los datos de autenticación de forma segura y consistente.

#### Acceptance Criteria

1. THE User_Model SHALL definir los campos username (String, requerido, único), email (String, requerido, único) y password (String, requerido).
2. THE User_Model SHALL incluir timestamps automáticos (createdAt, updatedAt).
3. WHEN se almacena un documento en User_Model, THE User_Model SHALL garantizar que el campo password contiene únicamente el hash bcrypt, nunca la contraseña en texto plano.

### Requirement 6: Formulario de registro (Frontend)

**User Story:** Como visitante, quiero un formulario de registro en React, para poder crear mi cuenta desde la interfaz web.

#### Acceptance Criteria

1. THE Register_Form SHALL renderizar campos de entrada para username, email y password.
2. WHEN el usuario envía el formulario, THE Register_Form SHALL invocar POST /auth/register con los valores del formulario.
3. IF la respuesta del servidor es un error, THEN THE Register_Form SHALL mostrar el mensaje de error retornado por el servidor en la interfaz.
4. WHEN el registro es exitoso, THE Register_Form SHALL redirigir al usuario a la ruta /login.
5. WHILE la petición está en curso, THE Register_Form SHALL deshabilitar el botón de envío para evitar envíos duplicados.

### Requirement 7: Formulario de inicio de sesión (Frontend)

**User Story:** Como usuario registrado, quiero un formulario de login en React, para iniciar sesión y acceder a la aplicación.

#### Acceptance Criteria

1. THE Login_Form SHALL renderizar campos de entrada para email y password.
2. WHEN el usuario envía el formulario, THE Login_Form SHALL invocar POST /auth/login con los valores del formulario.
3. WHEN la respuesta contiene los tokens, THE Login_Form SHALL almacenar el Access_Token en memoria (estado de la aplicación) y el Refresh_Token en localStorage bajo la clave "refresh_token".
4. WHEN los tokens son almacenados, THE Login_Form SHALL actualizar Auth_State con el estado autenticado y redirigir al usuario a la ruta /dashboard.
5. IF la respuesta del servidor es un error, THEN THE Login_Form SHALL mostrar el mensaje de error en la interfaz sin limpiar los campos.
6. WHILE la petición está en curso, THE Login_Form SHALL deshabilitar el botón de envío para evitar envíos duplicados.

### Requirement 8: Manejo de estado de autenticación (Frontend)

**User Story:** Como usuario, quiero que la aplicación recuerde mi sesión activa, para no tener que iniciar sesión cada vez que recargo la página.

#### Acceptance Criteria

1. WHEN la aplicación se inicializa, THE Auth_State SHALL leer localStorage para verificar si existe un Refresh_Token previo y, si existe, solicitar un nuevo Access_Token al endpoint POST /auth/refresh antes de establecer el estado autenticado.
2. WHEN el usuario cierra sesión, THE Auth_State SHALL eliminar el Refresh_Token de localStorage, descartar el Access_Token en memoria y restablecer el estado a no autenticado.
3. WHILE el usuario está autenticado, THE Auth_State SHALL proveer el Access_Token a los componentes que realizan peticiones a rutas protegidas.
4. WHEN el Access_Token expira durante una sesión activa, THE Auth_State SHALL usar el Refresh_Token almacenado para invocar POST /auth/refresh y obtener un nuevo Access_Token sin interrumpir la sesión del usuario.
5. IF el Refresh_Token ha expirado o es inválido al intentar renovar el Access_Token, THEN THE Auth_State SHALL eliminar el Refresh_Token de localStorage y restablecer el estado a no autenticado.

### Requirement 9: Validación de inputs

**User Story:** Como desarrollador, quiero que todos los inputs sean validados tanto en frontend como en backend, para garantizar la integridad de los datos y la seguridad del sistema.

#### Acceptance Criteria

1. THE Input_Validator SHALL verificar que el campo email cumple el formato RFC 5322 antes de procesar cualquier petición de registro o login.
2. THE Input_Validator SHALL verificar que el campo password tiene una longitud mínima de 6 caracteres.
3. THE Input_Validator SHALL verificar que el campo username tiene entre 3 y 30 caracteres.
4. IF alguna validación falla en el frontend, THEN THE Register_Form o THE Login_Form SHALL mostrar el mensaje de error correspondiente sin enviar la petición al servidor.
5. IF alguna validación falla en el backend, THEN THE Input_Validator SHALL retornar HTTP 400 con un mensaje que identifique el campo y el motivo del fallo.
