import React from 'react';
import styled, { keyframes } from 'styled-components';
import logo from '../assets/logo-sin-fondo-negro.png';

const pulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
`;

const Overlay = styled.div`
  position: ${({ fullscreen }) => (fullscreen ? 'fixed' : 'absolute')};
  top: 0;
  left: 0;
  width: 100%;
  height: ${({ fullscreen }) => (fullscreen ? '100vh' : '100%')};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  /* Mantener la pantalla de carga por debajo de la navbar y paneles */
  z-index: 500;
`;

const Logo = styled.img`
  width: 150px;
  animation: ${pulse} 1.6s ease-in-out infinite;
`;

export default function LoadingScreen({ fullscreen = false, ...rest }) {
  return (
    <Overlay fullscreen={fullscreen} {...rest}>
      <Logo src={logo} alt="Cargando..." />
    </Overlay>
  );
}
