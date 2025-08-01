import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useNotification } from '../NotificationContext';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';

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
  const [telefono, setTelefono] = useState('');
  const [confirmTelefono, setConfirmTelefono] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [curso, setCurso] = useState('');
  const [nombreHijo, setNombreHijo] = useState('');
  const [apellidoHijo, setApellidoHijo] = useState('');
  const [generoHijo, setGeneroHijo] = useState('Masculino');
  const [fechaNacHijo, setFechaNacHijo] = useState('');
  const [cities, setCities] = useState([]);

  const cursosGrouped = [
    { group: 'Primaria', options: ['1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria'] },
    { group: 'ESO', options: ['1º ESO','2º ESO','3º ESO','4º ESO'] },
    { group: 'Bachillerato', options: ['1º Bachillerato','2º Bachillerato'] }
  ];

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
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user) return;
    if (!nombre || !apellido || !telefono || !confirmTelefono || !ciudad || (rol !== 'profesor' && !curso)) {
      show('Completa todos los campos', 'error');
      return;
    }
    if (telefono !== confirmTelefono) {
      setTelefonoError('Los números no coinciden');
      return;
    }
    if (
      rol === 'padre' &&
      (!nombreHijo || !apellidoHijo || !fechaNacHijo || !generoHijo)
    ) {
      show('Completa datos del hijo', 'error');
      return;
    }
    setTelefonoError('');
    try {
      const phoneSnap = await getDocs(query(collection(db, 'usuarios'), where('telefono', '==', telefono)));
      if (!phoneSnap.empty) {
        setTelefonoError('Este teléfono ya está registrado');
        return;
      }
      const data = {
        uid: user.uid,
        email: user.email,
        photoURL: user.photoURL,
        nombre,
        apellido,
        telefono,
        ciudad,
        rol,
        createdAt: new Date()
      };
      if (rol === 'profesor') {
        // nothing extra
      } else {
        data.curso = curso;
        if (rol === 'padre') {
          data.hijos = [
            {
              id: Date.now().toString(),
              nombre: nombreHijo,
              apellidos: apellidoHijo,
              genero: generoHijo,
              fechaNacimiento: fechaNacHijo,
              curso,
              photoURL: user.photoURL || ''
            }
          ];
        }
      }
      await setDoc(doc(db, 'usuarios', user.uid), data);
      navigate('/home');
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
          {rol === 'padre' && (
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
          {rol !== 'profesor' && (
            <Field>
              <label>Curso</label>
              <select className="form-control" value={curso} onChange={e => setCurso(e.target.value)}>
                <option value="">Selecciona curso</option>
                {cursosGrouped.map(({group, options}) => (
                  <optgroup key={group} label={group}>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
          )}
          {rol === 'padre' && (
            <>
              <h3 style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '0.5rem', color: '#034640' }}>
                Datos del alumno
              </h3>
              <Field>
                <label>Nombre del hijo</label>
                <input
                  className="form-control"
                  type="text"
                  value={nombreHijo}
                  onChange={e => setNombreHijo(e.target.value)}
                />
              </Field>
              <Field>
                <label>Apellidos del hijo</label>
                <input
                  className="form-control"
                  type="text"
                  value={apellidoHijo}
                  onChange={e => setApellidoHijo(e.target.value)}
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
              <Field>
                <label>Fecha nacimiento del hijo</label>
                <input
                  className="form-control"
                  type="date"
                  value={fechaNacHijo}
                  onChange={e => setFechaNacHijo(e.target.value)}
                />
              </Field>
              <p style={{ gridColumn: '1 / -1', fontSize: '0.85rem', color: '#555' }}>
                Podrás añadir más hijos desde la pestaña "Mi cuenta".
              </p>
            </>
          )}
          <Button type="submit">Guardar</Button>
        </Form>
      </Card>
    </Page>
  );
}
