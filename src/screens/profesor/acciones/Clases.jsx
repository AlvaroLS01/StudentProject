// src/screens/profesor/acciones/Clases.jsx
import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import LoadingScreen from '../../../components/LoadingScreen';
import Card from '../../../components/CommonCard';
import InfoGrid from '../../../components/InfoGrid';
import Tabs from "../../../components/Tabs";
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { formatDate } from '../../../utils/formatDate';

import MisOfertas from './MisOfertas';

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




const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.75rem;
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

const StudentName = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: #024837;
  margin-left: 0.75rem;
`;


const Label = styled.span`
  font-weight: 500;
  color: #014F40;
`;

const Value = styled.span`
  color: #333;
`;

const CancelButton = styled.button`
  margin: 0.5rem auto 0;
  background: #e53e3e;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.25rem 0.8rem;
  font-size: 0.85rem;
  cursor: pointer;
  display: block;
  width: fit-content;
  &:hover {
    background: #c53030;
  }
`;


export default function ClasesProfesor({ only }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramView = searchParams.get('view') || 'clases';
  const [view, setView] = useState(only || paramView);
  const [clases, setClases] = useState([]);
  const [sortBy, setSortBy] = useState('fecha');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'clases_union'),
      where('profesorId', '==', auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, async snap => {
      const promises = snap.docs.map(async docu => {
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
          collection(db, 'clases_union', docu.id, 'clases_asignadas')
        );
        const arr = [];
        subSnap.docs.forEach(d => {
          const data = d.data();
          if (data.estado === 'aceptada' || data.estado === 'pendiente') {
            arr.push({
              id: d.id,
              unionId: docu.id,
              alumnoId: union.alumnoId,
              alumno: `${union.alumnoNombre} ${alumnoApellido}`.trim(),
              alumnoFoto,
              curso,
              ...data
            });
          }
        });
        return arr;
      });
      const results = await Promise.all(promises);
      setClases(results.flat());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!only) {
      setSearchParams({ view });
    }
  }, [view, setSearchParams, only]);


  const sortedClases = useMemo(() => {
    const arr = [...clases];
    arr.sort((a, b) => {
      if (sortBy === 'alumno') {
        return a.alumno.localeCompare(b.alumno);
      }
      if (sortBy === 'tipo') {
        return (a.modalidad || '').localeCompare(b.modalidad || '');
      }
      if (sortBy === 'asignatura') {
        return (a.asignatura || '').localeCompare(b.asignatura || '');
      }
      const da = new Date(`${a.fecha}T${a.hora || '00:00'}`);
      const db = new Date(`${b.fecha}T${b.hora || '00:00'}`);
      return db.getTime() - da.getTime();
    });
    return arr;
  }, [clases, sortBy]);

  const cancelPending = async clase => {
    const ref = doc(
      db,
      'clases_union',
      clase.unionId,
      'clases_asignadas',
      clase.id
    );
    await updateDoc(ref, {
      confirmada: false,
      estado: 'cancelada',
      canceladaEn: serverTimestamp()
    });
  };

  if (loading) {
    return <LoadingScreen fullscreen />;
  }

  const title = view === 'clases' ? 'Mis Clases' : 'Mis Ofertas';

  return (
    <Page>
      <Container>
        <Title>{only ? title : 'Mis Clases & Ofertas'}</Title>
        {!only && (
          <Tabs
            tabs={[
              { label: 'Mis clases', value: 'clases' },
              { label: 'Mis ofertas', value: 'ofertas' },
            ]}
            active={view}
            onChange={setView}
          />
        )}

        {view === 'clases' ? (
          <>
            <FilterContainer>
              <label htmlFor="sortProfesor">Ordenar por:</label>
              <select className="form-control"
                id="sortProfesor"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="fecha">Fecha</option>
                <option value="alumno">Alumno</option>
                <option value="tipo">Modalidad</option>
                <option value="asignatura">Asignatura</option>
              </select>
            </FilterContainer>
            {sortedClases.length === 0 && <p>No tienes clases asignadas.</p>}
            {sortedClases.map(c => (
              <Card key={c.id}>
                <CardHeader>
                  <HeaderLeft>
                    {c.alumnoFoto && <Avatar src={c.alumnoFoto} alt="Alumno" />}
                    <StudentName>{c.alumno}</StudentName>
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
                    <Label>Fecha:</Label> <Value>{formatDate(c.fecha)} {c.hora}</Value>
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
                {c.estado === 'pendiente' && (
                  <CancelButton onClick={() => cancelPending(c)}>
                    Cancelar propuesta
                  </CancelButton>
                )}
              </Card>
            ))}
          </>
        ) : (
          <MisOfertas />
        )}
      </Container>
    </Page>
  );
}
