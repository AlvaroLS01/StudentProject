require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const db = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Allow setting a service account key via env. Otherwise use application default
const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credsPath) {
  admin.initializeApp({
    credential: admin.credential.cert(require(credsPath)),
  });
} else {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'alvaro@studentproject.es',
    pass: process.env.EMAIL_PASS || 'zvet uxtn ocfd wvpj',
  },
});

// Google Sheets client
const sheetsAuth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  keyFile: process.env.GOOGLE_SHEETS_CREDENTIALS || 'credentials.json',
});
const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function appendRow(sheetName, values) {
  if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID not configured');
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

// --- Lookup endpoints ----------------------------------------------------
// These endpoints expose simple catalog data so the frontend can populate
// dropdowns from the PostgreSQL database rather than from hardcoded lists.

app.get('/ciudades', async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT id_ciudad, nombre FROM student_project.ciudad ORDER BY nombre'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching ciudades' });
  }
});

app.get('/cursos', async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT id_curso, nombre FROM student_project.curso ORDER BY id_curso'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching cursos' });
  }
});

app.get('/asignaturas', async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT id_asignatura, nombre_asignatura FROM student_project.asignatura ORDER BY nombre_asignatura'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching asignaturas' });
  }
});

app.post('/tutor', async (req, res) => {
  const { tutor, alumno } = req.body;
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');

    const hashed = await bcrypt.hash(tutor.password, 10);
    await client.query(
      'INSERT INTO student_project.tutor (correo_electronico, nombre, apellidos, genero, telefono, "NIF", direccion_facturacion, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        tutor.correo_electronico,
        tutor.nombre,
        tutor.apellidos,
        tutor.genero,
        tutor.telefono,
        tutor.NIF,
        tutor.direccion_facturacion,
        hashed,
      ]
    );

    if (alumno.telefono !== alumno.telefonoConfirm) {
      throw new Error('Teléfonos no coinciden');
    }

    const cityRes = await client.query(
      'SELECT id_ciudad FROM student_project.ciudad WHERE LOWER(nombre)=LOWER($1)',
      [alumno.ciudad]
    );
    let id_ciudad;
    if (cityRes.rowCount > 0) {
      id_ciudad = cityRes.rows[0].id_ciudad;
    } else {
      const insertedCity = await client.query(
        'INSERT INTO student_project.ciudad (nombre, id_grupo) VALUES ($1, 1) RETURNING id_ciudad',
        [alumno.ciudad]
      );
      id_ciudad = insertedCity.rows[0].id_ciudad;
    }

    const ubic = await client.query(
      'INSERT INTO student_project.ubicacion (Distrito, Barrio, Codigo_postal, id_ciudad) VALUES ($1,$2,$3,$4) RETURNING id_ubicacion',
      [alumno.distrito, alumno.barrio || null, alumno.codigo_postal || null, id_ciudad]
    );
    const id_ubicacion = ubic.rows[0].id_ubicacion;

    await client.query(
      'INSERT INTO student_project.alumno (nombre, apellidos, direccion, NIF, telefono, genero, correo_tutor, id_curso, id_ubicacion) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [
        alumno.nombre,
        alumno.apellidos,
        alumno.direccion,
        alumno.NIF,
        alumno.telefono,
        alumno.genero,
        tutor.correo_electronico,
        alumno.id_curso,
        id_ubicacion,
      ]
    );

    await client.query('COMMIT');
    res.json({ id: tutor.correo_electronico });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Error creando tutor' });
  } finally {
    if (client) client.release();
  }
});

app.post('/profesor', async (req, res) => {
  const {
    nombre,
    apellidos,
    genero,
    telefono,
    correo_electronico,
    NIF,
    direccion_facturacion,
    IBAN,
    carrera,
    curso,
    experiencia,
    password,
  } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO student_project.profesor (nombre, apellidos, genero, telefono, correo_electronico, "NIF", direccion_facturacion, "IBAN", carrera, curso, experiencia, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id_profesor',
      [nombre, apellidos, genero, telefono, correo_electronico, NIF, direccion_facturacion, IBAN, carrera, curso, experiencia, hashed]
    );
    res.json({ id: result.rows[0].id_profesor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando profesor" });
  }
});

app.post('/puja', async (req, res) => {
  const { fecha_puja, estado_puja, id_profesor, id_oferta } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO student_project.puja (fecha_puja, estado_puja, id_profesor, id_oferta) VALUES ($1,$2,$3,$4) RETURNING id_puja',
      [fecha_puja, estado_puja, id_profesor, id_oferta]
    );
    res.json({ id: result.rows[0].id_puja });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando puja" });
  }
});

app.post('/send-email', async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    await transporter.sendMail({
      from: `"Student Project" <${process.env.EMAIL_USER || 'alvaro@studentproject.es'}>`,
      to: email,
      subject: 'Bienvenido a Student Project',
      html: `<p>Hola ${name || 'usuario'}, bienvenido a nuestra plataforma.</p>`,
    });

    res.json({ message: 'Correo enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando correo' });
  }
});

