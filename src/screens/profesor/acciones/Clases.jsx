// src/screens/profesor/acciones/Clases.jsx
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc
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

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0 0.75rem;
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.75rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.5rem 1rem;
`;

const Label = styled.span`
  font-weight: 500;
  color: #014F40;
`;

const Value = styled.span`
  color: #333;
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
        let alumnoFoto = '';
        let alumnoApellido = '';
        let curso = '';
        try {
          const alumSnap = await getDoc(doc(db, 'usuarios', union.alumnoId));
          if (alumSnap.exists()) {
            const d = alumSnap.data();
            alumnoFoto = d.photoURL || '';
            alumnoApellido = d.apellido || '';
          }
          const classSnap = await getDoc(doc(db, 'clases', union.claseId));
          if (classSnap.exists()) curso = classSnap.data().curso || '';
        } catch (err) {
          console.error(err);
        }
        const subSnap = await getDocs(
          query(
            collection(db, 'clases_union', docu.id, 'clases_asignadas'),
            where('estado', '==', 'aceptada')
          )
        );
        const clases = subSnap.docs.map(d => ({ id: d.id, curso, ...d.data() }));
        if (clases.length) {
          data.push({
            alumno: `${union.alumnoNombre} ${alumnoApellido}`.trim(),
            alumnoFoto,
            clases
          });
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
            <GroupHeader>
              {g.alumnoFoto && <Avatar src={g.alumnoFoto} alt="Alumno" />}
              <GroupTitle>{g.alumno}</GroupTitle>
            </GroupHeader>
            {g.clases.map(c => (
              <Card key={c.id}>
                <InfoGrid>
                  <div>
                    <Label>Asignatura:</Label> <Value>{c.asignatura}</Value>
                  </div>
                  <div>
                    <Label>Curso:</Label> <Value>{c.curso || '-'}</Value>
                  </div>
                  <div>
                    <Label>Fecha:</Label> <Value>{c.fecha} {c.hora}</Value>
                  </div>
                  <div>
                    <Label>Modalidad:</Label> <Value>{c.modalidad}</Value>
                  </div>
                  <div>
                    <Label>Duración:</Label> <Value>{c.duracion}h</Value>
                  </div>
                  <div>
                    <Label>Ganancia:</Label> <Value>€{(c.precioTotalProfesor || 0).toFixed(2)}</Value>
                  </div>
                </InfoGrid>
              </Card>
            ))}
          </div>
        ))}
      </Container>
    </Page>
  );
}
