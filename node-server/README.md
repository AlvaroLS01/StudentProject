# Servidor de correo

Este servidor Node.js expone diferentes endpoints para enviar correos desde la plataforma: uno de bienvenida y otro para restablecer la contraseña.

## Configuración

1. Desde la carpeta `node-server`, instala las dependencias:
   ```bash
   npm install
   ```
2. Copia el archivo de ejemplo `.env-example` a `.env` y edítalo:
   ```bash
    cp .env-example .env
    # Modifica EMAIL_USER y EMAIL_PASS si cambian las credenciales
    # Establece JWT_SECRET y RESET_BASE_URL para los correos de restablecimiento
    # Especifica la ruta del JSON de la cuenta de servicio con
    # GOOGLE_APPLICATION_CREDENTIALS
    ```

  * `JWT_SECRET` puede ser cualquier cadena aleatoria que solo tú conozcas. El
    servidor la utiliza para firmar los tokens de restablecimiento. Cuanto más
    larga y compleja sea, mejor.
  * `GOOGLE_APPLICATION_CREDENTIALS` debe apuntar al archivo JSON de la cuenta
    de servicio de Firebase. Este archivo se obtiene desde la consola de
    Firebase y permite que el servidor utilice la API de administración.

## Ejecutar el servidor

Ejecuta desde la misma carpeta:

```bash
npm start
```

El servidor se inicia por defecto en el puerto `3001`. Puedes cambiarlo definiendo la variable `PORT` en el archivo `.env`.
El middleware de **CORS** viene activado para aceptar peticiones del cliente de React (por defecto en `http://localhost:3000`).

## Uso de los endpoints

### Bienvenida

Envía una petición `POST` a `http://localhost:3001/send-email` con un cuerpo JSON como el siguiente:

```json
{
  "email": "correo@ejemplo.com",
  "name": "Nombre del usuario"
}
```

Se enviará un correo de bienvenida a la dirección especificada.

### Restablecer contraseña

1. Solicitar el correo de restablecimiento:

   ```bash
   POST http://localhost:3001/request-password-reset
   { "email": "correo@ejemplo.com" }
   ```

   El usuario recibirá un enlace con un token que apunta a la aplicación.

2. Confirmar el cambio de contraseña:

   ```bash
   POST http://localhost:3001/reset-password
   { "token": "tokenRecibido", "password": "nuevaClave" }
   ```

   Si el token es válido, la contraseña del usuario se actualizará en Firebase.
