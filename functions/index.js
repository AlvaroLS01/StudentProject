/* eslint-disable */
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

const transporter = nodemailer.createTransport({
service: "gmail",
auth: {
  user: "alvaro@studentproject.es",
  pass: "ibmf zall dcqj vbuw",
},
});

const REGION = "us-central1";
const BASE_URL = `https://${REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net`;

const sendContactForm = (form) => {
  return transporter
    .sendMail({
      subject: "👾🤖Nuevo mensaje de tu formulario de contacto😎",
      bcc: ["contacto@fixter.org"],
      html: `<h3>¡Tienes un nuevo mensaje!</h3>
<p> Nombre: ${form.name} </p>
<p> Correo: ${form.email} </p>
<p> Mensaje: ${form.message} </p>
`,
    })
    .then((r) => {
      console.log("Accepted => ", r.accepted);
      console.log("Rejected  => ", r.rejected);
    })
    .catch((e) => console.log(e));
};

exports.helloWorld = functions.https.onRequest((req, res) => {
  if (req.body.secret !== 'firebaseIsCool') return res.send('Missing secret');

  sendContactForm(req.body);
  res.send("Sending email...");
});



// Trigger para notificar asignación de profesor
exports.onTeacherAssigned = functions.firestore
  .document("clases/{classId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const classId = context.params.classId;
    const beforeTeacher = before.profesorSeleccionado;
    const afterTeacher = after.profesorSeleccionado;
    if (!afterTeacher || beforeTeacher === afterTeacher) {
      return null;
    }

    try {
      const unionSnap = await db
        .collection("clases_union")
        .where("claseId", "==", classId)
        .limit(1)
        .get();
      if (unionSnap.empty) {
        functions.logger.warn("No se encontró la unión para la clase", classId);
        return null;
      }

      const unionDoc = unionSnap.docs[0];
      const union = unionDoc.data();
      const teacherId = union.profesorId;
      const studentId = union.alumnoId;

      const [teacherSnap, studentSnap] = await Promise.all([
        db.collection("usuarios").doc(teacherId).get(),
        db.collection("usuarios").doc(studentId).get(),
      ]);

      const teacherEmail = teacherSnap.exists ? teacherSnap.data().email : null;
      const teacherPhone = teacherSnap.exists ? teacherSnap.data().telefono : null;
      const teacherName =
        union.profesorNombre ||
        (teacherSnap.exists
          ? `${teacherSnap.data().nombre} ${teacherSnap.data().apellidos || ""}`.trim()
          : "");

      const studentEmail = studentSnap.exists ? studentSnap.data().email : null;
      const studentPhone = studentSnap.exists ? studentSnap.data().telefono : null;
      const studentName =
        union.padreNombre ||
        union.alumnoNombre ||
        (studentSnap.exists
          ? `${studentSnap.data().nombre} ${studentSnap.data().apellidos || ""}`.trim()
          : "");

      const asignatura = after.asignatura || (after.asignaturas || []).join(", ");
      const fecha = after.fechaInicio || "";

      const acceptLink = `${BASE_URL}/teacherEmailResponse?unionId=${unionDoc.id}&decision=accept`;
      const rejectLink = `${BASE_URL}/teacherEmailResponse?unionId=${unionDoc.id}&decision=reject`;

      await transporter.sendMail({
        to: teacherEmail,
        subject: "Nueva clase asignada",
        html:
          `<p>Hola, ${teacherName}.</p>` +
          `<p>Has sido seleccionado como el mejor candidato para la clase solicitada por ${studentName}.</p>` +
          `<p>Asignatura: ${asignatura}</p>` +
          (fecha ? `<p>Fecha de inicio: ${fecha}</p>` : "") +
          `<p><a href="${acceptLink}">Aceptar clase</a> | <a href="${rejectLink}">Rechazar clase</a></p>`,
      });

      // store phones and confirmation status
      await unionDoc.ref.update({
        profesorTelefono: teacherPhone || null,
        alumnoTelefono: studentPhone || null,
        confirmacionProfesor: "pendiente",
        confirmacionAlumno: null,
      });


      return null;
    } catch (error) {
      functions.logger.error("Error al enviar correos", error);
      return null;
    }
  });

