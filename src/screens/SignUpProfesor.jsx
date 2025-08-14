// src/screens/SignUpProfesor.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useNotification } from "../NotificationContext";
import { isValidEmail } from '../utils/validateEmail';
import { sendWelcomeEmail, sendVerificationCode } from '../utils/email';
import { fetchCities, registerProfesor } from '../utils/api';
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

// Página con fondo suave
const Page = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fdfc 0%, #dff8f2 100%);
`;

// Tarjeta principal con botón de cerrar
const Card = styled.div`
  position: relative;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 14px 36px rgba(0,0,0,0.15);
  padding: 3rem 2rem;
  width: 100%;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? "none" : "auto")};
  max-width: 520px;
  animation: ${fadeIn} 0.6s ease-out;
`;

// Botón cerrar en la esquina superior derecha
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
  margin-bottom: 0.3rem;
`;
const Subtitle = styled.p`
  text-align: center;
  font-size: 1rem;
  color: #014F40;
  margin-bottom: 1.8rem;
  font-style: italic;
`;

const ErrorText = styled.p`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin: 0.25rem 0 0.5rem;
`;

// Grid para campos
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
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
  input::placeholder { color: #aaa; }
  input:focus {
    border-color: #046654;
    box-shadow: 0 0 0 5px rgba(4,102,84,0.15);
  }
`;

const VerificationRow = styled.div`
  display: flex;
  margin-top: 0.5rem;
  gap: 0.5rem;
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
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.3s;
  &:hover { border-color: #046654; }
`;
const DropdownList = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 10;
`;
const DropdownItem = styled.li`
  padding: 0.6rem 0.9rem;
  cursor: pointer;
  &:hover { background: #f1f8f6; }
`;
const Arrow = styled.span`
  border: solid #034640;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 4px;
  transform: ${props => (props.open ? 'rotate(-135deg)' : 'rotate(45deg)')};
  transition: transform 0.2s;
`;

// Botón principal
const Button = styled.button`
  width: 100%;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? "none" : "auto")};
  padding: 0.9rem;
  margin-top: 1.8rem;
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

// Popup overlay y modal
const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
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
  ${props => props.primary
    ? `background: #046654; color: #fff; &:hover { background: #034640; }`
    : `background: #eee; color: #333; &:hover { background: #ddd; }`
  }
`;

export default function SignUpProfesor() {
  const [email, setEmail]             = useState('');
  const [emailError, setEmailError]   = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifCode, setVerifCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [checkStatus, setCheckStatus] = useState(null);
  const [sendCooldown, setSendCooldown] = useState(0);
  const [step, setStep] = useState(1);
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [salutation, setSalutation]   = useState('Sr.');
  const [nombre, setNombre]           = useState('');
  const [apellido, setApellido]       = useState('');
  const [telefono, setTelefono]       = useState('');
  const [confirmTelefono, setConfirmTelefono] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [ciudad, setCiudad]           = useState('');
  const [cities, setCities]           = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nif, setNif] = useState('');
  const [direccionFacturacion, setDireccionFacturacion] = useState('');
  const [distrito, setDistrito] = useState('');
  const [barrio, setBarrio] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [iban, setIban] = useState('');
  const [carrera, setCarrera] = useState('');
  const [cursoEstudios, setCursoEstudios] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const navigate = useNavigate();
  const { show } = useNotification();
  const ref = useRef();

  // Carga ciudades desde la API
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchCities();
        setCities(list.map(c => c.nombre));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    if (sendCooldown <= 0) return;
    const timer = setInterval(() => setSendCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [sendCooldown]);

  // Cierra dropdown al click fuera
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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

  // Autocomplete removed; addresses and districts are entered manually

  const handleSubmit = async () => {
    if (submitting) return;
    const missing = [];
    if (!email) missing.push('Correo');
    if (!password) missing.push('Contraseña');
    if (!confirmPassword) missing.push('Confirmar contraseña');
    if (!nombre) missing.push('Nombre');
    if (!apellido) missing.push('Apellidos');
    if (!telefono) missing.push('Teléfono');
    if (!confirmTelefono) missing.push('Repite Teléfono');
    if (!ciudad) missing.push('Ciudad');
    if (!nif) missing.push('NIF');
    if (!direccionFacturacion) missing.push('Dirección facturación');
    if (!distrito) missing.push('Distrito');
    if (!barrio) missing.push('Barrio');
    if (!codigoPostal) missing.push('Código Postal');
    if (!iban) missing.push('IBAN');
    if (!carrera) missing.push('Carrera');
    if (!cursoEstudios) missing.push('Curso');
    if (!experiencia) missing.push('Experiencia');
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
    if (password !== confirmPassword) {
      return show('Las contraseñas no coinciden', 'error');
    }
    setTelefonoError('');
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
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        email,
        tratamiento: salutation,
        nombre,
        apellido,
        telefono,
        ciudad,
        rol: 'profesor',
        createdAt: new Date(),
        NIF: nif,
        direccion: direccionFacturacion,
        distrito,
        barrio,
        codigo_postal: codigoPostal,
        IBAN: iban,
        carrera,
        curso: cursoEstudios,
        experiencia,
      });
      const genero = salutation === 'Sr.' ? 'Masculino' : 'Femenino';
      await registerProfesor({
        nombre,
        apellidos: apellido,
        genero,
        telefono,
        correo_electronico: email,
        NIF: nif,
        direccion_facturacion: direccionFacturacion,
        distrito,
        barrio,
        codigo_postal: codigoPostal,
        ciudad,
        IBAN: iban,
        carrera,
        curso: cursoEstudios,
        experiencia,
        password,
      });
      await sendWelcomeEmail({ email, name: nombre });
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
      show('Profesor registrado con éxito', 'success');
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
        <Title>Registro de Profesor</Title>
        {step === 1 ? (
          <>
            <Subtitle>Verifica tu correo electrónico</Subtitle>
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
                    value={confirmPassword}
                    onChange={e => setConfirm(e.target.value)}
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
                {emailVerified && <p style={{color:'#046654',fontSize:'0.9rem'}}>Correo verificado</p>}
              </Field>
            </FormGrid>
            <Button onClick={() => setStep(2)} disabled={!emailVerified || !password || !confirmPassword || password !== confirmPassword}>
              Siguiente
            </Button>
          </>
        ) : (
          <>
            <Subtitle>Completa tus datos para {email}</Subtitle>
            <FormGrid>
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
                    value={nif}
                    onChange={e => setNif(e.target.value)}
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
                    value={direccionFacturacion}
                    onChange={e => setDireccionFacturacion(e.target.value)}
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
                    value={distrito}
                    onChange={e => setDistrito(e.target.value)}
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
                    value={barrio}
                    onChange={e => setBarrio(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Barrio</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={codigoPostal}
                    onChange={e => setCodigoPostal(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Código Postal</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={iban}
                    onChange={e => setIban(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">IBAN</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={carrera}
                    onChange={e => setCarrera(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Carrera</label>
                </div>
              </Field>
              <Field>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={cursoEstudios}
                    onChange={e => setCursoEstudios(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Curso</label>
                </div>
              </Field>
              <Field style={{ gridColumn: '1 / -1' }}>
                <div className="fl-field">
                  <input
                    className="form-control fl-input"
                    type="text"
                    value={experiencia}
                    onChange={e => setExperiencia(e.target.value)}
                    placeholder=" "
                  />
                  <label className="fl-label">Experiencia</label>
                </div>
              </Field>
              <Field style={{ gridColumn: '1 / -1' }} ref={ref}>
                <label>Ciudad</label>
                <DropdownContainer>
                  <DropdownHeader onClick={() => setDropdownOpen(o => !o)}>
                    {ciudad || 'Selecciona ciudad'}<Arrow open={dropdownOpen} />
                  </DropdownHeader>
                  {dropdownOpen && (
                    <DropdownList>
                      {cities.map((c, i) => (
                        <DropdownItem key={i} onClick={() => { setCiudad(c); setDropdownOpen(false); }}>
                          {c}
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  )}
                </DropdownContainer>
              </Field>
            </FormGrid>
            <Button onClick={handleSubmit} disabled={submitting}>Crear cuenta de profesor</Button>
          </>
        )}
      </Card>

      {modalOpen && (
        <Overlay>
          <Modal>
            <ModalText>¿Seguro que quieres volver atrás? Se perderán los datos ingresados.</ModalText>
            <ModalActions>
              <ModalButton primary onClick={() => navigate('/alta')}>
                Sí, más tarde
              </ModalButton>
              <ModalButton onClick={() => setModalOpen(false)}>
                No, permanezco
              </ModalButton>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </Page>
  );
}
