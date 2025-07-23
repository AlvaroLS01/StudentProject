# Servidor de correo de bienvenida

Este servidor Node.js expone un endpoint para enviar correos de bienvenida a los usuarios que se registren en la plataforma.

## Configuración

1. Desde la carpeta `node-server`, instala las dependencias:
   ```bash
   npm install
   ```
2. Copia el archivo de ejemplo `.env-example` a `.env` y edítalo si es necesario:
   ```bash
   cp .env-example .env
   # Modifica EMAIL_USER y EMAIL_PASS si cambian las credenciales
   ```

## Ejecutar el servidor

Ejecuta desde la misma carpeta:

```bash
npm start
```

El servidor se inicia por defecto en el puerto `3001`. Puedes cambiarlo definiendo la variable `PORT` en el archivo `.env`.

## Uso del endpoint

Envía una petición `POST` a `http://localhost:3001/send-email` con un cuerpo JSON similar al siguiente:

```json
{
  "email": "correo@ejemplo.com",
  "name": "Nombre del usuario"
}
```

Se enviará un correo de bienvenida a la dirección especificada.
