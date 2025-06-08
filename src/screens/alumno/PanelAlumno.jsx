// src/screens/alumno/PanelAlumno.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useChild } from '../../ChildContext';

// importa tus pantallas “incrustadas”
import NuevaClase    from './acciones/NuevaClase';
import Clases        from './acciones/Clases';
import MisProfesores from './acciones/MisProfesores';
import CalendarioA   from './acciones/Calendario';
import MisHijos      from './acciones/MisHijos';

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

const ChildSelect = styled.div`
  margin-top: auto;
  padding-top: 1rem;
  label {
    display: block;
    margin-bottom: 0.25rem;
    color: #034640;
    font-weight: 600;
  }
  select {
    width: 100%;
    padding: 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  background: #f0f8f7;
  max-width: 960px;     /* ancho contenido más contenido */
  margin: 0 auto;       /* centra dentro del espacio disponible */
`;

export default function PanelAlumno() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'nueva-clase';
  const [view, setView] = useState(initialTab);
  const { userData } = useAuth();
  const { childList, selectedChild, setSelectedChild } = useChild();

  // Al cambiar de pestaña, subimos arriba y actualizamos la URL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams({ tab: view });
  }, [view, setSearchParams]);

  const renderView = () => {
    switch(view) {
      case 'nueva-clase':    return <NuevaClase />;
      case 'clases':         return <Clases />;
      case 'mis-profesores': return <MisProfesores />;
      case 'calendario':     return <CalendarioA />;
      case 'mis-hijos':      return <MisHijos />;
      default:               return <NuevaClase />;
    }
  };

  return (
    <Container>
      <Sidebar>
        <Logo>Alumno</Logo>
        <Menu>
          <MenuItem>
            <Button
              active={view === 'nueva-clase'}
              onClick={() => setView('nueva-clase')}
            >
              Solicitar nuevo profesor
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'clases'}
              onClick={() => setView('clases')}
            >
              Mis clases particulares
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'mis-profesores'}
              onClick={() => setView('mis-profesores')}
            >
              Mis profesores
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
          {userData?.rol === 'padre' && (
            <MenuItem>
              <Button
                active={view === 'mis-hijos'}
                onClick={() => setView('mis-hijos')}
              >
                Mis hijos
              </Button>
            </MenuItem>
          )}
        </Menu>
        {userData?.rol === 'padre' && childList.length > 0 && (
          <ChildSelect>
            <label>Selecciona hijo</label>
            <select
              value={selectedChild?.id || ''}
              onChange={e => {
                const c = childList.find(ch => ch.id === e.target.value);
                setSelectedChild(c);
              }}
            >
              {childList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </ChildSelect>
        )}
      </Sidebar>

      <Content>
        {renderView()}
      </Content>
    </Container>
  );
}
