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
const cors = require("cors")({origin: true});

admin.initializeApp();
const db = admin.firestore();

// Si quieres controlar concurrencia en v1, por función:
// exports.sendCustomPasswordResetEmail = functions.runWith({ maxInstances: 10 }).https.onRequest(...);

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
        const teacherName = union.profesorNombre ||
        (teacherSnap.exists ?
          `${teacherSnap.data().nombre} ${teacherSnap.data().apellidos || ""}`.trim() :
          "");

        const studentEmail = studentSnap.exists ? studentSnap.data().email : null;
        const studentName = union.padreNombre ||
        union.alumnoNombre ||
        (studentSnap.exists ?
          `${studentSnap.data().nombre} ${studentSnap.data().apellidos || ""}`.trim() :
          "");

        const asignatura = after.asignatura || (after.asignaturas || []).join(", ");
        const fecha = after.fechaInicio || "";

        const studentMessage = {
          to: [studentEmail],
          message: {
            subject: "Profesor asignado",
            html:
            `<p>Hola, ${studentName}.</p>` +
            `<p>Para la oferta de clase que solicitaste, se ha elegido al profesor ${teacherName}.</p>` +
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
            `<p>Has sido seleccionado como el mejor candidato para la clase solicitada por ${studentName}.</p>` +
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

exports.sendCustomPasswordResetEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Preflight CORS
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const email = (req.body.email || "").trim();
    if (!email) {
      res.status(400).json({error: "Email requerido"});
      return;
    }

    try {
      const userSnap = await db
          .collection("usuarios")
          .where("email", "==", email)
          .limit(1)
          .get();

      if (userSnap.empty) {
        res.status(404).json({error: "El correo no está registrado"});
        return;
      }

      const userData = userSnap.docs[0].data();
      const nombre = `${userData.nombre || ""} ${userData.apellidos || ""}`.trim();

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

      res.set("Access-Control-Allow-Origin", "*");
      res.json({success: true});
    } catch (err) {
      functions.logger.error("Error al enviar correo de restablecimiento", err);
      res.status(500).json({error: "No se pudo procesar la solicitud"});
    }
  });
});
