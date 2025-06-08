// src/screens/alumno/acciones/Clases.jsx
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

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

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const Field = styled.div`
  margin-bottom: 0.25rem;
  & > strong { color: #014f40; }
`;

export default function Clases() {
  const [clases, setClases] = useState([]);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const q = query(collection(db, 'clases_union'), where('alumnoId', '==', u.uid));
      const snap = await getDocs(q);
      let all = [];
      for (const docu of snap.docs) {
        const union = docu.data();
        const subSnap = await getDocs(
          query(
            collection(db, 'clases_union', docu.id, 'clases_asignadas'),
            where('estado', '==', 'aceptada')
          )
        );
        subSnap.docs.forEach(d => {
          all.push({ id: d.id, profesorNombre: union.profesorNombre, ...d.data() });
        });
      }
      setClases(all);
    })();
  }, []);

  return (
    <Page>
      <Container>
        <Title>Mis clases</Title>
        {clases.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No tienes clases asignadas.</p>
        ) : (
          clases.map(c => (
            <Card key={c.id}>
              <Field><strong>Asignatura:</strong> {c.asignatura}</Field>
              <Field><strong>Profesor:</strong> {c.profesorNombre}</Field>
              <Field><strong>Fecha:</strong> {c.fecha} {c.hora}</Field>
              <Field><strong>Modalidad:</strong> {c.modalidad}</Field>
              <Field><strong>Duración:</strong> {c.duracion}h</Field>
            </Card>
          ))
        )}
      </Container>
    </Page>
  );
}
