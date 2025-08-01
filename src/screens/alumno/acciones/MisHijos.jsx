import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { TextInput, PrimaryButton, DangerButton } from '../../../components/FormElements';
import { auth, db } from '../../../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useChild } from '../../../ChildContext';
import { useAuth } from '../../../AuthContext';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  padding: 1rem;
  background: #f0f8f7;
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 800px;
  margin: auto;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  color: #034640;
  font-size: 2rem;
  text-align: center;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
`;

const Img = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
`;

const Form = styled.div`
  margin-top: 2rem;
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
`;

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 320px;
  text-align: center;
`;

const ModalText = styled.p`
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #014F40;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-around;
`;

const ModalButton = styled.button`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  ${p =>
    p.primary
      ? `background: #006D5B; color: #fff;`
      : `background: #f0f0f0; color: #333;`}
`;

export default function MisHijos() {
  const { childList, setChildList, setSelectedChild } = useChild();
  const { userData } = useAuth();
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [saving, setSaving] = useState(false);
  const [childToDelete, setChildToDelete] = useState(null);

  const addChild = async () => {
    if (!nombre || !fecha || saving) return;
    setSaving(true);
    const nuevo = {
      id: Date.now().toString(),
      nombre,
      fechaNacimiento: fecha,
      photoURL: userData?.photoURL || auth.currentUser.photoURL || ''
    };
    const nuevos = [...childList, nuevo];
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { hijos: nuevos });
    setChildList(nuevos.filter(c => !c.disabled));
    setSelectedChild(nuevo);
    setNombre('');
    setFecha('');
    setSaving(false);
  };

  const removeChild = async child => {
    const nuevos = childList.map(c =>
      c.id === child.id ? { ...c, disabled: true } : c
    );
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { hijos: nuevos });
    const activos = nuevos.filter(c => !c.disabled);
    setChildList(activos);
    setSelectedChild(activos[0] || null);
  };

  return (
    <Page>
      <Container>
        <Title>Mis hijos</Title>
        <List>
          {childList.map(c => (
            <Item key={c.id}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {userData?.photoURL && <Img src={userData.photoURL} alt="foto" />}
                <div>
                  <div>{c.nombre}</div>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>{c.fechaNacimiento}</div>
                </div>
              </div>
              <DangerButton
                disabled={childList.length <= 1}
                title={
                  childList.length <= 1
                    ? 'Deberás añadir un hijo antes de eliminar el último que tienes'
                    : ''
                }
                onClick={() => setChildToDelete(c)}
              >
                Eliminar
              </DangerButton>
            </Item>
          ))}
        </List>

        <Form>
          <h3>Añadir nuevo hijo</h3>
          <div>
            <TextInput
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>
          <div>
            <TextInput
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
            />
          </div>
          <PrimaryButton onClick={addChild} disabled={saving}>Guardar</PrimaryButton>
        </Form>
      </Container>
      {childToDelete && (
        <Overlay onClick={() => setChildToDelete(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalText>
              Se eliminará la relación con profesores y clases de {childToDelete.nombre}. ¿Deseas continuar?
            </ModalText>
            <ModalActions>
              <ModalButton onClick={() => setChildToDelete(null)}>Cancelar</ModalButton>
              <ModalButton
                primary
                onClick={() => {
                  removeChild(childToDelete);
                  setChildToDelete(null);
                }}
              >
                Aceptar
              </ModalButton>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </Page>
  );
}
