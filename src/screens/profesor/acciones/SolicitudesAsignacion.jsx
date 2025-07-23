import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Card from '../../../components/CommonCard';
import InfoGrid from '../../../components/InfoGrid';
import LoadingScreen from '../../../components/LoadingScreen';
import { auth, db } from '../../../firebase/firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { acceptClassByTeacher, rejectPendingClass } from '../../../utils/classWorkflow';

const Button = styled.button`
  margin-top: 0.5rem;
  background: #006d5b;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #005047;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #e53e3e;
  &:hover:not(:disabled) {
    background: #c53030;
  }
`;

export default function SolicitudesAsignacion() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(new Set());

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) { setLoading(false); return; }
      const q = query(collection(db, 'registro_clases'), where('profesorId', '==', u.uid));
      const snap = await getDocs(q);
      const data = [];
      for (const d of snap.docs) {
        const rec = { id: d.id, ...d.data() };
        try {
          const cSnap = await getDoc(doc(db, 'clases', rec.claseId));
          if (cSnap.exists()) {
            rec.classInfo = cSnap.data();
          }
          const sSnap = await getDoc(doc(db, 'usuarios', rec.alumnoId));
          if (sSnap.exists()) {
            rec.studentEmail = sSnap.data().email || '';
          }
        } catch(err) {
          console.error(err);
        }
        data.push(rec);
      }
      setRecords(data);
      setLoading(false);
    })();
  }, []);

  const handleAccept = async rec => {
    if (processing.has(rec.id)) return;
    setProcessing(prev => new Set(prev).add(rec.id));
    try {
      await acceptClassByTeacher(rec.id, rec.studentEmail, rec.alumnoNombre);
      setRecords(rs => rs.map(r => r.id === rec.id ? { ...r, estado: 'pendiente_alumno' } : r));
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
    }
  };

  const handleCancel = async rec => {
    if (processing.has(rec.id)) return;
    setProcessing(prev => new Set(prev).add(rec.id));
    try {
      await rejectPendingClass(rec.id);
      setRecords(rs => rs.filter(r => r.id !== rec.id));
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
    }
  };

  if (loading) return <LoadingScreen fullscreen />;

  return (
    <div>
      {records.length === 0 ? (
        <p>No tienes solicitudes pendientes.</p>
      ) : (
        records.map(r => (
          <Card key={r.id}>
            <InfoGrid>
              <div><strong>Alumno:</strong> {r.alumnoNombre}</div>
              <div><strong>Asignaturas:</strong> {r.classInfo?.asignaturas ? r.classInfo.asignaturas.join(', ') : r.classInfo?.asignatura}</div>
              <div><strong>Estado:</strong> {r.estado === 'pendiente_profesor' ? 'Pendiente tu aceptación' : 'Esperando al alumno'}</div>
            </InfoGrid>
            {r.estado === 'pendiente_profesor' && (
              <div>
                <Button onClick={() => handleAccept(r)} disabled={processing.has(r.id)}>Aceptar</Button>{' '}
                <CancelButton onClick={() => handleCancel(r)} disabled={processing.has(r.id)}>Cancelar</CancelButton>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
