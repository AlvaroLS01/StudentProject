// src/screens/admin/PanelAdmin.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  collectionGroup,
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

// Importa tu componente de gestión de clases para admin

import GestionClases from './acciones/GestionClases';
import Facturacion   from './acciones/Facturacion';
import Usuarios      from './acciones/Usuarios';
import Pagos        from './acciones/Pagos';

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
  const [downloading, setDownloading] = useState(false);

  const handleDownloadCsv = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const snap = await getDocs(collectionGroup(db, 'clases_asignadas'));
      const unionCache = {};
      const teacherCache = {};
      const studentCache = {};
      const classCache = {};
      const rows = [];

      for (const d of snap.docs) {
        const data = d.data();
        const unionId = d.ref.parent.parent.id;

        if (!unionCache[unionId]) {
          const uSnap = await getDoc(doc(db, 'clases_union', unionId));
          unionCache[unionId] = uSnap.exists() ? uSnap.data() : {};
        }
        const union = unionCache[unionId];

        const teacherId = union.profesorId;
        if (teacherId && !teacherCache[teacherId]) {
          const tSnap = await getDoc(doc(db, 'usuarios', teacherId));
          teacherCache[teacherId] = tSnap.exists() ? tSnap.data() : {};
        }
        const teacher = teacherCache[teacherId] || {};

        const studentId = union.alumnoId;
        if (studentId && !studentCache[studentId]) {
          const sSnap = await getDoc(doc(db, 'usuarios', studentId));
          studentCache[studentId] = sSnap.exists() ? sSnap.data() : {};
        }
        const student = studentCache[studentId] || {};

        const classId = union.claseId;
        if (classId && !classCache[classId]) {
          const cSnap = await getDoc(doc(db, 'clases', classId));
          classCache[classId] = cSnap.exists() ? cSnap.data() : {};
        }
        const classData = classCache[classId] || {};

        const beneficio =
          (data.precioTotalPadres || 0) - (data.precioTotalProfesor || 0);

        rows.push({
          assignmentId: d.id,
          teacherEmail: teacher.email || '',
          teacherName:
            union.profesorNombre ||
            `${teacher.nombre || ''} ${teacher.apellidos || ''}`.trim(),
          studentName:
            union.padreNombre ||
            union.alumnoNombre ||
            `${student.nombre || ''} ${student.apellidos || ''}`.trim(),
          studentEmail: student.email || '',
          curso: classData.curso || '',
          asignatura:
            data.asignatura ||
            classData.asignatura ||
            (classData.asignaturas || []).join(', '),
          fecha: data.fecha || '',
          duracion: data.duracion || '',
          modalidad: data.modalidad || '',
          tipoClase: classData.tipoClase || '',
          precioTotalPadres: data.precioTotalPadres || 0,
          precioTotalProfesor: data.precioTotalProfesor || 0,
          beneficio,
        });
      }

      const headers = [
        'ID de Asignación',
        'Correo Profesor',
        'Nombre Profesor',
        'Nombre Alumno',
        'Correo Alumno',
        'Curso',
        'Asignatura',
        'Fecha',
        'Duración',
        'Modalidad',
        'Tipo de Clase',
        'Precio Total Padres',
        'Precio Total Profesor',
        'Beneficio',
      ];

      const csv = [
        headers.join(','),
        ...rows.map((r) =>
          [
            r.assignmentId,
            r.teacherEmail,
            r.teacherName,
            r.studentName,
            r.studentEmail,
            r.curso,
            r.asignatura,
            r.fecha,
            r.duracion,
            r.modalidad,
            r.tipoClase,
            r.precioTotalPadres,
            r.precioTotalProfesor,
            r.beneficio,
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'clases.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating CSV', err);
    }
    setDownloading(false);
  };

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
      case 'pagos':
        return <Pagos />;
      case 'usuarios':
        return <Usuarios />;
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
              active={view === 'pagos'}
              onClick={() => setView('pagos')}
            >
              Pagos
            </Button>
          </MenuItem>
          <MenuItem>
            <Button onClick={handleDownloadCsv}>
              Descargar CSV
            </Button>
          </MenuItem>
          <MenuItem>
            <Button
              active={view === 'usuarios'}
              onClick={() => setView('usuarios')}
            >
              Profesores &amp; Alumnos
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