// Trigger HTTP para envío de email de restablecimiento
exports.sendCustomPasswordResetEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { email } = req.body;
      const link = await admin.auth().generatePasswordResetLink(email, {
        url: "https://studentproject-4c33d.web.app/inicio",
      });

      await transporter.sendMail({
        from: "no-reply@studentproject-4c33d.firebaseapp.com",
        to: email,
        subject: "Restablecer contraseña",
        html: `<p>Pulsa <a href="${link}">aquí</a> para restablecer tu contraseña.</p>`,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// Trigger para volcar en Google Sheets (append o update)
exports.logClassToSheet = functions.firestore
  .document("clases_union/{unionId}/clases_asignadas/{assignmentId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null; // ignore deletions
    const after = change.after.data();
    if (after.estado !== "aceptada") return null;

    // Inicialización de Sheets dentro del trigger
    const sheetsConfig = functions.config().sheets || {
      spreadsheet_id: process.env.SHEETS_ID,
      client_email: process.env.SHEETS_CLIENT_EMAIL,
      private_key: (process.env.SHEETS_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    };
    const sheetsAuth = new google.auth.JWT(
      sheetsConfig.client_email,
      null,
      sheetsConfig.private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );
    const sheetsApi = google.sheets({ version: "v4", auth: sheetsAuth });

    try {
      const unionId = context.params.unionId;
      const unionSnap = await db.collection("clases_union").doc(unionId).get();
      if (!unionSnap.exists) {
        functions.logger.warn("Union not found", unionId);
        return null;
      }
      const union = unionSnap.data();

      const classSnap = await db.collection("clases").doc(union.claseId).get();
      const classData = classSnap.exists ? classSnap.data() : {};

      const [teacherSnap, studentSnap] = await Promise.all([
        db.collection("usuarios").doc(union.profesorId).get(),
        db.collection("usuarios").doc(union.alumnoId).get(),
      ]);

      const teacherEmail = teacherSnap.exists ? teacherSnap.data().email : "";
      const teacherName =
        union.profesorNombre ||
        (teacherSnap.exists
          ? `${teacherSnap.data().nombre} ${teacherSnap.data().apellidos || ""}`.trim()
          : "");

      const studentEmail = studentSnap.exists ? studentSnap.data().email : "";
      const studentName =
        union.padreNombre ||
        union.alumnoNombre ||
        (studentSnap.exists
          ? `${studentSnap.data().nombre} ${studentSnap.data().apellidos || ""}`.trim()
          : "");

      const beneficio =
        (after.precioTotalPadres || 0) - (after.precioTotalProfesor || 0);

      const asignatura =
        after.asignatura ||
        classData.asignatura ||
        (classData.asignaturas || []).join(", ");

      const row = [
        context.params.assignmentId,
        teacherEmail,
        teacherName,
        studentName,
        studentEmail,
        classData.curso || "",
        asignatura,
        after.fecha || "",
        after.duracion || "",
        after.modalidad || "",
        classData.tipoClase || "",
        after.precioTotalPadres || 0,
        after.precioTotalProfesor || 0,
        beneficio,
      ];

      // Leer columna A para ver si existe el assignmentId
      const existing = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: sheetsConfig.spreadsheet_id,
        range: "A:A",
      });
      const values = existing.data.values || [];
      const rowIndex = values.findIndex((r) => r[0] === context.params.assignmentId);

      if (rowIndex !== -1) {
        // actualizar fila existente
        const rowNumber = rowIndex + 1;
        await sheetsApi.spreadsheets.values.update({
          spreadsheetId: sheetsConfig.spreadsheet_id,
          range: `A${rowNumber}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [row] },
        });
      } else {
        // añadir al final
        await sheetsApi.spreadsheets.values.append({
          spreadsheetId: sheetsConfig.spreadsheet_id,
          range: "A1",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [row] },
        });
      }

      return null;
    } catch (error) {
      functions.logger.error("Error writing to Google Sheets", error);
      return null;
    }
  });

// ----- Respuesta del profesor por email -----
exports.teacherEmailResponse = functions.https.onRequest(async (req, res) => {
  const unionId = req.query.unionId;
  const decision = req.query.decision;
  if (!unionId || !decision) return res.status(400).send('Missing parameters');

  try {
    const docRef = db.collection('clases_union').doc(unionId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).send('Union not found');
    const data = docSnap.data();

    if (decision === 'accept') {
      await docRef.update({ confirmacionProfesor: 'aceptada' });

      if (data.alumnoId) {
        const studentSnap = await db.collection('usuarios').doc(data.alumnoId).get();
        const studentEmail = studentSnap.exists ? studentSnap.data().email : null;
        if (studentEmail) {
          const acceptLink = `${BASE_URL}/studentEmailResponse?unionId=${unionId}&decision=accept`;
          const rejectLink = `${BASE_URL}/studentEmailResponse?unionId=${unionId}&decision=reject`;
          await transporter.sendMail({
            to: studentEmail,
            subject: 'Confirmar clase',
            html:
              `<p>Se ha encontrado profesor para tu clase. ¿Confirmas la solicitud?</p>` +
              `<p><a href="${acceptLink}">Aceptar clase</a> | <a href="${rejectLink}">Rechazar clase</a></p>`
          });
          await docRef.update({ confirmacionAlumno: 'pendiente' });
        }
      }
      return res.send('Respuesta registrada');
    } else if (decision === 'reject') {
      await docRef.update({ confirmacionProfesor: 'rechazada' });

      if (data.claseId && data.offerId) {
        await db.doc(`clases/${data.claseId}`).update({
          estado: 'pendiente',
          profesorSeleccionado: admin.firestore.FieldValue.delete(),
        });
        await db.doc(`clases/${data.claseId}/ofertas/${data.offerId}`).update({ estado: 'rechazada' });
      }

      return res.send('Respuesta registrada');
    }

    return res.status(400).send('Invalid decision');
  } catch (err) {
    functions.logger.error('teacherEmailResponse error', err);
    return res.status(500).send('error');
  }
});

// ----- Respuesta del alumno/padre por email -----
exports.studentEmailResponse = functions.https.onRequest(async (req, res) => {
  const unionId = req.query.unionId;
  const decision = req.query.decision;
  if (!unionId || !decision) return res.status(400).send('Missing parameters');

  try {
    const docRef = db.collection('clases_union').doc(unionId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).send('Union not found');
    const data = docSnap.data();

    const [teacherSnap, studentSnap] = await Promise.all([
      db.collection('usuarios').doc(data.profesorId).get(),
      db.collection('usuarios').doc(data.alumnoId).get(),
    ]);
    const teacherEmail = teacherSnap.exists ? teacherSnap.data().email : null;
    const studentEmail = studentSnap.exists ? studentSnap.data().email : null;

    if (decision === 'accept') {
      await docRef.update({ confirmacionAlumno: 'aceptada', estadoUnion: 'confirmada' });

      if (teacherEmail) {
        await transporter.sendMail({
          to: teacherEmail,
          subject: 'Clase confirmada',
          html: '<p>La familia ha confirmado la clase. Accede a la plataforma para más detalles.</p>'
        });
      }
      if (studentEmail) {
        await transporter.sendMail({
          to: studentEmail,
          subject: 'Clase confirmada',
          html: '<p>Has confirmado la clase. Accede a la plataforma para más detalles.</p>'
        });
      }

      return res.send('Respuesta registrada');
    } else if (decision === 'reject') {
      await docRef.update({ confirmacionAlumno: 'rechazada', estadoUnion: 'rechazada' });

      if (teacherEmail) {
        await transporter.sendMail({
          to: teacherEmail,
          subject: 'Clase rechazada',
          html: '<p>La familia ha rechazado la clase.</p>'
        });
      }
      if (studentEmail) {
        await transporter.sendMail({
          to: studentEmail,
          subject: 'Clase rechazada',
          html: '<p>Has rechazado la clase. Deberás solicitar una nueva si aún la necesitas.</p>'
        });
      }

      return res.send('Respuesta registrada');
    }

    return res.status(400).send('Invalid decision');
  } catch (err) {
    functions.logger.error('studentEmailResponse error', err);
    return res.status(500).send('error');
  }
});

// ----- Enviar correo de bienvenida -----
exports.sendWelcomeEmail = functions.auth
  .user()
  .onCreate(async (user) => {
    if (!user.email) return null;

    const name = user.displayName || '';
    const logoUrl =
      'https://studentproject-4c33d.web.app/logo512.png';

    const html = `
      <div style="font-family: Arial, sans-serif; color:#333;">
        <img src="${logoUrl}" alt="StudentProject" style="max-width:150px;margin-bottom:20px" />
        <h2>Bienvenido${name ? ' ' + name : ''} a StudentProject</h2>
        <p>Nos alegra que te hayas unido a nuestra comunidad de aprendizaje.</p>
        <p>Con nuestra plataforma puedes conectar con profesores, gestionar tus clases y seguir tu progreso.</p>
        <p>Si tienes alguna duda, responde a este correo y con gusto te ayudaremos.</p>
        <p>¡Gracias por confiar en nosotros!</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        to: after.email,
        subject: 'Bienvenido a StudentProject',
        html,
      });
      await change.after.ref.update({ welcomeEmailSent: true });
    } catch (err) {
      functions.logger.error('sendWelcomeEmail error', err);
    }
    return null;
  });
