// src/screens/SignUpAlumno.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useNotification } from "../NotificationContext";
import { isValidEmail } from '../utils/validateEmail';
import { sendWelcomeEmail } from '../utils/email';

// Firebase (inicializado en firebaseConfig.js)
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';

// Animación de entrada
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Página y tarjeta
const Page = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fdfc 0%, #dff8f2 100%);
`;
const Card = styled.div`
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 3rem 2rem;
  box-shadow: 0 14px 36px rgba(0,0,0,0.15);
  width: 100%;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? "none" : "auto")};
  max-width: 520px;
  animation: ${fadeIn} 0.6s ease-out;
`;

// Botón para volver atrás
const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #ccf3e5;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.25rem;
  color: #034640;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover { background: #b4f0c5; }
`;

const Title = styled.h2`
  font-size: 2rem;
  color: #034640;
  text-align: center;
  margin-bottom: 0.5rem;
`;
const Subtitle = styled.p`
  text-align: center;
  color: #014F40;
  margin-bottom: 1.5rem;
  font-style: italic;
`;

const ErrorText = styled.p`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin: 0.25rem 0 0.5rem;
`;

// Grid/Formato
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  label {
    margin-bottom: 0.3rem;
    font-weight: 500;
    color: #014F40;
  }
  input {
    padding: 0.7rem 0.9rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s, box-shadow 0.3s;
    outline: none;
  }
  input::placeholder {
    color: #aaa;
  }
  input:focus {
    border-color: #046654;
    box-shadow: 0 0 0 4px rgba(4,102,84,0.15);
  }
`;

// Toggle de rol
const ToggleGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;
const ToggleOption = styled.button`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  background: ${p => (p.active ? '#034640' : '#eee')};
  color: ${p => (p.active ? '#fff' : '#333')};
  transition: background 0.3s;
`;

// Dropdown
const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? "none" : "auto")};
`;
const DropdownHeader = styled.div`
  padding: 0.7rem 0.9rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fdfdfd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.3s;
  &:hover { border-color: #046654; }
`;
const DropdownList = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 10;
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
const Arrow = styled.span`
  border: solid #034640;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 4px;
  transform: ${p => (p.open ? 'rotate(-135deg)' : 'rotate(45deg)')};
  transition: transform 0.2s;
`;

// Botón de enviar
const Button = styled.button`
  width: 100%;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? "none" : "auto")};
  padding: 0.9rem;
  margin-top: 1.5rem;
  background: #034640;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  box-shadow: 0 8px 20px rgba(0,0,0,0.18);
  &:hover {
    background: #046654;
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(0,0,0,0.22);
  }
`;

// Popup modal
const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
`;
const Modal = styled.div`
  background: #fff;
  border-radius: 10px;
  padding: 2rem;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 12px 36px rgba(0,0,0,0.2);
`;
const ModalText = styled.p`
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  color: #014F40;
`;
const ModalActions = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 1.5rem;
`;
const ModalButton = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
  ${p => p.primary
    ? `background: #046654; color: #fff; &:hover { background: #034640; }`
    : `background: #eee; color: #333; &:hover { background: #ddd; }`
  }
