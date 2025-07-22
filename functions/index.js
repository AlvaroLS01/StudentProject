/* eslint-disable */
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const cors = require("cors")({ origin: true });
const twilio = require("twilio");

admin.initializeApp();
const db = admin.firestore();

// SMTP config from functions.config()
const { host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass } = functions.config().smtp;
const transporter = nodemailer.createTransport({
service: "gmail",
auth: {
  user: "alvaro@studentproject.es",
  pass: "ibmf zall dcqj vbuw",
},
});

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


// Twilio config from functions.config()
const { sid: twilioSid, token: twilioToken, whatsapp_from: twilioFrom } =
  functions.config().twilio || {};
const twilioClient = twilio(twilioSid, twilioToken);

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

      // store phones and confirmation status
      await unionDoc.ref.update({
        profesorTelefono: teacherPhone || null,
        alumnoTelefono: studentPhone || null,
        confirmacionProfesor: "pendiente",
        confirmacionAlumno: null,
      });

      if (twilioSid && twilioToken && twilioFrom && teacherPhone) {
        await twilioClient.messages.create({
          from: twilioFrom,
          to: `whatsapp:${teacherPhone}`,
          body:
            `Has sido seleccionado como profesor para la clase de ${studentName}. ` +
            `Responde SI para confirmar o NO para rechazar.`,
        });
      }

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

// Webhook para recibir respuestas de WhatsApp
exports.twilioWebhook = functions.https.onRequest(async (req, res) => {
  const from = (req.body.From || "").replace("whatsapp:", "");
  const text = (req.body.Body || "").trim().toLowerCase();

  try {
    // ----- Respuesta del profesor -----
    const teacherSnap = await db
      .collection("clases_union")
      .where("profesorTelefono", "==", from)
      .where("confirmacionProfesor", "==", "pendiente")
      .limit(1)
      .get();

    if (!teacherSnap.empty) {
      const docSnap = teacherSnap.docs[0];
      const data = docSnap.data();

      if (text === "si" || text === "sí") {
        await docSnap.ref.update({ confirmacionProfesor: "aceptada" });

        if (data.alumnoTelefono) {
          await twilioClient.messages.create({
            from: twilioFrom,
            to: `whatsapp:${data.alumnoTelefono}`,
            body:
              "Se ha encontrado profesor para tu clase. ¿Confirmas la solicitud? Responde SI o NO.",
          });
          await docSnap.ref.update({ confirmacionAlumno: "pendiente" });
        }
      } else if (text === "no") {
        await docSnap.ref.update({ confirmacionProfesor: "rechazada" });

        // Reabrir la oferta para el admin
        if (data.claseId && data.offerId) {
          await db
            .doc(`clases/${data.claseId}`)
            .update({ estado: "pendiente", profesorSeleccionado: admin.firestore.FieldValue.delete() });
          await db
            .doc(`clases/${data.claseId}/ofertas/${data.offerId}`)
            .update({ estado: "rechazada" });
        }
      } else {
        await twilioClient.messages.create({
          from: twilioFrom,
          to: `whatsapp:${from}`,
          body: "Por favor responde SI o NO.",
        });
      }

      return res.status(200).send("ok");
    }

    // ----- Respuesta del alumno/padre -----
    const studentSnap = await db
      .collection("clases_union")
      .where("alumnoTelefono", "==", from)
      .where("confirmacionAlumno", "==", "pendiente")
      .limit(1)
      .get();

    if (!studentSnap.empty) {
      const docSnap = studentSnap.docs[0];
      const data = docSnap.data();

      if (text === "si" || text === "sí") {
        await docSnap.ref.update({ confirmacionAlumno: "aceptada", estadoUnion: "confirmada" });

        if (data.profesorTelefono) {
          await twilioClient.messages.create({
            from: twilioFrom,
            to: `whatsapp:${data.profesorTelefono}`,
            body: "La familia ha confirmado la clase. Accede a la web para más detalles.",
          });
        }
        if (data.alumnoTelefono) {
          await twilioClient.messages.create({
            from: twilioFrom,
            to: `whatsapp:${data.alumnoTelefono}`,
            body: "Clase confirmada. Accede a la web para más detalles.",
          });
        }
      } else if (text === "no") {
        await docSnap.ref.update({ confirmacionAlumno: "rechazada", estadoUnion: "rechazada" });
        if (data.profesorTelefono) {
          await twilioClient.messages.create({
            from: twilioFrom,
            to: `whatsapp:${data.profesorTelefono}`,
            body: "La familia ha rechazado la clase.",
          });
        }
      } else {
        await twilioClient.messages.create({
          from: twilioFrom,
          to: `whatsapp:${from}`,
          body: "Por favor responde SI o NO.",
        });
      }

      return res.status(200).send("ok");
    }

    return res.status(200).send("no-action");
  } catch (err) {
    functions.logger.error("Twilio webhook error", err);
    return res.status(500).send("error");
  }
});
