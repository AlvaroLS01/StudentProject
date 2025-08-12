# Servidor de correo

Este servidor Node.js expone diferentes endpoints para enviar correos desde la plataforma: uno de bienvenida, otro para enviar códigos de verificación y otro adicional para notificar la asignación de clases.

## Configuración

1. Desde la carpeta `node-server`, instala las dependencias:
   ```bash
   npm install
   ```
2. Copia el archivo de ejemplo `.env-example` a `.env` y edítalo:
   ```bash
    cp .env-example .env
    # Modifica EMAIL_USER y EMAIL_PASS si cambian las credenciales
    # Configura SPREADSHEET_ID y GOOGLE_SHEETS_CREDENTIALS para usar Google Sheets
    ```

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

### Código de verificación

Envía un `POST` a `http://localhost:3001/send-verification-code` con:

```json
{
  "email": "correo@ejemplo.com",
  "code": "123456"
}
```

El servidor enviará el código proporcionado al correo indicado.

### Asignación de clases

Envía un `POST` a `http://localhost:3001/send-assignment-email` con un cuerpo como:

```json
{
  "teacherEmail": "profesor@ejemplo.com",
  "teacherName": "Nombre Profesor",
  "studentEmail": "alumno@ejemplo.com",
  "studentName": "Nombre Alumno",
  "schedule": ["Lunes-17", "Martes-18"],
  "recipient": "teacher"
}
```

El campo `recipient` puede ser `teacher`, `student` o `both` para indicar a quién se envía la notificación.
Se utilizará para avisar al profesor cuando la administración lo seleccione y al alumno cuando el profesor acepte la solicitud.

### Sincronización con Google Sheets

Para registrar usuarios y clases en una hoja de cálculo debes especificar
`SPREADSHEET_ID` y `GOOGLE_SHEETS_CREDENTIALS` en el archivo `.env`. El JSON de
credenciales (por ejemplo `credentials.json`) **no se incluye en el repositorio**
y debes colocarlo manualmente en la carpeta `node-server`.

* **Registrar usuario**

  ```bash
  POST http://localhost:3001/sheet/user
  {
    "id": "idUsuario",
    "rol": "profesor" | "padre",
    "nombre": "Nombre",
    "apellidos": "Apellidos",
    "email": "correo@ejemplo.com",
    "telefono": "",
    "ciudad": "",
    "docType": "",
    "docNumber": "",
    "status": "",
    "studies": "",
    "studyTime": "",
    "job": "",
    "iban": "",
    "curso": "",
    "fechaNacimiento": ""
  }
  ```

* **Registrar clase aceptada**

  ```bash
  POST http://localhost:3001/sheet/class
  {
    "idAsignacion": "id",
    "nombreProfesor": "",
    "correoProfesor": "",
    "nombreAlumno": "",
    "correoAlumno": "",
    "curso": "",
    "asignatura": "",
    "fecha": "2024-01-01",
    "duracion": "1h",
    "modalidad": "",
    "localizacion": "",
    "tipoClase": "",
    "precioTotalPadres": 0,
    "precioTotalProfesor": 0,
    "beneficio": 0
  }
  ```

Los datos se añaden en las hojas **profesores**, **alumnos** y **clases** del
documento indicado.