`;

// Cursos agrupados igual que en NuevaClase
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
  { group: 'ESO', options: ['1º ESO', '2º ESO', '3º ESO', '4º ESO'] },
  {
    group: 'Bachillerato',
    options: ['1º Bachillerato', '2º Bachillerato']
  }
];

export default function SignUpAlumno() {
  const [email, setEmail]           = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [nombre, setNombre]         = useState('');
  const [apellido, setApellido]     = useState('');
  const [telefono, setTelefono]     = useState('');
  const [confirmTelefono, setConfirmTelefono] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [ciudad, setCiudad]         = useState('');
  const [cities, setCities]         = useState([]);
  const [rolUser, setRolUser]       = useState('alumno');
  const [curso, setCurso]           = useState('');
  const [cityOpen, setCityOpen]     = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [fechaNac, setFechaNac]     = useState('');
  const [nombreHijo, setNombreHijo] = useState('');
  const [fechaNacHijo, setFechaNacHijo] = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { show } = useNotification();
  const cityRef = useRef();
  const courseRef = useRef();

  // Carga ciudades
  useEffect(() => {
    (async () => {
      try {
        const snapCities = await getDocs(collection(db, 'ciudades'));
        setCities(snapCities.docs.map(d => d.data().ciudad));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Cierra dropdowns al click fuera
  useEffect(() => {
    const handleClick = e => {
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false);
      if (courseRef.current && !courseRef.current.contains(e.target)) setCourseOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    if (
      !email ||
      !password ||
      !confirmPwd ||
      !nombre ||
      !apellido ||
      !telefono ||
      !confirmTelefono ||
      !ciudad ||
      !curso
    ) {
      show('Completa todos los campos', 'error');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Correo electrónico no válido.');
      return;
    }
    if (telefono !== confirmTelefono) {
      setTelefonoError('Los números no coinciden');
      return;
    }
    if (password !== confirmPwd)
      return show('Las contraseñas no coinciden', 'error');
    if (rolUser === 'alumno' && !fechaNac)
      return show('Añade tu fecha de nacimiento', 'error');
    if (rolUser === 'padre' && (!nombreHijo || !fechaNacHijo))
      return show('Completa datos del hijo', 'error');

    setTelefonoError('');
    setSubmitting(true);
    try {
      const phoneSnap = await getDocs(query(collection(db, 'usuarios'), where('telefono', '==', telefono)));
      if (!phoneSnap.empty) {
        setTelefonoError('Este teléfono ya está registrado');
        setSubmitting(false);
        return;
      }
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const data = {
        uid: user.uid,
        email,
        nombre,
        apellido,
        telefono,
        ciudad,
        rol: rolUser,
        curso,
        createdAt: new Date()
      };
      if (rolUser === 'alumno') {
        data.fechaNacimiento = fechaNac;
      } else {
        data.hijos = [
          {
            id: Date.now().toString(),
            nombre: nombreHijo,
            fechaNacimiento: fechaNacHijo,
            curso,
            photoURL: user.photoURL || ''
          },
        ];
      }
      await setDoc(doc(db, 'usuarios', user.uid), data);
      await sendWelcomeEmail({ email, name: nombre });
      show('Alumno registrado con éxito', 'success');
      navigate('/');
    } catch (err) {
      console.error(err);
      show('Error: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Card>
        <CloseBtn onClick={() => setModalOpen(true)}>×</CloseBtn>
        <Title>Registro Alumno/Tutor</Title>
        <Subtitle>¡Únete y comienza tu aprendizaje hoy!</Subtitle>

        <ToggleGroup>
          <ToggleOption active={rolUser === 'alumno'} onClick={() => setRolUser('alumno')}>
            Soy Alumno
          </ToggleOption>
          <ToggleOption active={rolUser === 'padre'} onClick={() => setRolUser('padre')}>
            Soy Tutor Legal
          </ToggleOption>
        </ToggleGroup>

        <FormGrid>
          <Field>
            <div className="fl-field">
              <input
                className="form-control fl-input"
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder=" "
              />
              <label className="fl-label">E-mail</label>
            </div>
            {emailError && <ErrorText>{emailError}</ErrorText>}
          </Field>
          <Field>
            <div className="fl-field">
              <input
                className="form-control fl-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder=" "
              />
              <label className="fl-label">Contraseña</label>
            </div>
          </Field>
          <Field>
            <div className="fl-field">
              <input
                className="form-control fl-input"
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder=" "
              />
              <label className="fl-label">Repite Contraseña</label>
            </div>
          </Field>
          <Field>
            <div className="fl-field">
              <input
                className="form-control fl-input"
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder=" "
              />
              <label className="fl-label">Nombre</label>
            </div>
          </Field>
          <Field>
            <div className="fl-field">
              <input
                className="form-control fl-input"
                type="text"
                value={apellido}
                onChange={e => setApellido(e.target.value)}
                placeholder=" "
              />
              <label className="fl-label">Apellidos</label>
            </div>
          </Field>
          <Field>
            <div className="fl-field">
              <input
                className="form-control fl-input"
                type="tel"
                value={telefono}
                onChange={e => {
                  setTelefono(e.target.value);
                  setTelefonoError('');
                }}
                placeholder=" "
              />
              <label className="fl-label">Teléfono</label>
            </div>
          </Field>
          <Field>
            <div className="fl-field">
              <input
                className="form-control fl-input"
                type="tel"
                value={confirmTelefono}
                onChange={e => {
                  setConfirmTelefono(e.target.value);
                  setTelefonoError('');
                }}
                placeholder=" "
              />
              <label className="fl-label">Repite Teléfono</label>
            </div>
            {telefonoError && <ErrorText>{telefonoError}</ErrorText>}
          </Field>

          {/* Ciudad y Curso lado a lado */}
          <Field ref={cityRef}>
            <label>Ciudad</label>
            <DropdownContainer>
              <DropdownHeader onClick={() => setCityOpen(o => !o)}>
                {ciudad || 'Selecciona ciudad'} <Arrow open={cityOpen} />
              </DropdownHeader>
              {cityOpen && (
                <DropdownList>
                  {cities.map((c,i)=>(
                    <DropdownItem key={i} onClick={()=>{setCiudad(c);setCityOpen(false)}}>
                      {c}
                    </DropdownItem>
                  ))}
                </DropdownList>
              )}
            </DropdownContainer>
          </Field>
          <Field ref={courseRef}>
            <label>{rolUser === 'padre' ? 'Curso del hijo' : 'Curso'}</label>
            <DropdownContainer>
              <DropdownHeader onClick={() => setCourseOpen(o => !o)}>
                {curso || 'Selecciona curso'} <Arrow open={courseOpen} />
              </DropdownHeader>
              {courseOpen && (
                <DropdownList>
                  {cursosGrouped.map(({ group, options }) => (
                    <React.Fragment key={group}>
                      <DropdownGroupLabel>{group}</DropdownGroupLabel>
                      {options.map((c, i) => (
                        <DropdownItem
                          key={i}
                          onClick={() => {
                            setCurso(c);
                            setCourseOpen(false);
                          }}
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

          {rolUser === 'alumno' ? (
            <Field style={{gridColumn:'1 / -1'}}>
              <div className="fl-field">
                <input
                  className="form-control fl-input"
                  type="date"
                  value={fechaNac}
                  onChange={e=>setFechaNac(e.target.value)}
                  placeholder=" "
                />
                <label className="fl-label">Fecha de Nacimiento</label>
              </div>
            </Field>
          ) : (
            <>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={nombreHijo}
                    onChange={e=>setNombreHijo(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Nombre del Hijo</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="date"
                    value={fechaNacHijo}
                    onChange={e=>setFechaNacHijo(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Fecha Nacimiento del Hijo</label>
                </div>
              </Field>
              <p style={{gridColumn: '1 / -1', fontSize:'0.85rem', color:'#555'}}>
                Podrás añadir más hijos desde la pestaña "Mi cuenta".
              </p>
            </>
          )}
        </FormGrid>

        <Button onClick={handleSubmit} disabled={submitting}>Crear cuenta</Button>
      </Card>

      {modalOpen && (
        <Overlay>
          <Modal>
            <ModalText>¿Seguro que quieres volver atrás? Se perderán los datos ingresados.</ModalText>
            <ModalActions>
              <ModalButton primary onClick={()=>navigate('/alta')}>Sí, más tarde</ModalButton>
              <ModalButton onClick={()=>setModalOpen(false)}>No, permanezco</ModalButton>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </Page>
  );
}
