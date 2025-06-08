import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { auth, db, storage } from '../../../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useChild } from '../../../ChildContext';

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

export default function MisHijos() {
  const { childList, setChildList, setSelectedChild } = useChild();
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const addChild = async () => {
    if (!nombre || !fecha || saving) return;
    setSaving(true);
    let photoURL = '';
    if (file) {
      const r = ref(storage, `hijos/${auth.currentUser.uid}/${Date.now()}`);
      await uploadBytes(r, file);
      photoURL = await getDownloadURL(r);
    }
    const nuevo = {
      id: Date.now().toString(),
      nombre,
      fechaNacimiento: fecha,
      photoURL,
    };
    const nuevos = [...childList, nuevo];
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { hijos: nuevos });
    setChildList(nuevos);
    setSelectedChild(nuevo);
    setNombre('');
    setFecha('');
    setFile(null);
    setSaving(false);
  };

  const removeChild = async id => {
    const nuevos = childList.filter(c => c.id !== id);
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { hijos: nuevos });
    setChildList(nuevos);
    setSelectedChild(nuevos[0] || null);
  };

  return (
    <Page>
      <Container>
        <Title>Mis hijos</Title>
        <List>
          {childList.map(c => (
            <Item key={c.id}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {c.photoURL && <Img src={c.photoURL} alt="foto" />}
                <div>
                  <div>{c.nombre}</div>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>{c.fechaNacimiento}</div>
                </div>
              </div>
              <button onClick={() => removeChild(c.id)}>Eliminar</button>
            </Item>
          ))}
        </List>

        <Form>
          <h3>Añadir nuevo hijo</h3>
          <div>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>
          <div>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
            />
          </div>
          <div>
            <input type="file" onChange={e => setFile(e.target.files[0])} />
          </div>
          <button onClick={addChild} disabled={saving}>Guardar</button>
        </Form>
      </Container>
    </Page>
  );
}
