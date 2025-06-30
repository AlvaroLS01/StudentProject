import React from 'react';
import styled from 'styled-components';
import { useChild } from '../ChildContext';
import { useNotification } from '../NotificationContext';

const Bubble = styled.div`
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  background: #fff;
  padding: 0.75rem;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  z-index: 1100;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  color: #034640;
  font-weight: 600;
`;

const Select = styled.select`
  width: 180px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
`;

export default function ChildSelectorBubble({ onAddChild }) {
  const { childList, selectedChild, setSelectedChild } = useChild();
  const { show } = useNotification();

  const handleChange = e => {
    const val = e.target.value;
    if (val === 'add_child') {
      if (onAddChild) onAddChild();
      return;
    }
    const c = childList.find(ch => ch.id === val);
    setSelectedChild(c || null);
    if (c) show(`Ahora estás usando a ${c.nombre}`);
    else show('No hay hijo seleccionado');
  };

  return (
    <Bubble>
      <Label>Selecciona hijo</Label>
      <Select value={selectedChild?.id || ''} onChange={handleChange}>
        <option value="">Selecciona tu hijo</option>
        {childList.map(c => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
        <option value="add_child">Añadir hijo</option>
      </Select>
    </Bubble>
  );
}
