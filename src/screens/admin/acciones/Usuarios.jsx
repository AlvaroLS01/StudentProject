import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import LoadingScreen from '../../../components/LoadingScreen';
import { db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs
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
  margin-bottom: 1.5rem;
  font-size: 2.5rem;
`;

const Counter = styled.p`
  text-align: center;
  color: #046654;
  margin-top: -1rem;
  margin-bottom: 1rem;
  font-weight: 500;
`;

const SwitchContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const SwitchTrack = styled.div`
  position: relative;
  display: flex;
  width: 280px;
  background: #e0e0e0;
  border-radius: 20px;
  padding: 4px;
`;

const SwitchBubble = styled.div`
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 8px);
  background: #046654;
  border-radius: 16px;
  transition: transform 0.3s ease;
  transform: ${({ view }) =>
    view === 'alumnos' ? 'translateX(100%)' : 'translateX(0)'};
`;

const SwitchButton = styled.button`
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.5rem 1rem;
  color: ${({ active }) => (active ? '#fff' : '#333')};
  font-weight: 500;
  position: relative;
  z-index: 1;
  cursor: pointer;
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

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const Item = styled.li`
  background: #fff;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const UserLink = styled(Link)`
  color: #034640;
  font-weight: 500;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const ChildrenList = styled.ul`
  list-style: none;
  padding-left: 1rem;
  margin: 0.5rem 0 0 0;
  color: #555;
  font-size: 0.9rem;
`;

export default function Usuarios() {
  const [view, setView] = useState('profesores');
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('registro');

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchTeachers(), fetchStudents()]);
      setLoading(false);
    })();
  }, []);

  async function fetchTeachers() {
    const q = query(collection(db, 'usuarios'), where('rol', '==', 'profesor'));
    const snap = await getDocs(q);
    const arr = [];
    for (const d of snap.docs) {
      let classes = 0;
      const uSnap = await getDocs(
        query(collection(db, 'clases_union'), where('profesorId', '==', d.id))
      );
      for (const u of uSnap.docs) {
        const cSnap = await getDocs(
          query(
            collection(db, 'clases_union', u.id, 'clases_asignadas'),
            where('estado', '==', 'aceptada')
          )
        );
        classes += cSnap.size;
      }
      arr.push({ id: d.id, clases: classes, ...d.data() });
    }
    setTeachers(arr);
  }

  async function fetchStudents() {
    const snaps = [
      await getDocs(query(collection(db, 'usuarios'), where('rol', '==', 'alumno'))),
      await getDocs(query(collection(db, 'usuarios'), where('rol', '==', 'padre')))
    ];
    const arr = [];
    for (const snap of snaps) {
      for (const d of snap.docs) {
        let classes = 0;
        const uSnap = await getDocs(
          query(collection(db, 'clases_union'), where('alumnoId', '==', d.id))
        );
        for (const u of uSnap.docs) {
          const cSnap = await getDocs(
            query(
              collection(db, 'clases_union', u.id, 'clases_asignadas'),
              where('estado', '==', 'aceptada')
            )
          );
          classes += cSnap.size;
        }
        arr.push({ id: d.id, clases: classes, ...d.data() });
      }
    }
    setStudents(arr);
  }

  const sortUsers = arr => {
    const sorted = [...arr];
    if (sortBy === 'registro') {
      sorted.sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const tb = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return tb - ta;
      });
    } else if (sortBy === 'clases') {
      sorted.sort((a, b) => b.clases - a.clases);
    } else if (sortBy === 'nombre') {
      sorted.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    }
    return sorted;
  };

  const list = view === 'profesores' ? sortUsers(teachers) : sortUsers(students);

  const totalStudents = students.reduce((acc, s) => {
    if (s.rol === 'padre') {
      return acc + (s.hijos ? s.hijos.length : 0);
    }
    return acc + 1;
  }, 0);

  return (
    <Page>
      <Container>
        <Title>Profesores &amp; Alumnos</Title>
        <Counter>
          Total {view === 'profesores' ? teachers.length : totalStudents}
        </Counter>
        <SwitchContainer>
          <SwitchTrack>
            <SwitchBubble view={view} />
            <SwitchButton active={view === 'profesores'} onClick={() => setView('profesores')}>
              Profesores
            </SwitchButton>
            <SwitchButton active={view === 'alumnos'} onClick={() => setView('alumnos')}>
              Alumnos / Padres
            </SwitchButton>
          </SwitchTrack>
        </SwitchContainer>
        <FilterContainer>
          <label htmlFor="sortUsuarios">Ordenar por:</label>
          <select
            id="sortUsuarios"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="registro">Alta de registro</option>
            <option value="clases">Más clases {view === 'profesores' ? 'dadas' : 'recibidas'}</option>
            <option value="nombre">Nombre</option>
          </select>
        </FilterContainer>
        {loading ? (
          <LoadingScreen />
        ) : (
          <List>
            {list.map(u => (
              <Item key={u.id}>
                <UserLink to={`/perfil/${u.id}`}>{u.nombre} {u.apellido}</UserLink>
                {u.rol === 'padre' && (u.hijos || []).length > 0 && (
                  <ChildrenList>
                    {u.hijos.map(h => (
                      <li key={h.id}>{h.nombre}</li>
                    ))}
                  </ChildrenList>
                )}
              </Item>
            ))}
          </List>
        )}
      </Container>
    </Page>
  );
}
