import React, { useState } from 'react';
import styled from 'styled-components';
import { requestPasswordReset } from '../utils/password';

import logo from '../assets/logonavbar.png';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 10px;
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 12px 36px rgba(0,0,0,0.2);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
`;

const Logo = styled.img`
  width: 120px;
  margin: 0 auto 1rem;
`;

const Title = styled.h2`
  margin: 0 0 1rem;
  color: #014F40;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
`;

const Button = styled.button`
  width: 100%;
  background: #ccf3e5;
  color: #034640;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
`;

const ErrorText = styled.p`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const SuccessText = styled.p`
  color: #02b36e;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

export default function PasswordResetModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSending(true);
    try {
      await requestPasswordReset(email);
      setSuccess('Hemos enviado un correo para restablecer tu contraseña.');
      setEmail('');
    } catch (err) {
      setError(err?.message || 'Se produjo un error. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <Overlay>
      <Modal>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <Logo src={logo} alt="Student Project" />
        <Title>Restablecer contraseña</Title>
        {error && <ErrorText>{error}</ErrorText>}
        {success && <SuccessText>{success}</SuccessText>}
        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Tu correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>
      </Modal>
    </Overlay>
  );
}

