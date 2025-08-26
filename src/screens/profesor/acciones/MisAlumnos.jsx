import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from "../../../NotificationContext";
import styled, { keyframes } from 'styled-components';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  updateDoc,
  doc
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/formatDate';
import { notifyTutorClass } from '../../../utils/email';

// Animación de entrada
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  padding: 1rem;
  background: #eef6f5;
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 700px;
  margin: auto;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Title = styled.h2`
  text-align: center;
  color: #034640;
  margin-bottom: 1.5rem;
  font-size: 2rem;
`;

const List = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const Item = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  &:hover {
    background: #f0f4f8;
  }
  &:last-child {
    border-bottom: none;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
`;

const NameLink = styled(Link)`
  color: #2c5282;
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const NameWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;


const AddButton = styled.button`
  background: #006D5B;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto;
  white-space: nowrap;
  &:hover {
    background: #005047;
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

const Modal = styled.div`
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

// Modal más pequeño para propuesta de clase
const ProposalModal = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  max-width: 440px;
  width: 90%;
  text-align: left;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ProposalHeader = styled.h3`
  margin: 0;
  color: #014F40;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const Header = styled.div`
  padding: 1rem;
  background: #2b6cb0;
  color: #fff;
  font-weight: 600;
  text-align: center;
`;

const MessageContainer = styled.div`
  flex: 1;
  padding: 0.5rem 1rem;
  overflow-y: auto;
  background: #f7fafc;
`;

const BubbleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${p => (p.mine ? 'flex-end' : 'flex-start')};
  margin-bottom: 0.75rem;
`;

const Sender = styled.div`
  font-size: 0.75rem;
  color: #555;
  margin-bottom: 0.25rem;
`;

const Bubble = styled.div`
  position: relative;
  max-width: 70%;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  background: ${p => (p.mine ? '#bee3f8' : '#c6f6d5')};
`;

const Timestamp = styled.div`
  font-size: 0.65rem;
  color: #666;
  text-align: ${p => (p.mine ? 'right' : 'left')};
  margin-top: 0.25rem;
`;

const InputRow = styled.div`
  display: flex;
  border-top: 1px solid #eee;
`;

const StyledInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: none;
  outline: none;
  font-size: 1rem;
`;

const SendButton = styled.button`
  background: #2c7a7b;
  color: #fff;
  border: none;
  padding: 0 1rem;
  cursor: pointer;
  &:hover {
    background: #264653;
  }
`;

const Form = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #014F40;
`;

const InputDate = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
`;

const InputNumber = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
`;


const ModalActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #eee;
`;

const ModalButton = styled.button`
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  ${p =>
    p.primary
      ? `
      background: #006D5B;
      color: #fff;
      &:hover {
        background: #005047;
      }
    `
      : `
      background: #f0f0f0;
      color: #333;
      &:hover {
        background: #e0e0e0;
      }
    `}
`;

const CancelButton = styled.button`
  margin-top: 0.5rem;
  background: #e53e3e;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  &:hover {
    background: #c53030;
  }
`;

const AcceptedBadge = styled.button`
  margin-top: 0.5rem;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  font-size: 0.85rem;
  cursor: default;
  pointer-events: none;
