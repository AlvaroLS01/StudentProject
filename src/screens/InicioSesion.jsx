// src/screens/InicioSesion.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo-fondo.jpg';
import googleLogo from '../assets/google.png';
import appleLogo from '../assets/apple.png';
import PasswordResetModal from '../components/PasswordResetModal';

// Firebase
import { auth, db } from '../firebase/firebaseConfig';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getAuthErrorMessage } from '../utils/authErrorMessages';

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: #004640;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 6rem 2rem 2rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 360px;
  text-align: center;
`;

const Logo = styled.img`
  width: 300px;
  height: auto;
  display: block;
  margin: 0 auto 7rem;
`;

const Title = styled.h1`
  color: #ffffff;
  font-size: 1.75rem;
  margin-bottom: 1rem;
`;

const ErrorText = styled.p`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
`;

const Button = styled.button`
  background-color: #ccf3e5;
  color: #004640;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.5rem;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const ForgotLink = styled.button`
  background: none;
  border: none;
  color: #1e90ff;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-decoration: underline;
`;

const RegisterText = styled.p`
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #ffffff;

  a {
    color: #1e90ff;
    text-decoration: none;
    margin-left: 0.25rem;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  color: #ffffff;
  font-size: 0.9rem;
  text-transform: lowercase;
  margin: 1.5rem 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #ffffff;
  }

  &::before {
    margin-right: 0.5rem;
  }
  &::after {
    margin-left: 0.5rem;
  }
`;

const SocialButton = styled.button`
  position: relative;
  width: 100%;
  max-width: 300px;
  padding: 0.75rem;
  margin: 0.75rem auto;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  background-color: #ffffff;
  color: #000000;
  text-align: center;

  img {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    height: 24px;
    width: auto;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const InfoText = styled.p`
  margin-top: 1.5rem;
  font-size: 0.75rem;
  color: #ffffff;
  line-height: 1.3;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;

  a {
    font-weight: 700;
    color: #ccf3e5;
    text-decoration: none;
    margin: 0 0.25rem;
  }
`;

const InicioSesion = () => {
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  // Providers
  const googleProvider = new GoogleAuthProvider();
  const appleProvider  = new OAuthProvider('apple.com');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'usuarios', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, { photoURL: user.photoURL });
        navigate('/home');
      } else {
        await setDoc(userRef, { photoURL: user.photoURL }, { merge: true });
        navigate('/seleccion-rol');
      }
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    }
    setLoading(false);
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, appleProvider);
      navigate('/home');
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    }
    setLoading(false);
  };

  return (
    <PageWrapper>
      <Card>
        <Logo src={logo} alt="Student Project" />
        <Title>Inicio de sesión</Title>
        {error && <ErrorText>{error}</ErrorText>}

        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </Button>
          <ForgotLink type="button" onClick={() => setResetOpen(true)}>
            ¿Has olvidado la contraseña?
          </ForgotLink>
        </Form>

        <RegisterText>
          ¿No tienes cuenta?
          <Link to="/alta">Regístrate</Link>
        </RegisterText>

        <Divider>o</Divider>

        <SocialButton onClick={handleGoogleSignIn} disabled={loading}>
          <img src={googleLogo} alt="Google logo" />
          Continuar con Google
        </SocialButton>
        <SocialButton onClick={handleAppleSignIn} disabled={loading}>
          <img src={appleLogo} alt="Apple logo" />
          Continuar con Apple
        </SocialButton>

        <InfoText>
          Pulsando iniciar sesión, estás aceptando nuestros
          <Link to="/politica-y-privacidad">Términos de uso</Link>
          y
          <Link to="/politica-y-privacidad">Política de Privacidad</Link>.
        </InfoText>
      </Card>
      <PasswordResetModal open={resetOpen} onClose={() => setResetOpen(false)} />
    </PageWrapper>
  );
};

export default InicioSesion;
