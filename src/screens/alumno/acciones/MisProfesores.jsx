// src/screens/profesor/acciones/MisProfesores.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import LoadingScreen from '../../../components/LoadingScreen';
import { auth, db } from '../../../firebase/firebaseConfig';
import { useNotification } from '../../../NotificationContext';
import { useChild } from '../../../ChildContext';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/formatDate';
import { registerTransaction } from '../../../utils/api';

// Animación de entrada
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px) }
  to   { opacity: 1; transform: translateY(0) }
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
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
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

const Header = styled.div`
  padding: 1rem;
  background: #2c5282;
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

const Input = styled.input`
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

const AcceptButton = styled.button`
  margin-top: 0.5rem;
  margin-right: 0.5rem;
  background: #006D5B;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  &:hover {
    background: #005047;
  }
`;

const RejectButton = styled.button`
  margin-top: 0.5rem;
  margin-right: 0.5rem;
  background: #f56565;
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

export default function MisProfesores() {
  const [unions, setUnions] = useState([]);
  const [chatUnionId, setChatUnionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();
  const { show } = useNotification();
  const { selectedChild } = useChild();

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

  // 1. Carga las uniones (clase-alumno-profesor) donde el usuario es alumno
  useEffect(() => {
    async function fetchUnions() {
      setLoading(true);
      const u = auth.currentUser;
      if (!u) { setLoading(false); return; }
      let q = query(
        collection(db, 'clases_union'),
        where('alumnoId', '==', u.uid)
      );
      if (selectedChild) {
        q = query(
          collection(db, 'clases_union'),
          where('alumnoId', '==', u.uid),
          where('hijoId', '==', selectedChild.id)
        );
      }
      const snap = await getDocs(q);
      const items = await Promise.all(
        snap.docs.map(async d => {
          const data = d.data();
          let photoURL = '';
          try {
            const usnap = await getDoc(doc(db, 'usuarios', data.profesorId));
            photoURL = usnap.exists() ? usnap.data().photoURL || '' : '';
          } catch (err) {
            console.error(err);
          }
          return { id: d.id, ...data, profesorPhotoURL: photoURL };
        })
      );
      // Elimina profesores duplicados para que solo aparezcan una vez
      const unique = [];
      const seen = new Set();
      for (const item of items) {
        if (!seen.has(item.profesorId)) {
          unique.push(item);
          seen.add(item.profesorId);
        }
      }
      setUnions(unique);
      setLoading(false);
    }
    fetchUnions();
  }, [selectedChild]);

  useEffect(() => {
    setChatUnionId(null);
    setMessages([]);
    setProposals([]);
    setModifications([]);
  }, [selectedChild]);

  // 2. Escucha los mensajes del chat activo
  useEffect(() => {
    if (!chatUnionId) return;
    const q = query(
      collection(db, 'clases_union', chatUnionId, 'chats'),
      orderBy('createdAt')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => d.data()));
      // Se desplaza automáticamente al final
      setTimeout(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
      }, 50);
    });
    return unsub;
  }, [chatUnionId]);

  // 3. Escucha las propuestas de clase pendientes (confirmada == false, estado = 'pendiente')
  useEffect(() => {
    if (!chatUnionId) {
      setProposals([]);
      return;
    }
    const q2 = query(
      collection(db, 'clases_union', chatUnionId, 'clases_asignadas'),
      where('confirmada', '==', false),
      where('estado', '==', 'pendiente')
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
        userId: union.profesorId,
        text: input.trim(),
        read: false,
        createdAt: serverTimestamp()
      });
    }
    setInput('');
  };

  // 5. Acepta una propuesta de clase
  const acceptProposal = async proposal => {
    const propRef = doc(
      db,
      'clases_union',
      chatUnionId,
      'clases_asignadas',
      proposal.id
    );
    // Marcamos confirmada = true, estado = 'aceptada'
    await updateDoc(propRef, {
      confirmada: true,
      estado: 'aceptada',
      confirmadaEn: serverTimestamp(),
      pendienteAdmin: true
    });
    // Mensaje persistente en el chat indicando la clase añadida
    const union = unions.find(u => u.id === chatUnionId);
    if (union) {
      await addDoc(
        collection(db, 'clases_union', chatUnionId, 'chats'),
        {
          senderId: union.profesorId,
          text: `Clase confirmada de ${proposal.asignatura} el dia ${formatDate(proposal.fecha)}`,
          createdAt: serverTimestamp()
        }
      );
      try {
        await registerTransaction({
          tutorId: auth.currentUser.uid,
          tutorEmail: auth.currentUser.email,
          alumnoNombre: selectedChild ? selectedChild.nombre : '',
          profesorId: union.profesorId,
          asignatura: proposal.asignatura,
          modalidad: proposal.modalidad,
          fecha: proposal.fecha,
          hora: proposal.hora,
          duracion: proposal.duracion,
          montoTutor: proposal.precioTotalPadres,
          montoProfesor: proposal.precioTotalProfesor,
        });
        show('Clase confirmada', 'success');
      } catch (err) {
        console.error(err);
        show('Error registrando la clase', 'error');
      }
    }
  };

  // 6. Rechaza una propuesta de clase
  const rejectProposal = async proposal => {
    const propRef = doc(
      db,
      'clases_union',
      chatUnionId,
      'clases_asignadas',
      proposal.id
    );
    // Marcamos estado = 'rechazada'
    await updateDoc(propRef, {
      confirmada: false,
      estado: 'rechazada',
      rechazadoEn: serverTimestamp()
    });
    // NOTA: no agregamos mensaje extra al chat; el bubble desaparecerá
  };

  // Construcción de “feed”: combinamos mensajes y propuestas en un solo arreglo, ordenado por createdAt
  const feedItems = React.useMemo(() => {
    const msgs = messages.map(m => ({ ...m, type: 'message' }));
    const props = proposals.map(p => ({ ...p, type: 'proposal' }));
    const combined = [...msgs, ...props];
    combined.sort((a, b) => {
      const ta = a.createdAt?.toDate?.() || new Date(0);
      const tb = b.createdAt?.toDate?.() || new Date(0);
      return ta.getTime() - tb.getTime();
    });
    return combined;
  }, [messages, proposals]);

  if (loading) {
    return <LoadingScreen fullscreen />;
  }

  return (
    <Page>
      <Container>
        <Title>Mis profesores</Title>

        <List>
          {unions.length === 0 ? (
            <p>No tienes profesores asignados.</p>
          ) : (
            unions.map(u => (
              <Item key={u.id} onClick={() => setChatUnionId(u.id)}>
                {u.profesorPhotoURL && (
                  <Avatar src={u.profesorPhotoURL} alt="foto" />
                )}
                <NameLink
                  to={`/perfil/${u.profesorId}`}
                  onClick={e => {
                    e.stopPropagation();
                  }}
                >
                  {u.profesorNombre}
                </NameLink>
              </Item>
            ))
          )}
        </List>
      </Container>

      {/* ------------- Modal Chat ------------- */}
      {chatUnionId && (
        <Overlay onClick={() => setChatUnionId(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <Header>Chat con tu profesor</Header>

            <MessageContainer ref={scrollRef}>
              {feedItems.map((item, idx) => {
                if (item.type === 'proposal') {
                  // La propuesta viene del profesor => mine = false para el alumno
                  const mine = false;
                  const dateObj = item.createdAt?.toDate?.() || new Date();
                  const hh = String(dateObj.getHours()).padStart(2, '0');
                  const mm = String(dateObj.getMinutes()).padStart(2, '0');
                  return (
                    <BubbleWrapper key={`p-${item.id}`} mine={mine}>
                      <Sender>{mine ? 'Tú (Propuesta)' : 'Profesor (Propuesta)'}</Sender>
                      <Bubble mine={mine}>
                        <div>
                          El profesor ha añadido una clase de <strong> {item.asignatura}</strong> el{' '}
                        <strong>{formatDate(item.fecha)}</strong> a las <strong>{item.hora}</strong> ({item.duracion}h)
                        </div>
                        <div>Coste: €{(item.precioTotalPadres || 0).toFixed(2)}</div>
                        <RejectButton onClick={() => rejectProposal(item)}>
                          Rechazar
                        </RejectButton>
                        <AcceptButton onClick={() => acceptProposal(item)}>
                          Aceptar
                        </AcceptButton>
                      </Bubble>
                      <Timestamp mine={mine}>
                        {hh}:{mm}
                      </Timestamp>
                    </BubbleWrapper>
                  );
                }

                // Mensaje normal de chat
                const mine = item.senderId === auth.currentUser.uid;
                const date = item.createdAt?.toDate?.() || new Date();
                const hh = String(date.getHours()).padStart(2, '0');
                const mm = String(date.getMinutes()).padStart(2, '0');
                return (
                  <BubbleWrapper key={`m-${idx}`} mine={mine}>
                    <Sender>{mine ? 'Tú' : 'Profesor'}</Sender>
                    <Bubble mine={mine}>{item.text}</Bubble>
                    <Timestamp mine={mine}>{hh}:{mm}</Timestamp>
                  </BubbleWrapper>
                );
              })}
            </MessageContainer>

            <InputRow>
              <Input
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
    </Page>
  );
}
