import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { sendAssignmentEmails } from './email';
import { acceptPuja, confirmPuja, cancelOffer } from './api';

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

export async function acceptClassByTeacher(recordId, studentEmail, pujaId) {
  const ref = doc(db, 'registro_clases', recordId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  await updateDoc(ref, { estado: 'espera_alumno', acceptedByTeacher: serverTimestamp() });
  try {
    if (data.claseId) {
      await updateDoc(doc(db, 'clases', data.claseId), { estado: 'espera_alumno' });
    }
  } catch (err) {
    console.error(err);
  }
  let teacherCareer = '';
  try {
    if (data.profesorId) {
      const tSnap = await getDoc(doc(db, 'usuarios', data.profesorId));
      teacherCareer = tSnap.exists() ? tSnap.data().carrera || '' : '';
    }
  } catch (err) {
    console.error(err);
  }
  await sendAssignmentEmails({
    studentEmail,
    tutorName: data.padreNombre,
    studentName: data.alumnoNombre,
    teacherName: data.profesorNombre,
    teacherCareer,
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
  try {
    if (data.claseId) {
      await updateDoc(doc(db, 'clases', data.claseId), { estado: 'profesor_asignado' });
    }
  } catch (err) {
    console.error(err);
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
  let teacherCareer = '';
  try {
    if (data.profesorId) {
      const tSnap = await getDoc(doc(db, 'usuarios', data.profesorId));
      teacherCareer = tSnap.exists() ? tSnap.data().carrera || '' : '';
    }
  } catch (err) {
    console.error(err);
  }
  await sendAssignmentEmails({
    studentEmail: data.studentEmail,
    tutorName: data.padreNombre,
    studentName: data.alumnoNombre,
    teacherName: data.profesorNombre,
    teacherCareer,
    recipient: 'both',
  });
}

export async function rejectPendingClass(record, role) {
  const ref = doc(db, 'registro_clases', record.id);
  await deleteDoc(ref);
  try {
    await cancelOffer({ offerId: record.offerId, pujaId: record.pujaId, role });
  } catch (err) {
    console.error(err);
  }
  try {
    if (role === 'tutor') {
      if (record.claseId) {
        const offersSnap = await getDocs(collection(db, 'clases', record.claseId, 'ofertas'));
        for (const o of offersSnap.docs) {
          const data = o.data();
          if (data.profesorId) {
            try { await deleteDoc(doc(db, 'usuarios', data.profesorId, 'ofertas', o.id)); } catch (e) { console.error(e); }
          }
          await deleteDoc(o.ref);
        }
        await deleteDoc(doc(db, 'clases', record.claseId));
      }
    } else if (role === 'profesor') {
      if (record.claseId && record.offerId && record.profesorId) {
        await deleteDoc(doc(db, 'clases', record.claseId, 'ofertas', record.offerId));
        await deleteDoc(doc(db, 'usuarios', record.profesorId, 'ofertas', record.offerId));
        await updateDoc(doc(db, 'clases', record.claseId), {
          estado: 'pendiente',
          profesorSeleccionado: null,
          precioSeleccionado: null,
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
}