`;

export default function MisAlumnos() {
  const [unions, setUnions] = useState([]);
  const [chatUnionId, setChatUnionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [input, setInput] = useState('');
  const [openProposalModal, setOpenProposalModal] = useState(false);
  const { show } = useNotification();
  const [selectedUnion, setSelectedUnion] = useState(null);
  const [fechaClase, setFechaClase] = useState('');
  const [horaClase, setHoraClase] = useState('');
  const [duracion, setDuracion] = useState('');
  const [asignMateria, setAsignMateria] = useState('');
  const [modalidad, setModalidad] = useState('online');
  const [asignaturasList, setAsignaturasList] = useState([]);
  const [requestedAsignaturas, setRequestedAsignaturas] = useState([]);
  const scrollRef = useRef();

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
    });

  // Bloquea el scroll de la página cuando el chat está abierto
  useEffect(() => {
    if (chatUnionId) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [chatUnionId]);

  // 1. Carga las uniones (clase-alumno-profesor) donde el usuario es profesor
  useEffect(() => {
    async function fetchUnions() {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(
        collection(db, 'clases_union'),
        where('profesorId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const items = await Promise.all(
        snap.docs.map(async d => {
          const data = d.data();
          let photoURL = '';
          try {
            const usnap = await getDoc(doc(db, 'usuarios', data.alumnoId));
            if (usnap.exists()) {
              const udata = usnap.data();
              if (data.hijoId && Array.isArray(udata.alumnos)) {
                const hijo = udata.alumnos.find(h => h.id === data.hijoId);
                photoURL = hijo?.photoURL || '';
              } else {
                photoURL = udata.photoURL || '';
              }
            }
          } catch (err) {
            console.error(err);
          }
          return { id: d.id, ...data, alumnoPhotoURL: photoURL };
        })
      );
      setUnions(items);
    }
    fetchUnions();
  }, []);

  // Cargar lista de asignaturas para el desplegable
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'asignaturas'));
      setAsignaturasList(snap.docs.map(d => d.data().asignatura));
    })();
  }, []);

  // 2. Escucha los mensajes del chat activo
  useEffect(() => {
    if (!chatUnionId) return;
    const q = query(
      collection(db, 'clases_union', chatUnionId, 'chats'),
      orderBy('createdAt')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => d.data()));
      // Desplaza automáticamente al final
      setTimeout(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
      }, 50);
    });
    return unsub;
  }, [chatUnionId]);

  // 3. Escucha las propuestas de clase (pendientes y aceptadas)
  useEffect(() => {
    if (!chatUnionId) {
      setProposals([]);
      return;
    }
    const q2 = query(
      collection(db, 'clases_union', chatUnionId, 'clases_asignadas'),
      orderBy('createdAt')
    );
    const unsub2 = onSnapshot(q2, snap => {
      setProposals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub2;
  }, [chatUnionId]);

  // 4. Envía un mensaje de chat
  const sendMessage = async () => {
    if (!input.trim()) return;
    await addDoc(
      collection(db, 'clases_union', chatUnionId, 'chats'),
      {
        senderId: auth.currentUser.uid,
        text: input.trim(),
        createdAt: serverTimestamp()
      }
    );
    const union = unions.find(u => u.id === chatUnionId);
    if (union) {
      await addDoc(collection(db, 'notificaciones'), {
        userId: union.alumnoId,
        text: input.trim(),
        read: false,
        createdAt: serverTimestamp()
      });
    }
    setInput('');
  };

  // 5. Abre el modal para crear una propuesta de clase
  const openProposal = async union => {
    setSelectedUnion(union);
    setOpenProposalModal(true);
    const today = new Date().toISOString().slice(0, 10);
    setFechaClase(today);
    setHoraClase(timeOptions[0]);
    setDuracion('');
    setAsignMateria('');
    setModalidad('online');
    setRequestedAsignaturas([]);
    try {
      const snap = await getDoc(doc(db, 'clases', union.claseId));
      if (snap.exists()) {
        const data = snap.data();
        const subs = data.asignaturas || (data.asignatura ? [data.asignatura] : []);
        setRequestedAsignaturas(subs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Envía la propuesta de clase
  const submitProposal = async () => {
    if (!fechaClase || !horaClase || !duracion || !asignMateria) {
      show('Rellena todos los campos de la clase', 'error');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (fechaClase > todayStr) {
      show('La fecha de la clase no puede ser posterior a hoy', 'error');
      return;
    }
    const durNum = parseFloat(duracion);
    // Obtener precios de la clase principal
    const claseSnap = await getDoc(doc(db, 'clases', selectedUnion.claseId));
    const data = claseSnap.exists() ? claseSnap.data() : {};
    const precioProf = parseFloat(data.precioSeleccionado || data.precioProfesores || 0);
    const precioPad = parseFloat(data.precioPadres || 0);

    // Guardamos la propuesta en subcolección 'clases_asignadas'
    const modalidadStore = modalidad === 'presencial' ? 'Presencial' : 'Online';
    await addDoc(
      collection(db, 'clases_union', selectedUnion.id, 'clases_asignadas'),
      {
        profesorId: auth.currentUser.uid,
        alumnoId: selectedUnion.alumnoId,
        fecha: fechaClase,
        hora: horaClase,
        duracion: durNum,
        asignatura: asignMateria,
        modalidad: modalidadStore,
        precioProfesor: precioProf,
        precioPadres: precioPad,
        precioTotalProfesor: +(precioProf * durNum).toFixed(2),
        precioTotalPadres: +(precioPad * durNum).toFixed(2),
        estado: 'pendiente',
        confirmada: false,
        createdAt: serverTimestamp() // timestamp para ordenar
      }
    );
    let tutorEmail = '';
    try {
      const tutorSnap = await getDoc(doc(db, 'usuarios', selectedUnion.alumnoId));
      tutorEmail = tutorSnap.exists() ? tutorSnap.data().email || '' : '';
    } catch (err) {
      console.error(err);
    }
    if (tutorEmail) {
      await notifyTutorClass({
        tutorEmail,
        tutorName: selectedUnion.padreNombre || '',
        teacherName: selectedUnion.profesorNombre || '',
        studentName: selectedUnion.alumnoNombre || '',
        classDate: fechaClase,
        classTime: horaClase,
      });
    }
    setOpenProposalModal(false);
    show('Propuesta de clase enviada al alumno', 'success');
    // NOTA: **No** agregamos un mensaje separado en “chats”;
    // la burbuja desaparecerá de “proposals” cuando el alumno responda.
  };

  // 7. Cancela una propuesta de clase pendiente
  const cancelProposal = async proposal => {
    const propRef = doc(
      db,
      'clases_union',
      chatUnionId,
      'clases_asignadas',
      proposal.id
    );
    // Marcamos estado = 'cancelada'
    await updateDoc(propRef, {
      confirmada: false,
      estado: 'cancelada',
      canceladaEn: serverTimestamp()
    });
    // NO agregamos mensaje extra en “chats”; al cambiar estado, deja de aparecer.
  };

  // Construcción de “feed”: combinamos mensajes y propuestas en un solo arreglo, ordenado por createdAt
  const feedItems = React.useMemo(() => {
    // Cada mensaje: tipo = 'message', conserva senderId, text, createdAt
    const msgs = messages.map(m => ({ ...m, type: 'message' }));
    // Cada propuesta: tipo = 'proposal', sólo las pendientes o aceptadas
    const props = proposals
      .filter(p => p.estado === 'pendiente' || p.estado === 'aceptada')
      .map(p => ({ ...p, type: 'proposal' }));
    // Mezclamos en un solo arreglo
    const combined = [...msgs, ...props];
    // Ordenamos por createdAt (Firestore Timestamp)
    combined.sort((a, b) => {
      const ta = a.createdAt?.toDate?.() || new Date(0);
      const tb = b.createdAt?.toDate?.() || new Date(0);
      return ta.getTime() - tb.getTime();
    });
    return combined;
  }, [messages, proposals]);

  return (
    <Page>
      <Container>
        <Title>Mis alumnos</Title>

        <List>
          {unions.length === 0 ? (
            <p>No tienes alumnos asignados.</p>
          ) : (
            unions.map(u => (
              <Item key={u.id} onClick={() => setChatUnionId(u.id)}>
                {u.alumnoPhotoURL && (
                  <Avatar src={u.alumnoPhotoURL} alt="foto" />
                )}
                <NameWrapper>
                  <NameLink
                    to={`/perfil/${u.alumnoId}`}
                    onClick={e => {
                      e.stopPropagation();
                    }}
                  >
                    {u.alumnoNombre} {u.alumnoApellidos?.split(' ')[0] || ''}
                    {u.padreNombre ? ` (${u.padreNombre})` : ''}
                  </NameLink>
                </NameWrapper>
                <AddButton
                  onClick={e => {
                    e.stopPropagation();
                    openProposal(u);
                  }}
                >
                  Subir clase +
                </AddButton>
              </Item>
            ))
          )}
        </List>
      </Container>

      {/* ------------- Modal Chat ------------- */}
      {chatUnionId && (
        <Overlay onClick={() => setChatUnionId(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <Header>Chat con tu alumno</Header>

            <MessageContainer ref={scrollRef}>
              {feedItems.map((item, idx) => {
                // Si es propuesta pendiente => renderizamos burbuja “Propuesta”
                if (item.type === 'proposal') {
                  const mine = item.profesorId === auth.currentUser.uid; // siempre true aquí, es el profesor
                  const dateObj = item.createdAt?.toDate?.() || new Date();
                  const hh = String(dateObj.getHours()).padStart(2, '0');
                  const mm = String(dateObj.getMinutes()).padStart(2, '0');
                  return (
                    <BubbleWrapper key={`p-${item.id}`} mine={mine}>
                      <Sender>{mine ? 'Tú (Propuesta)' : 'Alumno (Propuesta)'}</Sender>
                      <Bubble mine={mine}>
                        <div>
                          {item.estado === 'aceptada'
                            ? (
                                <>El alumno ha aceptado la clase del{' '}
                                <strong>{formatDate(item.fecha)}</strong> a las{' '}
                                <strong>{item.hora}</strong> de{' '}
                                <strong>{item.asignatura}</strong> ({item.duracion}h)</>
                              )
                            : (
                                <>Has añadido la clase del{' '}
                                <strong>{formatDate(item.fecha)}</strong> a las{' '}
                                <strong>{item.hora}</strong> de{' '}
                                <strong>{item.asignatura}</strong> ({item.duracion}h)</>
                              )}
                        </div>
                        {item.estado === 'pendiente' && (
                          <CancelButton onClick={() => cancelProposal(item)}>
                            Cancelar
                          </CancelButton>
                        )}
                        {item.estado === 'aceptada' && (
                          <AcceptedBadge>Clase aceptada</AcceptedBadge>
                        )}
                      </Bubble>
                      <Timestamp mine={mine}>
                        {hh}:{mm}
                      </Timestamp>
                    </BubbleWrapper>
                  );
                }

                // Si es mensaje normal de chat
                const mine = item.senderId === auth.currentUser.uid;
                const date = item.createdAt?.toDate?.() || new Date();
                const hh = String(date.getHours()).padStart(2, '0');
                const mm = String(date.getMinutes()).padStart(2, '0');
                return (
                  <BubbleWrapper key={`m-${idx}`} mine={mine}>
                    <Sender>{mine ? 'Tú' : 'Alumno'}</Sender>
                    <Bubble mine={mine}>{item.text}</Bubble>
                    <Timestamp mine={mine}>{hh}:{mm}</Timestamp>
                  </BubbleWrapper>
                );
              })}
            </MessageContainer>

            <InputRow>
              <StyledInput
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Escribe un mensaje..."
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <SendButton onClick={sendMessage}>Enviar</SendButton>
            </InputRow>
          </Modal>
        </Overlay>
      )}
      {/* --------- /Modal Chat --------- */}

      {/* ------------- Modal Propuesta de Clase ------------- */}
      {openProposalModal && selectedUnion && (
        <Overlay onClick={() => setOpenProposalModal(false)}>
          <ProposalModal onClick={e => e.stopPropagation()}>
            <ProposalHeader>
              Registrar clase para {selectedUnion.alumnoNombre}{' '}
              {selectedUnion.alumnoApellidos?.split(' ')[0]}
              {selectedUnion.padreNombre ? ` (${selectedUnion.padreNombre})` : ''}
            </ProposalHeader>
            <Form>
              <Label>Fecha de clase:</Label>
              <InputDate
                type="date"
                value={fechaClase}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setFechaClase(e.target.value)}
              />
              <Label>Hora:</Label>
              <Select value={horaClase} onChange={e => setHoraClase(e.target.value)}>
                {timeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Label>Duración (horas):</Label>
              <InputNumber
                type="number"
                min="0.5"
                step="0.5"
                value={duracion}
                onChange={e => setDuracion(e.target.value)}
              />
              <Label>Modalidad:</Label>
              <Select value={modalidad} onChange={e => setModalidad(e.target.value)}>
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
              </Select>

              <Label>Asignatura:</Label>
              <Select value={asignMateria} onChange={e => setAsignMateria(e.target.value)}>
                <option value="" disabled>Selecciona asignatura</option>
                {requestedAsignaturas.length > 0 && (
                  <optgroup label="Asignaturas solicitadas">
                    {requestedAsignaturas.map((a, i) => (
                      <option key={`req-${i}`} value={a}>{a}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Resto de asignaturas">
                  {asignaturasList
                    .filter(a => !requestedAsignaturas.includes(a))
                    .map((a, i) => (
                      <option key={`rest-${i}`} value={a}>{a}</option>
                    ))}
                </optgroup>
              </Select>
            </Form>
            <ModalActions>
              <ModalButton onClick={() => setOpenProposalModal(false)}>
                Cancelar
              </ModalButton>
              <ModalButton primary onClick={submitProposal}>
                Registrar clase
              </ModalButton>
            </ModalActions>
          </ProposalModal>
        </Overlay>
      )}
      {/* --------- /Modal Propuesta de Clase --------- */}
    </Page>
  );
}
