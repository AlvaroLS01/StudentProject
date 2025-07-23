// src/screens/alumno/acciones/Clases.jsx
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { useChild } from '../../../ChildContext';
import LoadingScreen from '../../../components/LoadingScreen';
import Card from '../../../components/CommonCard';
import InfoGrid from '../../../components/InfoGrid';
import ToggleSwitch from "../../../components/ToggleSwitch";
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { acceptClassByStudent, rejectPendingClass } from '../../../utils/classWorkflow';

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


const Label = styled.span`
  font-weight: 500;
  color: #014F40;
`;

const Value = styled.span`
  color: #333;
`;

const AcceptButton = styled.button`
  margin-top: 0.5rem;
  background: #006d5b;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  &:hover:not(:disabled) {
    background: #005047;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  margin-top: 0.5rem;
  background: #f56565;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  &:hover:not(:disabled) {
    background: #c53030;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default function Clases() {
  const { selectedChild } = useChild();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get('view') || 'clases';
  const [view, setView] = useState(initialView);

  const [clases, setClases] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [sortBy, setSortBy] = useState('fecha');
  const [loading, setLoading] = useState(true);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    const u = auth.currentUser;
    if (!u) { setLoading(false); return; }
    let q = query(collection(db, 'clases_union'), where('alumnoId', '==', u.uid));
    if (selectedChild) {
      q = query(
        collection(db, 'clases_union'),
        where('alumnoId', '==', u.uid),
        where('hijoId', '==', selectedChild.id)
      );
    }
    const unsub = onSnapshot(q, async snap => {
      const promises = snap.docs.map(async docu => {
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
          collection(db, 'clases_union', docu.id, 'clases_asignadas')
        );
        const arr = [];
        subSnap.docs.forEach(d => {
          const data = d.data();
          if (data.estado === 'aceptada' || data.estado === 'pendiente') {
            arr.push({
              id: d.id,
              unionId: docu.id,
              profesorId: union.profesorId,
              profesorNombre: union.profesorNombre,
              profesorFoto,
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
      // Load pending assignments awaiting student confirmation
      let q2 = query(collection(db, 'registro_clases'), where('alumnoId', '==', u.uid), where('estado', '==', 'espera_alumno'));
      if (selectedChild) {
        q2 = query(collection(db, 'registro_clases'),
                  where('alumnoId', '==', u.uid),
                  where('hijoId', '==', selectedChild.id),
                  where('estado', '==', 'espera_alumno'));
      }
      const snap2 = await getDocs(q2);
      setPendingAssignments(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingReqs(false);
    })();
  }, [selectedChild]);

  useEffect(() => {
    setSearchParams({ tab: 'clases', view });
  }, [view, setSearchParams]);


  const acceptProposal = async clase => {
    if (processingIds.has(clase.id)) return;
    setProcessingIds(prev => new Set(prev).add(clase.id));
    const ref = doc(
      db,
      'clases_union',
      clase.unionId,
      'clases_asignadas',
      clase.id
    );
    try {
      await updateDoc(ref, {
        confirmada: true,
        estado: 'aceptada',
        confirmadaEn: serverTimestamp(),
        pendienteAdmin: true
      });
      await addDoc(collection(db, 'clases_union', clase.unionId, 'chats'), {
        senderId: clase.profesorId,
        text: `He añadido una clase, ${clase.fecha}`,
        createdAt: serverTimestamp()
      });
      setClases(prev => prev.map(c =>
        c.id === clase.id ? { ...c, estado: 'aceptada', confirmada: true } : c
      ));
    } finally {
      setProcessingIds(prev => {
        const s = new Set(prev);
        s.delete(clase.id);
        return s;
      });
    }
  };

  const rejectProposal = async clase => {
    if (processingIds.has(clase.id)) return;
    setProcessingIds(prev => new Set(prev).add(clase.id));
    const ref = doc(
      db,
      'clases_union',
      clase.unionId,
      'clases_asignadas',
      clase.id
    );
    try {
      await updateDoc(ref, {
        confirmada: false,
        estado: 'rechazada',
        rechazadoEn: serverTimestamp()
      });
      setClases(prev => prev.map(c =>
        c.id === clase.id ? { ...c, estado: 'rechazada', confirmada: false } : c
      ));
    } finally {
      setProcessingIds(prev => {
        const s = new Set(prev);
        s.delete(clase.id);
        return s;
      });
    }
  };

  const acceptModification = async clase => {
    if (processingIds.has(clase.id)) return;
    setProcessingIds(prev => new Set(prev).add(clase.id));
    const ref = doc(db, 'clases_union', clase.unionId, 'clases_asignadas', clase.id);
    try {
      await updateDoc(ref, {
        modificacionPendiente: false,
        modificacionAceptada: serverTimestamp()
      });
      await addDoc(collection(db, 'clases_union', clase.unionId, 'chats'), {
        senderId: auth.currentUser.uid,
        text: `He aceptado la modificación para el ${clase.fecha}`,
        createdAt: serverTimestamp()
      });
      setClases(prev => prev.map(c =>
        c.id === clase.id ? { ...c, modificacionPendiente: false } : c
      ));
    } finally {
      setProcessingIds(prev => {
        const s = new Set(prev);
        s.delete(clase.id);
        return s;
      });
    }
  };

  const rejectModification = async clase => {
    if (processingIds.has(clase.id)) return;
    setProcessingIds(prev => new Set(prev).add(clase.id));
    const ref = doc(db, 'clases_union', clase.unionId, 'clases_asignadas', clase.id);
    try {
      await updateDoc(ref, {
        modificacionPendiente: false,
        modificacionRechazada: serverTimestamp()
      });
      await addDoc(collection(db, 'clases_union', clase.unionId, 'chats'), {
        senderId: auth.currentUser.uid,
        text: `He rechazado la modificación para el ${clase.fecha}`,
        createdAt: serverTimestamp()
      });
      setClases(prev => prev.map(c =>
        c.id === clase.id ? { ...c, modificacionPendiente: false } : c
      ));
    } finally {
      setProcessingIds(prev => {
        const s = new Set(prev);
        s.delete(clase.id);
        return s;
      });
    }
  };

  const acceptAssignment = async rec => {
    if (processingIds.has(rec.id)) return;
    setProcessingIds(prev => new Set(prev).add(rec.id));
    try {
      await acceptClassByStudent(rec.id, rec);
      setPendingAssignments(pa => pa.filter(r => r.id !== rec.id));
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
    }
  };

  const rejectAssignment = async rec => {
    if (processingIds.has(rec.id)) return;
    setProcessingIds(prev => new Set(prev).add(rec.id));
    try {
      await rejectPendingClass(rec.id);
      setPendingAssignments(pa => pa.filter(r => r.id !== rec.id));
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
    }
  };

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

  return (
    <Page>
      <Container>
        <Title>Mis Clases & Solicitudes</Title>
        <ToggleSwitch leftLabel="Mis clases" rightLabel="Mis solicitudes" value={view === "clases" ? "left" : "right"} onChange={(val) => setView(val === "left" ? "clases" : "solicitudes")}/>

        {view === 'clases' ? (
          <>
            <FilterContainer>
              <label htmlFor="sortAlumno">Ordenar por:</label>
              <select className="form-control"
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
                  {c.estado === 'pendiente' && (
                    <div>
                      <AcceptButton
                        onClick={() => acceptProposal(c)}
                        disabled={processingIds.has(c.id)}
                      >
                        Aceptar
                      </AcceptButton>{' '}
                      <RejectButton
                        onClick={() => rejectProposal(c)}
                        disabled={processingIds.has(c.id)}
                      >
                        Rechazar
                      </RejectButton>
                    </div>
                  )}
                  {c.modificacionPendiente && (
                    <div>
                      <p style={{ marginTop: '0.5rem' }}>
                        El profesor propone modificar esta clase.
                      </p>
                      <AcceptButton
                        onClick={() => acceptModification(c)}
                        disabled={processingIds.has(c.id)}
                      >
                        Aceptar cambio
                      </AcceptButton>{' '}
                      <RejectButton
                        onClick={() => rejectModification(c)}
                        disabled={processingIds.has(c.id)}
                      >
                        Rechazar cambio
                      </RejectButton>
                    </div>
                  )}
                </Card>
              ))
            )}
          </>
        ) : (
          pendingAssignments.length === 0 && solicitudes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>No tienes solicitudes.</p>
          ) : (
            <>
            {pendingAssignments.map(p => (
              <Card key={p.id}>
                <InfoGrid>
                  <div>
                    <Label>Profesor:</Label> <Value>{p.profesorNombre}</Value>
                  </div>
                  <div>
                    <Label>Estado:</Label> <Value>Profesor aceptado</Value>
                  </div>
                </InfoGrid>
                <div>
                  <AcceptButton onClick={() => acceptAssignment(p)} disabled={processingIds.has(p.id)}>Aceptar</AcceptButton>{' '}
                  <RejectButton onClick={() => rejectAssignment(p)} disabled={processingIds.has(p.id)}>Cancelar</RejectButton>
                </div>
              </Card>
            ))}
            {solicitudes.map(s => {
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
            </>
          )
        )}
      </Container>
    </Page>
  );
}
