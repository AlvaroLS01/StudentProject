require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { google } = require('googleapis');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());


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
    } else if (d.rol === 'padre') {
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

// --- PostgreSQL backed endpoints ---

// Fetch list of cities from DB
app.get('/api/cities', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id_ciudad, nombre FROM student_project.ciudad ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    console.error('DB cities error', err);
    res.status(500).json({ error: 'Error obteniendo ciudades' });
  }
});

// Fetch list of courses
app.get('/api/courses', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id_curso, nombre FROM student_project.curso ORDER BY id_curso');
    res.json(rows);
  } catch (err) {
    console.error('DB courses error', err);
    res.status(500).json({ error: 'Error obteniendo cursos' });
  }
});

// Register tutor with optional child data
app.post('/api/tutors', async (req, res) => {
  const { tutor = {}, alumno = {}, ciudad } = req.body;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Insert tutor
    const tutorSql = `INSERT INTO student_project.tutor
      (nombre, apellidos, genero, telefono, correo_electronico, "NIF", direccion_facturacion)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_tutor`;
    const tutorVals = [tutor.nombre, tutor.apellidos, tutor.genero, tutor.telefono, tutor.correo_electronico, tutor.NIF, tutor.direccion_facturacion];
    const tutorRes = await client.query(tutorSql, tutorVals);
    const id_tutor = tutorRes.rows[0].id_tutor;

    if (alumno && alumno.nombre) {
      // Resolve city and course ids
      const cityRes = await client.query('SELECT id_ciudad FROM student_project.ciudad WHERE nombre = $1 LIMIT 1', [ciudad]);
      const cityId = cityRes.rows[0] ? cityRes.rows[0].id_ciudad : null;
      const courseRes = await client.query('SELECT id_curso FROM student_project.curso WHERE nombre = $1 LIMIT 1', [alumno.curso]);
      const courseId = courseRes.rows[0] ? courseRes.rows[0].id_curso : null;

      const locRes = await client.query('INSERT INTO student_project.ubicacion (Distrito, Barrio, Codigo_postal, id_ciudad) VALUES ($1,$2,$3,$4) RETURNING id_ubicacion', [alumno.distrito || null, alumno.barrio || null, alumno.codigo_postal || null, cityId]);
      const locId = locRes.rows[0].id_ubicacion;

      const alumnoSql = `INSERT INTO student_project.alumno
        (nombre, apellidos, direccion, NIF, telefono, genero, id_tutor, id_curso, id_ubicacion)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`;
      const alumnoVals = [alumno.nombre, alumno.apellidos, alumno.direccion, alumno.NIF, alumno.telefono, alumno.genero, id_tutor, courseId, locId];
      await client.query(alumnoSql, alumnoVals);
    }

    await client.query('COMMIT');
    res.json({ id_tutor });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB tutor error', err);
    res.status(500).json({ error: 'Error registrando tutor' });
  } finally {
    client.release();
  }
});

// Register professor
app.post('/api/profesores', async (req, res) => {
  const { profesor = {} } = req.body;
  try {
    const sql = `INSERT INTO student_project.profesor
      (nombre, apellidos, genero, telefono, correo_electronico, "NIF", direccion_facturacion, "IBAN", carrera, curso, experiencia)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id_profesor`;
    const vals = [profesor.nombre, profesor.apellidos, profesor.genero, profesor.telefono, profesor.correo_electronico, profesor.NIF, profesor.direccion_facturacion, profesor.IBAN, profesor.carrera, profesor.curso, profesor.experiencia];
    const { rows } = await db.query(sql, vals);
    res.json({ id_profesor: rows[0].id_profesor });
  } catch (err) {
    console.error('DB profesor error', err);
    res.status(500).json({ error: 'Error registrando profesor' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
