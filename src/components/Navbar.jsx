// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo-fondo.jpg';
import googleLogo from '../assets/google.png';
import appleLogo from '../assets/apple.png';

// Firebase
import { auth, db } from '../firebase/firebaseConfig';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNotification } from '../NotificationContext';

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Nav = styled.nav`
  background-color: ${({ theme }) => theme.colors.primary};
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1000;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoLink = styled(Link)`
  img {
    height: 40px;
    width: auto;
    transition: transform 0.3s ease;
  }
  &:hover img {
    transform: scale(1.05);
  }
`;

const LogoButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  img {
    height: 40px;
    width: auto;
    transition: transform 0.3s ease;
  }
  &:hover img {
    transform: scale(1.05);
  }
  &:focus {
    outline: none;
  }
`;

const MenuIcon = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.75rem;
  color: #fff;
  cursor: pointer;
  z-index: 1100;

  @media (max-width: 768px) {
    display: block;
  }
  &:focus { outline: none; }
  &:active { transform: scale(0.9); }
`;

const Menu = styled.div`
  display: flex;
  align-items: center;
  margin-left: 3rem;

  @media (max-width: 768px) {
    display: ${props => (props.open ? 'flex' : 'none')};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: ${({ theme }) => theme.colors.primary};
    flex-direction: column;
    align-items: center;
    padding: 2rem 0;
  }
`;

const MenuItem = styled(Link)`
  color: #fff;
  text-decoration: none;
  margin: 0 1.5rem;
  font-size: 1rem;
  position: relative;
  transition: color 0.3s ease;
  &:after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    height: 2px;
    width: 0;
    background: ${({ theme }) => theme.colors.secondary};
    transition: width 0.3s ease;
  }
  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
  &:hover:after {
    width: 100%;
  }
  @media (max-width: 768px) {
    margin: 1rem 0;
    font-size: 1.25rem;
  }
`;

const PanelLink = styled(Link)`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border: 2px solid #fff;
  border-radius: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #fff;
    color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    margin: 1rem 0;
    font-size: 1.15rem;
    padding: 0.75rem 1.25rem;
  }
`;

const MobileAccessButton = styled(Link)`
  display: none;
  @media (max-width: 768px) {
    display: inline-block;
    background-color: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.primary};
    padding: 0.75rem 2.5rem;
    border-radius: 24px;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.5rem;
    margin: 1.5rem 0;
    transition: background-color 0.3s ease, transform 0.3s ease;
    &:hover {
      background-color: ${({ theme }) => theme.colors.accent};
      transform: translateY(-2px);
    }
  }
`;

const AccessWrapper = styled.div`
  position: relative;
  margin-left: 1.5rem;
  @media (max-width: 768px) {
    display: none;
  }
`;

const AccessButton = styled.button`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.5rem 1.5rem;
  border-radius: 24px;
  border: none;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  &:hover {
    background-color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-2px);
  }
`;

const LoginPopup = styled.div`
  display: ${props => (props.show ? 'block' : 'none')};
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 320px;
  background: ${({ theme }) => theme.colors.primary}CC;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.25),
    0 4px 12px rgba(0,0,0,0.15);
  padding: 1.5rem;
  box-sizing: border-box;
  animation: ${slideDown} 0.3s ease-out;
  z-index: 1000;
`;

const PopupTitle = styled.h4`
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: #fff;
  text-align: center;
`;

const PopupInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
`;

const PopupButton = styled.button`
  width: 100%;
  box-sizing: border-box;
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 1rem;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? 'none' : 'auto')};
  transition: background-color 0.2s ease, transform 0.2s ease;
  &:hover {
    background-color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-2px);
  }
`;

const PopupRegister = styled.p`
  font-size: 0.9rem;
  text-align: center;
  margin: 0.5rem 0 1rem;
  color: #fff;
  a {
    color: #1e90ff;
    text-decoration: none;
    margin-left: 0.25rem;
  }
`;

const PopupDivider = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #fff;
  margin: 1rem 0;
  &::before, &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #fff;
  }
  &::before { margin-right: 0.5rem; }
  &::after  { margin-left: 0.5rem; }
`;

const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  border: none;
  border-radius: 4px;
  background-color: #fff;
  color: #000;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  img {
    height: 20px;
    width: auto;
  }
  &:hover {
    background-color: #f0f0f0;
  }
`;

const InfoText = styled.p`
  font-size: 0.75rem;
  color: #fff;
  line-height: 1.3;
  text-align: center;
  margin-top: 1rem;
  a {
    font-weight: 700;
    color: #ccf3e5;
    text-decoration: none;
    margin: 0 0.25rem;
  }
`;

