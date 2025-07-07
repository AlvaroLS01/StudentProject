import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import LoadingScreen from '../../../components/LoadingScreen';
import { db } from '../../../firebase/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from 'firebase/firestore';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  background: #f7faf9;
  min-height: 100vh;
  padding: 2rem;
`;

const Container = styled.div`
  max-width: 900px;
  margin: auto;
  animation: ${fadeIn} 0.4s ease-out;
`;

const Title = styled.h1`
  text-align: center;
  color: #034640;
  margin-bottom: 2rem;
  font-size: 2.5rem;
`;

const Counter = styled.span`
  font-size: 1.25rem;
  color: #046654;
  margin-left: 0.5rem;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const Item = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  cursor: pointer;
`;

const Bubble = styled.span`
  background: #3182ce;
  color: #fff;
  border-radius: 999px;
  padding: 0 8px;
  font-size: 0.75rem;
`;

const ClassesContainer = styled.div`
  margin-top: 1.5rem;
`;

const ClassCard = styled.div`
  background: #f0fdf4;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
`;

export default function Profesores() {
  const [teachers, setTeachers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    const q = query(collection(db, 'usuarios'), where('rol', '==', 'profesor'));
    const snap = await getDocs(q);
    const list = [];
    for (const d of snap.docs) {
      const uQuery = query(
        collection(db, 'clases_union'),
        where('profesorId', '==', d.id)
      );
      const uSnap = await getDocs(uQuery);
      let pending = 0;
      for (const u of uSnap.docs) {
        const cQuery = query(
          collection(db, 'clases_union', u.id, 'clases_asignadas'),
          where('estado', '==', 'aceptada'),
          where('pendienteAdmin', '==', true)
        );
        const cSnap = await getDocs(cQuery);
        pending += cSnap.size;
      }
      list.push({ id: d.id, ...d.data(), pending });
    }
    setTeachers(list);
  }

  async function openTeacher(t) {
    setSelected(t);
    setLoadingClasses(true);
    const unions = await getDocs(
      query(collection(db, 'clases_union'), where('profesorId', '==', t.id))
    );
    let cls = [];
    for (const u of unions.docs) {
      const cSnap = await getDocs(
        query(
          collection(db, 'clases_union', u.id, 'clases_asignadas'),
          where('estado', '==', 'aceptada')
        )
      );
      for (const c of cSnap.docs) {
        cls.push({ id: c.id, unionId: u.id, ...c.data() });
        if (c.data().pendienteAdmin) {
          await updateDoc(
            doc(db, 'clases_union', u.id, 'clases_asignadas', c.id),
            { pendienteAdmin: false }
          );
        }
      }
    }
    setClasses(cls);
    setTeachers((ts) => ts.map((te) =>
      te.id === t.id ? { ...te, pending: 0 } : te
    ));
    setLoadingClasses(false);
  }

  return (
    <Page>
      <Container>
        <Title>Profesores<Counter>({teachers.length})</Counter></Title>
        <List>
          {teachers.map((t) => (
            <Item key={t.id} onClick={() => openTeacher(t)}>
              <span>{t.nombre} {t.apellido}</span>
              {t.pending > 0 && <Bubble>{t.pending}</Bubble>}
            </Item>
          ))}
        </List>

        {selected && (
          <ClassesContainer>
            <h3>Clases de {selected.nombre}</h3>
            {loadingClasses ? (
              <LoadingScreen />
            ) : classes.length === 0 ? (
              <p>No hay clases registradas.</p>
            ) : (
              classes.map((cl) => (
                <ClassCard key={cl.id}>
                  <p><strong>Alumno:</strong> {cl.alumnoNombre} {cl.alumnoApellidos}</p>
                  <p><strong>Fecha:</strong> {cl.fecha} {cl.hora}</p>
                  <p><strong>Asignatura:</strong> {cl.asignatura}</p>
                  <p><strong>Duración:</strong> {cl.duracion} h</p>
                </ClassCard>
              ))
            )}
          </ClassesContainer>
        )}
      </Container>
    </Page>
  );
}
