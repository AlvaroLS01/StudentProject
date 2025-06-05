// src/screens/alumno/Clases.jsx
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px) }
  to   { opacity: 1; transform: translateY(0) }
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

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem 1rem;
`;

const Field = styled.div`
  & > strong { color: #014f40; }
`;

const Badge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: ${p => p.pending ? '#F6AD55' : '#48BB78'};
`;

export default function Clases() {
  const [clases, setClases] = useState([]);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const q = query(
        collection(db, 'clases'),
        where('alumnoId', '==', u.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClases(data);
    })();
  }, []);

  return (
    <Page>
      <Container>
        <Title>Mis clases</Title>
        {clases.length === 0
          ? <p style={{ textAlign: 'center', color: '#666' }}>No tienes clases.</p>
          : clases.map(c => (
            <Card key={c.id}>
              <InfoGrid>
                <Field><strong>Asignatura:</strong> {c.asignatura}</Field>
                <Badge pending={c.estado === 'pendiente'}>
                  {c.estado === 'pendiente'
                    ? 'Pendiente: Asignación en curso'
                    : 'Asignada'}
                </Badge>
                <Field><strong>Curso:</strong> {c.curso}</Field>
                {c.estado === 'aceptada' && (
                  <Field><strong>Profesor:</strong> {c.profesorSeleccionado}</Field>
                )}
                <Field><strong>Fecha y hora:</strong> {c.fecha} a las {c.hora}</Field>
                <Field><strong>Modalidad:</strong> {c.modalidad}</Field>
                {c.zona && <Field><strong>Zona:</strong> {c.zona}</Field>}
                <Field>
                  <strong>Duración:</strong>{' '}
                  {c.duracion === '1.5' ? '1h y media' : `${c.duracion}h`}
                </Field>
                <Field><strong>Notas:</strong> {c.notas || '–'}</Field>
                {c.estado === 'aceptada' && (
                  <Field><strong>Precio acordado:</strong> €{c.precioSeleccionado}</Field>
                )}
              </InfoGrid>
            </Card>
          ))
        }
      </Container>
    </Page>
  );
}
