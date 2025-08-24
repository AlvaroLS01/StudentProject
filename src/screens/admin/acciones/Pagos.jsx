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
  max-width:800px;
  margin:auto;
  animation:${fade} 0.4s ease-out;
`;

const Title = styled.h1`
  text-align:center;
  color:#034640;
  margin-bottom:2rem;
`;

const Switch = styled.div`
  display:flex;
  justify-content:center;
  gap:1rem;
  margin-bottom:1rem;
  button{
    padding:0.5rem 1rem;
    border:none;
    border-radius:6px;
    cursor:pointer;
    background:#e2e8f0;
  }
  .active{
    background:${({theme})=>theme.colors.secondary};
    color:${({theme})=>theme.colors.primary};
  }
`;

const Table = styled.table`
  width:100%;
  border-collapse:collapse;
  th,td{
    padding:0.5rem;
    border:1px solid #e2e8f0;
    text-align:left;
  }
`;

export default function Pagos(){
  const [role,setRole]=useState('tutor');
  const [rows,setRows]=useState([]);

  useEffect(()=>{
    (async()=>{
      try{
        const data=await fetchBalances(role);
        setRows(data);
      }catch(e){
        console.error(e);
      }
    })();
  },[role]);

  const handleLiquidar=async(id)=>{
    try{
      const email = role==='tutor'?id:undefined;
      await liquidarBalance(id, role, email);
      setRows(r=>r.map(x=>x.user_id===id?{...x,saldo:0}:x));
    }catch(e){
      console.error(e);
    }
  };

  return(
    <Page>
      <Container>
        <Title>Pagos</Title>
        <Switch>
          <button className={role==='tutor'?'active':''} onClick={()=>setRole('tutor')}>Tutores</button>
          <button className={role==='profesor'?'active':''} onClick={()=>setRole('profesor')}>Profesores</button>
        </Switch>
        <Table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Saldo (€)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.user_id}>
                <td>{r.user_id}</td>
                <td>{r.saldo}</td>
                <td><PrimaryButton onClick={()=>handleLiquidar(r.user_id)}>Mandar factura</PrimaryButton></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </Page>
  );
}

