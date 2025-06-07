import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const fade = keyframes`from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}`;

const Page = styled.div`
  background:#f7faf9;
  min-height:100vh;
  padding:2rem;
`;
const Container = styled.div`
  max-width:600px;
  margin:auto;
  animation:${fade} 0.4s ease-out;
`;
const Title = styled.h1`
  text-align:center;
  color:#034640;
  margin-bottom:2rem;
`;
const Form = styled.div`
  display:flex;
  flex-direction:column;
  gap:0.5rem;
  margin-bottom:1rem;
  input,textarea{padding:0.5rem;border:1px solid #ccc;border-radius:4px;}
  button{align-self:flex-start;background:#034640;color:#fff;border:none;border-radius:4px;padding:0.5rem 1rem;cursor:pointer;}
`;
const Item = styled.div`
  display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;
`;
const DelBtn = styled.button`
  background:#e53e3e;color:#fff;border:none;border-radius:4px;padding:0.25rem 0.5rem;cursor:pointer;
`;

export default function Facturacion(){
  const [items,setItems]=useState([]);
  const [fecha,setFecha]=useState('');
  const [mensaje,setMensaje]=useState('');

  const fetchItems=async()=>{
    const snap=await getDocs(collection(db,'facturacion'));
    setItems(snap.docs.map(d=>({id:d.id,...d.data()})));
  };

  useEffect(()=>{fetchItems();},[]);

  const addItem=async()=>{
    if(!fecha||!mensaje) return;
    await addDoc(collection(db,'facturacion'),{fecha,mensaje});
    setFecha('');setMensaje('');
    fetchItems();
  };
  const removeItem=async(id)=>{
    await deleteDoc(doc(db,'facturacion',id));
    setItems(items.filter(i=>i.id!==id));
  };

  return(
    <Page>
      <Container>
        <Title>Días de facturación</Title>
        <Form>
          <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
          <textarea value={mensaje} onChange={e=>setMensaje(e.target.value)} placeholder="Mensaje" />
          <button type="button" onClick={addItem}>Añadir</button>
        </Form>
        {items.map(i=>(
          <Item key={i.id}>
            <span>{i.fecha} - {i.mensaje}</span>
            <DelBtn onClick={()=>removeItem(i.id)}>Eliminar</DelBtn>
          </Item>
        ))}
      </Container>
    </Page>
  );
}
