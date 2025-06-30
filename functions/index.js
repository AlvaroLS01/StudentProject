/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

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
              teacherSnap.data().apellidos || ""
            }`.trim() :
            "");

        const studentEmail = studentSnap.exists ?
        studentSnap.data().email :
        null;
        const studentName = union.padreNombre || union.alumnoNombre ||
          (studentSnap.exists ?
            `${studentSnap.data().nombre} ${
              studentSnap.data().apellidos || ""
            }`.trim() :
            "");

        const asignatura =
          after.asignatura || (after.asignaturas || []).join(", ");
        const fecha = after.fechaInicio || "";

        const studentMessage = {
          to: [studentEmail],
          message: {
            subject: "Profesor asignado",
            html:
              `<p>Hola, ${studentName}.</p>` +
              `<p>Para la oferta de clase que solicitaste, ` +
              `se ha elegido al profesor ${teacherName}.</p>` +
              `<p>Asignatura: ${asignatura}</p>` +
              (fecha ? `<p>Fecha de inicio: ${fecha}</p>` : "") +
              "<p>Puede ver la información en la pestaña \"Mis " +
              "Profesores\".</p>",
          },
        };

        const teacherMessage = {
          to: [teacherEmail],
          message: {
            subject: "Nueva clase asignada",
            html:
              `<p>Hola, ${teacherName}.</p>` +
              `<p>Has sido seleccionado como el mejor candidato ` +
              `para la clase solicitada por ${studentName}.</p>` +
              `<p>Asignatura: ${asignatura}</p>` +
              (fecha ? `<p>Fecha de inicio: ${fecha}</p>` : "") +
              "<p>Puede consultar la información en su pestaña de \"Mis " +
              "Alumnos\".</p>",
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

exports.sendCustomPasswordResetEmail = functions.https.onCall(async (data) => {
  const email = (data.email || "").trim();
  if (!email) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Email requerido",
    );
  }

  try {
    const userSnap = await db
        .collection("usuarios")
        .where("email", "==", email)
        .limit(1)
        .get();

    if (userSnap.empty) {
      throw new functions.https.HttpsError(
          "not-found",
          "El correo no está registrado",
      );
    }

    const userData = userSnap.docs[0].data();
    const nombre = (
      `${userData.nombre || ""} ${userData.apellidos || ""}`
    ).trim();

    const link = await admin.auth().generatePasswordResetLink(email, {
      url: "https://studentproject-4c33d.web.app/inicio",
    });

    const html =
        `<p>Hola, ${nombre || "usuario"}.</p>` +
        `<p>Parece que has olvidado la contraseña.</p>` +
        `<p>Pulsa el siguiente botón para restablecerla:</p>` +
        `<p><a href="${link}" style="background:#ccf3e5;color:#004640;` +
        `padding:10px 20px;border-radius:4px;text-decoration:none;">` +
        `Restablecer contraseña</a></p>`;

    await db.collection("mail").add({
      to: [email],
      message: {
        subject: "Restablecer contraseña",
        html: html,
      },
    });

    return {success: true};
  } catch (err) {
    functions.logger.error("Error al enviar correo de restablecimiento", err);
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }
    throw new functions.https.HttpsError(
        "internal",
        "No se pudo procesar la solicitud",
    );
  }
});
