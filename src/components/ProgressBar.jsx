import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  from { background-position: 0 0; }
  to { background-position: 200% 0; }
`;

const Container = styled.div`
  width: 100%;
  margin: 0.75rem 0;
`;

const Track = styled.div`
  position: relative;
  height: 8px;
  background: #e2e8f0;
  border-radius: 8px;
`;

const Fill = styled.div`
  height: 100%;
  width: ${p => p.percent}%;
  background: ${p => p.color};
  background-image: linear-gradient(
    90deg,
    rgba(255,255,255,0.3) 25%,
    rgba(255,255,255,0) 25%,
    rgba(255,255,255,0) 50%,
    rgba(255,255,255,0.3) 50%,
    rgba(255,255,255,0.3) 75%,
    rgba(255,255,255,0) 75%,
    rgba(255,255,255,0) 100%
  );
  background-size: 40px 100%;
  animation: ${shimmer} 35s linear infinite;
  transition: width 0.6s ease;
  border-radius: 8px;
`;

const StepDot = styled.div`
  position: absolute;
  top: 50%;
  left: ${p => p.left}%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${p => (p.active ? p.color : '#cbd5e0')};
  box-shadow: 0 0 0 3px #fff;
  z-index: 1;
`;

const CurrentDot = styled(StepDot)`
  width: 16px;
  height: 16px;
  z-index: 2;
  cursor: default;

  &:hover span { opacity: 1; }
`;

const Tooltip = styled.span`
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  background: #2d3748;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
`;

const Labels = styled.div`
  display: grid;
  grid-template-columns: repeat(${p => p.count}, 1fr);
  gap: .25rem;
  margin-top: .25rem;
  font-size: 0.75rem;
  color: #4a5568;
`;

const LabelItem = styled.div`
  text-align: center;
  padding: 0 .25rem;
  line-height: 1.2;
  white-space: normal;        /* permite salto por espacios */
  overflow-wrap: anywhere;    /* evita que se apiñe/solape */
`;

export default function ProgressBar({ percent, color = '#0ea5e9', label }) {
  const steps = [
    'Solicitud',
    'Búsqueda de profesor',
    'Selección de profesor',
    'Esperando respuesta del profesor',
    'Esperando respuesta del tutor',
    'Profesor asignado'
  ];

  const stepPercents = steps.map((_, i) => (i / (steps.length - 1)) * 100);

  return (
    <Container>
      <Track>
        <Fill percent={percent} color={color} />
        {stepPercents.map((left, i) => (
          <StepDot key={i} left={left} active={percent >= left} color={color} />
        ))}
        <CurrentDot left={percent} color={color}>
          <Tooltip>{label}</Tooltip>
        </CurrentDot>
      </Track>

      <Labels count={steps.length}>
        {steps.map((s, i) => (
          <LabelItem key={i}>{s}</LabelItem>
        ))}
      </Labels>
    </Container>
  );
}
