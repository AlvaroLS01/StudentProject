// src/screens/admin/acciones/GestionClases.jsx
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

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

const Card = styled.div`
  background: #fff;
  border-radius: 10px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 28px rgba(0,0,0,0.12);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem 1.5rem;
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

export default function GestionClases() {
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOfferId, setExpandedOfferId] = useState(null);

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'clases'), where('estado', '==', 'pendiente'));
      const snap = await getDocs(q);
      const data = await Promise.all(snap.docs.map(async d => {
        const c = { id: d.id, ...d.data() };
        const offsSnap = await getDocs(collection(db, 'clases', d.id, 'ofertas'));
        c.ofertas = offsSnap.docs.map(o => ({ id: o.id, ...o.data() }));
        return c;
      }));
      setClases(data.filter(c => c.ofertas.length > 0));
      setLoading(false);
    })();
  }, []);

  const assignOffer = async (classId, offer, alumnoId, alumnoNombre) => {
    await updateDoc(doc(db, 'clases', classId, 'ofertas', offer.id), {
      estado: 'aceptada',
      updatedAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'clases', classId), {
      estado: 'aceptada',
      profesorSeleccionado: offer.profesorNombre,
      precioSeleccionado: offer.precio,
      updatedAt: serverTimestamp()
    });
    await addDoc(collection(db, 'clases_union'), {
      claseId: classId,
      alumnoId,
      alumnoNombre,
      profesorId: offer.profesorId,
      profesorNombre: offer.profesorNombre,
      createdAt: serverTimestamp()
    });
    setClases(cs => cs.filter(c => c.id !== classId));
  };

  if (loading) {
    return (
      <Page>
        <Container>
          <Title>Panel de Administración</Title>
          <p style={{ textAlign: 'center', color: '#666' }}>Cargando clases...</p>
        </Container>
      </Page>
    );
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
                  <Value>{c.alumnoNombre} {c.alumnoApellidos}</Value>
                </div>
                <div>
                  <Label>Asignatura:</Label>{' '}
                  <Value>{c.asignatura}</Value>
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

              <OffersList>
                <SectionTitle>Ofertas recibidas:</SectionTitle>
                {c.ofertas.map(o => (
                  <OfferCard key={o.id}>
                    <OfferHeader>
                      <div>
                        <Label>Oferta profesor:</Label>{' '}
                        <Value>{o.profesorNombre}</Value><br />
                        <Label>Precio:</Label>{' '}
                        <Value>€{o.precio}</Value>
                      </div>
                      <AcceptText
                        onClick={() =>
                          assignOffer(c.id, o, c.alumnoId, c.alumnoNombre)
                        }
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
      </Container>
    </Page>
  );
}
