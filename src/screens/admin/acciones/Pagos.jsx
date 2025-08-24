import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { PrimaryButton } from '../../../components/FormElements';
import { fetchBalances, liquidarBalance } from '../../../utils/api';

const fade = keyframes`from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}`;

const Page = styled.div`
  background:#f7faf9;
  min-height:100vh;
  padding:2rem;
`;

const Container = styled.div`
  max-width:900px;
  margin:auto;
  animation:${fade} 0.4s ease-out;
`;

const Title = styled.h1`
  text-align:center;
  color:#034640;
  margin-bottom:1.5rem;
  font-size:2.5rem;
`;

const Counter = styled.p`
  text-align:center;
  color:#046654;
  margin-top:-1rem;
  margin-bottom:1rem;
  font-weight:500;
`;
const Table = styled.table`
  width:100%;
  border-collapse:collapse;
  background:#fff;
  border-radius:8px;
  overflow:hidden;
  box-shadow:0 4px 12px rgba(0,0,0,0.05);
`;

const Th = styled.th`
  text-align:left;
  padding:0.75rem 1rem;
  background:#e6f2ef;
  color:#034640;
`;

const Td = styled.td`
  padding:0.75rem 1rem;
  border-top:1px solid #e2e8f0;
`;

export default function Pagos(){
  const [rows,setRows]=useState([]);
  const [total,setTotal]=useState(0);

  useEffect(()=>{
    (async()=>{
      try{
        const [tutores, profesores] = await Promise.all([
          fetchBalances('tutor'),
          fetchBalances('profesor')
        ]);
        const combined=[
          ...tutores.map(r=>({...r, rol:'tutor'})),
          ...profesores.map(r=>({...r, rol:'profesor'}))
        ];
        setRows(combined);
        setTotal(combined.reduce((a,b)=>a+Number(b.saldo||0),0));
      }catch(e){
        console.error(e);
      }
    })();
  },[]);

  const handleLiquidar=async(id, rol)=>{
    try{
      const email = rol==='tutor'?id:undefined;
      await liquidarBalance(id, rol, email);
      setRows(r=>{
        const updated=r.map(x=>x.user_id===id && x.rol===rol?{...x,saldo:0}:x);
        setTotal(updated.reduce((a,b)=>a+Number(b.saldo||0),0));
        return updated;
      });
    }catch(e){
      console.error(e);
    }
  };

  return(
    <Page>
      <Container>
        <Title>Pagos</Title>
        <Counter>Total saldo: {total}€</Counter>
        <Table>
          <thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Rol</Th>
              <Th>Saldo</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={`${r.user_id}-${r.rol}`}>
                <Td>{r.user_id}</Td>
                <Td>{r.rol}</Td>
                <Td>{r.saldo}€</Td>
                <Td>
                  <PrimaryButton onClick={() => handleLiquidar(r.user_id, r.rol)}>
                    Mandar factura
                  </PrimaryButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </Page>
  );
}

