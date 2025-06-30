// src/screens/alumno/acciones/Ofertas.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { auth, db } from '../../../firebase/firebaseConfig';
import { useAuth } from '../../../AuthContext';
import CompleteTeacherProfileModal from '../../../components/CompleteTeacherProfileModal';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';

// Animación de fade-in al desplegar
const fadeDown = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Helper: formatea Date como "D de mes" en español
function formatSpanishDate(date) {
  if (!date) return '';
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day} de ${month}`;
}

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

// Grupos de cursos igual que en NuevaClase
const cursosGrouped = [
  {
    group: 'Primaria',
    options: [
      '1º Primaria',
      '2º Primaria',
      '3º Primaria',
      '4º Primaria',
      '5º Primaria',
      '6º Primaria'
    ]
  },
  {
    group: 'ESO',
    options: ['1º ESO', '2º ESO', '3º ESO', '4º ESO']
  },
  {
    group: 'Bachillerato',
    options: ['1º Bachillerato', '2º Bachillerato']
  }
];

// Lista de días y horas usados tanto en filtros como en calendario
const daysOfWeek = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const hours = Array.from({ length: 14 }, (_, i) => 8 + i);

// Estilos principales
const Page = styled.div`
  background: #eef4f2;
  min-height: 100vh;
  padding: 2rem 1rem;
`;
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  animation: ${fadeDown} 0.4s ease-out;
`;
const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #024837;
  text-align: center;
  margin-bottom: 0.5rem;
  position: relative;
  &:after {
    content: '';
    display: block;
    width: 80px;
    height: 4px;
    background: #046654;
    margin: 8px auto 0;
    border-radius: 2px;
  }
`;
const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #035f4a;
  text-align: center;
  margin-bottom: 2rem;
`;

// Notificación de éxito
const SuccessNotification = styled.div`
  background: #dff0d8;
  color: #3c763d;
  border: 1px solid #d6e9c6;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 1rem;
`;

// Notificación de error
const ErrorNotification = styled.div`
  background: #f2dede;
  color: #a94442;
  border: 1px solid #ebccd1;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 1rem;
`;

// Card para filtros alineados en fila
const FilterCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f7fcfb 100%);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  padding: 1.75rem;
  margin-bottom: 2rem;
`;
const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 220px;
  min-width: 220px;
  label {
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #014F40;
    font-size: 0.95rem;
  }
`;

// Dropdown genéricos para filtros
const DropdownContainer = styled.div`
  position: relative;
`;
const DropdownHeader = styled.div`
  padding: 0.65rem 0.9rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: #03805c;
    background: #f0fbf9;
  }
`;
const ArrowSpan = styled.span`
  font-size: 0.85rem;
  color: #034640;
`;
const DropdownList = styled.ul`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  z-index: 20;
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
`;
const DropdownGroupLabel = styled.li`
  padding: 0.5rem 0.9rem;
  font-weight: 700;
  background: #e6f7f2;
  color: #014F40;
`;
const DropdownItem = styled.li`
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: #e6f7f2;
  }
`;

// Badge para destacar Asignatura y Curso en la tarjeta de clase
const Badge = styled.span`
  display: inline-block;
  background: ${p => p.variant === 'asignatura' ? '#DFF5EF' : '#F0F4F8'};
  color: ${p => p.variant === 'asignatura' ? '#006D5B' : '#034640'};
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  margin-right: 0.5rem;
`;

// Card de oferta de clase con estilo profesional
const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  margin-bottom: 1.75rem;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
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
  flex-direction: column;
`;
const StudentName = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: #024837;
  margin-bottom: 0.5rem;
`;
const HeaderBadges = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;
const HeaderRight = styled.div``;
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem 2rem;
  margin-bottom: 1rem;
`;
const Label = styled.span`
  font-weight: 500;
  color: #014F40;
`;
const Value = styled.span`
  color: #333;
`;
const PriceTag = styled.div`
  background: #DFF5EF;
  color: #006D5B;
  font-weight: 600;
  padding: 0.55rem 1.1rem;
  border-radius: 24px;
  font-size: 1.15rem;
  display: inline-block;
`;
const Controls = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1.5rem;
`;
const ShowScheduleText = styled.span`
  color: #006D5B;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.95rem;
  transition: color 0.2s, text-decoration 0.2s;
  &:hover {
    color: #005047;
    text-decoration: underline;
  }
`;
const RequestButton = styled.button`
  background: #034640;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.6rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  &:hover {
    background: #02634A;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
`;

