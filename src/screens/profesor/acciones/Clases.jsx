// src/screens/profesor/acciones/Clases.jsx
import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import LoadingScreen from '../../../components/LoadingScreen';
import Card from '../../../components/CommonCard';
import InfoGrid from '../../../components/InfoGrid';
import { auth, db } from '../../../firebase/firebaseConfig';
import { useNotification } from '../../../NotificationContext';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
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

const ModifyButton = styled.button`
  margin-top: 0.75rem;
  background: #006d5b;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #005047;
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  margin-top: 0.75rem;
  background: #e53e3e;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: #c53030;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const EditModal = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 16px 48px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LabelInput = styled.label`
  font-weight: 500;
  color: #014f40;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-around;
`;

const ModalButton = styled.button`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  ${p =>
    p.primary
      ? `background: #006d5b; color: #fff;`
      : `background: #f0f0f0; color: #333;`}
`;

export default function ClasesProfesor() {
  const [clases, setClases] = useState([]);
  const [sortBy, setSortBy] = useState('fecha');
  const [editing, setEditing] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const { show } = useNotification();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const q = query(collection(db, 'clases_union'), where('profesorId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      const list = [];
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
          collection(db, 'clases_union', docu.id, 'clases_asignadas')
        );
        subSnap.docs.forEach(d => {
          const data = d.data();
          if (data.estado === 'aceptada' || data.estado === 'pendiente') {
            list.push({
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
      }
      setClases(list);
      setLoading(false);
    })();
  }, []);

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

  const isModificationAllowed = clase => {
    const d = new Date(clase.fecha);
    const sunday = new Date(d);
    const offset = (7 - sunday.getDay()) % 7;
    sunday.setDate(d.getDate() + offset);
    sunday.setHours(16, 0, 0, 0);
    return !clase.modificacionPendiente && Date.now() < sunday.getTime();
  };

  const openEdit = clase => {
    setEditing(clase);
    setNewDate(clase.fecha);
    setNewDuration(String(clase.duracion));
  };

  const submitEdit = async () => {
    if (!editing) return;
    const docRef = doc(db, 'clases_union', editing.unionId, 'clases_asignadas', editing.id);
    const d = new Date(editing.fecha);
    const sunday = new Date(d);
    const offset = (7 - sunday.getDay()) % 7;
    sunday.setDate(d.getDate() + offset);
    sunday.setHours(16, 0, 0, 0);
    await updateDoc(docRef, {
      fecha: newDate,
      duracion: parseFloat(newDuration),
      modificacionPendiente: true,
      modificacionExpira: sunday.toISOString(),
      modificacionCreada: serverTimestamp()
    });
    await addDoc(collection(db, 'clases_union', editing.unionId, 'chats'), {
      senderId: auth.currentUser.uid,
      text: `He modificado la clase del día ${editing.fecha} de duración ${editing.duracion}h a ${newDate} con duración ${newDuration}h`,
      createdAt: serverTimestamp()
    });
    await addDoc(collection(db, 'notificaciones'), {
      userId: editing.alumnoId,
      text: `Se modificó la clase del ${editing.fecha}`,
      read: false,
      createdAt: serverTimestamp()
    });
    show('Propuesta de modificación enviada', 'success');
    setEditing(null);
  };

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

  return (
    <Page>
      <Container>
        <Title>Mis clases asignadas</Title>
        <FilterContainer>
          <label htmlFor="sortProfesor">Ordenar por:</label>
          <select
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
            {c.estado === 'pendiente' && (
              <CancelButton onClick={() => cancelPending(c)}>
                Cancelar propuesta
              </CancelButton>
            )}
            {c.estado === 'aceptada' && (
              <CancelButton onClick={() => cancelPending(c)}>
                Cancelar clase
              </CancelButton>
            )}
            {c.estado !== 'pendiente' && (
              <ModifyButton
                disabled={!isModificationAllowed(c)}
                onClick={() => openEdit(c)}
              >
                {isModificationAllowed(c) ? 'Modificar clase' : 'Modificación no disponible'}
              </ModifyButton>
            )}
          </Card>
        ))}
      </Container>

      {editing && (
        <Overlay onClick={() => setEditing(null)}>
          <EditModal onClick={e => e.stopPropagation()}>
            <LabelInput>Fecha nueva:</LabelInput>
            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            <LabelInput>Duración (horas):</LabelInput>
            <Input type="number" min="0.5" step="0.5" value={newDuration} onChange={e => setNewDuration(e.target.value)} />
            <ModalActions>
              <ModalButton onClick={() => setEditing(null)}>Cancelar</ModalButton>
              <ModalButton
                primary
                onClick={() => {
                  setEditing(null);
                  setConfirmEdit(true);
                }}
              >
                Confirmar
              </ModalButton>
            </ModalActions>
          </EditModal>
        </Overlay>
      )}

      {confirmEdit && (
        <Overlay onClick={() => setConfirmEdit(false)}>
          <EditModal onClick={e => e.stopPropagation()}>
            <p style={{ textAlign: 'center' }}>
              Solo se puede modificar una sola vez. ¿Confirmar cambio?
            </p>
            <ModalActions>
              <ModalButton onClick={() => setConfirmEdit(false)}>Cancelar</ModalButton>
              <ModalButton
                primary
                onClick={() => {
                  submitEdit();
                  setConfirmEdit(false);
                }}
              >
                Confirmar
              </ModalButton>
            </ModalActions>
          </EditModal>
        </Overlay>
      )}
    </Page>
  );
}
