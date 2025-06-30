import React, { useState } from 'react';
import styled from 'styled-components';
import { TextInput, SelectInput, PrimaryButton } from './FormElements';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useChild } from '../ChildContext';
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
  max-width: 420px;
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


const cursosGrouped = [
  {
    group: 'Primaria',
    options: [
      '1º Primaria',
      '2º Primaria',
      '3º Primaria',
      '4º Primaria',
      '5º Primaria',
      '6º Primaria'
    ]
  },
  {
    group: 'ESO',
    options: ['1º ESO', '2º ESO', '3º ESO', '4º ESO']
  },
  {
    group: 'Bachillerato',
    options: ['1º Bachillerato', '2º Bachillerato']
  }
];

export default function AddChildModal({ open, onClose }) {
  const { childList, setChildList, setSelectedChild } = useChild();
  const { userData } = useAuth();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [course, setCourse] = useState('');
  const [saving, setSaving] = useState(false);

  const addChild = async () => {
    if (!name || !date || !course || saving) return;
    setSaving(true);
    const nuevo = {
      id: Date.now().toString(),
      nombre: name,
      fechaNacimiento: date,
      curso: course,
      photoURL: userData?.photoURL || auth.currentUser.photoURL || ''
    };
    const nuevos = [...childList, nuevo];
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { hijos: nuevos });
    setChildList(nuevos);
    setSelectedChild(nuevo);
    setName('');
    setDate('');
    setCourse('');
    setSaving(false);
    onClose();
  };

  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <Title>Añadir hijo</Title>
        <TextInput
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <TextInput
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <SelectInput value={course} onChange={e => setCourse(e.target.value)}>
          <option value="">Selecciona curso</option>
          {cursosGrouped.map(({ group, options }) => (
            <optgroup key={group} label={group}>
              {options.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </optgroup>
          ))}
        </SelectInput>
        <PrimaryButton onClick={addChild} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </PrimaryButton>
      </Modal>
    </Overlay>
  );
}
