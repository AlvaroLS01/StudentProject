import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TextInput, SelectInput, PrimaryButton } from './FormElements';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

function validateDNI(value) {
  const match = /^([0-9]{8})([A-Za-z])$/.exec(value.toUpperCase());
  if (!match) return false;
  const num = parseInt(match[1], 10);
  const letter = match[2];
  return DNI_LETTERS[num % 23] === letter;
}

function validateIBAN(value) {
  const iban = value.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{22}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const converted = rearranged
    .split('')
    .map(ch => (/[A-Z]/.test(ch) ? ch.charCodeAt(0) - 55 : ch))
    .join('');
  let remainder = 0;
  for (let i = 0; i < converted.length; i++) {
    remainder = (remainder * 10 + parseInt(converted[i], 10)) % 97;
  }
  return remainder === 1;
}

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

const ErrorText = styled.p`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

export default function CompleteTeacherProfileModal({ open, onClose, userData }) {
  const { refreshUserData } = useAuth();
  const [docSelect, setDocSelect] = useState(
    userData?.docType === 'DNI' ? 'DNI' : 'Otro'
  );
  const [docTypeOther, setDocTypeOther] = useState(
    userData?.docType && userData?.docType !== 'DNI' ? userData.docType : ''
  );
  const [docNumber, setDocNumber] = useState(userData?.docNumber || '');
  const [studies, setStudies] = useState(userData?.studies || '');
  const [studyTime, setStudyTime] = useState(userData?.studyTime || '');
  const [finished, setFinished] = useState(userData?.careerFinished || false);
  const [iban, setIban] = useState(userData?.iban || '');
  const [saving, setSaving] = useState(false);
  const [dniError, setDniError] = useState('');
  const [ibanError, setIbanError] = useState('');

  useEffect(() => {
    if (docSelect === 'DNI') {
      setDniError(docNumber ? (validateDNI(docNumber) ? '' : 'DNI no válido') : '');
    } else {
      setDniError('');
    }
  }, [docNumber, docSelect]);

  useEffect(() => {
    if (docSelect === 'DNI') {
      setDocTypeOther('');
    }
  }, [docSelect]);

  useEffect(() => {
    if (!iban) {
      setIbanError('');
    } else {
      setIbanError(validateIBAN(iban) ? '' : 'IBAN no válido');
    }
  }, [iban]);

  if (!open) return null;

  const save = async () => {
    const finalDocType = docSelect === 'DNI' ? 'DNI' : docTypeOther.trim();
    if (!finalDocType || !docNumber || !studies || !iban) return;
    if (docSelect === 'DNI' && dniError) return;
    if (ibanError) return;
    if (saving) return;
    setSaving(true);
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), {
      docType: finalDocType,
      docNumber,
      studies,
      studyTime,
      careerFinished: finished,
      status: 'estudia',
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
            value={docSelect}
            onChange={e => setDocSelect(e.target.value)}
            disabled={!!userData?.docNumber}
          >
            <option value="DNI">DNI</option>
            <option value="Otro">Otro</option>
          </SelectInput>
          {docSelect === 'Otro' && (
            <TextInput
              type="text"
              placeholder="NIF, NIE, Pasaporte"
              value={docTypeOther}
              onChange={e => setDocTypeOther(e.target.value)}
              disabled={!!userData?.docNumber}
              style={{ marginTop: '0.5rem' }}
            />
          )}
        </Field>
        <Field>
          <label>Número</label>
          <TextInput
            type="text"
            value={docNumber}
            onChange={e => setDocNumber(e.target.value)}
            disabled={!!userData?.docNumber}
          />
          {dniError && <ErrorText>{dniError}</ErrorText>}
        </Field>
        <Field>
          <label>¿Qué estudias o has estudiado?</label>
          <TextInput
            type="text"
            value={studies}
            onChange={e => setStudies(e.target.value)}
          />
        </Field>
        {!finished && (
          <Field>
            <label>¿En qué año estás?</label>
            <TextInput
              type="text"
              value={studyTime}
              onChange={e => setStudyTime(e.target.value)}
            />
          </Field>
        )}
        <Field>
          <label>
            <input className="form-control"
              type="checkbox"
              checked={finished}
              onChange={e => setFinished(e.target.checked)}
            />{' '}Carrera finalizada
          </label>
        </Field>
        <Field>
          <label>IBAN o número de cuenta</label>
          <TextInput
            type="text"
            value={iban}
            onChange={e => setIban(e.target.value)}
          />
          {ibanError && <ErrorText>{ibanError}</ErrorText>}
        </Field>
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </PrimaryButton>
      </Modal>
    </Overlay>
  );
}
