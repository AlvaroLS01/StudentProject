/* eslint-disable */
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const {google} = require("googleapis");

const smtpConfig = functions.config().smtp || {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass,
  },
});

admin.initializeApp();
const db = admin.firestore();

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

      const union = unionSnap.docs[0].data();
      const teacherId = union.profesorId;
      const studentId = union.alumnoId;

      const [teacherSnap, studentSnap] = await Promise.all([
        db.collection("usuarios").doc(teacherId).get(),
        db.collection("usuarios").doc(studentId).get(),
      ]);

      const teacherEmail = teacherSnap.exists ? teacherSnap.data().email : null;
      const teacherName =
        union.profesorNombre ||
        (teacherSnap.exists
          ? `${teacherSnap.data().nombre} ${teacherSnap.data().apellidos || ""}`.trim()
          : "");

      const studentEmail = studentSnap.exists ? studentSnap.data().email : null;
      const studentName =
        union.padreNombre ||
        union.alumnoNombre ||
        (studentSnap.exists
          ? `${studentSnap.data().nombre} ${studentSnap.data().apellidos || ""}`.trim()
          : "");

      const asignatura = after.asignatura || (after.asignaturas || []).join(", ");
      const fecha = after.fechaInicio || "";

      const studentMessage = {
        to: [studentEmail],
        message: {
          subject: "Profesor asignado",
          html:
            `<p>Hola, ${studentName}.</p>` +
            `<p>Para la oferta de clase que solicitaste, se ha elegido al ` +
            `profesor ${teacherName}.</p>` +
            `<p>Asignatura: ${asignatura}</p>` +
            (fecha ? `<p>Fecha de inicio: ${fecha}</p>` : "") +
            `<p>Puede ver la información en la pestaña "Mis Profesores".</p>`,
        },
      };

      const teacherMessage = {
        to: [teacherEmail],
        message: {
          subject: "Nueva clase asignada",
          html:
            `<p>Hola, ${teacherName}.</p>` +
            `<p>Has sido seleccionado como el mejor candidato para la clase ` +
            `solicitada por ${studentName}.</p>` +
            `<p>Asignatura: ${asignatura}</p>` +
            (fecha ? `<p>Fecha de inicio: ${fecha}</p>` : "") +
            `<p>Puede consultar la información en su pestaña de "Mis Alumnos".</p>`,
        },
      };

      await Promise.all([
        db.collection("mail").add(studentMessage),
        db.collection("mail").add(teacherMessage),
      ]);
      return null;
    } catch (error) {
      functions.logger.error("Error al enviar correos", error);
      return null;
    }
  });

// Trigger HTTP para envío de email de restablecimiento
exports.sendCustomPasswordResetEmail = functions.https.onRequest(async (req, res) => {
  try {
    const {email} = req.body;
    const link = await admin.auth().generatePasswordResetLink(email, {
      url: "https://studentproject-4c33d.web.app/inicio",
    });

    await transporter.sendMail({
      from: "no-reply@tudominio.com",
      to: email,
      subject: "Restablecer contraseña",
      html: `<p>Pulsa <a href="${link}">aquí</a> para restablecer tu contraseña.</p>`,
    });

    res.json({success: true});
  } catch (error) {
    console.error(error);
    res.status(500).send({error: error.message});
  }
});

// Trigger para volcar en Google Sheets
exports.logClassToSheet = functions.firestore
  .document("clases_union/{unionId}/clases_asignadas/{assignmentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.estado === "aceptada" || after.estado !== "aceptada") {
      return null;
    }

    // Muevo aquí la inicialización de Sheets para no bloquear la carga del módulo
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
    const sheetsApi = google.sheets({version: "v4", auth: sheetsAuth});

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

      await sheetsApi.spreadsheets.values.append({
        spreadsheetId: sheetsConfig.spreadsheet_id,
        range: "A1",
        valueInputOption: "USER_ENTERED",
        requestBody: {values: [row]},
      });
      return null;
    } catch (error) {
      functions.logger.error("Error writing to Google Sheets", error);
      return null;
    }
  });
