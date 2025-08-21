import React from 'react';
import styled from 'styled-components';

const BarContainer = styled.div`
  width: 100%;
  background: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  height: 8px;
  margin: 0.75rem 0;
`;

const Bar = styled.div`
  height: 100%;
  width: ${p => p.percent}%;
  background: ${p => p.color};
  transition: width 0.3s ease;
`;

export default function ProgressBar({ percent, color }) {
  return (
    <BarContainer>
      <Bar percent={percent} color={color} />
    </BarContainer>
  );
}
