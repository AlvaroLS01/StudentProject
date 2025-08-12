// src/screens/SignUpPadre.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useNotification } from "../NotificationContext";
import { isValidEmail } from '../utils/validateEmail';
import { sendWelcomeEmail, sendVerificationCode } from '../utils/email';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// Firebase (inicializado en firebaseConfig.js)
import { auth } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

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

export default function SignUpPadre() {
  const [email, setEmail]           = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifCode, setVerifCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [sendCooldown, setSendCooldown] = useState(0);
  const [password, setPassword]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [salutation, setSalutation] = useState('Sr.');
  const [nombre, setNombre]         = useState('');
  const [apellido, setApellido]     = useState('');
  const [telefono, setTelefono]     = useState('');
  const [confirmTelefono, setConfirmTelefono] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [ciudad, setCiudad]         = useState('');
  const [cities, setCities]         = useState([]);
  const [cursos, setCursos]         = useState([]);
  const [curso, setCurso]           = useState('');
  const [cityOpen, setCityOpen]     = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [nombreHijo, setNombreHijo] = useState('');
  const [apellidoHijo, setApellidoHijo] = useState('');
  const [fechaNacHijo, setFechaNacHijo] = useState('');
  const [generoHijo, setGeneroHijo] = useState('Masculino');
  const [nifHijo, setNifHijo]       = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { show } = useNotification();
  const cityRef = useRef();
  const courseRef = useRef();

  useEffect(() => {
    if (sendCooldown <= 0) return;
    const timer = setInterval(() => setSendCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [sendCooldown]);

  // Carga ciudades y cursos desde la API
  useEffect(() => {
    (async () => {
      try {
        const resCities = await fetch('http://localhost:3001/api/cities');
        const citiesData = await resCities.json();
        setCities(citiesData.map(c => c.nombre));

        const resCourses = await fetch('http://localhost:3001/api/courses');
        const coursesData = await resCourses.json();
        setCursos(coursesData.map(c => c.nombre));
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

  const handleSendCode = async () => {
    if (!isValidEmail(email)) {
      setEmailError('Correo electrónico no válido.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerifCode(code);
    await sendVerificationCode({ email, code });
    setSendCooldown(30);
  };

  const handleCheckCode = () => {
    if (codeInput === verifCode) {
      setEmailVerified(true);
      show('Correo verificado', 'success');
    } else {
      show('Código incorrecto', 'error');
    }
  };

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
      !curso ||
      !emailVerified
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
    if (!nombreHijo || !apellidoHijo || !fechaNacHijo || !generoHijo || !nifHijo)
      return show('Completa datos del hijo', 'error');

    setTelefonoError('');
    setSubmitting(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      await fetch('http://localhost:3001/api/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutor: {
            nombre,
            apellidos: apellido,
            genero: salutation === 'Sr.' ? 'Masculino' : 'Femenino',
            telefono,
            correo_electronico: email,
            NIF: 'pendiente',
            direccion_facturacion: 'pendiente'
          },
          alumno: {
            nombre: nombreHijo,
            apellidos: apellidoHijo,
            direccion: '',
            NIF: nifHijo,
            telefono: null,
            genero: generoHijo,
            curso
          },
          ciudad
        })
      });

      await sendWelcomeEmail({ email, name: nombre });
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
      show('Tutor registrado con éxito', 'success');
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
        <Title>Registro de Tutor</Title>
        <Subtitle>¡Únete y ayuda a tu hijo a aprender!</Subtitle>

        <h3 style={{gridColumn:'1 / -1',marginBottom:'0.5rem',color:'#034640'}}>Datos del tutor legal</h3>
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
            <div style={{display:'flex',marginTop:'0.5rem',gap:'0.5rem'}}>
              <button type="button" onClick={handleSendCode} disabled={sendCooldown>0} style={{flex:'1',background:'#046654',color:'#fff',border:'none',borderRadius:'6px',padding:'0.5rem',cursor:'pointer',opacity:sendCooldown>0?0.6:1}}>
                {sendCooldown>0 ? `Reenviar (${sendCooldown})` : 'Verificar correo'}
              </button>
              <input type="text" value={codeInput} onChange={e=>setCodeInput(e.target.value)} placeholder="Código" style={{flex:'1',padding:'0.5rem',border:'1px solid #ccc',borderRadius:'6px'}} />
              <button type="button" onClick={handleCheckCode} style={{background:'#ccc',border:'none',borderRadius:'6px',padding:'0.5rem',cursor:'pointer'}}>Comprobar</button>
            </div>
            {emailVerified && <p style={{color:'#046654',fontSize:'0.9rem'}}>Correo verificado</p>}
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
            <label>Tratamiento</label>
            <select value={salutation} onChange={e=>setSalutation(e.target.value)} style={{padding:'0.7rem 0.9rem',border:'1px solid #ccc',borderRadius:'8px'}}>
              <option value="Sr.">Sr.</option>
              <option value="Sra.">Sra.</option>
            </select>
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
            <label>Teléfono</label>
            <PhoneInput
              country={'es'}
              value={telefono}
              onChange={value => { setTelefono(value); setTelefonoError(''); }}
              inputStyle={{ width: '100%' }}
            />
          </Field>
          <Field>
            <label>Repite Teléfono</label>
            <PhoneInput
              country={'es'}
              value={confirmTelefono}
              onChange={value => { setConfirmTelefono(value); setTelefonoError(''); }}
              inputStyle={{ width: '100%' }}
            />
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

        <h3 style={{gridColumn:'1 / -1',marginTop:'1rem',marginBottom:'0.5rem',color:'#034640'}}>Datos del alumno</h3>
          <Field ref={courseRef}>
            <label>Curso del hijo</label>
            <DropdownContainer>
              <DropdownHeader onClick={() => setCourseOpen(o => !o)}>
                {curso || 'Selecciona curso'} <Arrow open={courseOpen} />
              </DropdownHeader>
              {courseOpen && (
                <DropdownList>
                  {cursos.map((c, i) => (
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
                </DropdownList>
              )}
            </DropdownContainer>
          </Field>

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
                type="text"
                value={apellidoHijo}
                onChange={e=>setApellidoHijo(e.target.value)}
                placeholder=" "
              />
              <label className="fl-label">Apellidos del Hijo</label>
            </div>
          </Field>
          <Field>
            <div className="fl-field">
              <input
                className="form-control fl-input"
                type="text"
                value={nifHijo}
                onChange={e=>setNifHijo(e.target.value)}
                placeholder=" "
              />
              <label className="fl-label">NIF del Hijo</label>
            </div>
          </Field>
          <Field>
            <label>Género</label>
            <select value={generoHijo} onChange={e=>setGeneroHijo(e.target.value)} style={{padding:'0.7rem 0.9rem',border:'1px solid #ccc',borderRadius:'8px'}}>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
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