export default function Navbar() {
  const { show } = useNotification();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const loginRef = useRef(null);
  const navigate = useNavigate();

  // cerrar popup al click fuera
  useEffect(() => {
    const handler = e => {
      if (loginRef.current && !loginRef.current.contains(e.target)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'usuarios', u.uid));
        setUserData(snap.exists() ? snap.data() : null);
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setLoginOpen(false);
    navigate('/home');
  };

  const handleLogin = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const u = userCredential.user;
      // Obtener rol desde Firestore
      const snap = await getDoc(doc(db, 'usuarios', u.uid));
      const data = snap.exists() ? snap.data() : null;
      const rol = data?.rol;
      // Redirigir según rol
      if (rol === 'admin') {
        navigate('/admin');
      } else if (rol === 'profesor') {
        navigate('/profesor');
      } else {
        navigate('/alumno');
      }
      setLoginEmail('');
      setLoginPassword('');
      setLoginOpen(false);
    } catch (err) {
      show(`Error al iniciar sesión: ${err.message}`);
    } finally {
      setLoggingIn(false);
    }
  };

  // ruta y texto según rol para el botón de panel
  const panelPath =
    userData?.rol === 'admin'
      ? '/admin'
      : userData?.rol === 'profesor'
      ? '/profesor'
      : '/alumno';
  const panelText =
    userData?.rol === 'admin'
      ? 'Panel Admin'
      : userData?.rol === 'profesor'
      ? 'Panel Profesor/a'
      : 'Panel Alumno/a';

  return (
    <Nav>
      <Container>
        {user ? (
          <LogoButton onClick={() => window.location.reload()}>
            <img src={logo} alt="Student Project" />
          </LogoButton>
        ) : (
          <LogoLink to="/home">
            <img src={logo} alt="Student Project" />
          </LogoLink>
        )}

        <MenuIcon
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen(o => !o)}
        >
          {open ? '✕' : '☰'}
        </MenuIcon>

        <Menu open={open}>
          {user ? (
            <>
              {/* Panel button ajustado con tamaño ligeramente menor */}
              <PanelLink to={panelPath}>{panelText}</PanelLink>

              {/* Móvil: logout */}
              <MobileAccessButton as="button" onClick={handleLogout}>
                Cerrar sesión
              </MobileAccessButton>

              {/* Escritorio: Hola, nombre + popup logout */}
              <AccessWrapper ref={loginRef}>
                <AccessButton onClick={() => setLoginOpen(o => !o)}>
                  Hola, {userData?.nombre}
                </AccessButton>
                <LoginPopup show={loginOpen}>
                  <PopupButton onClick={handleLogout}>
                    Cerrar sesión
                  </PopupButton>
                </LoginPopup>
              </AccessWrapper>
            </>
          ) : (
            <>
              <MenuItem to="/ser-profesor">Ser profesor/a</MenuItem>
              <MenuItem to="/reserva-tu-clase">Reserva tu clase</MenuItem>
              <MenuItem to="/quienes-somos">Quiénes somos</MenuItem>

              <MobileAccessButton to="/inicio">Acceso</MobileAccessButton>

              <AccessWrapper ref={loginRef}>
                <AccessButton onClick={() => setLoginOpen(o => !o)}>
                  Iniciar sesión
                </AccessButton>
                <LoginPopup show={loginOpen}>
                  <PopupTitle>Inicio de sesión</PopupTitle>
                  <PopupInput
                    type="email"
                    placeholder="Correo electrónico"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                  />
                  <PopupInput
                    type="password"
                    placeholder="Contraseña"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                  />
                  <PopupButton onClick={handleLogin} disabled={loggingIn}>
                    Iniciar sesión
                  </PopupButton>
                  <PopupRegister>
                    ¿No tienes cuenta? <Link to="/alta">Regístrate</Link>
                  </PopupRegister>
                  <PopupDivider>o</PopupDivider>
                  <SocialButton>
                    <img src={googleLogo} alt="Google logo" />
                    Continuar con Google
                  </SocialButton>
                  <SocialButton>
                    <img src={appleLogo} alt="Apple logo" />
                    Continuar con Apple
                  </SocialButton>
                  <InfoText>
                    Al iniciar sesión, aceptas nuestros
                    <Link to="/politica-y-privacidad">
                      {' '}
                      Términos de uso
                    </Link>{' '}
                    y
                    <Link to="/politica-y-privacidad">
                      {' '}
                      Política de Privacidad
                    </Link>
                    .
                  </InfoText>
                </LoginPopup>
              </AccessWrapper>
            </>
          )}
        </Menu>
      </Container>
    </Nav>
  );
}
