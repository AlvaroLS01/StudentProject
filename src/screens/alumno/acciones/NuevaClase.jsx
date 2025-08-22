// src/screens/alumno/acciones/NuevaClase.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useNotification } from "../../../NotificationContext";
import { auth, db } from '../../../firebase/firebaseConfig';
import { useAuth } from '../../../AuthContext';
import { useChild } from '../../../ChildContext';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc
} from 'firebase/firestore';
import { fetchCities, fetchCursos, fetchAsignaturas, createOferta, fetchPagos } from '../../../utils/api';
import { Overlay, Modal, ModalText, ModalActions, ModalButton } from '../../../components/ModalStyles';

// Animación fade-in
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Estilos generales
const Page = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #e6f7f2;
  padding: 1rem;
`;
const Card = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f0fcf9 100%);
  border-radius: 12px;
  padding: 2rem 1.5rem;
  box-shadow: 0 14px 36px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 700px;
  animation: ${fadeIn} 0.4s ease-out;
`;
const Title = styled.h2`
  font-size: 1.75rem;
  color: #034640;
  text-align: center;
  margin-bottom: 0.5rem;
  &:after {
    content: '';
    display: block;
    width: 50px;
    height: 3px;
    background: #046654;
    margin: 6px auto 0;
    border-radius: 2px;
  }
`;
const Subtitle = styled.p`
  text-align: center;
  color: #014F40;
  margin-bottom: 1.5rem;
  font-style: italic;
  font-size: 0.9rem;
`;
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  label {
    margin-bottom: 0.4rem;
    font-weight: 600;
    color: #014F40;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
  }
  input, textarea, select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 0.95rem;
    background: #fff;
  }
  input[type="date"] {
    font-size: 0.9rem;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
  textarea {
    resize: vertical;
    min-height: 100px;
  }
  ${p => p.error && `
    label { color: #c0392b; }
    input, textarea, select { border-color: #c0392b; }
  `}
`;
const InfoWrapper = styled.div`
  position: relative;
  display: inline-block;
  margin-left: 6px;
`;
const InfoButton = styled.button`
  width: 1em;
  height: 1em;
  padding: 0;
  border: 1px solid #888;
  border-radius: 50%;
  background: #fff;
  color: #888;
  font-size: 0.75em;
  line-height: 1;
  text-align: center;
  cursor: default;
`;
const Tooltip = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 250px;
  background: rgba(0,0,0,0.8);
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
  z-index: 9999;
  ${InfoWrapper}:hover & {
    opacity: 1;
  }
`;
const DropdownContainer = styled.div`
  position: relative;
`;
const DropdownHeader = styled.div`
  padding: 0.6rem 0.8rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? 'none' : 'auto')};
  ${p => p.error && 'border-color: #c0392b;'}
`;
const ArrowSpan = styled.span`
  font-size: 0.8rem;
  color: #034640;
`;
const DropdownList = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  z-index: 10;
  list-style: none;
  margin: 0;
  padding: 0;
`;
const DropdownGroupLabel = styled.li`
  padding: 0.5rem 0.8rem;
  font-weight: 700;
  background: #e6f7f2;
  color: #014F40;
`;
const DropdownItem = styled.li`
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? 'none' : 'auto')};
  &:hover { background: #e6f7f2; }
`;
const Button = styled.button`
  width: 100%;
  padding: 0.9rem;
  margin-top: 2rem;
  background: #006D5B;
  color: #fff;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? 'none' : 'auto')};
`;
const ScheduleContainer = styled.div`
  margin-top: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow-x: auto;
`;
const ScheduleGrid = styled.div`
  display: grid;
  grid-template-columns: 140px repeat(7, 1fr);
`;
const HeaderCell = styled.div`
  padding: 0.5rem;
  background: #f1faf7;
  font-weight: 600;
  text-align: center;
  font-size: 0.85rem;
`;
const HourLabel = styled(HeaderCell)`
  background: #fff;
  white-space: nowrap;
`;
const SlotCell = styled.div`
  border: 1px solid #ccc;
  padding: 0.4rem;
  height: 32px;
  background: ${p => (p.selected ? '#046654' : '#fff')};
  cursor: pointer;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? 'none' : 'auto')};
