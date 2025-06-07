// src/screens/alumno/Calendario.jsx
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { auth, db } from '../../../firebase/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  parseISO,
  getDay,
  eachDayOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f9fdfc 0%, #dff8f2 100%);
  min-height: 100vh;
`;

const CalendarContainer = styled.div`
  width: 100%;
  max-width: 600px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 14px 36px rgba(0,0,0,0.15);
  padding: 1rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #034640;
  &:hover { color: #046654; }
`;

const MonthLabel = styled.h2`
  font-size: 1.25rem;
  color: #034640;
  text-transform: capitalize;
`;

const DaysRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.25rem;
`;

const Cells = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const DayCell = styled.div`
  min-height: 100px;
  max-height: 140px;
  border: 1px solid #eee;
  padding: 0.25rem;
  background: ${p => p.isCurrentMonth ? '#fff' : '#f9f9f9'};
  position: relative;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
`;

const DayNumber = styled.div`
  font-size: 0.85rem;
  color: ${p => p.isToday ? '#046654' : '#333'};
  font-weight: ${p => p.isToday ? '700' : '400'};
`;

const EventsList = styled.div`
  margin-top: 4px;
  overflow-y: auto;
  flex: 1;
`;

const EventItem = styled.div`
  margin-bottom: 4px;
  padding: 4px;
  font-size: 0.75rem;
  border-radius: 4px;
  background: ${p => {
    if (p.status === 'facturacion') return '#800080';
    return p.status === 'pendiente' ? '#FFD700' : '#28a745';
  }};
  color: #fff;
  line-height: 1.2;
`;

// Mapeo de nombres de día (español) a getDay() numérico


export default function Calendario() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [clases, setClases] = useState([]);
  const [facturacion, setFacturacion] = useState([]);

  useEffect(() => {
    const fetchClases = async () => {
      const u = auth.currentUser;
      if (!u) return;
      const q = query(
        collection(db, 'clases_union'),
        where('alumnoId', '==', u.uid)
      );
      const snap = await getDocs(q);
      let all = [];
      for (const docu of snap.docs) {
        const unionData = docu.data();
        const subSnap = await getDocs(
          query(
            collection(db, 'clases_union', docu.id, 'clases_asignadas'),
            where('estado', '==', 'aceptada')
          )
        );
        subSnap.docs.forEach(d => {
          all.push({ id: d.id, profesorNombre: unionData.profesorNombre, ...d.data() });
        });
      }
      setClases(all);
    };
    const fetchFact = async () => {
      const snap = await getDocs(collection(db, 'facturacion'));
      setFacturacion(snap.docs.map(d => d.data()));
    };
    fetchClases();
    fetchFact();
  }, []);

  const prevMonth = () =>
    setCurrentMonth(addDays(startOfMonth(currentMonth), -1));
  const nextMonth = () =>
    setCurrentMonth(addDays(endOfMonth(currentMonth), 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(monthStart);
  const startDate  = startOfWeek(monthStart, { locale: es });
  const endDate    = endOfWeek(monthEnd,   { locale: es });

  const eventsByDate = {};

  clases.forEach(ev => {
    if (!ev.fecha) return;
    const key = format(parseISO(ev.fecha), 'yyyy-MM-dd');
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  });

  facturacion.forEach(f => {
    const key = f.fecha;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push({ id: 'f-' + key, mensaje: f.mensaje, estado: 'facturacion' });
  });

  const weekdays = Array.from({ length: 7 }).map((_, i) =>
    format(addDays(startOfWeek(new Date(), { locale: es }), i), 'EEEEEE', { locale: es })
  );

  const rows = [];
  let days = [];
  let day = startDate;
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayEvents = eventsByDate[dateKey] || [];
      days.push(
        <DayCell
          key={dateKey}
          isCurrentMonth={isSameMonth(day, monthStart)}
          isToday={isSameDay(day, new Date())}
        >
          <DayNumber>{format(day, 'd', { locale: es })}</DayNumber>
          <EventsList>
            {dayEvents.map(ev => {
              if (ev.estado === 'facturacion') {
                return (
                  <EventItem key={ev.id} status="facturacion">
                    {ev.mensaje}
                  </EventItem>
                );
              }
              const profLabel = `Profesor: ${ev.profesorNombre || 'N/A'}`;
              return (
                <EventItem key={ev.id} status={ev.estado}>
                  <strong>{ev.hora}</strong><br/>
                  {ev.asignatura}<br/>
                  <em>{profLabel}</em>
                </EventItem>
              );
            })}
          </EventsList>
        </DayCell>
      );
      day = addDays(day, 1);
    }
    rows.push(<Cells key={day}>{days}</Cells>);
    days = [];
  }

  return (
    <Page>
      <CalendarContainer>
        <Header>
          <NavButton onClick={prevMonth}>&#8249;</NavButton>
          <MonthLabel>
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </MonthLabel>
          <NavButton onClick={nextMonth}>&#8250;</NavButton>
        </Header>

        <DaysRow>
          {weekdays.map(d => <div key={d}>{d}</div>)}
        </DaysRow>

        {rows}
      </CalendarContainer>
    </Page>
  );
}
