// src/screens/alumno/PanelTutor.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useChild } from '../../ChildContext';
import { useNotification } from '../../NotificationContext';
import ChildSelectorBubble from '../../components/ChildSelectorBubble';
import AddChildModal from '../../components/AddChildModal';

// importa tus pantallas “incrustadas”
import NuevaClase    from './acciones/NuevaClase';
import MisClases     from './acciones/MisClases';
import MisSolicitudes from './acciones/MisSolicitudes';
import MisProfesores from './acciones/MisProfesores';
import CalendarioA   from './acciones/Calendario';
import MisAlumnos    from './acciones/MisAlumnos';

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
  display: flex;
  flex-direction: column;
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
  max-width: 960px;     /* ancho contenido más contenido */
  margin: 0 auto;       /* centra dentro del espacio disponible */
`;

const CenterMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 60vh;
  color: #034640;
`;

export default function PanelTutor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'nueva-clase';
  const [view, setView] = useState(initialTab);
  const { userData } = useAuth();
  const { selectedChild } = useChild();
  const { show } = useNotification();
  const [showAddChild, setShowAddChild] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (userData?.rol === 'tutor') {
      if (selectedChild) {
        show(
          <span>
            Ahora estás usando a <strong>{selectedChild.nombre}</strong>
          </span>,
          'success',
          2000
        );
      } else {
        show('No hay alumno seleccionado', 'error', 2000);
      }
    }
  }, [selectedChild, userData, show]);

  // Al cambiar de pestaña, subimos arriba y actualizamos la URL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams({ tab: view });
  }, [view, setSearchParams]);

  const renderView = () => {
    switch(view) {
      case 'nueva-clase':    return requireChild(<NuevaClase />);
      case 'mis-clases':     return requireChild(<MisClases />);
      case 'mis-solicitudes':return requireChild(<MisSolicitudes />);
      case 'mis-profesores': return requireChild(<MisProfesores />);
      case 'calendario':     return requireChild(<CalendarioA />);
      case 'mis-alumnos':      return <MisAlumnos />;
      default:               return <NuevaClase />;
    }
  };

  const requireChild = component => {
    if (userData?.rol === 'tutor' && !selectedChild) {
      return (
        <CenterMessage>
          Selecciona un alumno para continuar
        </CenterMessage>
      );
    }
    return component;
  };

  const handleMenuClick = name => {
    if (userData?.rol === 'tutor' && !selectedChild && name !== 'mis-alumnos') {
      show('Selecciona un alumno primero', 'error');
      return;
    }
    setView(name);
  };

  return (
    <>
    <Container>
      <Sidebar>
        <Logo>Tutor</Logo>
        <Menu>
          <MenuItem>
            <Button
              active={view === 'nueva-clase'}
              onClick={() => handleMenuClick('nueva-clase')}
            >
              Solicitar nuevo profesor
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'mis-clases'}
              onClick={() => handleMenuClick('mis-clases')}
            >
              Mis Clases
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'mis-solicitudes'}
              onClick={() => handleMenuClick('mis-solicitudes')}
            >
              Mis Solicitudes
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'mis-profesores'}
              onClick={() => handleMenuClick('mis-profesores')}
            >
              Mis profesores
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'calendario'}
              onClick={() => handleMenuClick('calendario')}
            >
              Calendario
            </Button>
          </MenuItem>
          {userData?.rol === 'tutor' && (
            <MenuItem>
              <Button
                active={view === 'mis-alumnos'}
                onClick={() => handleMenuClick('mis-alumnos')}
              >
                Alumnos
              </Button>
            </MenuItem>
          )}
        </Menu>
      </Sidebar>

      <Content>
        {renderView()}
      </Content>
    </Container>
    {userData?.rol === 'tutor' && (
      <>
        <ChildSelectorBubble onAddChild={() => setShowAddChild(true)} />
        <AddChildModal open={showAddChild} onClose={() => setShowAddChild(false)} />
      </>
    )}
    </>
  );
}
