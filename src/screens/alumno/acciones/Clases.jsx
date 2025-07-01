// src/screens/alumno/acciones/Clases.jsx
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { useChild } from '../../../ChildContext';
import LoadingScreen from '../../../components/LoadingScreen';
import Card from '../../../components/CommonCard';
import InfoGrid from '../../../components/InfoGrid';
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

const SwitchContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const SwitchButton = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  background: ${({ active }) => (active ? '#046654' : '#e0e0e0')};
  color: ${({ active }) => (active ? '#fff' : '#333')};
  border: none;
  cursor: pointer;
  &:first-child {
    border-radius: 8px 0 0 8px;
  }
  &:last-child {
    border-radius: 0 8px 8px 0;
  }
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


const Label = styled.span`
  font-weight: 500;
  color: #014F40;
`;

const Value = styled.span`
  color: #333;
`;

export default function Clases() {
  const { selectedChild } = useChild();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get('view') || 'clases';
  const [view, setView] = useState(initialView);

  const [clases, setClases] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [sortBy, setSortBy] = useState('fecha');
  const [loading, setLoading] = useState(true);
  const [loadingReqs, setLoadingReqs] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const u = auth.currentUser;
      if (!u) { setLoading(false); return; }
      let q = query(collection(db, 'clases_union'), where('alumnoId', '==', u.uid));
      if (selectedChild) {
        q = query(collection(db, 'clases_union'),
                  where('alumnoId', '==', u.uid),
                  where('hijoId', '==', selectedChild.id));
      }
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
      setLoading(false);
    })();
  }, [selectedChild]);

  useEffect(() => {
    (async () => {
      setLoadingReqs(true);
      const u = auth.currentUser;
      if (!u) { setLoadingReqs(false); return; }
      let q = query(collection(db, 'clases'), where('alumnoId', '==', u.uid));
      if (selectedChild) {
        q = query(collection(db, 'clases'),
                  where('alumnoId', '==', u.uid),
                  where('hijoId', '==', selectedChild.id));
      }
      const snap = await getDocs(q);
      const data = [];
      for (const d of snap.docs) {
        const offers = await getDocs(collection(db, 'clases', d.id, 'ofertas'));
        data.push({ id: d.id, offers: offers.size, ...d.data() });
      }
      setSolicitudes(data);
      setLoadingReqs(false);
    })();
  }, [selectedChild]);

  useEffect(() => {
    setSearchParams({ tab: 'clases', view });
  }, [view, setSearchParams]);

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

  const formatDate = d => {
    return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  };

  if ((view === 'clases' && loading) || (view === 'solicitudes' && loadingReqs)) {
    return <LoadingScreen fullscreen />;
  }

  return (
    <Page>
      <Container>
        <Title>Mis clases</Title>
        <SwitchContainer>
          <SwitchButton active={view === 'clases'} onClick={() => setView('clases')}>Mis clases</SwitchButton>
          <SwitchButton active={view === 'solicitudes'} onClick={() => setView('solicitudes')}>Mis solicitudes</SwitchButton>
        </SwitchContainer>
        {view === 'clases' ? (
          <>
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
          </>
        ) : (
          solicitudes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>No tienes solicitudes.</p>
          ) : (
            solicitudes.map(s => {
              const estado = s.estado === 'pendiente'
                ? (s.offers === 0 ? 'En búsqueda de profesor' : 'En selección de profesor')
                : 'Profesor asignado';
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
                      <Label>Estado:</Label> <Value>{estado}</Value>
                    </div>
                  </InfoGrid>
                </Card>
              );
            })
          )
        )}
      </Container>
    </Page>
  );
}
