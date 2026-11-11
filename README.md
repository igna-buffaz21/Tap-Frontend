# Panel administrador

Base con React, TypeScript, Vite, Clerk y los componentes de shadcn/ui.

## Desarrollo

1. Instalá las dependencias con `npm install`.
2. Copiá `.env.example` a `.env` y configurá `VITE_CLERK_PUBLISHABLE_KEY` con la clave pública de tu aplicación de Clerk y `VITE_API_URL` con la URL del backend.
3. Ejecutá `npm run dev`.

## Estructura

- `src/modules/auth`: login con Clerk, estado de carga y protección de rutas.
- `src/modules/panel`: layout y sidebar oficial de shadcn (`sidebar-07`), con el contenido central vacío.
- `src/modules/tap`: pantalla pública de la aplicación, accesible en `/tap` sin iniciar sesión.
- `src/components/ui`: componentes compartidos de shadcn/ui.
- `src/config/app.routes.ts`: rutas de la aplicación.

`/login` muestra solamente el componente de inicio de sesión de Clerk. Al iniciar sesión se accede a `/panel`. El sidebar usa el bloque oficial `sidebar-07` de shadcn, con un menú Productos y accesos a Productos y Categorías. Cada producto incluye una acción Identificar para leer una etiqueta EPC. El menú de usuario permite cerrar la sesión de Clerk.

El panel requiere una sesión de Clerk y una cuenta activa validada mediante `GET /auth/me`, enviando `Authorization: Bearer <token de Clerk>`. La consulta no lleva body ni parámetros. Si el backend rechaza la cuenta o no está disponible, se muestra un error con opciones para reintentar o cerrar sesión. Los roles y permisos vacíos no bloquean el acceso. `/tap` permanece pública y no consulta este endpoint.

## Verificación

- `npm run lint`
- `npm run build`
- `npm test` (Node 24 o superior)

Al desplegar, configurá el hosting para servir `index.html` en las rutas de la aplicación, incluidas `/panel` y `/login/*`.

## Catálogo

- `/panel/products`: tabla de productos, búsqueda local, creación y edición en dialogs.
- `/panel/product-categories`: tabla de categorías, búsqueda local, creación y edición en dialogs.
- Cada fila permite activar o desactivar mediante el endpoint `/status` correspondiente.
- La edición envía únicamente campos modificados. Los campos opcionales de productos se pueden vaciar; se envían como `null`.
- Al crear un producto se puede indicar un ID de sucursal y una cantidad mínima. El stock inicial es 0; la edición de productos no modifica stock.
- Las peticiones usan `VITE_API_URL` y un token de Clerk actualizado; el token se imprime en consola, como en autenticación.

## Lectura de etiquetas

La acción **Identificar** de cada producto abre un dialog con el botón **Leer EPC**. Ejecuta `POST /esp32/read-tag` con el token de Clerk, sin body ni parámetros. Mientras espera la respuesta, muestra una animación de chip y antena.

Si se detecta exactamente una etiqueta, el dialog se cierra y se muestra el EPC leído en la pantalla de productos. El resultado permanece solo en memoria: todavía no se guarda ni se asocia al producto en el backend. Si no se detecta una única etiqueta, el dialog permite reintentar. Los errores 409 y 503 muestran mensajes específicos.
