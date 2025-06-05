// src/components/MobileNavbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

// Iconos .png desde assets/icons
import AlumnosIcon     from '../assets/icons/alumnos.png';
import CalendarioIcon  from '../assets/icons/calendario.png';
import OfertasIcon     from '../assets/icons/ofertas.png';
import ChatIcon        from '../assets/icons/chat.png';
import PerfilIcon      from '../assets/icons/perfil.png';

const Nav = styled.nav`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;        /* Ancho completo */
    height: 60px;       /* Altura fija */
    background: #046654;
    z-index: 9999;      /* Por encima de todo */
  }
`;

const Tab = styled(Link)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #fff;
  font-size: 10px;
  overflow: hidden;

  img {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
  }
`;

export default function MobileNavbar() {
  const tabs = [
    { name: 'Alumnos',    icon: AlumnosIcon },
    { name: 'Calendario', icon: CalendarioIcon },
    { name: 'Ofertas',    icon: OfertasIcon },
    { name: 'Chat',       icon: ChatIcon },
    { name: 'Perfil',     icon: PerfilIcon },
  ];

  return (
    <Nav>
      {tabs.map(tab => (
        <Tab key={tab.name} to="/home">
          <img src={tab.icon} alt={tab.name} />
          <span>{tab.name}</span>
        </Tab>
      ))}
    </Nav>
  );
}