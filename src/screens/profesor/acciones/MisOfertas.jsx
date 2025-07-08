import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Card from '../../../components/CommonCard';
import InfoGrid from '../../../components/InfoGrid';
import LoadingScreen from '../../../components/LoadingScreen';
import { auth, db } from '../../../firebase/firebaseConfig';
import { collectionGroup, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

const StatusText = styled.span`
  font-weight: 600;
  color: ${p => p.color};
`;

export default function MisOfertas() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) { setLoading(false); return; }
      const q = query(collectionGroup(db, 'ofertas'), where('profesorId', '==', u.uid));
      const snap = await getDocs(q);
      const data = [];
      for (const d of snap.docs) {
        const classId = d.ref.parent.parent.id;
        let classData = {};
        try {
          const cSnap = await getDoc(doc(db, 'clases', classId));
          if (cSnap.exists()) classData = { classEstado: cSnap.data().estado, alumnoNombre: cSnap.data().alumnoNombre };
        } catch (err) {
          console.error(err);
        }
        data.push({ id: d.id, classId, ...classData, ...d.data() });
      }
      setOffers(data);
      setLoading(false);
    })();
  }, []);

  const statusInfo = offer => {
    if (offer.estado === 'aceptada') return { text: 'Oferta aceptada', color: '#2f855a' };
    if (offer.classEstado === 'aceptada') return { text: 'No seleccionada', color: '#718096' };
    return { text: 'Pendiente', color: '#d69e2e' };
  };

  if (loading) return <LoadingScreen fullscreen />;

  return (
    <div>
      {offers.length === 0 ? (
        <p>No has enviado ofertas.</p>
      ) : (
        offers.map(o => {
          const { text, color } = statusInfo(o);
          return (
            <Card key={o.id}>
              <InfoGrid>
                <div><strong>Alumno:</strong> {o.alumnoNombre || '-'}</div>
                <div><strong>Asignaturas:</strong> {o.asignaturas ? o.asignaturas.join(', ') : o.asignatura}</div>
                <div><strong>Precio ofertado:</strong> €{o.precio}</div>
                <div><strong>Estado:</strong> <StatusText color={color}>{text}</StatusText></div>
              </InfoGrid>
            </Card>
          );
        })
      )}
    </div>
  );
}
