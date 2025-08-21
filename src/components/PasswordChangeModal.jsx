import React, { useState } from 'react';
import styled from 'styled-components';
import { resetPassword } from '../utils/password';
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

export default function PasswordChangeModal({ open, onClose, token }) {
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password1 !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!token) {
      setError('Token inválido');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, password: password1 });
      setSuccess('La contraseña se ha cambiado con éxito.');
      setPassword1('');
      setPassword2('');
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <Logo src={logo} alt="Student Project" />
        <ModalTitle>Cambiar contraseña</ModalTitle>
        {error && <ErrorText>{error}</ErrorText>}
        {success && <SuccessText>{success}</SuccessText>}
        <form onSubmit={handleSubmit}>
          <Input
            type="password"
            placeholder="Nueva contraseña"
            value={password1}
            onChange={e => setPassword1(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Repite la contraseña"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>
        </form>
      </Modal>
    </Overlay>
  );
}