app.post('/send-verification-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  try {
    await transporter.sendMail({
      from: `"Student Project" <${process.env.EMAIL_USER || 'alvaro@studentproject.es'}>`,
      to: email,
      subject: 'Código de verificación',
      html: `<p>Tu código de verificación es: <strong>${code}</strong></p>`
    });
    res.json({ message: 'Código enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando código' });
  }
});

// Append user data to Google Sheets
app.post('/sheet/user', async (req, res) => {
  const d = req.body || {};
  if (!d.id || !d.rol) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    if (d.rol === 'profesor') {
      await appendRow('profesores', [
        d.id,
        d.nombre,
        d.apellidos,
        d.email,
        d.telefono,
        d.ciudad,
        d.docType,
        d.docNumber,
        d.status,
        d.studies,
        d.studyTime,
        d.job,
        d.iban,
      ]);
    } else if (d.rol === 'tutor') {
      await appendRow('alumnos', [
        d.id,
        'P',
        d.nombre,
        d.apellidos,
        d.email,
        d.telefono,
        d.ciudad,
        d.curso,
        d.fechaNacimiento,
      ]);
    } else {
      return res.status(400).json({ error: 'Rol no válido' });
    }
    res.json({ message: 'Registrado en hoja' });
  } catch (err) {
    console.error('Sheet error', err);
    res.status(500).json({ error: 'Error escribiendo en la hoja' });
  }
});

// Append class data to Google Sheets
app.post('/sheet/class', async (req, res) => {
  const d = req.body || {};
  if (!d.idAsignacion) return res.status(400).json({ error: 'ID de asignación requerido' });
  try {
    await appendRow('clases', [
      d.idAsignacion,
      d.nombreProfesor,
      d.correoProfesor,
      d.nombreAlumno,
      d.correoAlumno,
      d.curso,
      d.asignatura,
      d.fecha,
      d.duracion,
      d.modalidad,
      d.localizacion,
      d.tipoClase,
      d.precioTotalPadres,
      d.precioTotalProfesor,
      d.beneficio,
    ]);
    res.json({ message: 'Clase registrada' });
  } catch (err) {
    console.error('Sheet error', err);
    res.status(500).json({ error: 'Error escribiendo en la hoja' });
  }
});

app.post('/send-assignment-email', async (req, res) => {
  const {
    teacherEmail,
    teacherName,
    studentEmail,
    studentName,
    schedule = [],
    recipient = 'both',
  } = req.body;

  if (!teacherEmail && !studentEmail) {
    return res.status(400).json({ error: 'Falta correo destinatario' });
  }

  const scheduleText = Array.isArray(schedule)
    ? (() => {
        const byDay = {};
        schedule.forEach(slot => {
          const [day, h] = slot.split('-');
          byDay[day] = byDay[day] || [];
          const start = parseInt(h, 10);
          if (!isNaN(start)) {
            byDay[day].push(`${start}.00–${start + 1}.00`);
          }
        });
        return Object.keys(byDay)
          .map(d => `${d}: ${byDay[d].join(', ')}`)
          .join('<br>');
      })()
    : '';

  const from = `"Student Project" <${process.env.EMAIL_USER || 'alvaro@studentproject.es'}>`;

  const emails = [];

  if (['teacher', 'both'].includes(recipient) && teacherEmail) {
    const html = `
      <p>Hola ${teacherName || 'profesor'}, has sido seleccionado para impartir la clase del alumno ${studentName || ''}.</p>
      ${scheduleText ? `<p>Horario propuesto:</p><p>${scheduleText}</p>` : ''}
      <p>Debes aceptar la solicitud en <strong>Mis clases</strong> &gt; <strong>Ofertas</strong>.</p>
    `;
    emails.push(
      transporter.sendMail({
        from,
        to: teacherEmail,
        subject: 'Solicitud de clase',
        html,
      })
    );
  }

  if (['student', 'both'].includes(recipient) && studentEmail) {
    const html = `
      <p>Hola ${studentName || 'alumno'}, el profesor ${teacherName || ''} ha aceptado impartir tu clase.</p>
      <p>Debes aceptarlo en la sección <strong>Mis clases</strong>. Una vez aceptado podréis coordinar la clase.</p>
    `;
    emails.push(
      transporter.sendMail({
        from,
        to: studentEmail,
        subject: 'Profesor asignado',
        html,
      })
    );
  }

  try {
    await Promise.all(emails);
    res.json({ message: 'Correos enviados' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando correo' });
  }
});

app.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  try {
    // Ensure the user exists
    await admin.auth().getUserByEmail(email);

    const token = jwt.sign({ email }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1h',
    });

    const resetUrl = `${process.env.RESET_BASE_URL || 'http://localhost:3000/reset-password'}?token=${token}`;

    const html = `
      <p>Haz clic en el botón para restablecer tu contraseña:</p>
      <p><a href="${resetUrl}" style="background:#ccf3e5;color:#034640;padding:12px 20px;border-radius:6px;text-decoration:none;">Restablecer contraseña</a></p>
    `;

    await transporter.sendMail({
      from: `"Student Project" <${process.env.EMAIL_USER || 'alvaro@studentproject.es'}>`,
      to: email,
      subject: 'Restablecer contraseña',
      html,
    });

    res.json({ message: 'Correo de restablecimiento enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando correo' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password });
    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Token inválido o expirado' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
