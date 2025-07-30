// src/screens/admin/acciones/GestionClases.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Card from '../../../components/CommonCard';
import InfoGrid from '../../../components/InfoGrid';
import LoadingScreen from '../../../components/LoadingScreen';
import { db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { sendAssignmentEmails } from '../../../utils/email';
import { registerPendingClass } from '../../../utils/classWorkflow';

// Animación suave al cargar
const fadeDown = keyframes`
  from { opacity: 0; transform: translateY(-10px) }
  to   { opacity: 1; transform: translateY(0) }
`;

const Page = styled.div`
  background: #f7faf9;
  min-height: 100vh;
  padding: 2rem;
`;

const Container = styled.div`
  max-width: 1000px;
  margin: auto;
  animation: ${fadeDown} 0.4s ease-out;
`;

const Title = styled.h1`
  text-align: center;
  color: #034640;
  margin-bottom: 2rem;
  font-size: 2.5rem;
`;



const Label = styled.span`
  font-weight: 500;
  color: #014F40;
`;

const Value = styled.span`
  color: #333;
`;

const SectionTitle = styled.h3`
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #014F40;
  font-size: 1.1rem;
`;

const OffersList = styled.div`
  margin-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
`;

const OfferCard = styled.div`
  display: flex;
  flex-direction: column;
  background: #f0fdf4;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: background 0.2s;
  &:hover { background: #e6faf0; }
`;

const OfferHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AcceptText = styled.span`
  color: #006D5B;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    color: #005047;
    text-decoration: underline;
  }
`;

const ShowScheduleText = styled.span`
  color: #006D5B;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
  &:hover {
    color: #005047;
    text-decoration: underline;
  }
`;

const NameLink = styled.span`
  color: #2c5282;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

// Para mostrar la tabla de disponibilidad
const ScheduleContainer = styled.div`
  margin-top: 1rem;
  overflow-x: auto;
  border: 1px solid #ccc;
  border-radius: 6px;
`;

const ScheduleGrid = styled.div`
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  font-size: 0.75rem;
`;

const HeaderCell = styled.div`
  padding: 0.4rem;
  background: #f1faf7;
  font-weight: 600;
  text-align: center;
  border-right: 1px solid #ddd;
`;

const HourLabel = styled(HeaderCell)`
  background: #fff;
  white-space: nowrap;
`;

const SlotCell = styled.div`
  border: 1px solid #ccc;
  padding: 0.3rem;
  height: 24px;
  background: ${p => {
    if (p.prof) return '#034640';       /* Verde corporativo para profesor */
    if (p.student) return '#d4edda';    /* Verde claro para alumno */
    return '#fff';
  }};
  color: ${p => p.prof ? '#fff' : '#000'};
`;

const daysOfWeek = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const hours = Array.from({ length: 14 }, (_, i) => 8 + i);

// Helper: calcula semanas aproximadas entre dos fechas (YYYY-MM-DD)
function calculateWeeks(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0;
  const diffDays = diffMs / (1000 * 60 * 60 * 24) + 1;
  return Math.round(diffDays / 7);
}

// ----- Modal de confirmación -----
const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
`;
const Modal = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 320px;
  text-align: center;
`;
const ModalText = styled.p`
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #014F40;
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
  ${p => p.primary
    ? `background: #006D5B; color: #fff;`
    : `background: #f0f0f0; color: #333;`
  }
`;

export default function GestionClases() {
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOfferId, setExpandedOfferId] = useState(null);
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [offerToConfirm, setOfferToConfirm] = useState(null);
  const [classToConfirm, setClassToConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'clases'), where('estado', '==', 'pendiente'));
      const snap = await getDocs(q);
      const teacherCache = {};
      const data = await Promise.all(
        snap.docs.map(async (d) => {
          const c = { id: d.id, ...d.data() };
          const offsSnap = await getDocs(collection(db, 'clases', d.id, 'ofertas'));
          c.ofertas = await Promise.all(
            offsSnap.docs.map(async (o) => {
              const offer = { id: o.id, ...o.data() };
              const tId = offer.profesorId;
              if (!teacherCache[tId]) {
                try {
                  const tSnap = await getDoc(doc(db, 'usuarios', tId));
                  let studies = '';
                  let job = '';
                  let studyTime = '';
                  let status = '';
                  let iban = '';
                  if (tSnap.exists()) {
                    const d = tSnap.data();
                    studies = d.studies || '';
                    job = d.job || '';
                    studyTime = d.studyTime || '';
                    status = d.status || '';
                    iban = d.iban || '';
                  }
                  const unionsSnap = await getDocs(
                    query(collection(db, 'clases_union'), where('profesorId', '==', tId))
                  );
                  let classesCount = 0;
                  for (const u of unionsSnap.docs) {
                    const clSnap = await getDocs(
                      query(
                        collection(db, 'clases_union', u.id, 'clases_asignadas'),
                        where('estado', '==', 'aceptada')
                      )
                    );
                    classesCount += clSnap.size;
                  }
                  teacherCache[tId] = { studies, job, studyTime, status, iban, classesCount };
                } catch (err) {
                  console.error(err);
                  teacherCache[tId] = { studies: '', job: '', studyTime: '', status: '', iban: '', classesCount: 0 };
                }
              }
              offer.teacherInfo = teacherCache[tId];
              return offer;
            })
          );
          return c;
        })
      );
      setClases(data.filter((c) => c.ofertas.length > 0));
      setLoading(false);
    })();
  }, []);

  const markOfferPending = async (classId, offer, alumnoId, alumnoNombre, padreNombre, hijoId) => {
    await updateDoc(doc(db, 'clases', classId, 'ofertas', offer.id), {
      estado: 'en_proceso',
      updatedAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'clases', classId), {
      estado: 'en_proceso',
      profesorSeleccionado: offer.profesorNombre,
      precioSeleccionado: offer.precio,
      updatedAt: serverTimestamp()
    });
    await registerPendingClass({
      classId,
      offer,
      alumnoId,
      alumnoNombre,
      padreNombre,
      hijoId
    });
    setClases(cs => cs.filter(c => c.id !== classId));
  };

  const confirmOffer = async () => {
    if (!offerToConfirm || !classToConfirm) return;
    const c = classToConfirm;
    const o = offerToConfirm;
    await markOfferPending(c.id, o, c.alumnoId, c.alumnoNombre, c.padreNombre, c.hijoId);
    try {
      const profSnap = await getDoc(doc(db, 'usuarios', o.profesorId));
      const teacherEmail = profSnap.exists() ? profSnap.data().email : '';
      await sendAssignmentEmails({
        teacherEmail,
        teacherName: o.profesorNombre,
        studentEmail: '',
        studentName: '',
        schedule: c.schedule || [],
        recipient: 'teacher'
      });
    } catch (err) {
      console.error(err);
    }
    setConfirmModal(false);
    setOfferToConfirm(null);
    setClassToConfirm(null);
  };

  if (loading) {
    return <LoadingScreen fullscreen />;
  }

  return (
    <Page>
      <Container>
        <Title>Panel de Administración</Title>
        {clases.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            No hay ofertas pendientes.
          </p>
        ) : clases.map(c => {
          // Calculamos duración aproximada en semanas
          const duracion = calculateWeeks(c.fechaInicio, c.fechaFin);
          return (
            <Card key={c.id}>
              <InfoGrid>
                <div>
                  <Label>Alumno:</Label>{' '}
                  <NameLink
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/perfil/${c.alumnoId}`);
                    }}
                  >
                    {c.alumnoNombre} {c.alumnoApellidos}
                  </NameLink>
                </div>
                <div>
                  <Label>Asignaturas:</Label>{' '}
                  <Value>{c.asignaturas ? c.asignaturas.join(', ') : c.asignatura}</Value>
                </div>
                <div>
                  <Label>Curso:</Label>{' '}
                  <Value>{c.curso}</Value>
                </div>
                <div>
                  <Label>Modalidad:</Label>{' '}
                  <Value>{c.modalidad.charAt(0).toUpperCase() + c.modalidad.slice(1)}</Value>
                </div>
                <div>
                  <Label>Fecha inicio:</Label>{' '}
                  <Value>
                    {c.fechaInicio
                      ? new Date(c.fechaInicio).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : '—'}
                  </Value>
                </div>
                <div>
                  <Label>Fecha fin:</Label>{' '}
                  <Value>
                    {c.fechaFin
                      ? new Date(c.fechaFin).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : '—'}
                  </Value>
                </div>
                <div>
                  <Label>Duración Sém.:</Label>{' '}
                  <Value>
                    {duracion} {duracion === 1 ? 'semana' : 'semanas'}
                  </Value>
                </div>
                <div>
                  <Label>Horas/semana:</Label>{' '}
                  <Value>{c.horasSemana}</Value>
                </div>
              </InfoGrid>

              {/* Disponibilidad del alumno */}
              {c.schedule && c.schedule.length > 0 && (
                <>
                  <ShowScheduleText
                    onClick={() =>
                      setExpandedClassId(
                        expandedClassId === c.id ? null : c.id
                      )
                    }
                  >
                    {expandedClassId === c.id
                      ? 'Ocultar horario'
                      : 'Mostrar horario'}
                  </ShowScheduleText>

                  {expandedClassId === c.id && (
                    <>
                      <SectionTitle>Disponibilidad del alumno:</SectionTitle>
                      <ScheduleContainer>
                        <ScheduleGrid>
                          <HeaderCell>Hora</HeaderCell>
                          {daysOfWeek.map(d => (
                            <HeaderCell key={d}>{d}</HeaderCell>
                          ))}
                          {hours.map(h => (
                            <React.Fragment key={h}>
                              <HourLabel>{`${h}.00–${h + 1}.00`}</HourLabel>
                              {daysOfWeek.map(d => {
                                const key = `${d}-${h}`;
                                const studentHas = c.schedule.includes(key);
                                return (
                                  <SlotCell
                                    key={key}
                                    student={studentHas ? 1 : 0}
                                    prof={0}
                                  />
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </ScheduleGrid>
                      </ScheduleContainer>
                    </>
                  )}
                </>
              )}

              <OffersList>
                <SectionTitle>Ofertas recibidas:</SectionTitle>
                {c.ofertas.map(o => (
                  <OfferCard key={o.id}>
                    <OfferHeader>
                      <div>
                        <Label>Oferta profesor:</Label>{' '}
                        <NameLink
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/perfil/${o.profesorId}`);
                          }}
                        >
                          {o.profesorNombre}
                        </NameLink>
                        <br />
                        <Label>Precio:</Label>{' '}
                        <Value>€{o.precio}</Value>
                        <br />
                        <Label>Asignaturas prof.:</Label>{' '}
                        <Value>{o.asignaturas ? o.asignaturas.join(', ') : (c.asignaturas ? c.asignaturas.join(', ') : c.asignatura)}</Value>
                        {(() => {
                          const studSubs = c.asignaturas || (c.asignatura ? [c.asignatura] : []);
                          const profSubs = o.asignaturas || [];
                          const allSelected =
                            studSubs.length > 0 &&
                            studSubs.every(s => profSubs.includes(s)) &&
                            profSubs.length === studSubs.length;
                          return (
                            <>
                              <br />
                              <Label>Selección:</Label>{' '}
                              <Value>
                                {allSelected
                                  ? 'Todas las solicitadas'
                                  : `${profSubs.length} de ${studSubs.length}`}
                              </Value>
                            </>
                          );
                        })()}
                        {o.teacherInfo && (
                          <>
                            <br />
                            {o.teacherInfo.studies && (
                              <>
                                <Label>Estudios:</Label>{' '}
                                <Value>{o.teacherInfo.studies}</Value>
                                <br />
                              </>
                            )}
                            {o.teacherInfo.job &&
                              o.teacherInfo.job.toLowerCase() !== 'no trabaja' && (
                                <>
                                  <Label>Trabajo:</Label>{' '}
                                  <Value>{o.teacherInfo.job}</Value>
                                  <br />
                                </>
                              )}
                            {o.teacherInfo.studyTime && (
                              <>
                                <Label>Tiempo estudiando:</Label>{' '}
                                <Value>{o.teacherInfo.studyTime}</Value>
                                <br />
                              </>
                            )}
                            {o.teacherInfo.status && (
                              <>
                                <Label>Situación:</Label>{' '}
                                <Value>{o.teacherInfo.status}</Value>
                                <br />
                              </>
                            )}
                            {o.teacherInfo.iban && (
                              <>
                                <Label>IBAN:</Label>{' '}
                                <Value>{o.teacherInfo.iban}</Value>
                                <br />
                              </>
                            )}
                            {o.teacherInfo.classesCount !== undefined && (
                              <>
                                <Label>Clases impartidas:</Label>{' '}
                                <Value>{o.teacherInfo.classesCount}</Value>
                              </>
                            )}
                          </>
                        )}
                      </div>
                      <AcceptText
                        onClick={() => {
                          setOfferToConfirm(o);
                          setClassToConfirm(c);
                          setConfirmModal(true);
                        }}
                      >
                        Aceptar oferta
                      </AcceptText>
                    </OfferHeader>

                    {/* Alternar visibilidad de la tabla */}
                    <ShowScheduleText
                      onClick={() =>
                        setExpandedOfferId(
                          expandedOfferId === o.id ? null : o.id
                        )
                      }
                    >
                      {expandedOfferId === o.id
                        ? 'Ocultar horarios'
                        : 'Mostrar horarios'}
                    </ShowScheduleText>

                    {expandedOfferId === o.id && (
                      <>
                        <SectionTitle>Comparativa de horarios:</SectionTitle>
                        <ScheduleContainer>
                          <ScheduleGrid>
                            <HeaderCell>Hora</HeaderCell>
                            {daysOfWeek.map(d => (
                              <HeaderCell key={d}>{d}</HeaderCell>
                            ))}
                            {hours.map(h => (
                              <React.Fragment key={h}>
                                <HourLabel>{`${h}.00–${h + 1}.00`}</HourLabel>
                                {daysOfWeek.map(d => {
                                  const key = `${d}-${h}`;
                                  const studentHas = c.schedule.includes(key);
                                  const profHas = o.schedule?.includes(key);
                                  return (
                                    <SlotCell
                                      key={key}
                                      student={studentHas ? 1 : 0}
                                      prof={profHas ? 1 : 0}
                                    />
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </ScheduleGrid>
                        </ScheduleContainer>
                      </>
                    )}
                  </OfferCard>
                ))}
              </OffersList>
            </Card>
          );
        })}
        {confirmModal && offerToConfirm && classToConfirm && (
          <Overlay>
            <Modal>
              <ModalText>
                ¿Aceptar a {offerToConfirm.profesorNombre} para la clase de {classToConfirm.alumnoNombre}?
              </ModalText>
              <ModalActions>
                <ModalButton onClick={() => setConfirmModal(false)}>Cancelar</ModalButton>
                <ModalButton primary onClick={confirmOffer}>Aceptar</ModalButton>
              </ModalActions>
            </Modal>
          </Overlay>
        )}
      </Container>
    </Page>
  );
}
