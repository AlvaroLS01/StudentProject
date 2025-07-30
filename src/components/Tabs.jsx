import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
`;

const TabButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  color: ${({ active }) => (active ? '#046654' : '#666')};
  border-bottom: ${({ active }) => (active ? '3px solid #046654' : '3px solid transparent')};
  font-weight: ${({ active }) => (active ? '700' : '500')};
`;

export default function Tabs({ tabs, active, onChange }) {
  return (
    <Container>
      {tabs.map(tab => (
        <TabButton key={tab.value} active={tab.value === active} onClick={() => onChange(tab.value)}>
          {tab.label}
        </TabButton>
      ))}
    </Container>
  );
}
