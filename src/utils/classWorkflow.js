import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { sendAssignmentEmails } from './email';
import { acceptPuja, confirmPuja } from './api';

export async function registerPendingClass({ classId, offer, alumnoId, alumnoNombre, padreNombre, hijoId }) {
  await addDoc(collection(db, 'registro_clases'), {
    claseId: classId,
    offerId: offer.id,
    alumnoId,
    alumnoNombre,
    profesorId: offer.profesorId,
    profesorNombre: offer.profesorNombre,
    padreNombre: padreNombre || null,
    hijoId: hijoId || null,
    pujaId: offer.pujaId || null,
    estado: 'espera_profesor',
    createdAt: serverTimestamp(),
  });
}

export async function acceptClassByTeacher(recordId, studentEmail, studentName, pujaId) {
  const ref = doc(db, 'registro_clases', recordId);
  await updateDoc(ref, { estado: 'espera_alumno', acceptedByTeacher: serverTimestamp() });
  await sendAssignmentEmails({
    studentEmail,
    studentName,
    recipient: 'student',
  });
  if (pujaId) {
    try {
      await acceptPuja(pujaId);
    } catch (err) {
      console.error(err);
    }
  }
}

export async function acceptClassByStudent(recordId, data) {
  const ref = doc(db, 'registro_clases', recordId);
  await deleteDoc(ref);
  if (data.pujaId) {
    try {
      await confirmPuja(data.pujaId);
    } catch (err) {
      console.error(err);
    }
  }
  await addDoc(collection(db, 'clases_union'), {
    claseId: data.claseId,
    offerId: data.offerId,
    alumnoId: data.alumnoId,
    alumnoNombre: data.alumnoNombre,
    profesorId: data.profesorId,
    profesorNombre: data.profesorNombre,
    padreNombre: data.padreNombre || null,
    hijoId: data.hijoId || null,
    estado: 'clase_formada',
    createdAt: serverTimestamp(),
  });
  await sendAssignmentEmails({
    studentEmail: data.studentEmail,
    studentName: data.alumnoNombre,
    teacherName: data.profesorNombre,
    recipient: 'both',
  });
}

export async function rejectPendingClass(recordId) {
  const ref = doc(db, 'registro_clases', recordId);
  await deleteDoc(ref);
}
