import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { fetchBalances, liquidarBalance } from '../../../utils/api';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const Switch = styled.div`
  margin-bottom: 1rem;
  button {
    margin-right: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    border: 1px solid #ccc;
    padding: 0.5rem;
    text-align: left;
  }
`;

export default function Pagos() {
  const [role, setRole] = useState('tutor');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBalances(role);
        setRows(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [role]);

  const handleLiquidar = async id => {
    try {
      const email = role === 'tutor' ? id : undefined;
      await liquidarBalance(id, role, email);
      setRows(r => r.map(x => x.user_id === id ? { ...x, saldo: 0 } : x));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Container>
      <h2>Pagos</h2>
      <Switch>
        <button disabled={role==='tutor'} onClick={() => setRole('tutor')}>Tutores</button>
        <button disabled={role==='profesor'} onClick={() => setRole('profesor')}>Profesores</button>
      </Switch>
      <Table>
        <thead>
          <tr><th>Usuario</th><th>Saldo (€)</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.user_id}>
              <td>{r.user_id}</td>
              <td>{r.saldo}</td>
              <td><button onClick={() => handleLiquidar(r.user_id)}>Liquidar</button></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
