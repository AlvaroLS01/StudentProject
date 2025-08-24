import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import ToggleSwitch from '../../../components/ToggleSwitch';
import { PrimaryButton } from '../../../components/FormElements';
import { fetchBalances, liquidarBalance } from '../../../utils/api';

const fade = keyframes`from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}`;

const Page = styled.div`
  background:#f7faf9;
  min-height:100vh;
  padding:2rem;
`;

const Container = styled.div`
  max-width:800px;
  margin:auto;
  animation:${fade} 0.4s ease-out;
`;

const Title = styled.h1`
  text-align:center;
  color:#034640;
  margin-bottom:2rem;
`;

const Counter = styled.p`
  text-align:center;
  color:#046654;
  margin-top:-1rem;
  margin-bottom:1rem;
  font-weight:500;
`;

const List = styled.ul`
  list-style:none;
  padding:0;
  margin:0;
`;

const Item = styled.li`
  display:flex;
  justify-content:space-between;
  align-items:center;
  background:#fff;
  border-radius:8px;
  padding:0.75rem 1rem;
  margin-bottom:0.75rem;
  box-shadow:0 4px 12px rgba(0,0,0,0.05);
`;

const User = styled.span`
  color:#034640;
  font-weight:500;
`;

const Amount = styled.span`
  margin-right:1rem;
`;

export default function Pagos(){
  const [role,setRole]=useState('tutor');
  const [rows,setRows]=useState([]);
  const [total,setTotal]=useState(0);

  useEffect(()=>{
    (async()=>{
      try{
        const data=await fetchBalances(role);
        setRows(data);
        setTotal(data.reduce((a,b)=>a+Number(b.saldo||0),0));
      }catch(e){
        console.error(e);
      }
    })();
  },[role]);

  const handleLiquidar=async(id)=>{
    try{
      const email = role==='tutor'?id:undefined;
      await liquidarBalance(id, role, email);
      setRows(r=>{
        const updated=r.map(x=>x.user_id===id?{...x,saldo:0}:x);
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
        <ToggleSwitch
          leftLabel="Tutores"
          rightLabel="Profesores"
          value={role==='tutor'?'left':'right'}
          onChange={val=>setRole(val==='left'?'tutor':'profesor')}
        />
        <Counter>Total saldo: {total}€</Counter>
        <List>
          {rows.map(r=> (
            <Item key={r.user_id}>
              <User>{r.user_id}</User>
              <Amount>{r.saldo}€</Amount>
              <PrimaryButton onClick={()=>handleLiquidar(r.user_id)}>Mandar factura</PrimaryButton>
            </Item>
          ))}
        </List>
      </Container>
    </Page>
  );
}

