import React, { useState } from 'react';
import styled from 'styled-components';
import { requestPasswordReset } from '../utils/password';

import logo from '../assets/logonavbar.png';
import { Overlay, Modal, ModalTitle } from './ModalStyles';

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
        <ModalTitle>Restablecer contraseña</ModalTitle>
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

