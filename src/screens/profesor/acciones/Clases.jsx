// src/screens/profesor/Clases.jsx
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc as fsDoc
} from 'firebase/firestore';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
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

const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const Field = styled.p`
  margin: 0.5rem 0;
  & > strong { color: #014f40; }
`;

export default function ClasesProfesor() {
  const [clases, setClases] = useState([]);

  useEffect(() => {
    (async () => {
      // 1. Leer nombre del profesor actual
      const uSnap = await getDoc(fsDoc(db, 'usuarios', auth.currentUser.uid));
      const profName = uSnap.exists() ? uSnap.data().nombre : '';

      // 2. Consultar todas las clases donde profesorSeleccionado === profName
      const q = query(
        collection(db, 'clases'),
        where('profesorSeleccionado', '==', profName)
      );
      const snap = await getDocs(q);
      setClases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  return (
    <Page>
      <Container>
        <Title>Mis Clases Asignadas</Title>
        {clases.length === 0 && <p>No tienes ninguna clase asignada.</p>}
        {clases.map(c => (
          <Card key={c.id}>
            <Field><strong>Asignatura:</strong> {c.asignatura}</Field>
            <Field><strong>Curso:</strong> {c.curso}</Field>
            <Field>
              <strong>Fecha:</strong> {c.fecha} &nbsp;
              <strong>Hora:</strong> {c.hora}
            </Field>
            <Field><strong>Modalidad:</strong> {c.modalidad}</Field>
            <Field>
              <strong>Alumno:</strong> {c.alumnoNombre} {c.alumnoApellidos}
            </Field>
            <Field><strong>Estado:</strong> {c.estado}</Field>
            {c.precioSeleccionado && (
              <Field>
                <strong>Tarifa acordada:</strong> €{c.precioSeleccionado}
              </Field>
            )}
          </Card>
        ))}
      </Container>
    </Page>
  );
}
