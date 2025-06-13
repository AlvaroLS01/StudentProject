// src/screens/admin/PanelAdmin.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Importa tu componente de gestión de clases para admin
import GestionClases from './acciones/GestionClases';
import Facturacion   from './acciones/Facturacion';
import Profesores    from './acciones/Profesores';

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f9fdfc;
`;

const Sidebar = styled.nav`
  position: sticky;
  top: 0;
  align-self: flex-start;   /* para que sticky funcione dentro de flex */
  height: 100vh;
  width: 240px;
  background: #fff;
  border-right: 1px solid #e6e8eb;
  padding: 2rem 1rem;
  box-shadow: 2px 0 6px rgba(0,0,0,0.05);
  overflow-y: auto;         /* por si el menú es más largo que la pantalla */
  /* Mantener el panel por encima de la pantalla de carga */
  z-index: 1000;
`;

const Logo = styled.h1`
  font-size: 1.25rem;
  color: #034640;
  text-align: center;
  margin-bottom: 2rem;
`;

const Menu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MenuItem = styled.li`
  margin-bottom: 1rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: ${({ active }) => active ? '#ccf3e5' : 'transparent'};
  color: ${({ active }) => active ? '#014F40' : '#034640'};
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #f1f8f6;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  background: #f0f8f7;
  max-width: 960px;     /* ancho contenido más contenido */
  margin: 0 auto;       /* centra dentro del espacio disponible */
`;

export default function PanelAdmin() {
  // Por defecto abrimos "Gestión de clases"
  const [view, setView] = useState('gestion-clases');

  // Cuando cambia la vista, subimos al tope
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const renderView = () => {
    switch (view) {
      case 'gestion-clases':
        return <GestionClases />;
      case 'facturacion':
        return <Facturacion />;
      case 'profesores':
        return <Profesores />;
      default:
        return <GestionClases />;
    }
  };

  return (
    <Container>
      <Sidebar>
        <Logo>Admin</Logo>
        <Menu>
          <MenuItem>
            <Button
              active={view === 'gestion-clases'}
              onClick={() => setView('gestion-clases')}
            >
              Gestión de clases
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'facturacion'}
              onClick={() => setView('facturacion')}
            >
              Facturación
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'profesores'}
              onClick={() => setView('profesores')}
            >
              Profesores
            </Button>
          </MenuItem>
        </Menu>
      </Sidebar>
      <Content>
        {renderView()}
      </Content>
    </Container>
  );
}
