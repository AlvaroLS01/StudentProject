import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TextInput, SelectInput, PrimaryButton } from './FormElements';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

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
  const { refreshUserData } = useAuth();
  const [docType, setDocType] = useState(userData?.docType || '');
  const [docNumber, setDocNumber] = useState(userData?.docNumber || '');
  const [studies, setStudies] = useState(userData?.studies || '');
  const [studyTime, setStudyTime] = useState(userData?.studyTime || '');
  const [finished, setFinished] = useState(userData?.careerFinished || false);
  const [job, setJob] = useState(userData?.job || '');
  const [status, setStatus] = useState(userData?.status || '');
  const [iban, setIban] = useState(userData?.iban || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'trabaja') {
      setStudyTime('Finalizado en tiempo');
    }
  }, [status]);

  if (!open) return null;

  const save = async () => {
    if (!docType || !docNumber || !studies || !status || !iban) return;
    if (saving) return;
    setSaving(true);
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), {
      docType,
      docNumber,
      studies,
      studyTime: status === 'trabaja' ? 'Finalizado en tiempo' : studyTime,
      careerFinished: finished,
      job,
      status,
      iban,
    });
    await refreshUserData();
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
          <label>¿Estudias o trabajas?</label>
          <SelectInput value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Selecciona</option>
            <option value="estudia">Estudio</option>
            <option value="trabaja">Trabajo</option>
          </SelectInput>
        </Field>
        {status === 'trabaja' && (
          <>
            <Field>
              <label>¿Qué has estudiado?</label>
              <TextInput
                type="text"
                value={studies}
                onChange={e => setStudies(e.target.value)}
              />
            </Field>
          </>
        )}
        {status === 'estudia' && (
          <>
            <Field>
              <label>¿Qué estudias?</label>
              <TextInput
                type="text"
                value={studies}
                onChange={e => setStudies(e.target.value)}
              />
            </Field>
            <Field>
              <label>¿En qué año estás?</label>
              <TextInput
                type="text"
                value={studyTime}
                onChange={e => setStudyTime(e.target.value)}
              />
            </Field>
          </>
        )}
        <Field>
          <label>
            <input
              type="checkbox"
              checked={finished}
              onChange={e => setFinished(e.target.checked)}
            />{' '}Carrera finalizada
          </label>
        </Field>
        {status === 'trabaja' && (
          <Field>
            <label>¿En qué trabajas?</label>
            <TextInput
              type="text"
              value={job}
              onChange={e => setJob(e.target.value)}
            />
          </Field>
        )}
        <Field>
          <label>IBAN o número de cuenta</label>
          <TextInput
            type="text"
            value={iban}
            onChange={e => setIban(e.target.value)}
          />
        </Field>
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </PrimaryButton>
      </Modal>
    </Overlay>
  );
}
