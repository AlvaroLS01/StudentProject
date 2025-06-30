// src/screens/alumno/acciones/Clases.jsx
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import Card from '../../../components/CommonCard';
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

const FilterContainer = styled.div`
  text-align: right;
  margin-bottom: 1rem;
  select {
    margin-left: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
  }
`;



const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const TeacherName = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: #024837;
  margin-left: 0.75rem;
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
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem 2rem;
  margin-bottom: 1rem;
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
  const [sortBy, setSortBy] = useState('fecha');

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

  const sortedClases = React.useMemo(() => {
    const arr = [...clases];
    arr.sort((a, b) => {
      if (sortBy === 'profesor') {
        return a.profesorNombre.localeCompare(b.profesorNombre);
      }
      if (sortBy === 'tipo') {
        return (a.modalidad || '').localeCompare(b.modalidad || '');
      }
      if (sortBy === 'asignatura') {
        return (a.asignatura || '').localeCompare(b.asignatura || '');
      }
      // fecha descendente
      const da = new Date(`${a.fecha}T${a.hora || '00:00'}`);
      const db = new Date(`${b.fecha}T${b.hora || '00:00'}`);
      return db.getTime() - da.getTime();
    });
    return arr;
  }, [clases, sortBy]);

  return (
    <Page>
      <Container>
        <Title>Mis clases</Title>
        <FilterContainer>
          <label htmlFor="sortAlumno">Ordenar por:</label>
          <select
            id="sortAlumno"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="fecha">Fecha</option>
            <option value="profesor">Profesor</option>
            <option value="tipo">Modalidad</option>
            <option value="asignatura">Asignatura</option>
          </select>
        </FilterContainer>
        {sortedClases.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No tienes clases asignadas.</p>
        ) : (
          sortedClases.map(c => (
            <Card key={c.id}>
              <CardHeader>
                <HeaderLeft>
                  {c.profesorFoto && <Avatar src={c.profesorFoto} alt="Profesor" />}
                  <TeacherName>{c.profesorNombre}</TeacherName>
                </HeaderLeft>
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
