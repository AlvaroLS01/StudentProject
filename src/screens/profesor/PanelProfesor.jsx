import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';

// importa tus pantallas “incrustadas” para profesor
import Ofertas                from './acciones/Ofertas';
import ClasesProfesor         from './acciones/Clases';
import CalendarioProfesor     from './acciones/Calendario';
import MisAlumnos             from './acciones/MisAlumnos';

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f9fdfc;
`;

const Sidebar = styled.nav`
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
  width: 240px;
  background: #fff;
  border-right: 1px solid #e6e8eb;
  padding: 2rem 1rem;
  box-shadow: 2px 0 6px rgba(0,0,0,0.05);
  overflow-y: auto;
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
  max-width: 960px;
  margin: 0 auto;
`;

export default function PanelProfesor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'ofertas';
  const [view, setView] = useState(initialTab);

  // Al cambiar de pestaña, subimos arriba y actualizamos la URL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams({ tab: view });
  }, [view, setSearchParams]);

  const renderView = () => {
    switch(view) {
      case 'ofertas':
        return <Ofertas />;
      case 'clases':
        return <ClasesProfesor />;
      case 'calendario':
        return <CalendarioProfesor />;
      case 'misAlumnos':
        return <MisAlumnos />;
      default:
        return <Ofertas />;
    }
  };

  return (
    <Container>
      <Sidebar>
        <Logo>Profesor</Logo>
        <Menu>
          <MenuItem>
            <Button
              active={view === 'ofertas'}
              onClick={() => setView('ofertas')}
            >
              Clases disponibles
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'clases'}
              onClick={() => setView('clases')}
            >
              Mis clases asignadas
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'calendario'}
              onClick={() => setView('calendario')}
            >
              Calendario
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'misAlumnos'}
              onClick={() => setView('misAlumnos')}
            >
              Mis alumnos
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
