// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import styled from 'styled-components';

import ScrollToTop     from './components/ScrollToTop';
import Navbar          from './components/Navbar';
import Footer          from './components/Footer';
import Home            from './screens/Home';
import Alta            from './screens/Alta';
import ReservaClase    from './screens/ReservaClase';
import CalendarioA     from './screens/alumno/acciones/Calendario';
import CalendarioP     from './screens/profesor/acciones/Calendario';
import Clases          from './screens/alumno/acciones/Clases';
import ClasesProfesor  from './screens/profesor/acciones/Clases';
import NuevaClase      from './screens/alumno/acciones/NuevaClase';
import Ofertas         from './screens/profesor/acciones/Ofertas';
import SerProfesor     from './screens/SerProfesor';
import QuienesSomos    from './screens/QuienesSomos';
import Contacto        from './screens/Contacto';
import InicioSesion    from './screens/InicioSesion';
import SignUpProfesor  from './screens/SignUpProfesor';
import SignUpAlumno    from './screens/SignUpAlumno';
import PanelProfesor   from './screens/profesor/PanelProfesor';
import PanelAlumno     from './screens/alumno/PanelAlumno';
import PanelAdmin      from './screens/admin/PanelAdmin';
import GestionClases   from './screens/admin/acciones/GestionClases';
import MisProfesores   from './screens/alumno/acciones/MisProfesores';
import MisAlumnos      from './screens/profesor/acciones/MisAlumnos';
import Perfil          from './screens/shared/Perfil';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;
const Main = styled.main`
  flex: 1;
`;

// Layout con Navbar + Footer
const Layout = () => (
  <>
    <Navbar />
    <Main><Outlet/></Main>
    <Footer />
  </>
);

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContainer>
        <Routes>
          {/* Sin Navbar/Footer */}
          <Route path="/alta-profesor" element={<SignUpProfesor />} />
          <Route path="/alta-alumno"   element={<SignUpAlumno />} />
          <Route path="/inicio"        element={<InicioSesion />} />

          {/* Con Navbar/Footer */}
          <Route element={<Layout />}>
            <Route path="/home"                 element={<Home />} />

            {/* Ruta de perfil con parámetro userId */}
            <Route path="/perfil/:userId"       element={<Perfil />} />

            <Route path="/alumno"               element={<PanelAlumno />} />
            <Route path="/alumno/nueva-clase"   element={<NuevaClase />} />
            <Route path="/alumno/clases"        element={<Clases />} />
            <Route path="/alumno/calendario"    element={<CalendarioA />} />
            <Route path="/profesor/mis-profesores" element={<MisProfesores />} />

            <Route path="/admin"                element={<PanelAdmin />} />
            <Route path="/admin/acciones/gestion-clases" element={<GestionClases />} />

            <Route path="/profesor"             element={<PanelProfesor />} />
            <Route path="/profesor/ofertas"     element={<Ofertas />} />
            <Route path="/profesor/calendario"  element={<CalendarioP />} />
            <Route path="/profesor/mis-clases"  element={<ClasesProfesor />} />
            <Route path="/profesor/mis-alumnos" element={<MisAlumnos />} />

            {/* Rutas públicas */}
            <Route path="/reserva-tu-clase"     element={<ReservaClase />} />
            <Route path="/ser-profesor"         element={<SerProfesor />} />
            <Route path="/quienes-somos"        element={<QuienesSomos />} />
            <Route path="/contacto"             element={<Contacto />} />
            <Route path="/alta"                 element={<Alta />} />

            {/* Cualquier otra ruta redirige a /home */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </AppContainer>
    </BrowserRouter>
  );
}
