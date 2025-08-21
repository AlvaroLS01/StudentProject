// src/screens/SignUpTutor.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useNotification } from "../NotificationContext";
import { isValidEmail } from '../utils/validateEmail';
import { sendWelcomeEmail, sendVerificationCode } from '../utils/email';
import {
  fetchCities,
  fetchCursos,
  registerTutor,
} from '../utils/api';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// Firebase (inicializado en firebaseConfig.js)
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

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

// Formulario en columna para el paso de verificación
const FormColumn = styled.div`
  display: flex;
  flex-direction: column;
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

const VerificationRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 0.5rem;
  gap: 0.5rem;

  @media (min-width: 480px) {
    flex-direction: row;
  }
`;

const CodeInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-family: inherit;
`;

const SendButton = styled.button`
  flex: 1;
  background: #046654;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  font-family: inherit;
`;

const VerifyButton = styled.button`
  flex: 1;
  background: ${({ theme, status }) =>
    status === 'success'
      ? theme.colors.accent
      : status === 'error'
      ? '#ff6b6b'
      : theme.colors.secondary};
  color: ${({ status, theme }) => (status ? '#fff' : theme.colors.primary)};
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  font-family: inherit;
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

export default function SignUpTutor() {
  const [email, setEmail]           = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifCode, setVerifCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [checkStatus, setCheckStatus] = useState(null);
  const [sendCooldown, setSendCooldown] = useState(0);
  const [step, setStep] = useState(1);
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
  const [curso, setCurso]           = useState('');
  const [idCurso, setIdCurso]       = useState(null);
  const [courses, setCourses]       = useState([]);
  const [cityOpen, setCityOpen]     = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [nifTutor, setNifTutor] = useState('');
  const [direccionTutor, setDireccionTutor] = useState('');
  const [distritoTutor, setDistritoTutor] = useState('');
  const [barrioTutor, setBarrioTutor] = useState('');
  const [codigoPostalTutor, setCodigoPostalTutor] = useState('');
  const [nifAlumno, setNifAlumno] = useState('');
  const [telefonoHijo, setTelefonoHijo] = useState('');
  const [confirmTelefonoHijo, setConfirmTelefonoHijo] = useState('');
  const [telefonoHijoError, setTelefonoHijoError] = useState('');
  const [direccionAlumno, setDireccionAlumno] = useState('');
  const [distritoAlumno, setDistritoAlumno] = useState('');
  const [nombreHijo, setNombreHijo] = useState('');
  const [apellidoHijo, setApellidoHijo] = useState('');
  const [fechaNacHijo, setFechaNacHijo] = useState('');
  const [generoHijo, setGeneroHijo] = useState('Masculino');
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

  // Carga ciudades
  useEffect(() => {
    (async () => {
      try {
        const cityList = await fetchCities();
        setCities(cityList.map(c => c.nombre));
        const courseList = await fetchCursos();
        setCourses(courseList);
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
    show('Se ha enviado el correo', 'success');
    setSendCooldown(30);
    setCheckStatus(null);
    setEmailVerified(false);
  };

  const handleCheckCode = () => {
    setCheckStatus(null);
    if (codeInput === verifCode) {
      setEmailVerified(true);
      setCheckStatus('success');
      show('Correo verificado', 'success');
    } else {
      setCheckStatus('error');
      show('Código incorrecto', 'error');
    }
  };

  // Autocomplete removed; addresses and related fields are now entered manually

  const handleSubmit = async () => {
    if (submitting) return;
    const missing = [];
    if (!email) missing.push('Correo');
    if (!password) missing.push('Contraseña');
    if (!confirmPwd) missing.push('Confirmar contraseña');
    if (!nombre) missing.push('Nombre');
    if (!apellido) missing.push('Apellidos');
    if (!telefono) missing.push('Teléfono');
    if (!confirmTelefono) missing.push('Repite Teléfono');
    if (!ciudad) missing.push('Ciudad');
    if (!curso || !idCurso) missing.push('Curso');
    if (!nifTutor) missing.push('NIF');
    if (!direccionTutor) missing.push('Dirección facturación');
    if (!distritoTutor) missing.push('Distrito facturación');
    if (!barrioTutor) missing.push('Barrio facturación');
    if (!codigoPostalTutor) missing.push('Código postal facturación');
    if (!nifAlumno) missing.push('NIF del Alumno');
    if (!telefonoHijo) missing.push('Teléfono del Alumno');
    if (!confirmTelefonoHijo) missing.push('Repite Teléfono del Alumno');
    if (!direccionAlumno) missing.push('Dirección del Alumno');
    if (!distritoAlumno) missing.push('Distrito del Alumno');
    if (!nombreHijo) missing.push('Nombre del Alumno');
    if (!apellidoHijo) missing.push('Apellidos del Alumno');
    if (!fechaNacHijo) missing.push('Fecha Nacimiento del Alumno');
    if (!generoHijo) missing.push('Género del Alumno');
    if (!emailVerified) missing.push('Verificación de correo');
    if (missing.length) {
      show('Faltan: ' + missing.join(', '), 'error');
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
    if (telefonoHijo !== confirmTelefonoHijo) {
      setTelefonoHijoError('Los números no coinciden');
      return;
    }
    if (password !== confirmPwd)
      return show('Las contraseñas no coinciden', 'error');

    setTelefonoError('');
    setTelefonoHijoError('');
    setSubmitting(true);
    let authUser = null;
    try {
      const phoneSnap = await getDocs(query(collection(db, 'usuarios'), where('telefono', '==', telefono)));
      if (!phoneSnap.empty) {
        setTelefonoError('Este teléfono ya está registrado');
        setSubmitting(false);
        return;
      }
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      authUser = user;
      const data = {
        uid: user.uid,
        email,
        tratamiento: salutation,
        nombre,
        apellido,
        telefono,
        ciudad,
        rol: 'tutor',
        curso,
        NIF: nifTutor,
        direccion: direccionTutor,
        distrito: distritoTutor,
        barrio: barrioTutor,
        codigo_postal: codigoPostalTutor,
        createdAt: new Date(),
        alumnos: [
          {
            id: Date.now().toString(),
            nombre: nombreHijo,
            apellidos: apellidoHijo,
            genero: generoHijo,
            fechaNacimiento: fechaNacHijo,
            curso,
            telefono: telefonoHijo,
            NIF: nifAlumno,
            direccion: direccionAlumno,
            distrito: distritoAlumno,
            photoURL: user.photoURL || ''
          },
        ]
      };
      await setDoc(doc(db, 'usuarios', user.uid), data);
      const generoTutor = salutation === 'Sr.' ? 'Masculino' : 'Femenino';
      await registerTutor({
        tutor: {
          nombre,
          apellidos: apellido,
          genero: generoTutor,
          telefono,
          correo_electronico: email,
          NIF: nifTutor,
          direccion_facturacion: direccionTutor,
          distrito: distritoTutor,
          barrio: barrioTutor,
          codigo_postal: codigoPostalTutor,
          ciudad,
          password,
        },
        alumno: {
          nombre: nombreHijo,
          apellidos: apellidoHijo,
          direccion: direccionAlumno,
          distrito: distritoAlumno,
          ciudad,
          NIF: nifAlumno,
          telefono: telefonoHijo,
          telefonoConfirm: confirmTelefonoHijo,
          genero: generoHijo,
          id_curso: idCurso,
        }
      });
      await sendWelcomeEmail({ email, name: nombre });
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
      show('Tutor registrado con éxito', 'success');
      navigate('/');
    } catch (err) {
      console.error(err);
      if (authUser) {
        try { await deleteDoc(doc(db, 'usuarios', authUser.uid)); } catch (_) {}
        try { await deleteUser(authUser); } catch (_) {}
      }
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
        {step === 1 ? (
          <>
            <Subtitle>Verifica tu correo electrónico</Subtitle>
            <FormColumn>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setEmailError('');
                      setEmailVerified(false);
                      setCheckStatus(null);
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
                <VerificationRow>
                  <SendButton type="button" onClick={handleSendCode} disabled={sendCooldown>0}>
                    {sendCooldown>0 ? `Reenviar (${sendCooldown})` : 'Verificar correo'}
                  </SendButton>
                  <CodeInput
                    type="text"
                    value={codeInput}
                    onChange={e => {
                      setCodeInput(e.target.value);
                      setCheckStatus(null);
                    }}
                    placeholder="Código"
                  />
                  <VerifyButton type="button" onClick={handleCheckCode} status={checkStatus}>Comprobar</VerifyButton>
                </VerificationRow>
                {emailVerified && (
                  <p style={{ color: '#046654', fontSize: '0.9rem', textAlign: 'center' }}>
                    Correo verificado
                  </p>
                )}
              </Field>
            </FormColumn>
            <Button onClick={() => setStep(2)} disabled={!emailVerified || !password || !confirmPwd || password !== confirmPwd}>
              Siguiente
            </Button>
          </>
        ) : (
          <>
            <Subtitle>Te estás dando de alta con <strong>{email}</strong></Subtitle>
            <h3 style={{gridColumn:'1 / -1',marginBottom:'0.5rem',color:'#034640'}}>Datos del tutor legal</h3>
            <FormGrid>
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
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={nifTutor}
                    onChange={e => setNifTutor(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">NIF</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={direccionTutor}
                    onChange={e => setDireccionTutor(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Dirección facturación</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={distritoTutor}
                    onChange={e => setDistritoTutor(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Distrito facturación</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={barrioTutor}
                    onChange={e => setBarrioTutor(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Barrio facturación</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={codigoPostalTutor}
                    onChange={e => setCodigoPostalTutor(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Código Postal facturación</label>
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
                <label>Curso del alumno</label>
                <DropdownContainer>
                  <DropdownHeader onClick={() => setCourseOpen(o => !o)}>
                    {curso || 'Selecciona curso'} <Arrow open={courseOpen} />
                  </DropdownHeader>
                  {courseOpen && (
                    <DropdownList>
                      {courses.map((c) => (
                        <DropdownItem
                          key={c.id_curso}
                          onClick={() => {
                            setCurso(c.nombre);
                            setIdCurso(c.id_curso);
                            setCourseOpen(false);
                          }}
                        >
                          {c.nombre}
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
                  <label className="fl-label">Nombre del Alumno</label>
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
                  <label className="fl-label">Apellidos del Alumno</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={nifAlumno}
                    onChange={e=>setNifAlumno(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">NIF del Alumno</label>
                </div>
              </Field>
              <Field>
                <label>Teléfono del Alumno</label>
                <PhoneInput
                  country={'es'}
                  value={telefonoHijo}
                  onChange={value => { setTelefonoHijo(value); setTelefonoHijoError(''); }}
                  inputStyle={{ width: '100%' }}
                />
              </Field>
              <Field>
                <label>Repite Teléfono del Alumno</label>
                <PhoneInput
                  country={'es'}
                  value={confirmTelefonoHijo}
                  onChange={value => { setConfirmTelefonoHijo(value); setTelefonoHijoError(''); }}
                  inputStyle={{ width: '100%' }}
                />
                {telefonoHijoError && <ErrorText>{telefonoHijoError}</ErrorText>}
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={direccionAlumno}
                    onChange={e => setDireccionAlumno(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Dirección del Alumno</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={distritoAlumno}
                    onChange={e => setDistritoAlumno(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Distrito del Alumno</label>
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
                  <label className="fl-label">Fecha Nacimiento del Alumno</label>
                </div>
              </Field>
              <p style={{gridColumn: '1 / -1', fontSize:'0.85rem', color:'#555'}}>
                Podrás añadir más alumnos desde la pestaña "Mi cuenta".
              </p>
            </FormGrid>
            <Button onClick={handleSubmit} disabled={submitting}>Crear cuenta</Button>
          </>
        )}
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