`;


// Utilidad para obtener la fecha de hoy en formato YYYY-MM-DD
const getToday = () => new Date().toISOString().split('T')[0];
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const hours = Array.from({ length: 14 }, (_, i) => 8 + i);

export default function NuevaClase() {
  const [cursosGrouped, setCursosGrouped] = useState([]);
  const [asignaturas, setAsignaturas]     = useState([]);
  const [curso, setCurso]                 = useState('');
  const [tipoClase, setTipoClase]         = useState('individual');
  const [modalidad, setModalidad]         = useState('online');
  const [ciudad, setCiudad]               = useState('');
  const [cityGroups, setCityGroups]       = useState({});
  const [startDate, setStartDate]         = useState(getToday());
  const [endDate, setEndDate]             = useState('');
  const [noEndDate, setNoEndDate]         = useState(false);
  const [horasSemana, setHorasSemana]     = useState('');
  const [notas, setNotas]                 = useState('');
  const [precioPadres, setPrecioPadres]   = useState(0);
  const [precioProfesores, setPrecioProfesores] = useState(0);
  const [asignaturasList, setAsignaturasList]   = useState([]);
  const [ciudadesList, setCiudadesList]         = useState([]);
  const [pagoMap, setPagoMap]                   = useState({});
  const [openAsign, setOpenAsign]               = useState(false);
  const [openCurso, setOpenCurso]               = useState(false);
  const [openCity, setOpenCity]                 = useState(false);
  const [selectedSlots, setSelectedSlots]       = useState(new Set());
  const [confirmModal, setConfirmModal]         = useState(false);
  const [submitting, setSubmitting]             = useState(false);
  const [successModal, setSuccessModal]         = useState(false);

  const [errors, setErrors] = useState({});

  const { userData } = useAuth();
  const { selectedChild } = useChild();

  const [alumnoNombre, setAlumnoNombre]         = useState('');
  const [alumnoApellidos, setAlumnoApellidos]   = useState('');
  const asignRef = useRef();
  const cursoRef = useRef();
  const cityRef  = useRef();
  const datesRef = useRef();
  const horasRef = useRef();
  const scheduleRef = useRef();
  const navigate = useNavigate();
  const { show } = useNotification();

  // Datos de usuario/alumno para autocompletar el formulario
  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const snap = await getDoc(doc(db, 'usuarios', u.uid));
      if (snap.exists()) {
        const d = snap.data();
        if (d.rol === 'tutor' && selectedChild) {
          setAlumnoNombre(selectedChild.nombre);
          setAlumnoApellidos('');
          setCurso(selectedChild.curso || '');
        } else {
          setAlumnoNombre(d.nombre);
          setAlumnoApellidos(d.apellidos || d.apellido || '');
          setCurso(d.curso || '');
        }
        if (d.ciudad) setCiudad(d.ciudad);
      }
    })();
  }, [selectedChild]);

  // Carga asignaturas, ciudades y cursos desde el servidor
  useEffect(() => {
    (async () => {
      try {
        const [asigRes, cityRes, courseRes, pagoRes] = await Promise.all([
          fetchAsignaturas(),
          fetchCities(),
          fetchCursos(),
          fetchPagos()
        ]);
        setAsignaturasList(asigRes.map(a => a.nombre_asignatura || a.nombre));
        const cityMap = {};
        cityRes.forEach(c => {
          cityMap[c.nombre] = c.grupo || 'A';
        });
        setCiudadesList(cityRes.map(c => c.nombre));
        setCityGroups(cityMap);
        const pMap = {};
        pagoRes.forEach(p => {
          const g = p.grupo;
          if (!pMap[g]) pMap[g] = {};
          if (!pMap[g][p.curso]) pMap[g][p.curso] = {};
          if (!pMap[g][p.curso][p.modalidad]) pMap[g][p.curso][p.modalidad] = {};
          pMap[g][p.curso][p.modalidad][p.tipo] = p;
        });
        setPagoMap(pMap);
        const groups = {};
        courseRes.forEach(({ nombre }) => {
          let key;
          if (nombre.includes('Primaria')) key = 'Primaria';
          else if (nombre.includes('ESO')) key = 'ESO';
          else if (nombre.includes('Bachillerato')) key = 'Bachillerato';
          else key = 'Otros';
          if (!groups[key]) groups[key] = [];
          groups[key].push(nombre);
        });
        const grouped = Object.entries(groups).map(([group, options]) => ({ group, options }));
        setCursosGrouped(grouped);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = e => {
      if (asignRef.current && !asignRef.current.contains(e.target)) setOpenAsign(false);
      if (cursoRef.current && !cursoRef.current.contains(e.target)) setOpenCurso(false);
      if (cityRef.current  && !cityRef.current.contains(e.target)) setOpenCity(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular precios
  useEffect(() => {
    if (!curso || !ciudad || !Object.keys(pagoMap).length) return;
    const group = cityGroups[ciudad] || 'A';
    const modKey = modalidad === 'online' ? 'Online' : 'Presencial';
    let cKey;
    if (curso.includes('Primaria')) cKey = 'Primaria';
    else if (curso.includes('ESO')) {
      if (modKey === 'Presencial' && group === 'B') {
        if (curso.includes('1º') || curso.includes('2º')) cKey = '1º y 2º ESO';
        else cKey = '3º y 4º ESO';
      } else {
        cKey = 'ESO';
      }
    } else if (curso.includes('Bachillerato')) {
      if (modKey === 'Presencial' && group === 'B') {
        if (curso.includes('1º')) cKey = '1º Bachillerato';
        else if (curso.includes('2º')) cKey = '2º Bachillerato';
        else cKey = 'Bachillerato';
      } else {
        cKey = 'Bachillerato';
      }
    } else {
      cKey = curso;
    }
    const p = pagoMap[group]?.[cKey]?.[modKey]?.[tipoClase];
    if (p) {
      setPrecioPadres(parseFloat(p.precio_tutor).toFixed(2));
      setPrecioProfesores(parseFloat(p.precio_profesor).toFixed(2));
    } else {
      setPrecioPadres(0);
      setPrecioProfesores(0);
    }
  }, [tipoClase, modalidad, ciudad, curso, cityGroups, pagoMap]);

  // Toggle franjas horarias
  const toggleSlot = (day, hour) => {
    const key = `${day}-${hour}`;
    setSelectedSlots(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setErrors(prev => ({ ...prev, horario: false }));
  };

  // Manejar cambio de checkbox "sin fecha de fin planeada"
  const handleNoEndDateChange = (checked) => {
    setNoEndDate(checked);
    if (checked) {
      // Fecha de fin de curso: 23 de junio de 2026
      setEndDate('2026-06-23');
    } else {
      setEndDate('');
    }
    setErrors(prev => ({ ...prev, fechas: false }));
  };

  // Validar y abrir modal
  const handleSubmit = () => {
    const newErrors = {};
    let firstRef = null;
    if (asignaturas.length === 0) {
      newErrors.asignaturas = true;
      firstRef = firstRef || asignRef;
    }
    if (!curso) {
      newErrors.curso = true;
      firstRef = firstRef || cursoRef;
    }
    if (!ciudad) {
      newErrors.ciudad = true;
      firstRef = firstRef || cityRef;
    }
    if (!startDate || !endDate) {
      newErrors.fechas = true;
      firstRef = firstRef || datesRef;
    }
    if (!horasSemana || parseInt(horasSemana, 10) < 1) {
      newErrors.horas = true;
      firstRef = firstRef || horasRef;
    }
    if (selectedSlots.size === 0) {
      newErrors.horario = true;
      firstRef = firstRef || scheduleRef;
    }

    setErrors(newErrors);

    const fieldNames = {
      asignaturas: 'Asignaturas',
      curso: 'Curso',
      ciudad: 'Ciudad',
      fechas: 'Fechas',
      horas: 'Horas por semana',
      horario: 'Horario'
    };
    const missing = Object.keys(newErrors).map(k => fieldNames[k]);
    if (missing.length > 0) {
      show('Faltan: ' + missing.join(', '), 'error');
      if (firstRef && firstRef.current) {
        firstRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setConfirmModal(true);
  };

  // Restablecer todos los campos del formulario
  const resetForm = () => {
    setAsignaturas([]);
    setCurso('');
    setTipoClase('individual');
    setModalidad('online');
    setCiudad('');
    setStartDate(getToday());
    setEndDate('');
    setNoEndDate(false);
    setHorasSemana('');
    setNotas('');
    setPrecioPadres(0);
    setPrecioProfesores(0);
    setSelectedSlots(new Set());
  };

  // Confirmar y guardar
  const confirmRequest = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const modalidadStore = modalidad === 'presencial' ? 'Presencial' : 'Online';
      const ofertaRes = await createOferta({
        fecha_oferta: new Date().toISOString(),
        fecha_inicio: startDate,
        fecha_fin: endDate,
        disponibilidad: Array.from(selectedSlots).join(','),
        estado: 'pendiente',
        numero_horas: parseInt(horasSemana, 10),
        modalidad: modalidadStore,
        tipo: tipoClase,
        beneficio_sp: precioPadres - precioProfesores,
        ganancia_profesor: precioProfesores,
        precio_alumno: precioPadres,
        precio_profesor: precioProfesores,
        tutor_email: auth.currentUser.email,
        alumno_nombre: alumnoNombre,
        alumno_apellidos: alumnoApellidos,
        asignaturas,
        anotaciones: notas,
      });

      await addDoc(collection(db,'clases'), {
        alumnoId: auth.currentUser.uid,
        alumnoNombre,
        alumnoApellidos,
        hijoId: userData?.rol === 'tutor' ? selectedChild?.id : null,
        padreNombre: userData?.rol === 'tutor' ? userData.nombre : null,
        asignatura: asignaturas[0] || '',
        asignaturas,
        curso,
        tipoClase,
        modalidad: modalidadStore,
        ciudad,
        fechaInicio: startDate,
        fechaFin: endDate,
        horasSemana: parseInt(horasSemana, 10),
        schedule: Array.from(selectedSlots),
        precioPadres,
        precioProfesores,
        notas,
        estado: 'pendiente',
        ofertaId: ofertaRes.id,
        createdAt: serverTimestamp()
      });
      resetForm();
      setConfirmModal(false);
      setSuccessModal(true);
    } catch (err) {
      console.error(err);
      show('Error: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModal(false);
    navigate('/tutor?tab=clases&view=solicitudes');
  };

  return (
    <Page>
      <Card>
        <Title>
          Solicitar nueva clase
          {userData?.rol === 'tutor' && alumnoNombre && ` para ${alumnoNombre}`}
        </Title>
        <Subtitle>Encuentra al profesor ideal para ti</Subtitle>

        <FormGrid>
          {/* Asignatura */}
          <Field ref={asignRef} error={errors.asignaturas}>
            <label>Asignatura *</label>
            <DropdownContainer>
              <DropdownHeader error={errors.asignaturas} onClick={() => setOpenAsign(o => !o)}>
                {asignaturas.length > 0 ? asignaturas.join(', ') : 'Selecciona asignaturas'} <ArrowSpan>{openAsign ? '▲' : '▼'}</ArrowSpan>
              </DropdownHeader>
              {openAsign && (
                <DropdownList>
                  {asignaturasList.map((a,i) => (
                    <DropdownItem key={i} onClick={() => {
                      setAsignaturas(prev =>
                        prev.includes(a)
                          ? prev.filter(s => s !== a)
                          : [...prev, a]
                      );
                      setErrors(prev => ({ ...prev, asignaturas: false }));
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input className="form-control" type="checkbox" checked={asignaturas.includes(a)} readOnly /> {a}
                      </label>
                    </DropdownItem>
                  ))}
                </DropdownList>
              )}
            </DropdownContainer>
          </Field>

          {/* Curso */}
          <Field ref={cursoRef} error={errors.curso}>
            <label>Curso *</label>
            <DropdownContainer>
              <DropdownHeader error={errors.curso} onClick={() => setOpenCurso(o => !o)}>
                {curso || 'Selecciona curso'} <ArrowSpan>{openCurso ? '▲' : '▼'}</ArrowSpan>
              </DropdownHeader>
              {openCurso && (
                <DropdownList>
                  {cursosGrouped.map(({group, options}) => (
                    <React.Fragment key={group}>
                      <DropdownGroupLabel>{group}</DropdownGroupLabel>
                      {options.map((c,i) => (
                        <DropdownItem
                          key={i}
                          onClick={() => { setCurso(c); setOpenCurso(false); setErrors(prev => ({ ...prev, curso:false })); }}
                        >
                          {c}
                        </DropdownItem>
                      ))}
                    </React.Fragment>
                  ))}
                </DropdownList>
              )}
            </DropdownContainer>
          </Field>

          {/* Tipo de clase */}
          <Field>
            <label>
              Tipo clase *
              <InfoWrapper>
                <InfoButton aria-label="Ayuda tipo de clase">?</InfoButton>
                <Tooltip>
                  <strong>Individual:</strong> una clase con un solo alumno.<br/>
                  <strong>Doble:</strong> clase para dos alumnos juntos.
                </Tooltip>
              </InfoWrapper>
            </label>
            <div>
              <label>
                <input className="form-control"
                  type="radio"
                  name="tipoClase"
                  value="individual"
                  checked={tipoClase === 'individual'}
                  onChange={e => setTipoClase(e.target.value)}
                /> Individual
              </label>{' '}
              <label>
                <input className="form-control"
                  type="radio"
                  name="tipoClase"
                  value="doble"
                  checked={tipoClase === 'doble'}
                  onChange={e => setTipoClase(e.target.value)}
                /> Doble
              </label>
            </div>
          </Field>

          {/* Modalidad */}
          <Field>
            <label>Modalidad *</label>
            <div>
              <label>
                <input className="form-control"
                  type="radio"
                  name="modalidad"
                  value="online"
                  checked={modalidad === 'online'}
                  onChange={e => setModalidad(e.target.value)}
                /> Online
              </label>{' '}
              <label>
                <input className="form-control"
                  type="radio"
                  name="modalidad"
                  value="presencial"
                  checked={modalidad === 'presencial'}
                  onChange={e => {
                    setModalidad(e.target.value);
                    alert('Si se elige presencial, la dirección usada será la del alumno');
                  }}
                /> Presencial
              </label>
            </div>
          </Field>

          {/* Ciudad */}
          <Field ref={cityRef} error={errors.ciudad}>
            <label>Ciudad *</label>
            <DropdownContainer>
              <DropdownHeader error={errors.ciudad} onClick={() => setOpenCity(o => !o)}>
                {ciudad || 'Selecciona ciudad'} <ArrowSpan>{openCity ? '▲' : '▼'}</ArrowSpan>
              </DropdownHeader>
              {openCity && (
                <DropdownList>
                  {ciudadesList.map((c,i) => (
                    <DropdownItem
                      key={i}
                      onClick={() => { setCiudad(c); setOpenCity(false); setErrors(prev => ({ ...prev, ciudad:false })); }}
                    >
                      {c}
                    </DropdownItem>
                  ))}
                </DropdownList>
              )}
            </DropdownContainer>
          </Field>

          {/* Zona / Barrio eliminado para modalidad presencial */}

          {/* Fecha de inicio y fecha de fin por día */}
          <Field ref={datesRef} error={errors.fechas} style={{ gridColumn: '1 / -1' }}>
            <label>
              Fecha inicio y fin *
              <InfoWrapper>
                <InfoButton aria-label="Ayuda fechas">?</InfoButton>
                <Tooltip>
                  La fecha de inicio es cuando quieres comenzar las clases y la fecha de fin es cuando querrías terminar las clases. <strong>Todo esto es orientativo y luego lo podrás hablar con el profesor en cuestión.</strong>
                </Tooltip>
              </InfoWrapper>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input className="form-control"
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setErrors(prev => ({ ...prev, fechas:false })); }}
              />
              <input className="form-control"
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setErrors(prev => ({ ...prev, fechas:false })); }}
                disabled={noEndDate}
              />
              <label style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                <input className="form-control"
                  type="checkbox"
                  checked={noEndDate}
                  onChange={e => handleNoEndDateChange(e.target.checked)}
                  style={{ marginRight: '0.3rem' }}
                />
                Sin fecha de fin planeada
              </label>
            </div>
          </Field>

          {/* Horas por semana */}
          <Field ref={horasRef} error={errors.horas}>
            <label>
              Horas por semana *
              <InfoWrapper>
                <InfoButton aria-label="Ayuda horas por semana">?</InfoButton>
                <Tooltip>
                  Número entero de horas de clase que deseas recibir cada semana.
                </Tooltip>
              </InfoWrapper>
            </label>
            <input className="form-control"
              type="number"
              min="1"
              step="1"
              value={horasSemana}
              onChange={e => { setHorasSemana(e.target.value); setErrors(prev => ({ ...prev, horas:false })); }}
              placeholder="Introduce horas semanales"
            />
          </Field>

          {/* Disponibilidad semanal */}
          <Field ref={scheduleRef} error={errors.horario} style={{ gridColumn: '1 / -1' }}>
            <label>
              Selecciona tu disponibilidad *
              <InfoWrapper>
                <InfoButton aria-label="Ayuda disponibilidad">?</InfoButton>
                <Tooltip>
                  Horas y días en los que estarías dispuesto a dar clase.
                </Tooltip>
              </InfoWrapper>
            </label>
            <ScheduleContainer>
              <ScheduleGrid>
                <HeaderCell>Hora</HeaderCell>
                {daysOfWeek.map(d => <HeaderCell key={d}>{d}</HeaderCell>)}
                {hours.map(h => (
                  <React.Fragment key={h}>
                    <HourLabel>{`${h}.00–${h + 1}.00`}</HourLabel>
                    {daysOfWeek.map(d => {
                      const key = `${d}-${h}`;
                      return (
                        <SlotCell
                          key={key}
                          selected={selectedSlots.has(key)}
                          onClick={() => toggleSlot(d, h)}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </ScheduleGrid>
            </ScheduleContainer>
          </Field>

          {/* Notas adicionales */}
          <Field style={{ gridColumn: '1 / -1' }}>
            <label>Notas adicionales</label>
            <textarea className="form-control"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Algo que deba saber el profesor..."
            />
          </Field>
        </FormGrid>

        <Button onClick={handleSubmit}>Solicitar clase</Button>

        {confirmModal && (
          <Overlay>
            <Modal>
              <ModalText>¿Confirmar solicitud de clase?</ModalText>
              <ModalActions>
                <ModalButton onClick={() => setConfirmModal(false)}>Cancelar</ModalButton>
                <ModalButton primary onClick={confirmRequest} disabled={submitting}>Confirmar</ModalButton>
              </ModalActions>
            </Modal>
          </Overlay>
        )}

        {successModal && (
          <Overlay>
            <Modal>
              <ModalText>
                Se ha publicado una solicitud.<br/>
                La podrás encontrar en Mis Clases &amp; Solicitudes en el apartado de mis solicitudes.
              </ModalText>
              <ModalActions>
                <ModalButton primary onClick={handleSuccessClose}>Entendido</ModalButton>
              </ModalActions>
            </Modal>
          </Overlay>
        )}
      </Card>
    </Page>
  );
}
