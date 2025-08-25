import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TextInput, SelectInput, PrimaryButton } from './FormElements';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { updateProfesor, fetchGrados } from '../utils/api';
import { Overlay, Modal, ModalTitle } from './ModalStyles';

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

const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
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
    userData?.docType
      ? userData.docType === 'DNI'
        ? 'DNI'
        : 'Otro'
      : ''
  );
  const [docTypeOther, setDocTypeOther] = useState(
    userData?.docType && userData?.docType !== 'DNI' ? userData.docType : ''
  );
  const [docNumber, setDocNumber] = useState(userData?.docNumber || '');
  const [degrees, setDegrees] = useState([]);
  const [studySelect, setStudySelect] = useState('');
  const [studyOther, setStudyOther] = useState('');
  const [isOtherStudy, setIsOtherStudy] = useState(false);
  const [studyTime, setStudyTime] = useState(userData?.studyTime || '');
  const [finished, setFinished] = useState(userData?.careerFinished || false);
  const [iban, setIban] = useState(userData?.iban || '');
  const [experience, setExperience] = useState(userData?.experiencia || '');
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

  useEffect(() => {
    const loadDegrees = async () => {
      try {
        const data = await fetchGrados();
        setDegrees(data);
        if (userData?.studies) {
          if (data.some(d => d.nombre === userData.studies)) {
            setStudySelect(userData.studies);
            setIsOtherStudy(false);
          } else {
            setStudySelect('');
            setStudyOther(userData.studies);
            setIsOtherStudy(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadDegrees();
  }, [userData]);

  if (!open) return null;

  const save = async () => {
    const finalDocType = docSelect === 'DNI' ? 'DNI' : docTypeOther.trim();
    const finalStudies = isOtherStudy ? studyOther.trim() : studySelect.trim();
    if (!finalDocType || !docNumber || !finalStudies || (!finished && !studyTime) || !experience || !iban) return;
    if (docSelect === 'DNI' && dniError) return;
    if (ibanError) return;
    if (saving) return;
    setSaving(true);
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), {
      docType: finalDocType,
      docNumber,
      studies: finalStudies,
      studyTime,
      careerFinished: finished,
      status: 'estudia',
      iban,
      NIF: docNumber,
      IBAN: iban,
      carrera: finalStudies,
      curso: studyTime,
      experiencia: Number(experience),
    });
    await updateProfesor({
      correo_electronico: auth.currentUser.email,
      NIF: docNumber,
      IBAN: iban,
      carrera: finalStudies,
      curso: studyTime,
      experiencia: Number(experience),
    });
    await refreshUserData();
    setSaving(false);
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <ModalTitle>Completa tu perfil</ModalTitle>
        <Field>
          <label>Tipo de documento</label>
          <SelectInput
            value={docSelect}
            onChange={e => setDocSelect(e.target.value)}
            disabled={!!userData?.docNumber}
          >
            <option value="">Seleccione tipo de documento</option>
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
            disabled={!!userData?.docNumber || !docSelect}
          />
          {dniError && <ErrorText>{dniError}</ErrorText>}
        </Field>
        <Field>
          <label>¿Qué estudias o has estudiado?</label>
          <TextInput
            list="grados-list"
            value={isOtherStudy ? 'Otro grado' : studySelect}
            onChange={e => {
              const val = e.target.value;
              if (val === 'Otro grado') {
                setIsOtherStudy(true);
                setStudySelect('');
              } else {
                setIsOtherStudy(false);
                setStudySelect(val);
              }
            }}
          />
          <datalist id="grados-list">
            {degrees.map(g => (
              <option key={g.id_grado} value={g.nombre} />
            ))}
            <option value="Otro grado" />
          </datalist>
          {isOtherStudy && (
            <TextInput
              type="text"
              placeholder="Introduce tu grado"
              value={studyOther}
              onChange={e => setStudyOther(e.target.value)}
              style={{ marginTop: '0.5rem' }}
            />
          )}
        </Field>
        {!finished && (
          <Field>
            <label>¿En qué curso estás?</label>
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
              onChange={e => {
                const checked = e.target.checked;
                setFinished(checked);
                setStudyTime(checked ? '4' : '');
              }}
            />{' '}Carrera finalizada
          </label>
        </Field>
        <Field>
          <label>Años de experiencia</label>
          <TextInput
            type="number"
            value={experience}
            onChange={e => setExperience(e.target.value)}
          />
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
