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
      `SELECT c.id_ciudad, c.nombre, g.nombre AS grupo
       FROM student_project.ciudad c
       JOIN student_project.grupo g ON c.id_grupo = g.id_grupo
       ORDER BY c.nombre`
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

app.get('/pagos', async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id_pago, g.nombre AS grupo, p.curso, p.modalidad, p.tipo,
              p.precio_tutor, p.precio_profesor
         FROM student_project.pago p
         JOIN student_project.grupo g ON p.id_grupo = g.id_grupo
         ORDER BY p.id_pago`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching pagos' });
  }
});
app.post('/transaccion', async (req, res) => {
  const {
    alumnoId,
    profesorId,
    tutorId: tutorIdReq,
    tutorEmail,
    alumnoNombre,
    asignatura,
    modalidad,
    fecha,
    hora,
    duracion,
    montoTutor,
    montoProfesor,
  } = req.body;

  const tutorId = tutorIdReq || alumnoId;
  if (!tutorId || !profesorId) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');
    const fdb = admin.firestore();

    const profSnap = await fdb.collection('usuarios').doc(profesorId).get();
    const profesorEmail = profSnap.exists ? profSnap.data().email : null;
    if (!profesorEmail) throw new Error('Correo del profesor no encontrado');

    await client.query(
      `INSERT INTO student_project.saldo_usuario (user_id, rol, saldo)
       VALUES ($1,'tutor',$2)
       ON CONFLICT (user_id, rol) DO UPDATE SET saldo = saldo + EXCLUDED.saldo`,
      [tutorId, -Math.abs(montoTutor || 0)]
    );
    await client.query(
      `INSERT INTO student_project.saldo_usuario (user_id, rol, saldo)
       VALUES ($1,'profesor',$2)
       ON CONFLICT (user_id, rol) DO UPDATE SET saldo = saldo + EXCLUDED.saldo`,
      [profesorId, montoProfesor || 0]
    );

    let id_profesor = null;
    let id_alumno = null;
    let id_ubicacion = null;
    let id_asignatura = null;

    const pr = await client.query(
      'SELECT id_profesor FROM student_project.profesor WHERE correo_electronico=$1',
      [profesorEmail]
    );
    if (pr.rowCount > 0) id_profesor = pr.rows[0].id_profesor;

    if (tutorEmail && alumnoNombre) {
      const ar = await client.query(
        'SELECT id_alumno, id_ubicacion FROM student_project.alumno WHERE correo_tutor=$1 AND LOWER(nombre)=LOWER($2)',
        [tutorEmail, alumnoNombre]
      );
      if (ar.rowCount > 0) {
        id_alumno = ar.rows[0].id_alumno;
        id_ubicacion = ar.rows[0].id_ubicacion;
      }
    }

    if (asignatura) {
      const asr = await client.query(
        'SELECT id_asignatura FROM student_project.asignatura WHERE LOWER(nombre_asignatura)=LOWER($1)',
        [asignatura]
      );
      if (asr.rowCount > 0) id_asignatura = asr.rows[0].id_asignatura;
    }

    if (
      id_profesor &&
      id_alumno &&
      id_ubicacion &&
      id_asignatura &&
      fecha &&
      hora &&
      modalidad
    ) {
      await client.query(
        `INSERT INTO student_project.clase (
          fecha_clase, hora_clase, modalidad_clase, precio_total_clase, beneficio_clase,
          duracion_clase, fecha_registro_clase, id_asignatura, id_ubicacion, id_profesor, id_alumno)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          fecha,
          hora,
          modalidad,
          Math.abs(montoTutor || 0),
          (montoTutor || 0) - (montoProfesor || 0),
          duracion || 0,
          new Date().toISOString().slice(0, 10),
          id_asignatura,
          id_ubicacion,
          id_profesor,
          id_alumno,
        ]
      );
    }

    await client.query('COMMIT');

    await fdb.collection('balances').doc(tutorId).set(
      {
        rol: 'tutor',
        saldo: admin.firestore.FieldValue.increment(-Math.abs(montoTutor || 0)),
      },
      { merge: true }
    );
    await fdb.collection('balances').doc(profesorId).set(
      {
        rol: 'profesor',
        saldo: admin.firestore.FieldValue.increment(montoProfesor || 0),
      },
      { merge: true }
    );

    res.json({ message: 'Transacción registrada' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error registrando transacción' });
  } finally {
    if (client) client.release();
  }
});

