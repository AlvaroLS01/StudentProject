import React from 'react';
import styled from 'styled-components';

const SwitchContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const SwitchTrack = styled.div`
  position: relative;
  display: flex;
  width: 280px;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 4px;
`;

const SwitchBubble = styled.div`
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  background: #046654;
  border-radius: 16px;
  transition: transform 0.3s ease;
  transform: ${({ view }) =>
    view === 'right' ? 'translateX(100%)' : 'translateX(0)'};
`;

const SwitchButton = styled.button`
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.5rem 1rem;
  color: ${({ active }) => (active ? '#fff' : '#333')};
  font-weight: 500;
  position: relative;
  z-index: 1;
  cursor: pointer;
`;

export default function ToggleSwitch({
  leftLabel,
  rightLabel,
  value,
  onChange,
}) {
  return (
    <SwitchContainer>
      <SwitchTrack>
        <SwitchBubble view={value} />
        <SwitchButton
          active={value === 'left'}
          onClick={() => onChange('left')}
        >
          {leftLabel}
        </SwitchButton>
        <SwitchButton
          active={value === 'right'}
          onClick={() => onChange('right')}
        >
          {rightLabel}
        </SwitchButton>
      </SwitchTrack>
    </SwitchContainer>
  );
}
