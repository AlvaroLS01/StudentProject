// src/screens/alumno/acciones/Clases.jsx
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

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
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
        let profesorFoto = '';
        let curso = '';
        try {
          const profSnap = await getDoc(doc(db, 'usuarios', union.profesorId));
          if (profSnap.exists()) profesorFoto = profSnap.data().photoURL || '';
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
        subSnap.docs.forEach(d => {
          all.push({
            id: d.id,
            profesorNombre: union.profesorNombre,
            profesorFoto,
            curso,
            ...d.data()
          });
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
              <CardHeader>
                {c.profesorFoto && <Avatar src={c.profesorFoto} alt="Profesor" />}
                <h3 style={{ margin: 0 }}>{c.profesorNombre}</h3>
              </CardHeader>
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
              </InfoGrid>
            </Card>
          ))
        )}
      </Container>
    </Page>
  );
}
