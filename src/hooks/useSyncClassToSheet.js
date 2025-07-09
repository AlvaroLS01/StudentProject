// src/hooks/useSyncClassToSheet.js
// Hook to sync a Firestore class document with Google Sheets via webhook
import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbxnWRLywG3iF9VhIg7J1JRpXoW3EXvJMs-mGeqbyfz4ELOSARLExBi71ok57Tsybxev/exec';
const SHEET_SECRET = process.env.REACT_APP_SHEET_SECRET;

export function useSyncClassToSheet(unionId, assignmentId) {
  useEffect(() => {
    if (!unionId || !assignmentId) return;
    const ref = doc(db, 'clases_union', unionId, 'clases_asignadas', assignmentId);
    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.estado !== 'aceptada') return;
      const payload = {
        secret: SHEET_SECRET,
        idClase: assignmentId,
        emailProfesor: data.emailProfesor,
        nombreProfesor: data.nombreProfesor,
        emailAlumno: data.emailAlumno,
        nombreAlumno: data.nombreAlumno,
        curso: data.curso,
        asignatura: data.asignatura,
        ciudad: data.ciudad,
        fecha: data.fecha,
        duracion: data.duracion,
        modalidad: data.modalidad,
        numeroAlumnos: data.numeroAlumnos,
        precioTotalPadres: data.precioTotalPadres,
        precioTotalProfesor: data.precioTotalProfesor,
        beneficio: (data.precioTotalPadres || 0) - (data.precioTotalProfesor || 0),
      };

      fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(err => console.error('Sheet sync error', err));
    });
    return () => unsub();
  }, [unionId, assignmentId]);
}
