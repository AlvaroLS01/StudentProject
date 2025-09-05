import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useNotification } from '../NotificationContext';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { fetchCursos, registerTutor, registerProfesor } from '../utils/api';

const Page = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fdfc 0%, #dff8f2 100%);
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 14px 36px rgba(0,0,0,0.15);
  padding: 3rem 2rem;
  width: 100%;
  max-width: 520px;
`;

const Title = styled.h2`
  color: #034640;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  label {
    margin-bottom: 0.3rem;
    font-weight: 500;
    color: #014F40;
  }
  input, select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
  }
`;

const ErrorText = styled.p`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin: 0.25rem 0 0.5rem;
`;

const Button = styled.button`
  grid-column: 1 / -1;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background: #046654;
  color: #fff;
`;

export default function CompletarDatosGoogle() {
  const { user } = useAuth();
  const { show } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const rol = new URLSearchParams(location.search).get('rol');

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [telefono, setTelefono] = useState('');
  const [confirmTelefono, setConfirmTelefono] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [nif, setNif] = useState('');
  const [direccionFacturacion, setDireccionFacturacion] = useState('');
  const [nombreHijo, setNombreHijo] = useState('');
  const [apellidoHijo, setApellidoHijo] = useState('');
  const [nifAlumno, setNifAlumno] = useState('');
  const [distritoAlumno, setDistritoAlumno] = useState('');
  const [generoHijo, setGeneroHijo] = useState('Masculino');
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (user && user.displayName) {
      const [n, ...ap] = user.displayName.split(' ');
      setNombre(n);
      setApellido(ap.join(' '));
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'ciudades'));
        setCities(snap.docs.map(d => d.data().ciudad));
        const cursos = await fetchCursos();
        setCourses(cursos);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user) return;
    const missing = [];
    if (!nombre) missing.push('Nombre');
    if (!apellido) missing.push('Apellidos');
    if (!telefono) missing.push('Teléfono');
    if (!confirmTelefono) missing.push('Repite Teléfono');
    if (!ciudad) missing.push('Ciudad');
    if (rol !== 'profesor' && !courseId) missing.push('Curso');
    if (!nif) missing.push('NIF');
    if (!direccionFacturacion) missing.push('Dirección facturación');
    if (missing.length) {
      show('Faltan: ' + missing.join(', '), 'error');
      return;
    }
    if (telefono !== confirmTelefono) {
      setTelefonoError('Los números no coinciden');
      return;
    }
      if (rol === 'tutor') {
        const missingAlumno = [];
        if (!nombreHijo) missingAlumno.push('Nombre del alumno');
        if (!apellidoHijo) missingAlumno.push('Apellidos del alumno');
        if (!nifAlumno) missingAlumno.push('NIF del alumno');
        if (!distritoAlumno) missingAlumno.push('Distrito del alumno');
        if (!generoHijo) missingAlumno.push('Género del alumno');
        if (missingAlumno.length) {
          show('Faltan datos del alumno: ' + missingAlumno.join(', '), 'error');
          return;
        }
    }
    setTelefonoError('');
    try {
      const phoneSnap = await getDocs(query(collection(db, 'usuarios'), where('telefono', '==', telefono)));
      if (!phoneSnap.empty) {
        setTelefonoError('Este teléfono ya está registrado');
        return;
      }
      const courseName = courses.find(c => c.id_curso === parseInt(courseId))?.nombre || '';
      const data = {
        uid: user.uid,
        email: user.email,
        photoURL: user.photoURL,
        nombre,
        apellido,
        genero,
        telefono,
        ciudad,
        rol,
        nif,
        direccionFacturacion,
        createdAt: new Date()
      };
      if (rol === 'profesor') {
        // nothing extra
      } else {
        data.curso = courseName;
        if (rol === 'tutor') {
          data.alumnos = [
            {
              id: Date.now().toString(),
              nombre: nombreHijo,
              apellidos: apellidoHijo,
              genero: generoHijo,
              curso: courseName,
              nif: nifAlumno,
              distrito: distritoAlumno,
              photoURL: user.photoURL || ''
            }
          ];
        }
      }
      await setDoc(doc(db, 'usuarios', user.uid), data);

      if (rol === 'profesor') {
        await registerProfesor({
          nombre,
          apellidos: apellido,
          genero,
          telefono,
          correo_electronico: user.email,
          NIF: nif,
          direccion_facturacion: direccionFacturacion,
          distrito: null,
          barrio: null,
          codigo_postal: null,
          ciudad,
          IBAN: null,
          carrera: null,
          curso: null,
          experiencia: null,
          password: user.uid,
        });
      } else if (rol === 'tutor') {
        await registerTutor({
          tutor: {
            nombre,
            apellidos: apellido,
            genero,
            telefono,
            correo_electronico: user.email,
            NIF: nif,
            direccion_facturacion: direccionFacturacion,
            distrito: null,
            barrio: null,
            codigo_postal: null,
            ciudad,
            password: user.uid,
          },
          alumno: {
            nombre: nombreHijo,
            apellidos: apellidoHijo,
            direccion: distritoAlumno,
            NIF: nifAlumno,
            telefono: null,
            telefonoConfirm: null,
            genero: generoHijo,
            id_curso: parseInt(courseId),
            distrito: distritoAlumno,
            barrio: null,
            codigo_postal: null,
            ciudad,
          },
        });
      }
      const target = rol === 'profesor' ? '/profesor' : '/tutor';
      navigate(target);
    } catch (err) {
      console.error(err);
      show('Error al guardar datos', 'error');
    }
  };

  return (
    <Page>
      <Card>
        <Title>Completa tu perfil</Title>
        <Form onSubmit={handleSubmit}>
          {rol === 'tutor' && (
            <h3 style={{ gridColumn: '1 / -1', marginBottom: '0.5rem', color: '#034640' }}>
              Datos del tutor legal
            </h3>
          )}
          <Field>
            <label>Nombre</label>
            <input className="form-control" type="text" value={nombre} onChange={e => setNombre(e.target.value)} />
          </Field>
          <Field>
            <label>Apellidos</label>
            <input className="form-control" type="text" value={apellido} onChange={e => setApellido(e.target.value)} />
          </Field>
          <Field>
            <label>Género</label>
            <select className="form-control" value={genero} onChange={e => setGenero(e.target.value)}>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
          <Field>
            <label>NIF</label>
            <input className="form-control" type="text" value={nif} onChange={e => setNif(e.target.value)} />
          </Field>
          <Field>
            <label>Teléfono</label>
            <PhoneInput
              country={'es'}
              value={telefono}
              onChange={value => {
                setTelefono(value);
                setTelefonoError('');
              }}
              inputStyle={{ width: '100%' }}
            />
          </Field>
          <Field>
            <label>Repite Teléfono</label>
            <PhoneInput
              country={'es'}
              value={confirmTelefono}
              onChange={value => {
                setConfirmTelefono(value);
                setTelefonoError('');
              }}
              inputStyle={{ width: '100%' }}
            />
            {telefonoError && <ErrorText>{telefonoError}</ErrorText>}
          </Field>
          <Field>
            <label>Ciudad</label>
            <select className="form-control" value={ciudad} onChange={e => setCiudad(e.target.value)}>
              <option value="">Selecciona ciudad</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field>
            <label>Dirección facturación</label>
            <input className="form-control" type="text" value={direccionFacturacion} onChange={e => setDireccionFacturacion(e.target.value)} />
          </Field>
          {rol !== 'profesor' && (
            <Field>
              <label>Curso</label>
              <select className="form-control" value={courseId} onChange={e => setCourseId(e.target.value)}>
                <option value="">Selecciona curso</option>
                {courses.map(c => (
                  <option key={c.id_curso} value={c.id_curso}>{c.nombre}</option>
                ))}
              </select>
            </Field>
          )}
          {rol === 'tutor' && (
            <>
              <h3 style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '0.5rem', color: '#034640' }}>
                Datos del alumno
              </h3>
              <Field>
                <label>Nombre del alumno</label>
                <input
                  className="form-control"
                  type="text"
                  value={nombreHijo}
                  onChange={e => setNombreHijo(e.target.value)}
                />
              </Field>
              <Field>
                <label>Apellidos del alumno</label>
                <input
                  className="form-control"
                  type="text"
                  value={apellidoHijo}
                  onChange={e => setApellidoHijo(e.target.value)}
                />
              </Field>
              <Field>
                <label>NIF del alumno</label>
                <input
                  className="form-control"
                  type="text"
                  value={nifAlumno}
                  onChange={e => setNifAlumno(e.target.value)}
                />
              </Field>
              <Field>
                <label>Distrito del alumno</label>
                <input
                  className="form-control"
                  type="text"
                  value={distritoAlumno}
                  onChange={e => setDistritoAlumno(e.target.value)}
                />
              </Field>
              <Field>
                <label>Género</label>
                <select
                  className="form-control"
                  value={generoHijo}
                  onChange={e => setGeneroHijo(e.target.value)}
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </Field>
              <p style={{ gridColumn: '1 / -1', fontSize: '0.85rem', color: '#555' }}>
                Podrás añadir más alumnos desde la pestaña "Mi cuenta".
              </p>
            </>
          )}
          <Button type="submit">Guardar</Button>
        </Form>
      </Card>
    </Page>
  );
}
