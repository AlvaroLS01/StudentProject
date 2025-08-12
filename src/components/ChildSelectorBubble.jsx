import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useChild } from '../ChildContext';
import { SelectInput } from './FormElements';

const flash = keyframes`
  0% { transform: scale(1); background: #fff; }
  50% { transform: scale(1.05); background: #ccf3e5; }
  100% { transform: scale(1); background: #fff; }
`;

const Bubble = styled.div`
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  background: #fff;
  padding: 0.75rem;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  z-index: 1100;

  &.flash {
    animation: ${flash} 0.6s ease-out;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  color: #034640;
  font-weight: 600;
`;


export default function ChildSelectorBubble({ onAddChild }) {
  const { childList, selectedChild, setSelectedChild } = useChild();
  const [flashAnim, setFlashAnim] = useState(false);

  useEffect(() => {
    if (selectedChild) {
      setFlashAnim(true);
      const t = setTimeout(() => setFlashAnim(false), 600);
      return () => clearTimeout(t);
    }
  }, [selectedChild]);

  const handleChange = e => {
    const val = e.target.value;
    if (val === 'add_child') {
      if (onAddChild) onAddChild();
      return;
    }
    const c = childList.find(ch => ch.id === val);
    setSelectedChild(c || null);
  };

  return (
    <Bubble className={flashAnim ? 'flash' : ''}>
      <Label>Selecciona alumno</Label>
      <SelectInput value={selectedChild?.id || ''} onChange={handleChange} style={{ width: 180 }}>
        <option value="">Selecciona tu alumno</option>
        {childList.map(c => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
        <option value="add_child">Añadir alumno</option>
      </SelectInput>
    </Bubble>
  );
}
