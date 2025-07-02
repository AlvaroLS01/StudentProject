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

const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 587,
  auth: {
    user: functions.config().smtp.user,
    pass: functions.config().smtp.pass,
  },
});

admin.initializeApp();
const db = admin.firestore();

// Si quieres controlar concurrencia en v1, por función:
// exports.sendCustomPasswordResetEmail =
//   functions.runWith({maxInstances: 10}).https.onRequest(...);

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
          functions.logger.warn(
              "No se encontró la unión para la clase",
              classId,
          );
          return null;
        }

        const union = unionSnap.docs[0].data();
        const teacherId = union.profesorId;
        const studentId = union.alumnoId;

        const [teacherSnap, studentSnap] = await Promise.all([
          db.collection("usuarios").doc(teacherId).get(),
          db.collection("usuarios").doc(studentId).get(),
        ]);

        const teacherEmail = teacherSnap.exists ?
          teacherSnap.data().email :
          null;
        const teacherName = union.profesorNombre ||
          (teacherSnap.exists ?
            `${teacherSnap.data().nombre} ${
              teacherSnap.data().apellidos || ""}`.trim() :
            "");

        const studentEmail = studentSnap.exists ?
          studentSnap.data().email :
          null;
        const studentName = union.padreNombre ||
          union.alumnoNombre ||
          (studentSnap.exists ?
            `${studentSnap.data().nombre} ${
              studentSnap.data().apellidos || ""}`.trim() :
            "");

        const asignatura = after.asignatura ||
          (after.asignaturas || []).join(", ");
        const fecha = after.fechaInicio || "";

        const studentMessage = {
          to: [studentEmail],
          message: {
            subject: "Profesor asignado",
            html:
            `<p>Hola, ${studentName}.</p>` +
            `<p>Para la oferta de clase que solicitaste, se ha elegido al `+
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
            `<p>Has sido seleccionado como el mejor candidato para la clase `+
            `solicitada por ${studentName}.</p>` +
            `<p>Asignatura: ${asignatura}</p>` +
            (fecha ? `<p>Fecha de inicio: ${fecha}</p>` : "") +
            `<p>Puede consultar la información en su pestaña de "Mis `+
            `Alumnos".</p>`,
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
