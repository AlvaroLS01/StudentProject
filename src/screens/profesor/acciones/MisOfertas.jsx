import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import Card from '../../../components/CommonCard';
import InfoGrid from '../../../components/InfoGrid';
import LoadingScreen from '../../../components/LoadingScreen';
import { auth, db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { acceptClassByTeacher, rejectPendingClass } from '../../../utils/classWorkflow';

const StatusText = styled.span`
  font-weight: 600;
  color: ${p => p.color};
`;

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

export default function MisOfertas() {
  const [offers, setOffers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(new Set());

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) { setLoading(false); return; }

      const snap = await getDocs(collection(db, 'usuarios', u.uid, 'ofertas'));
      const data = [];

      for (const d of snap.docs) {
        const { classId } = d.data();
        let classData = {};
        let offerData = {};
        try {
          const offSnap = await getDoc(doc(db, 'clases', classId, 'ofertas', d.id));
          if (offSnap.exists()) offerData = offSnap.data();
        } catch (err) {
          console.error(err);
        }
        try {
          const cSnap = await getDoc(doc(db, 'clases', classId));
          if (cSnap.exists()) classData = { classEstado: cSnap.data().estado, alumnoNombre: cSnap.data().alumnoNombre };
        } catch (err) {
          console.error(err);
        }
        data.push({ id: d.id, classId, ...classData, ...offerData });
      }

      setOffers(data);

      const q = query(collection(db, 'registro_clases'), where('profesorId', '==', u.uid));
      const snap2 = await getDocs(q);
      const assignmentsData = [];
      for (const d of snap2.docs) {
        const rec = { id: d.id, ...d.data() };
        try {
          const cSnap = await getDoc(doc(db, 'clases', rec.claseId));
          if (cSnap.exists()) rec.classInfo = cSnap.data();
          const sSnap = await getDoc(doc(db, 'usuarios', rec.alumnoId));
          if (sSnap.exists()) rec.studentEmail = sSnap.data().email || '';
        } catch (err) {
          console.error(err);
        }
        assignmentsData.push(rec);
      }
      setAssignments(assignmentsData);
      setLoading(false);
    })();
  }, []);

  const alertMap = useMemo(() => {
    const map = new Map();
    assignments.forEach(a => map.set(a.offerId, a));
    return map;
  }, [assignments]);

  const merged = useMemo(
    () => offers.map(o => ({ ...o, alert: alertMap.get(o.id) })),
    [offers, alertMap]
  );

  const statusInfo = (offer, alert) => {
    if (alert) {
      if (alert.estado === 'espera_profesor') return { text: 'Pendiente tu aceptación', color: '#d69e2e' };
      if (alert.estado === 'espera_alumno') return { text: 'Esperando al alumno', color: '#2f855a' };
    }
    if (offer.estado === 'cancelada') return { text: 'Cancelada', color: '#e53e3e' };
    if (offer.estado === 'aceptada') return { text: 'Oferta aceptada', color: '#2f855a' };
    if (offer.classEstado === 'aceptada') return { text: 'No seleccionada', color: '#718096' };
    return { text: 'Pendiente', color: '#d69e2e' };
  };

  const handleAccept = async rec => {
    if (processing.has(rec.id)) return;
    setProcessing(prev => new Set(prev).add(rec.id));
    try {
      await acceptClassByTeacher(rec.id, rec.studentEmail, rec.alumnoNombre, rec.pujaId);
      setAssignments(as => as.map(a => a.id === rec.id ? { ...a, estado: 'espera_alumno' } : a));
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
    }
  };

  const handleCancel = async rec => {
    if (processing.has(rec.id)) return;
    setProcessing(prev => new Set(prev).add(rec.id));
    try {
      await rejectPendingClass(rec.id);
      setAssignments(as => as.filter(a => a.id !== rec.id));
      setOffers(os => os.map(o => o.id === rec.offerId ? { ...o, estado: 'cancelada' } : o));
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
    }
  };

  if (loading) return <LoadingScreen fullscreen />;

  return (
    <div>
      {merged.length === 0 ? (
        <p>No has enviado ofertas.</p>
      ) : (
        merged.map(o => {
          const alert = o.alert;
          const { text, color } = statusInfo(o, alert);
          return (
            <Card key={o.id}>
              {alert && alert.estado === 'espera_profesor' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Button onClick={() => handleAccept(alert)} disabled={processing.has(alert.id)}>Aceptar</Button>
                  <CancelButton onClick={() => handleCancel(alert)} disabled={processing.has(alert.id)}>Cancelar</CancelButton>
                </div>
              )}
              <InfoGrid>
                <div><strong>Alumno:</strong> {o.alumnoNombre || alert?.alumnoNombre || '-'}</div>
                <div><strong>Asignaturas:</strong> {o.asignaturas ? o.asignaturas.join(', ') : o.asignatura || alert?.classInfo?.asignaturas?.join(', ') || alert?.classInfo?.asignatura}</div>
                {o.precio && (<div><strong>Precio ofertado:</strong> €{o.precio}</div>)}
                <div><strong>Estado:</strong> <StatusText color={color}>{text}</StatusText></div>
              </InfoGrid>
            </Card>
          );
        })
      )}
    </div>
  );
}