// Modal de confirmación con estilo profesional
const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
`;
const Modal = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  max-width: 440px;
  width: 90%;
  text-align: left;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
`;
const ModalText = styled.div`
  font-size: 1rem;
  color: #014F40;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;
const ModalActions = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 1rem;
`;
const ModalButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  ${p => p.primary
    ? `
      background: #006D5B;
      color: #fff;
      &:hover {
        background: #005047;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
      }
    `
    : `
      background: #f0f0f0;
      color: #333;
      &:hover {
        background: #e0e0e0;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
      }
    `
  }
`;

// Calendario pequeño para selección de franjas
const SmallCalendarContainer = styled.div`
  margin-top: 1rem;
  overflow-x: auto;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 1rem;
`;
const SmallScheduleGrid = styled.div`
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
  border: ${p => p.selected ? '2px solid #024837' : '1px solid #ccc'};
  padding: 0.3rem;
  height: 24px;
  cursor: ${p => p.available ? 'pointer' : 'not-allowed'};
  background: ${p => {
    if (!p.available) return '#e0e0e0';
    if (p.selected) return '#024837';
    return '#ffffff';
  }};
  transition: background 0.2s, border 0.2s;
`;

export default function Ofertas() {
  // Datos de perfil y clases
  const { userData } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profesorCompleto, setProfesorCompleto] = useState('');
  const [clases, setClases] = useState([]);
  // Estados para expandir desglose de horario y selección de franjas
  const [expandedId, setExpandedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [subjectChoices, setSubjectChoices] = useState({});
  const [confirmModal, setConfirmModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);

  // Notificaciones
  const [successNotification, setSuccessNotification] = useState('');
  const [errorNotification, setErrorNotification] = useState('');

  // Estados para filtros
  const [asignaturasList, setAsignaturasList] = useState([]);
  const [filterAsignatura, setFilterAsignatura] = useState('');
  const [openAsignFiltro, setOpenAsignFiltro] = useState(false);
  const asignFiltroRef = useRef();

  const [filterModalidad, setFilterModalidad] = useState('');
  const [openModalidadFiltro, setOpenModalidadFiltro] = useState(false);
  const modalidadFiltroRef = useRef();

  const [filterTipoClase, setFilterTipoClase] = useState('');
  const [openTipoFiltro, setOpenTipoFiltro] = useState(false);
  const tipoFiltroRef = useRef();

  const [filterCurso, setFilterCurso] = useState('');
  const [openCursoFiltro, setOpenCursoFiltro] = useState(false);
  const cursoFiltroRef = useRef();

  // Carga del nombre completo del profesor y las clases pendientes sin ofertas propias
  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      // Nombre de profesor
      const snapUser = await getDoc(doc(db, 'usuarios', u.uid));
      if (snapUser.exists()) {
        const d = snapUser.data();
        setProfesorCompleto(`${d.nombre} ${d.apellidos || ''}`.trim());
      }
      // Clases pendientes sin ofertas del profesor actual
      const q = query(collection(db, 'clases'), where('estado', '==', 'pendiente'));
      const snap2 = await getDocs(q);
      const disponibles = [];
      for (const d of snap2.docs) {
        const data = d.data();
        const offersSnap = await getDocs(
          query(collection(db, 'clases', d.id, 'ofertas'),
                where('profesorId', '==', u.uid))
        );
        if (offersSnap.empty) {
          disponibles.push({ id: d.id, ...data });
        }
      }
      setClases(disponibles);
    })();
  }, []);

  // Carga de lista de asignaturas para el filtro
  useEffect(() => {
    (async () => {
      const sa = await getDocs(collection(db, 'asignaturas'));
      setAsignaturasList(sa.docs.map(d => d.data().asignatura));
    })();
  }, []);

  // Cerrar dropdowns de filtros al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = e => {
      if (asignFiltroRef.current && !asignFiltroRef.current.contains(e.target)) {
        setOpenAsignFiltro(false);
      }
      if (modalidadFiltroRef.current && !modalidadFiltroRef.current.contains(e.target)) {
        setOpenModalidadFiltro(false);
      }
      if (tipoFiltroRef.current && !tipoFiltroRef.current.contains(e.target)) {
        setOpenTipoFiltro(false);
      }
      if (cursoFiltroRef.current && !cursoFiltroRef.current.contains(e.target)) {
        setOpenCursoFiltro(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para alternar expansión de horario
  const toggleExpand = id => {
    if (expandedId !== id) {
      setSelectedSlots(new Set());
    }
    setExpandedId(expandedId === id ? null : id);
  };

  // Función para alternar selección de cada franja (sin límite)
  const toggleSlot = key => {
    setSelectedSlots(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const setSubjectChoice = (sub, can) => {
    setSubjectChoices(prev => ({ ...prev, [sub]: can }));
  };

  // Validación antes de abrir modal de confirmación
  const validateBeforeSubmit = clase => {
    const profileComplete =
      userData &&
      userData.docNumber &&
      userData.docType &&
      userData.studies &&
      userData.studyTime &&
      userData.job &&
      userData.job !== '' &&
      userData.status &&
      userData.iban;
    if (!profileComplete) {
      setShowProfileModal(true);
      return false;
    }
    if (expandedId !== clase.id) {
      setErrorNotification('Primero muestra el horario y selecciona franjas.');
      return false;
    }
    if (selectedSlots.size === 0) {
      setErrorNotification('Debes seleccionar al menos una franja para enviar la oferta.');
      return false;
    }
    // Si llegó aquí, validar ok
    setErrorNotification('');
    return true;
  };

  // Manejo de clic en "Enviar oferta"
  const handleSendOffer = clase => {
    if (!validateBeforeSubmit(clase)) return;
    setSelected(clase);
    const subs = clase.asignaturas || (clase.asignatura ? [clase.asignatura] : []);
    const choices = {};
    subs.forEach(s => {
      choices[s] = null;
    });
    setSubjectChoices(choices);
    setConfirmModal(true);
  };

  // Confirmar y guardar oferta en Firestore
  const confirmRequest = async () => {
    const clase = selected;
    const prof = auth.currentUser;
    const undecided = Object.values(subjectChoices).some(v => v === null);
    const selectedSubs = Object.entries(subjectChoices)
      .filter(([,v]) => v === true)
      .map(([s]) => s);
    if (undecided) {
      setErrorNotification('Indica si puedes o no en todas las asignaturas.');
      return;
    }
    if (selectedSubs.length === 0) {
      setErrorNotification('Selecciona al menos una asignatura.');
      return;
    }
    const snap = await getDoc(doc(db, 'usuarios', prof.uid));
    const profName = snap.exists()
      ? `${snap.data().nombre} ${snap.data().apellidos || ''}`.trim()
      : '';
    const franjas = Array.from(selectedSlots).map(slot => {
      const [day, h] = slot.split('-');
      return `${day} ${h}.00–${parseInt(h,10)+1}.00`;
    }).join(', ');
    await addDoc(collection(db, 'clases', clase.id, 'ofertas'), {
      profesorId: prof.uid,
      profesorNombre: profName,
      precio: clase.precioProfesores,
      estado: 'oferta',
      createdAt: serverTimestamp(),
      schedule: Array.from(selectedSlots),
      asignaturas: selectedSubs,
      fechaInicio: clase.fechaInicio,
      fechaFin: clase.fechaFin,
      horasSemana: clase.horasSemana,
      duracionSemanas: calculateWeeks(clase.fechaInicio, clase.fechaFin)
    });
    setClases(cs => cs.filter(c => c.id !== clase.id));
    setConfirmModal(false);
    setSelected(null);
    setSelectedSlots(new Set());
    setSubjectChoices({});

    // Mostrar información de proceso de selección en un modal
    setInfoModal(true);

    // Construir el texto de notificación
    const inicioTxt = clase.fechaInicio ? formatSpanishDate(new Date(clase.fechaInicio)) : '—';
    const finTxt = clase.fechaFin ? formatSpanishDate(new Date(clase.fechaFin)) : '—';
    const duration = calculateWeeks(clase.fechaInicio, clase.fechaFin);
    const durTxt = `${duration} ${duration === 1 ? 'semana' : 'semanas'}`;
    const firstName = clase.alumnoNombre?.split(' ')[0] || '';
    const asignText = selectedSubs.join(', ');
    const mensaje =
      `Se ha enviado tu oferta para la clase de ${asignText}.\n` +
      `Alumno: ${firstName}\n` +
      `Fecha inicio aprox.: ${inicioTxt}\n` +
      `Fecha fin aprox.: ${finTxt}\n` +
      `Duración aprox.: ${durTxt}\n` +
      `Franjas seleccionadas: ${franjas}`;
    setSuccessNotification(mensaje);
    setErrorNotification('');
  };

  // Renderiza resumen de horario en texto, ordenando días de la semana
  const renderSummary = schedule => {
    const byDay = {};
    schedule.forEach(slot => {
      const [day, h] = slot.split('-');
      byDay[day] = byDay[day] || [];
      byDay[day].push(`${h}.00–${parseInt(h,10)+1}.00`);
    });
    return daysOfWeek.map(day => {
      if (!byDay[day]) return null;
      return (
        <div key={day}>
          <strong>{day}:</strong> {byDay[day].join(', ')}
        </div>
      );
    });
  };

  // Filtrar clases según los valores de filtros y descartar las sin nombre de alumno
  const clasesFiltradas = clases.filter(c => {
    if (!c.alumnoNombre || c.alumnoNombre.trim() === '') {
      return false;
    }
    const matchAsign = filterAsignatura
      ? (c.asignaturas ? c.asignaturas.includes(filterAsignatura) : c.asignatura === filterAsignatura)
      : true;
    const matchModalidad = filterModalidad ? c.modalidad === filterModalidad : true;
    const matchTipo = filterTipoClase ? c.tipoClase === filterTipoClase : true;
    const matchCurso = filterCurso ? c.curso === filterCurso : true;
    return matchAsign && matchModalidad && matchTipo && matchCurso;
  });

  return (
    <Page>
      <Container>
        {successNotification && (
          <SuccessNotification>
            {successNotification.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </SuccessNotification>
        )}
        {errorNotification && (
          <ErrorNotification>
            {errorNotification}
          </ErrorNotification>
        )}
        <Title>Solicitar Clase</Title>
        <Subtitle>Profesor: {profesorCompleto}</Subtitle>

        {/* Sección de filtros alineados en una fila */}
        <FilterCard>
          <FiltersContainer>
            {/* Filtro de Asignatura */}
            <Field ref={asignFiltroRef}>
              <label>Asignatura</label>
              <DropdownContainer>
                <DropdownHeader onClick={() => setOpenAsignFiltro(o => !o)}>
                  {filterAsignatura || 'Todas'} <ArrowSpan>{openAsignFiltro ? '▲' : '▼'}</ArrowSpan>
                </DropdownHeader>
                {openAsignFiltro && (
                  <DropdownList>
                    <DropdownItem
                      onClick={() => { setFilterAsignatura(''); setOpenAsignFiltro(false); }}
                    >
                      Todas
                    </DropdownItem>
                    {asignaturasList.map((a, i) => (
                      <DropdownItem
                        key={i}
                        onClick={() => { setFilterAsignatura(a); setOpenAsignFiltro(false); }}
                      >
                        {a}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                )}
              </DropdownContainer>
            </Field>

            {/* Filtro de Curso */}
            <Field ref={cursoFiltroRef}>
              <label>Curso</label>
              <DropdownContainer>
                <DropdownHeader onClick={() => setOpenCursoFiltro(o => !o)}>
                  {filterCurso || 'Todos'} <ArrowSpan>{openCursoFiltro ? '▲' : '▼'}</ArrowSpan>
                </DropdownHeader>
                {openCursoFiltro && (
                  <DropdownList>
                    <DropdownItem
                      onClick={() => { setFilterCurso(''); setOpenCursoFiltro(false); }}
                    >
                      Todos
                    </DropdownItem>
                    {cursosGrouped.map(({ group, options }) => (
                      <React.Fragment key={group}>
                        <DropdownGroupLabel>{group}</DropdownGroupLabel>
                        {options.map((cName, idx) => (
                          <DropdownItem
                            key={idx}
                            onClick={() => { setFilterCurso(cName); setOpenCursoFiltro(false); }}
                          >
                            {cName}
                          </DropdownItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </DropdownList>
                )}
              </DropdownContainer>
            </Field>

            {/* Filtro de Modalidad */}
            <Field ref={modalidadFiltroRef}>
              <label>Modalidad</label>
              <DropdownContainer>
                <DropdownHeader onClick={() => setOpenModalidadFiltro(o => !o)}>
                  {filterModalidad
                    ? filterModalidad.charAt(0).toUpperCase() + filterModalidad.slice(1)
                    : 'Todas'}{' '}
                  <ArrowSpan>{openModalidadFiltro ? '▲' : '▼'}</ArrowSpan>
                </DropdownHeader>
                {openModalidadFiltro && (
                  <DropdownList>
                    <DropdownItem
                      onClick={() => { setFilterModalidad(''); setOpenModalidadFiltro(false); }}
                    >
                      Todas
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { setFilterModalidad('online'); setOpenModalidadFiltro(false); }}
                    >
                      Online
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { setFilterModalidad('presencial'); setOpenModalidadFiltro(false); }}
                    >
                      Presencial
                    </DropdownItem>
                  </DropdownList>
                )}
              </DropdownContainer>
            </Field>

            {/* Filtro de Tipo de Clase */}
            <Field ref={tipoFiltroRef}>
              <label>Tipo de Clase</label>
              <DropdownContainer>
                <DropdownHeader onClick={() => setOpenTipoFiltro(o => !o)}>
                  {filterTipoClase
                    ? filterTipoClase.charAt(0).toUpperCase() + filterTipoClase.slice(1)
                    : 'Todas'}{' '}
                  <ArrowSpan>{openTipoFiltro ? '▲' : '▼'}</ArrowSpan>
                </DropdownHeader>
                {openTipoFiltro && (
                  <DropdownList>
                    <DropdownItem
                      onClick={() => { setFilterTipoClase(''); setOpenTipoFiltro(false); }}
                    >
                      Todas
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { setFilterTipoClase('individual'); setOpenTipoFiltro(false); }}
                    >
                      Individual
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { setFilterTipoClase('doble'); setOpenTipoFiltro(false); }}
                    >
                      Doble
                    </DropdownItem>
                  </DropdownList>
                )}
              </DropdownContainer>
            </Field>
          </FiltersContainer>
        </FilterCard>

        {/* Listado de clases filtradas */}
        {clasesFiltradas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '3rem' }}>
            No hay clases disponibles que coincidan con los filtros.
          </p>
        ) : clasesFiltradas.map(c => {
          const inicioDate = c.fechaInicio ? new Date(c.fechaInicio) : null;
          const finDate = c.fechaFin ? new Date(c.fechaFin) : null;
          const duracion = calculateWeeks(c.fechaInicio, c.fechaFin);
          return (
            <Card key={c.id}>
              <CardHeader>
                <HeaderLeft>
                  <StudentName>
                    {c.alumnoNombre?.split(' ')[0]}
                  </StudentName>
                  <HeaderBadges>
                    <Badge variant="asignatura">{c.asignaturas ? c.asignaturas.join(', ') : c.asignatura}</Badge>
                    <Badge variant="curso">{c.curso}</Badge>
                  </HeaderBadges>
                </HeaderLeft>
                <HeaderRight>
                  <PriceTag>€{c.precioProfesores}/h</PriceTag>
                </HeaderRight>
              </CardHeader>

              <InfoGrid>
                <div>
                  <Label>Tipo:</Label>{' '}
                  <Value>{c.tipoClase.charAt(0).toUpperCase() + c.tipoClase.slice(1)}</Value>
                </div>
                <div>
                  <Label>Modalidad:</Label>{' '}
                  <Value>{c.modalidad.charAt(0).toUpperCase() + c.modalidad.slice(1)}</Value>
                </div>
                {c.modalidad === 'presencial' && (
                  <div>
                    <Label>Zona:</Label>{' '}
                    <Value>{c.zona || '—'}</Value>
                  </div>
                )}
                <div>
                  <Label>Fecha inicio:</Label>{' '}
                  <Value>{inicioDate ? formatSpanishDate(inicioDate) : '—'}</Value>
                </div>
                <div>
                  <Label>Fecha fin:</Label>{' '}
                  <Value>{finDate ? formatSpanishDate(finDate) : '—'}</Value>
                </div>
                <div>
                  <Label>Duración aprox.:</Label>{' '}
                  <Value>{duracion} {duracion === 1 ? 'semana' : 'semanas'}</Value>
                </div>
                <div>
                  <Label>Horas/semana:</Label>{' '}
                  <Value>{c.horasSemana} <em>(aprox.)</em></Value>
                </div>
                {c.notas && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Label>Notas adicionales:</Label>{' '}
                    <Value>{c.notas}</Value>
                  </div>
                )}
              </InfoGrid>

              <Controls>
                <ShowScheduleText onClick={() => toggleExpand(c.id)}>
                  {expandedId === c.id ? 'Ocultar horario' : 'Mostrar horario'}
                </ShowScheduleText>
                <RequestButton
                  onClick={() => handleSendOffer(c)}
                >
                  Enviar oferta
                </RequestButton>
              </Controls>

              {expandedId === c.id && (
                <SmallCalendarContainer>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Selecciona las franjas en las que puedas dar clase dentro de la disponibilidad del alumno:</strong>{' '}
                    ({selectedSlots.size} seleccionadas)
                  </div>
                  <SmallScheduleGrid>
                    <HeaderCell>Hora</HeaderCell>
                    {daysOfWeek.map(d => <HeaderCell key={d}>{d}</HeaderCell>)}
                    {hours.map(h => (
                      <React.Fragment key={h}>
                        <HourLabel>{`${h}.00–${h + 1}.00`}</HourLabel>
                        {daysOfWeek.map(d => {
                          const key = `${d}-${h}`;
                          const available = c.schedule?.includes(key);
                          const isSelected = selectedSlots.has(key);
                          return (
                            <SlotCell
                              key={key}
                              available={available}
                              selected={isSelected}
                              onClick={() => {
                                if (!available) return;
                                toggleSlot(key);
                              }}
                            />
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </SmallScheduleGrid>
                </SmallCalendarContainer>
              )}
            </Card>
          );
        })}

        {/* Modal de confirmación de oferta */}
        {confirmModal && selected && (
          <Overlay>
            <Modal>
              <ModalText>
                Vas a enviar oferta de <strong>€{selected.precioProfesores}/h</strong><br/>
                al alumno <strong>{selected.alumnoNombre}</strong>.<br/>
                <strong>Indica si puedes impartir cada asignatura:</strong><br/>
                {(selected.asignaturas || [selected.asignatura]).map((s,i) => (
                  <div key={i} style={{ marginBottom: '0.25rem' }}>
                    <strong>{s}</strong>{' '}
                    <label style={{ marginLeft: '0.5rem' }}>
                      <input
                        type="radio"
                        name={`sub-${i}`}
                        checked={subjectChoices[s] === true}
                        onChange={() => setSubjectChoice(s, true)}
                      />{' '}Sí
                    </label>{' '}
                    <label style={{ marginLeft: '0.5rem' }}>
                      <input
                        type="radio"
                        name={`sub-${i}`}
                        checked={subjectChoices[s] === false}
                        onChange={() => setSubjectChoice(s, false)}
                      />{' '}No
                    </label>
                  </div>
                ))}
                <br/>
                <strong>Fecha inicio:</strong>{' '}
                {selected.fechaInicio ? formatSpanishDate(new Date(selected.fechaInicio)) : '—'}<br/>
                <strong>Fecha fin:</strong>{' '}
                {selected.fechaFin ? formatSpanishDate(new Date(selected.fechaFin)) : '—'}<br/>
                <strong>Duración aprox.:</strong> {calculateWeeks(selected.fechaInicio, selected.fechaFin)} {calculateWeeks(selected.fechaInicio, selected.fechaFin) === 1 ? 'semana' : 'semanas'}<br/>
                <strong>Horas/semana:</strong> {selected.horasSemana} <em>(aprox.)</em><br/><br/>
                <strong>Horario de TÚ DISPONIBILIDAD:</strong><br/>
                {renderSummary(Array.from(selectedSlots))}
              </ModalText>
              <ModalActions>
                <ModalButton onClick={() => setConfirmModal(false)}>
                  Cancelar
                </ModalButton>
                <ModalButton primary onClick={confirmRequest}>
                  Confirmar oferta
                </ModalButton>
              </ModalActions>
            </Modal>
          </Overlay>
        )}

        {/* Modal informativo tras enviar oferta */}
        {infoModal && (
          <Overlay>
            <Modal>
              <ModalText>
                Has entrado en el proceso de selección de esta clase.<br/>
                Aún no has sido seleccionado, pero si los administradores deciden asignarte
                recibirás un correo en la dirección con la que te registraste.
              </ModalText>
              <ModalActions>
                <ModalButton primary onClick={() => setInfoModal(false)}>
                  Entendido
                </ModalButton>
              </ModalActions>
            </Modal>
          </Overlay>
        )}
      </Container>
      <CompleteTeacherProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={userData}
      />
    </Page>
  );
}