app.get('/balances', async (req, res) => {
  const { role } = req.query;
  if (!role) return res.status(400).json({ error: 'role requerido' });
  try {
    const result = await db.query(
      'SELECT user_id, rol, saldo FROM student_project.saldo_usuario WHERE rol=$1 ORDER BY user_id',
      [role]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo saldos' });
  }
});

app.post('/balances/:userId/liquidar', async (req, res) => {
  const { userId } = req.params;
  const { role, email } = req.body;
  if (!role) return res.status(400).json({ error: 'Datos incompletos' });
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');
    const balRes = await client.query(
      'SELECT saldo FROM student_project.saldo_usuario WHERE user_id=$1 AND rol=$2',
      [userId, role]
    );
    const saldo = balRes.rowCount ? balRes.rows[0].saldo : 0;
    await client.query(
      'UPDATE student_project.saldo_usuario SET saldo=0 WHERE user_id=$1 AND rol=$2',
      [userId, role]
    );
    await client.query('COMMIT');
    const fdb = admin.firestore();
    await fdb.collection('balances').doc(userId).set({ saldo: 0, rol: role }, { merge: true });
    if (email) {
      await transporter.sendMail({
        from: `"Student Project" <${process.env.EMAIL_USER || 'alvaro@studentproject.es'}>`,
        to: email,
        subject: role === 'tutor' ? 'Pago pendiente' : 'Pago recibido',
        html: role === 'tutor'
          ? `<p>Tienes que pagar €${saldo}</p>`
          : `<p>Se te ha ingresado €${saldo}</p>`
      });
    }
    res.json({ message: 'Saldo liquidado' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al liquidar saldo' });
  } finally {
    if (client) client.release();
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

    const telefonoAlumno = alumno.telefono && alumno.telefono.trim() !== ''
      ? alumno.telefono
      : tutor.telefono;
    if (
      alumno.telefono &&
      alumno.telefonoConfirm &&
      alumno.telefono !== alumno.telefonoConfirm
    ) {
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
        `INSERT INTO student_project.ciudad (nombre, id_grupo)
         VALUES ($1, (SELECT id_grupo FROM student_project.grupo WHERE nombre='A'))
         RETURNING id_ciudad`,
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
        telefonoAlumno,
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

app.post('/alumno', async (req, res) => {
  const { tutor_email, alumno } = req.body;
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');
    if (
      alumno.telefono &&
      alumno.telefonoConfirm &&
      alumno.telefono !== alumno.telefonoConfirm
    ) {
      throw new Error('Teléfonos no coinciden');
    }

    let telefonoAlumno = alumno.telefono && alumno.telefono.trim() !== '' ? alumno.telefono : null;
    if (!telefonoAlumno) {
      const tutorRes = await client.query(
        'SELECT telefono FROM student_project.tutor WHERE correo_electronico=$1',
        [tutor_email]
      );
      telefonoAlumno = tutorRes.rows[0]?.telefono || null;
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
        `INSERT INTO student_project.ciudad (nombre, id_grupo)
         VALUES ($1, (SELECT id_grupo FROM student_project.grupo WHERE nombre='A'))
         RETURNING id_ciudad`,
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
        telefonoAlumno,
        alumno.genero,
        tutor_email,
        alumno.id_curso,
        id_ubicacion,
      ]
    );

    await client.query('COMMIT');
    res.json({ status: 'ok' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Error creando alumno' });
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
    NIF = null,
    direccion_facturacion,
    IBAN = null,
    carrera = null,
    curso = null,
    experiencia = null,
    password,
  } = req.body;
  if (!nombre || !apellidos || !genero || !telefono || !correo_electronico || !direccion_facturacion || !password) {
    return res.status(400).json({ error: 'Datos obligatorios faltantes' });
  }

  const clamp = (val, max) => (val && val.length > max ? val.slice(0, max) : val);
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO student_project.profesor (nombre, apellidos, genero, telefono, correo_electronico, "NIF", direccion_facturacion, "IBAN", carrera, curso, experiencia, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id_profesor',
      [
        clamp(nombre, 100),
        clamp(apellidos, 100),
        clamp(genero, 100),
        clamp(telefono, 25),
        clamp(correo_electronico, 100),
        clamp(NIF, 100),
        clamp(direccion_facturacion, 100),
        clamp(IBAN, 100),
        clamp(carrera, 100),
        clamp(curso, 100),
        clamp(experiencia, 1000),
        hashed,
      ]
    );
    res.json({ id: result.rows[0].id_profesor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando profesor' });
  }
});

app.put('/profesor', async (req, res) => {
  const { correo_electronico, NIF = null, IBAN = null, carrera = null, curso = null, experiencia = null } = req.body;
  if (!correo_electronico) return res.status(400).json({ error: 'Falta correo del profesor' });
  try {
    await db.query(
      'UPDATE student_project.profesor SET "NIF"=$1, "IBAN"=$2, carrera=$3, curso=$4, experiencia=$5 WHERE correo_electronico=$6',
      [NIF, IBAN, carrera, curso, experiencia, correo_electronico]
    );
    res.json({ message: 'Profesor actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando profesor' });
  }
});

app.post('/oferta', async (req, res) => {
  const {
    fecha_oferta,
    fecha_inicio,
    fecha_fin,
    disponibilidad,
    estado,
    numero_horas,
    modalidad,
    tipo,
    beneficio_sp,
    ganancia_profesor,
    precio_alumno,
    precio_profesor,
    tutor_email,
    alumno_nombre,
    alumno_apellidos,
    asignaturas = [],
    anotaciones,
  } = req.body;

  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');

    const aRes = await client.query(
      'SELECT id_alumno FROM student_project.alumno WHERE correo_tutor=$1 AND LOWER(nombre)=LOWER($2) AND ($3::text IS NULL OR LOWER(apellidos)=LOWER($3))',
      [tutor_email, alumno_nombre, alumno_apellidos || null]
    );
    if (aRes.rowCount === 0) {
      throw new Error('Alumno no encontrado');
    }
    const id_alumno = aRes.rows[0].id_alumno;

    const result = await client.query(
      'INSERT INTO student_project.oferta (fecha_oferta, fecha_inicio, fecha_fin, disponibilidad, estado, numero_horas, modalidad, tipo, beneficio_sp, ganancia_profesor, precio_alumno, precio_profesor, asignaturas_seleccionadas, anotaciones, id_alumno) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id_oferta',
      [
        fecha_oferta,
        fecha_inicio,
        fecha_fin,
        disponibilidad,
        estado,
        numero_horas,
        modalidad,
        tipo,
        beneficio_sp,
        ganancia_profesor,
        precio_alumno,
        precio_profesor,
        asignaturas.join(','),
        anotaciones || null,
        id_alumno,
      ]
    );
    const ofertaId = result.rows[0].id_oferta;

    for (const nombre of asignaturas) {
      const asRes = await client.query(
        'SELECT id_asignatura FROM student_project.asignatura WHERE LOWER(nombre_asignatura)=LOWER($1)',
        [nombre]
      );
      if (asRes.rowCount > 0) {
        await client.query(
          'INSERT INTO student_project.oferta_asignatura (id_oferta, id_asignatura) VALUES ($1,$2)',
          [ofertaId, asRes.rows[0].id_asignatura]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ id: ofertaId });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error creando oferta' });
  } finally {
    if (client) client.release();
  }
});

app.post('/puja', async (req, res) => {
  const {
    fecha_puja,
    estado_puja,
    profesor_email,
    id_oferta,
    asignaturas = [],
    precio,
  } = req.body;

  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');

    const pRes = await client.query(
      'SELECT id_profesor FROM student_project.profesor WHERE correo_electronico=$1',
      [profesor_email]
    );
    if (pRes.rowCount === 0) {
      throw new Error('Profesor no encontrado');
    }
    const id_profesor = pRes.rows[0].id_profesor;

    const result = await client.query(
      'INSERT INTO student_project.puja (fecha_puja, estado_puja, id_profesor, id_oferta) VALUES ($1,$2,$3,$4) RETURNING id_puja',
      [fecha_puja, estado_puja, id_profesor, id_oferta]
    );
    const pujaId = result.rows[0].id_puja;

    await client.query(
      'UPDATE student_project.oferta SET estado=$1 WHERE id_oferta=$2',
      ['seleccion_profesor', id_oferta]
    );

    for (const nombre of asignaturas) {
      const asRes = await client.query(
        'SELECT id_asignatura FROM student_project.asignatura WHERE LOWER(nombre_asignatura)=LOWER($1)',
        [nombre]
      );
      if (asRes.rowCount > 0) {
        await client.query(
          'INSERT INTO student_project.puja_asignatura (id_puja, id_asignatura, precio) VALUES ($1,$2,$3)',
          [pujaId, asRes.rows[0].id_asignatura, precio]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ id: pujaId });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error creando puja' });
  } finally {
    if (client) client.release();
  }
});

// Selecciona una puja por parte de la administración
app.post('/puja/:id/select', async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');
    const selRes = await client.query(
      'UPDATE student_project.puja SET estado_puja=$1 WHERE id_puja=$2 RETURNING id_oferta',
      ['ganadora', id]
    );
    if (selRes.rowCount === 0) throw new Error('Puja no encontrada');
    const id_oferta = selRes.rows[0].id_oferta;
    await client.query(
      'UPDATE student_project.puja SET estado_puja=$1 WHERE id_oferta=$2 AND id_puja<>$3',
      ['no_seleccionada', id_oferta, id]
    );
    await client.query(
      'UPDATE student_project.oferta SET estado=$1 WHERE id_oferta=$2',
      ['espera_profesor', id_oferta]
    );
    await client.query('COMMIT');
    res.json({ message: 'Puja seleccionada' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error seleccionando puja' });
  } finally {
    if (client) client.release();
  }
});

// Aceptación de la puja por parte del profesor
app.post('/puja/:id/accept', async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');
    const pujaRes = await client.query(
      'SELECT id_oferta FROM student_project.puja WHERE id_puja=$1 AND estado_puja=$2',
      [id, 'ganadora']
    );
    if (pujaRes.rowCount === 0) throw new Error('Puja no encontrada');
    const id_oferta = pujaRes.rows[0].id_oferta;
    await client.query(
      'UPDATE student_project.oferta SET estado=$1 WHERE id_oferta=$2',
      ['espera_tutor', id_oferta]
    );
    await client.query('COMMIT');
    res.json({ message: 'Puja aceptada por el profesor' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error actualizando puja' });
  } finally {
    if (client) client.release();
  }
});

// Confirmación de la puja por parte del tutor y creación del enlace
app.post('/puja/:id/confirm', async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');
    const pujaRes = await client.query(
      'SELECT id_oferta, id_profesor FROM student_project.puja WHERE id_puja=$1 AND estado_puja=$2',
      [id, 'ganadora']
    );
    if (pujaRes.rowCount === 0) throw new Error('Puja no encontrada');
    const { id_oferta, id_profesor } = pujaRes.rows[0];
    const alumRes = await client.query(
      'SELECT id_alumno FROM student_project.oferta WHERE id_oferta=$1',
      [id_oferta]
    );
    if (alumRes.rowCount === 0) throw new Error('Oferta no encontrada');
    const id_alumno = alumRes.rows[0].id_alumno;
    await client.query(
      'INSERT INTO student_project.enlace_clases (id_alumno, id_profesor, id_puja, id_oferta) VALUES ($1,$2,$3,$4)',
      [id_alumno, id_profesor, id, id_oferta]
    );
    await client.query(
      'UPDATE student_project.oferta SET estado=$1 WHERE id_oferta=$2',
      ['profesor_asignado', id_oferta]
    );
    await client.query('COMMIT');
    res.json({ message: 'Enlace creado' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error confirmando puja' });
  } finally {
    if (client) client.release();
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

app.post('/notify-tutor-class', async (req, res) => {
  const {
    tutorEmail,
    tutorName,
    teacherName,
    studentName,
    classDate,
    classTime,
  } = req.body;

  if (!tutorEmail) {
    return res.status(400).json({ error: 'Falta correo del tutor' });
  }

  const html = `
      <p>Hola ${tutorName || 'tutor'}, el profesor ${teacherName || 'profesor'} ha añadido una clase para el alumno ${studentName || ''}.</p>
      <p>Fecha y hora: ${classDate || ''} a las ${classTime || ''}.</p>
      <p>Por favor, entra en el chat con el profesor para aceptarla.</p>
    `;

  try {
    await transporter.sendMail({
      from: `"Student Project" <${process.env.EMAIL_USER || 'alvaro@studentproject.es'}>`,
      to: tutorEmail,
      subject: 'Nueva clase pendiente de confirmar',
      html,
    });
    res.json({ message: 'Correo enviado al tutor' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando correo' });
  }
});

app.post('/accept-class', async (req, res) => {
  const {
    fecha_clase,
    hora_clase,
    modalidad_clase,
    precio_total_clase,
    beneficio_clase,
    duracion_clase,
    fecha_registro_clase,
    id_asignatura,
    id_ubicacion,
    id_profesor,
    id_alumno,
    teacherEmail,
    teacherName,
    studentName,
  } = req.body;

  if (
    !fecha_clase ||
    !hora_clase ||
    !modalidad_clase ||
    precio_total_clase == null ||
    beneficio_clase == null ||
    duracion_clase == null ||
    !fecha_registro_clase ||
    !id_asignatura ||
    !id_ubicacion ||
    !id_profesor ||
    !id_alumno ||
    !teacherEmail
  ) {
    return res.status(400).json({ error: 'Datos incompletos para la clase' });
  }

  const clamp = (val, max) => (val && val.length > max ? val.slice(0, max) : val);

  let client;
  try {
    client = await db.connect();
    await client.query(
      `INSERT INTO student_project.clase
        (fecha_clase, hora_clase, modalidad_clase, precio_total_clase, beneficio_clase, duracion_clase, fecha_registro_clase, id_asignatura, id_ubicacion, id_profesor, id_alumno)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        fecha_clase,
        hora_clase,
        clamp(modalidad_clase, 100),
        precio_total_clase,
        beneficio_clase,
        duracion_clase,
        fecha_registro_clase,
        id_asignatura,
        id_ubicacion,
        id_profesor,
        id_alumno,
      ]
    );
  } catch (err) {
    console.error(err);
    if (client) client.release();
    return res.status(500).json({ error: 'Error registrando la clase' });
  }

  if (client) client.release();

  try {
    const html = `
      <p>Hola ${teacherName || 'profesor'}, el alumno ${studentName || ''} ha aceptado la clase programada para el ${fecha_clase || ''} a las ${hora_clase || ''}.</p>
      <p>La clase se ha registrado correctamente en la base de datos.</p>
    `;
    await transporter.sendMail({
      from: `"Student Project" <${process.env.EMAIL_USER || 'alvaro@studentproject.es'}>`,
      to: teacherEmail,
      subject: 'Clase aceptada por el alumno',
      html,
    });
    res.json({ message: 'Clase aceptada y correo enviado al profesor' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Clase registrada pero error enviando correo al profesor' });
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
