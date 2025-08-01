// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import RedirectLoggedIn from './components/RedirectLoggedIn';
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
import SignUpTutor     from './screens/SignUpTutor';
import PanelProfesor   from './screens/profesor/PanelProfesor';
import PanelTutor      from './screens/alumno/PanelTutor';
import PanelAdmin      from './screens/admin/PanelAdmin';
import GestionClases   from './screens/admin/acciones/GestionClases';
import MisProfesores   from './screens/alumno/acciones/MisProfesores';
import MisAlumnos      from './screens/profesor/acciones/MisAlumnos';
import Perfil          from './screens/shared/Perfil';
import LoadingScreen   from './components/LoadingScreen';
import NotificationBell from './components/NotificationBell';
import SeleccionRol    from './screens/SeleccionRol';
import CompletarDatosGoogle from './screens/CompletarDatosGoogle';
import ResetPassword from './screens/ResetPassword';
import { useSyncClassToSheet } from './hooks/useSyncClassToSheet';

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
    <NotificationBell />
    <Main><Outlet/></Main>
    <Footer />
  </>
);

function AppContent() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Example: sync a specific class to Google Sheets
  useSyncClassToSheet('union123', 'assignment456');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AppContainer>
      {loading && <LoadingScreen fullscreen />}
      <Routes>
          {/* Sin Navbar/Footer */}
          <Route path="/alta-profesor" element={<SignUpProfesor />} />
          <Route path="/alta-tutor"    element={<SignUpTutor />} />
          <Route path="/inicio"        element={<InicioSesion />} />
          <Route path="/seleccion-rol" element={<SeleccionRol />} />
          <Route path="/google-datos" element={<CompletarDatosGoogle />} />

          {/* Con Navbar/Footer */}
          <Route element={<Layout />}>
            <Route element={<RedirectLoggedIn />}>
              <Route path="/home"             element={<Home />} />
              <Route path="/reserva-tu-clase" element={<ReservaClase />} />
              <Route path="/ser-profesor"     element={<SerProfesor />} />
              <Route path="/quienes-somos"    element={<QuienesSomos />} />
            </Route>

            {/* Ruta de perfil con parámetro userId */}
            <Route path="/perfil/:userId"       element={<Perfil />} />

            <Route element={<RequireAuth allowedRoles={['tutor','admin']} />}>
              <Route path="/tutor"               element={<PanelTutor />} />
              <Route path="/tutor/nueva-clase"   element={<NuevaClase />} />
              <Route path="/tutor/clases"        element={<Clases />} />
              <Route path="/tutor/calendario"    element={<CalendarioA />} />
              <Route path="/profesor/mis-profesores" element={<MisProfesores />} />
            </Route>

            <Route element={<RequireAuth allowedRoles={['admin']} />}>
              <Route path="/admin"                element={<PanelAdmin />} />
              <Route path="/admin/acciones/gestion-clases" element={<GestionClases />} />
            </Route>

            <Route element={<RequireAuth allowedRoles={['profesor','admin']} />}>
              <Route path="/profesor"             element={<PanelProfesor />} />
              <Route path="/profesor/ofertas"     element={<Ofertas />} />
              <Route path="/profesor/calendario"  element={<CalendarioP />} />
              <Route path="/profesor/mis-clases"  element={<ClasesProfesor />} />
              <Route path="/profesor/mis-alumnos" element={<MisAlumnos />} />
            </Route>

            <Route path="/reset-password" element={<ResetPassword />} />

              {/* Rutas públicas */}
              <Route path="/contacto"             element={<Contacto />} />
              <Route path="/alta"                 element={<Alta />} />

            {/* Cualquier otra ruta redirige a /home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </AppContainer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}
