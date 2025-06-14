import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useNotification } from '../NotificationContext';
import { db } from '../firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

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
  max-width: 420px;
  text-align: center;
`;

const Title = styled.h2`
  color: #034640;
  margin-bottom: 2rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background: #046654;
  color: #fff;
  transition: background 0.3s;
  &:hover {
    background: #034640;
  }
`;

export default function SeleccionRol() {
  const { user } = useAuth();
  const { show } = useNotification();
  const navigate = useNavigate();

  const handleSelect = async rol => {
    if (!user) return;
    try {
      const [nombre, ...apellidos] = user.displayName ? user.displayName.split(' ') : ['', ''];
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        email: user.email,
        nombre,
        apellido: apellidos.join(' '),
        rol,
        createdAt: new Date()
      });
      navigate('/home');
    } catch (err) {
      console.error(err);
      show('Error al guardar datos');
    }
  };

  return (
    <Page>
      <Card>
        <Title>Selecciona tu rol</Title>
        <ButtonGroup>
          <Button onClick={() => handleSelect('alumno')}>Alumno</Button>
          <Button onClick={() => handleSelect('padre')}>Padre</Button>
          <Button onClick={() => handleSelect('profesor')}>Profesor</Button>
        </ButtonGroup>
      </Card>
    </Page>
  );
}
