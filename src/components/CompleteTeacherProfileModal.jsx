import React, { useState } from 'react';
import styled from 'styled-components';
import { TextInput, SelectInput, PrimaryButton } from './FormElements';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

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
  max-width: 480px;
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

const Title = styled.h2`
  margin: 0 0 1rem;
  color: #014F40;
`;

const Field = styled.div`
  margin-bottom: 1rem;
`;

export default function CompleteTeacherProfileModal({ open, onClose, userData }) {
  const [docType, setDocType] = useState(userData?.docType || '');
  const [docNumber, setDocNumber] = useState(userData?.docNumber || '');
  const [studies, setStudies] = useState(userData?.studies || '');
  const [studyTime, setStudyTime] = useState(userData?.studyTime || '');
  const [finished, setFinished] = useState(userData?.careerFinished || false);
  const [job, setJob] = useState(userData?.job || '');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const save = async () => {
    if (!docType || !docNumber || !studies) return;
    if (saving) return;
    setSaving(true);
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), {
      docType,
      docNumber,
      studies,
      studyTime,
      careerFinished: finished,
      job,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <Title>Completa tu perfil</Title>
        <Field>
          <label>Tipo de documento</label>
          <SelectInput
            value={docType}
            onChange={e => setDocType(e.target.value)}
            disabled={!!userData?.docNumber}
          >
            <option value="">Selecciona</option>
            <option value="DNI">DNI</option>
            <option value="NIE">NIE</option>
            <option value="NIF">NIF</option>
            <option value="Pasaporte">Pasaporte</option>
          </SelectInput>
        </Field>
        <Field>
          <label>Número</label>
          <TextInput
            type="text"
            value={docNumber}
            onChange={e => setDocNumber(e.target.value)}
            disabled={!!userData?.docNumber}
          />
        </Field>
        <Field>
          <label>¿Qué estudias?</label>
          <TextInput
            type="text"
            value={studies}
            onChange={e => setStudies(e.target.value)}
          />
        </Field>
        <Field>
          <label>Tiempo cursando / finalizado</label>
          <TextInput
            type="text"
            value={studyTime}
            onChange={e => setStudyTime(e.target.value)}
          />
        </Field>
        <Field>
          <label>
            <input
              type="checkbox"
              checked={finished}
              onChange={e => setFinished(e.target.checked)}
            />{' '}Carrera finalizada
          </label>
        </Field>
        <Field>
          <label>¿En qué trabajas?</label>
          <TextInput
            type="text"
            value={job}
            onChange={e => setJob(e.target.value)}
          />
        </Field>
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </PrimaryButton>
      </Modal>
    </Overlay>
  );
}
