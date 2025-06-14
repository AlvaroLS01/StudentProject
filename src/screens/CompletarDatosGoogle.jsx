import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useNotification } from '../NotificationContext';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

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
    padding: 0.7rem 0.9rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
  }
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
  const [ciudad, setCiudad] = useState('');
  const [curso, setCurso] = useState('');
  const [fechaNac, setFechaNac] = useState('');
  const [nombreHijo, setNombreHijo] = useState('');
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
    if (!nombre || !apellido || !telefono || !ciudad || (rol !== 'profesor' && !curso)) {
      show('Completa todos los campos');
      return;
    }
    if (rol === 'alumno' && !fechaNac) {
      show('Añade tu fecha de nacimiento');
      return;
    }
    if (rol === 'padre' && (!nombreHijo || !fechaNacHijo)) {
      show('Completa datos del hijo');
      return;
    }
    try {
      const data = {
        uid: user.uid,
        email: user.email,
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
        if (rol === 'alumno') {
          data.fechaNacimiento = fechaNac;
        } else {
          data.hijos = [{ id: Date.now().toString(), nombre: nombreHijo, fechaNacimiento: fechaNacHijo }];
        }
      }
      await setDoc(doc(db, 'usuarios', user.uid), data);
      navigate('/home');
    } catch (err) {
      console.error(err);
      show('Error al guardar datos');
    }
  };

  return (
    <Page>
      <Card>
        <Title>Completa tu perfil</Title>
        <Form onSubmit={handleSubmit}>
          <Field>
            <label>Nombre</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} />
          </Field>
          <Field>
            <label>Apellidos</label>
            <input type="text" value={apellido} onChange={e => setApellido(e.target.value)} />
          </Field>
          <Field>
            <label>Teléfono</label>
            <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} />
          </Field>
          <Field>
            <label>Ciudad</label>
            <select value={ciudad} onChange={e => setCiudad(e.target.value)}>
              <option value="">Selecciona ciudad</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          {rol !== 'profesor' && (
            <Field>
              <label>Curso</label>
              <select value={curso} onChange={e => setCurso(e.target.value)}>
                <option value="">Selecciona curso</option>
                {cursosGrouped.map(({group, options}) => (
                  <optgroup key={group} label={group}>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
          )}
          {rol === 'alumno' && (
            <Field>
              <label>Fecha de nacimiento</label>
              <input type="date" value={fechaNac} onChange={e => setFechaNac(e.target.value)} />
            </Field>
          )}
          {rol === 'padre' && (
            <>
              <Field>
                <label>Nombre del hijo</label>
                <input type="text" value={nombreHijo} onChange={e => setNombreHijo(e.target.value)} />
              </Field>
              <Field>
                <label>Fecha nacimiento del hijo</label>
                <input type="date" value={fechaNacHijo} onChange={e => setFechaNacHijo(e.target.value)} />
              </Field>
            </>
          )}
          <Button type="submit">Guardar</Button>
        </Form>
      </Card>
    </Page>
  );
}
