require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const db = require('./db');

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

app.post('/tutor', async (req, res) => {
  const {
    nombre,
    apellidos,
    genero,
    telefono,
    correo_electronico,
    NIF,
    direccion_facturacion,
  } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO student_project.tutor (nombre, apellidos, genero, telefono, correo_electronico, "NIF", direccion_facturacion) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_tutor',
      [nombre, apellidos, genero, telefono, correo_electronico, NIF, direccion_facturacion]
    );
    res.json({ id: result.rows[0].id_tutor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando tutor" });
  }
});

app.post('/tutor/:tutorId/alumno', async (req, res) => {
  const { tutorId } = req.params;
  const { nombre, apellidos, direccion, NIF, telefono, genero } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO student_project.alumno (nombre, apellidos, direccion, NIF, telefono, genero, id_tutor) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_alumno',
      [nombre, apellidos, direccion, NIF, telefono, genero, tutorId]
    );
    res.json({ id: result.rows[0].id_alumno });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando alumno" });
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
  } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO student_project.profesor (nombre, apellidos, genero, telefono, correo_electronico, "NIF", direccion_facturacion, "IBAN", carrera, curso, experiencia) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id_profesor',
      [nombre, apellidos, genero, telefono, correo_electronico, NIF, direccion_facturacion, IBAN, carrera, curso, experiencia]
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
