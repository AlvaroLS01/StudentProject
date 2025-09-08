import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Overlay, Modal, ModalTitle, ModalText, ModalActions, ModalButton } from './ModalStyles';
import { reportIncident } from '../utils/api';

const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
`;

const ErrorText = styled.p`
  color: #ff6b6b;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const SuccessText = styled.p`
  color: #02b36e;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 0.5rem;
`;

export default function ReportIncidentModal({ open, onClose, defaultName = '', defaultEmail = '' }) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setEmail(defaultEmail);
      setMessage('');
      setError('');
      setSuccess('');
    }
  }, [open, defaultName, defaultEmail]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSending(true);
    try {
      await reportIncident({ nombre: name, email, mensaje: message });
      setSuccess('Incidencia enviada correctamente.');
      setMessage('');
    } catch (err) {
      setError(err.message || 'Error enviando incidencia');
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <Overlay>
      <Modal>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <ModalTitle>Reportar incidencia</ModalTitle>
        <ModalText>Cuéntanos el problema que has encontrado.</ModalText>
        {error && <ErrorText>{error}</ErrorText>}
        {success && <SuccessText>{success}</SuccessText>}
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Tu correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <TextArea
            placeholder="Describe la incidencia"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
          <ModalActions>
            <ModalButton type="button" onClick={onClose}>Cancelar</ModalButton>
            <ModalButton primary type="submit" disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar'}
            </ModalButton>
          </ModalActions>
        </form>
      </Modal>
    </Overlay>
  );
}

