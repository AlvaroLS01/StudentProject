import React from 'react';
import styled, { keyframes } from 'styled-components';
import logo from '../assets/logo-sin-fondo.png';

const pulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 2000;
`;

const Logo = styled.img`
  width: 150px;
  animation: ${pulse} 1.6s ease-in-out infinite;
`;

export default function LoadingScreen() {
  return (
    <Overlay>
      <Logo src={logo} alt="Cargando..." />
    </Overlay>
  );
}
