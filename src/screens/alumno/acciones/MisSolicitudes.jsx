// src/screens/alumno/acciones/MisSolicitudes.jsx
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { useChild } from '../../../ChildContext';
import Card from '../../../components/CommonCard';
import InfoGrid from '../../../components/InfoGrid';
import ProgressBar from '../../../components/ProgressBar';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { acceptClassByStudent, rejectPendingClass } from '../../../utils/classWorkflow';
import { formatDate } from '../../../utils/formatDate';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  padding: 1rem;
  background: #f0f8f7;
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 800px;
  margin: auto;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  color: #034640;
  font-size: 2rem;
  text-align: center;
`;

const Label = styled.span`
  font-weight: 500;
  color: #014F40;
`;

const Value = styled.span`
  color: #333;
`;

const AcceptButton = styled.button`
  margin-top: 0.5rem;
  margin-right: 0.5rem;
  background: #006d5b;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  &:hover:not(:disabled) {
    background: #005047;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  margin-top: 0.5rem;
  margin-right: 0.5rem;
  background: #f56565;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  &:hover:not(:disabled) {
    background: #c53030;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const getProgressData = s => {
  if (s.estado === 'pendiente') {
    return s.offers === 0
      ? { percent: 20, color: '#e53e3e', label: 'En búsqueda de profesor' }
      : { percent: 40, color: '#dd6b20', label: 'En selección de profesor' };
  }
  if (s.estado === 'en_proceso') {
    return { percent: 60, color: '#3182ce', label: 'Esperando respuesta del profesor' };
  }
  if (s.estado === 'espera_alumno') {
    return { percent: 80, color: '#805ad5', label: 'Esperando respuesta del tutor' };
  }
  return { percent: 100, color: '#38a169', label: 'Profesor asignado' };
};

export default function MisSolicitudes() {
  const { selectedChild } = useChild();
  const [solicitudes, setSolicitudes] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) { return; }
      let q = query(collection(db, 'clases'), where('alumnoId', '==', u.uid));
      if (selectedChild) {
        q = query(
          collection(db, 'clases'),
          where('alumnoId', '==', u.uid),
          where('hijoId', '==', selectedChild.id)
        );
      }
      const snap = await getDocs(q);
      const data = [];
      for (const d of snap.docs) {
        const offers = await getDocs(collection(db, 'clases', d.id, 'ofertas'));
        data.push({ id: d.id, offers: offers.size, ...d.data() });
      }
      setSolicitudes(data);
      let q2 = query(collection(db, 'registro_clases'), where('alumnoId', '==', u.uid), where('estado', '==', 'espera_alumno'));
      if (selectedChild) {
        q2 = query(
          collection(db, 'registro_clases'),
          where('alumnoId', '==', u.uid),
          where('hijoId', '==', selectedChild.id),
          where('estado', '==', 'espera_alumno')
        );
      }
      const snap2 = await getDocs(q2);
      setPendingAssignments(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [selectedChild]);

  const acceptAssignment = async rec => {
    if (processingIds.has(rec.id)) return;
    setProcessingIds(prev => new Set(prev).add(rec.id));
    try {
      const emailUser = auth.currentUser ? auth.currentUser.email : '';
      await acceptClassByStudent(rec.id, { ...rec, studentEmail: emailUser });
      setPendingAssignments(pa => pa.filter(r => r.id !== rec.id));
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
    }
  };

  const rejectAssignment = async rec => {
    if (processingIds.has(rec.id)) return;
    setProcessingIds(prev => new Set(prev).add(rec.id));
    try {
      await rejectPendingClass(rec, 'tutor');
      setPendingAssignments(pa => pa.filter(r => r.id !== rec.id));
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
    }
  };

  return (
    <Page>
      <Container>
        <Title>Mis Solicitudes</Title>
        {pendingAssignments.length === 0 && solicitudes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No tienes solicitudes.</p>
        ) : (
          <>
            {pendingAssignments.map(p => (
              <Card key={p.id}>
                <p>
                  ¿Quieres aceptar la clase con{' '}
                  <Link to={`/perfil/${p.profesorId}`}>{p.profesorNombre}</Link>
                  ?
                </p>
                <div>
                  <RejectButton onClick={() => rejectAssignment(p)} disabled={processingIds.has(p.id)}>Rechazar</RejectButton>{' '}
                  <AcceptButton onClick={() => acceptAssignment(p)} disabled={processingIds.has(p.id)}>Confirmar</AcceptButton>
                </div>
              </Card>
            ))}
            {solicitudes.map(s => {
              const { percent, color, label } = getProgressData(s);
              return (
                <Card key={s.id}>
                  <InfoGrid>
                    <div>
                      <Label>Asignaturas:</Label> <Value>{s.asignaturas ? s.asignaturas.join(', ') : s.asignatura}</Value>
                    </div>
                    <div>
                      <Label>Curso:</Label> <Value>{s.curso}</Value>
                    </div>
                    <div>
                      <Label>Modalidad:</Label> <Value>{s.modalidad}</Value>
                    </div>
                    <div>
                      <Label>Inicio:</Label> <Value>{formatDate(s.fechaInicio)}</Value>
                    </div>
                    <div>
                      <Label>Horas/semana:</Label> <Value>{s.horasSemana}</Value>
                    </div>
                    <div>
                      <Label>Estado:</Label> <Value>{label}</Value>
                    </div>
                  </InfoGrid>
                  {label !== 'Profesor asignado' && (
                    <ProgressBar percent={percent} color={color} label={label} />
                  )}
                </Card>
              );
            })}
          </>
        )}
      </Container>
    </Page>
  );
}

