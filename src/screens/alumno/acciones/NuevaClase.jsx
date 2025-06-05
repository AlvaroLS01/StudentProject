// src/screens/alumno/acciones/NuevaClase.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  getDoc,
  doc
} from 'firebase/firestore';
import { useAlert } from '../../../context/AlertContext';

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
    padding: 0.6rem 0.8rem;
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
`;
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

// Datos de tarifas y listas
const ciudadesSur = ['Sevilla', 'Huelva', 'Granada', 'Malaga', 'Valencia'];
const priceTable = {
  individual: {
    A: {
      online: {
        Primaria:     { padres: 13,   profesores: 10   },
        ESO:          { padres: 14.5, profesores: 11.5 },
        BACHILLERATO: { padres: 16,   profesores: 12.5 }
      },
      presencial: {
        Primaria:     { padres: 15,   profesores: 12   },
        ESO:          { padres: 16.5, profesores: 13   },
        BACHILLERATO: { padres: 17.5, profesores: 14   }
      }
    },
    B: {
      online: {
        Primaria:     { padres: 11.5, profesores: 9   },
        ESO:          { padres: 12.5, profesores: 10  },
        BACHILLERATO: { padres: 13,   profesores: 10  }
      },
      presencial: {
        Primaria:         { padres: 11.5, profesores: 9   },
        '1º y 2º ESO':    { padres: 13,   profesores: 10  },
        '3º y 4º ESO':    { padres: 13.5, profesores: 10.5},
        '1º BACHILLERATO':{ padres: 14,   profesores: 11  },
        '2º BACHILLERATO':{ padres: 14.5, profesores: 11.5}
      }
    }
  },
  doble: {
    A: {
      Primaria:     { padres: 24,   profesores: 15  },
      ESO:          { padres: 27,   profesores: 18  },
      BACHILLERATO: { padres: 29,   profesores: 20  }
    },
    B: {
      Primaria:     { padres: 18.5, profesores: 12.5},
      ESO:          { padres: 23,   profesores: 15  },
      BACHILLERATO: { padres: 25,   profesores: 17  }
    }
  }
};
const cursosGrouped = [
  {
    group: 'Primaria',
    options: ['1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria']
  },
  { group: 'ESO',      options: ['1º ESO','2º ESO','3º ESO','4º ESO'] },
  { group: 'Bachillerato', options: ['1º Bachillerato','2º Bachillerato'] }
];
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const hours = Array.from({ length: 14 }, (_, i) => 8 + i);

export default function NuevaClase() {
  const [asignatura, setAsignatura]       = useState('');
  const [curso, setCurso]                 = useState('');
  const [tipoClase, setTipoClase]         = useState('individual');
  const [modalidad, setModalidad]         = useState('online');
  const [ciudad, setCiudad]               = useState('');
  const [zona, setZona]                   = useState('');
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState('');
  const [noEndDate, setNoEndDate]         = useState(false);
  const [horasSemana, setHorasSemana]     = useState('');
  const [notas, setNotas]                 = useState('');
  const [precioPadres, setPrecioPadres]   = useState(0);
  const [precioProfesores, setPrecioProfesores] = useState(0);
  const [asignaturasList, setAsignaturasList]   = useState([]);
  const [ciudadesList, setCiudadesList]         = useState([]);
  const [openAsign, setOpenAsign]               = useState(false);
  const [openCurso, setOpenCurso]               = useState(false);
  const [openCity, setOpenCity]                 = useState(false);
  const [selectedSlots, setSelectedSlots]       = useState(new Set());
  const [confirmModal, setConfirmModal]         = useState(false);
  const [loading, setLoading]                   = useState(false);

  const [alumnoNombre, setAlumnoNombre]         = useState('');
  const [alumnoApellidos, setAlumnoApellidos]   = useState('');
  const asignRef = useRef();
  const cursoRef = useRef();
  const cityRef  = useRef();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Datos de usuario
  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const snap = await getDoc(doc(db,'usuarios',u.uid));
      if (snap.exists()) {
        const d = snap.data();
        setAlumnoNombre(d.nombre);
        setAlumnoApellidos(d.apellidos || d.apellido || '');
      }
    })();
  }, []);

  // Carga asignaturas y ciudades
  useEffect(() => {
    (async () => {
      const [sa, sc] = await Promise.all([
        getDocs(collection(db,'asignaturas')),
        getDocs(collection(db,'ciudades'))
      ]);
      setAsignaturasList(sa.docs.map(d => d.data().asignatura));
      setCiudadesList(sc.docs.map(d => d.data().ciudad));
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
    if (!curso || !ciudad) return;
    const group = ciudadesSur.includes(ciudad) ? 'B' : 'A';
    let base;
    if (tipoClase === 'individual') {
      let key;
      if (group === 'B' && modalidad === 'presencial') {
        if (curso.includes('Primaria')) key = 'Primaria';
        else if (curso.includes('ESO')) {
          const num = parseInt(curso);
          key = num <= 2 ? '1º y 2º ESO' : '3º y 4º ESO';
        } else {
          key = parseInt(curso) === 1 ? '1º BACHILLERATO' : '2º BACHILLERATO';
        }
      } else {
        if (curso.includes('Primaria')) key = 'Primaria';
        else if (curso.includes('ESO')) key = 'ESO';
        else key = 'BACHILLERATO';
      }
      base = priceTable.individual[group][modalidad][key];
    } else {
      const nivel = curso.includes('Primaria')
        ? 'Primaria'
        : curso.includes('ESO')
        ? 'ESO'
        : 'BACHILLERATO';
      base = priceTable.doble[group][nivel];
    }
    setPrecioPadres(base.padres.toFixed(2));
    setPrecioProfesores(base.profesores.toFixed(2));
  }, [tipoClase, modalidad, ciudad, curso]);

  // Toggle franjas horarias
  const toggleSlot = (day, hour) => {
    const key = `${day}-${hour}`;
    setSelectedSlots(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Manejar cambio de checkbox "sin fecha de fin planeada"
  const handleNoEndDateChange = (checked) => {
    setNoEndDate(checked);
    if (checked) {
      const year = new Date().getFullYear();
      // Fecha de fin de curso: 23 de junio del año actual
      setEndDate(`${year}-06-23`);
    } else {
      setEndDate('');
    }
  };

  // Validar y abrir modal
  const handleSubmit = () => {
    if (
      !asignatura ||
      !curso ||
      !ciudad ||
      !startDate ||
      !endDate ||
      !horasSemana ||
      parseInt(horasSemana, 10) < 1 ||
      selectedSlots.size === 0
    ) {
      return showAlert('Completa todos los campos obligatorios antes de continuar');
    }
    setConfirmModal(true);
  };

  // Confirmar y guardar
  const confirmRequest = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db,'clases'), {
        alumnoId: auth.currentUser.uid,
        alumnoNombre,
        alumnoApellidos,
        asignatura,
        curso,
        tipoClase,
        modalidad,
        ciudad,
        zona: modalidad === 'presencial' ? zona : null,
        fechaInicio: startDate,
        fechaFin: endDate,
        horasSemana: parseInt(horasSemana, 10),
        schedule: Array.from(selectedSlots),
        precioPadres,
        precioProfesores,
        notas,
        estado: 'pendiente',
        createdAt: serverTimestamp()
      });
      showAlert('Clase solicitada con éxito');
      navigate('/alumno/calendario');
    } catch (err) {
      console.error(err);
      showAlert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Card>
        <Title>Solicitar nueva clase</Title>
        <Subtitle>Encuentra al profesor ideal para ti</Subtitle>

        <FormGrid>
          {/* Asignatura */}
          <Field ref={asignRef}>
            <label>Asignatura *</label>
            <DropdownContainer>
              <DropdownHeader onClick={() => setOpenAsign(o => !o)}>
                {asignatura || 'Selecciona asignatura'} <ArrowSpan>{openAsign ? '▲' : '▼'}</ArrowSpan>
              </DropdownHeader>
              {openAsign && (
                <DropdownList>
                  {asignaturasList.map((a,i) => (
                    <DropdownItem
                      key={i}
                      onClick={() => { setAsignatura(a); setOpenAsign(false); }}
                    >
                      {a}
                    </DropdownItem>
                  ))}
                </DropdownList>
              )}
            </DropdownContainer>
          </Field>

          {/* Curso */}
          <Field ref={cursoRef}>
            <label>Curso *</label>
            <DropdownContainer>
              <DropdownHeader onClick={() => setOpenCurso(o => !o)}>
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
                          onClick={() => { setCurso(c); setOpenCurso(false); }}
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
                <input
                  type="radio"
                  name="tipoClase"
                  value="individual"
                  checked={tipoClase === 'individual'}
                  onChange={e => setTipoClase(e.target.value)}
                /> Individual
              </label>{' '}
              <label>
                <input
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
                <input
                  type="radio"
                  name="modalidad"
                  value="online"
                  checked={modalidad === 'online'}
                  onChange={e => setModalidad(e.target.value)}
                /> Online
              </label>{' '}
              <label>
                <input
                  type="radio"
                  name="modalidad"
                  value="presencial"
                  checked={modalidad === 'presencial'}
                  onChange={e => setModalidad(e.target.value)}
                /> Presencial
              </label>
            </div>
          </Field>

          {/* Ciudad */}
          <Field ref={cityRef}>
            <label>Ciudad *</label>
            <DropdownContainer>
              <DropdownHeader onClick={() => setOpenCity(o => !o)}>
                {ciudad || 'Selecciona ciudad'} <ArrowSpan>{openCity ? '▲' : '▼'}</ArrowSpan>
              </DropdownHeader>
              {openCity && (
                <DropdownList>
                  {ciudadesList.map((c,i) => (
                    <DropdownItem
                      key={i}
                      onClick={() => { setCiudad(c); setOpenCity(false); }}
                    >
                      {c}
                    </DropdownItem>
                  ))}
                </DropdownList>
              )}
            </DropdownContainer>
          </Field>

          {/* Zona / Barrio */}
          {modalidad === 'presencial' && (
            <Field>
              <label>Zona / Barrio</label>
              <input
                value={zona}
                onChange={e => setZona(e.target.value)}
                placeholder="Centro, Norte..."
              />
            </Field>
          )}

          {/* Fecha de inicio y fecha de fin por día */}
          <Field style={{ gridColumn: '1 / -1' }}>
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
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                disabled={noEndDate}
              />
              <label style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                <input
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
          <Field>
            <label>
              Horas por semana *
              <InfoWrapper>
                <InfoButton aria-label="Ayuda horas por semana">?</InfoButton>
                <Tooltip>
                  Número entero de horas de clase que deseas recibir cada semana.
                </Tooltip>
              </InfoWrapper>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={horasSemana}
              onChange={e => setHorasSemana(e.target.value)}
              placeholder="Introduce horas semanales"
            />
          </Field>

          {/* Disponibilidad semanal */}
          <Field style={{ gridColumn: '1 / -1' }}>
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
            <textarea
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
                <ModalButton primary onClick={confirmRequest} disabled={loading}>
                  {loading ? 'Confirmando...' : 'Confirmar'}
                </ModalButton>
              </ModalActions>
            </Modal>
          </Overlay>
        )}
      </Card>
    </Page>
  );
}
