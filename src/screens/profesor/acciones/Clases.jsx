// src/screens/profesor/acciones/Clases.jsx
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
  background: #eef9f7;
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 800px;
  margin: auto;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Title = styled.h2`
  color: #034640;
  margin-bottom: 1rem;
`;

const GroupTitle = styled.h3`
  margin: 1.5rem 0 0.75rem;
  color: #01675b;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const Field = styled.p`
  margin: 0.4rem 0;
  & > strong { color: #014f40; }
`;

export default function ClasesProfesor() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'clases_union'), where('profesorId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      let data = [];
      for (const docu of snap.docs) {
        const union = docu.data();
        const subSnap = await getDocs(
          query(
            collection(db, 'clases_union', docu.id, 'clases_asignadas'),
            where('estado', '==', 'aceptada')
          )
        );
        const clases = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (clases.length) {
          data.push({ alumno: `${union.alumnoNombre} ${union.alumnoApellidos || ''}`.trim(), clases });
        }
      }
      setGroups(data);
    })();
  }, []);

  return (
    <Page>
      <Container>
        <Title>Mis clases asignadas</Title>
        {groups.length === 0 && <p>No tienes clases aceptadas.</p>}
        {groups.map(g => (
          <div key={g.alumno}>
            <GroupTitle>{g.alumno}</GroupTitle>
            {g.clases.map(c => (
              <Card key={c.id}>
                <Field><strong>Asignatura:</strong> {c.asignatura}</Field>
                <Field><strong>Fecha:</strong> {c.fecha} {c.hora}</Field>
                <Field><strong>Modalidad:</strong> {c.modalidad}</Field>
                <Field><strong>Duración:</strong> {c.duracion}h</Field>
                <Field><strong>Ganancia:</strong> €{(c.precioTotalProfesor || 0).toFixed(2)}</Field>
              </Card>
            ))}
          </div>
        ))}
      </Container>
    </Page>
  );
}
