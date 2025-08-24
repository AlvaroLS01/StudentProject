import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { PrimaryButton } from '../../../components/FormElements';
import { fetchBalances, liquidarBalance } from '../../../utils/api';
import { db } from '../../../firebase/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

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
const SectionTitle = styled.h2`
  margin-top:1.5rem;
  color:#034640;
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

export default function Pagos() {
  const [tutores, setTutores] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [total, setTotal] = useState(0);

  // Helper to obtain the Firestore profile name/id
  async function fetchProfile(userId) {
    let profileId = userId;
    let nombre = userId;
    try {
      const ref = doc(db, 'usuarios', userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        nombre = `${data.nombre || ''} ${data.apellidos || data.apellido || ''}`.trim();
        profileId = snap.id;
      } else {
        const q = query(collection(db, 'usuarios'), where('email', '==', userId));
        const qsnap = await getDocs(q);
        if (!qsnap.empty) {
          const d = qsnap.docs[0];
          const data = d.data();
          nombre = `${data.nombre || ''} ${data.apellidos || data.apellido || ''}`.trim();
          profileId = d.id;
        }
      }
    } catch (err) {
      console.error('Error obteniendo perfil', err);
    }
    return { nombre, profileId };
  }

  useEffect(() => {
    (async () => {
      try {
        const [balTutores, balProfes] = await Promise.all([
          fetchBalances('tutor'),
          fetchBalances('profesor'),
        ]);

        const load = async (rows) =>
          Promise.all(
            rows.map(async (r) => {
              const { nombre, profileId } = await fetchProfile(r.user_id);
              return { ...r, nombre, profileId };
            })
          );

        const tutoresData = await load(balTutores);
        const profesoresData = await load(balProfes);

        setTutores(tutoresData);
        setProfesores(profesoresData);
        setTotal(
          tutoresData.reduce(
            (a, b) => a - Math.abs(Number(b.saldo) || 0),
            0
          ) +
            profesoresData.reduce(
              (a, b) => a + Math.abs(Number(b.saldo) || 0),
              0
            )
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const updateTotal = (ts, ps) => {
    setTotal(
      ts.reduce((a, b) => a - Math.abs(Number(b.saldo) || 0), 0) +
        ps.reduce((a, b) => a + Math.abs(Number(b.saldo) || 0), 0)
    );
  };

  const handleLiquidar = async (id, rol) => {
    try {
      const email = rol === 'tutor' ? id : undefined;
      await liquidarBalance(id, rol, email);
      if (rol === 'tutor') {
        setTutores((prev) => {
          const updated = prev.map((x) =>
            x.user_id === id ? { ...x, saldo: 0 } : x
          );
          updateTotal(updated, profesores);
          return updated;
        });
      } else {
        setProfesores((prev) => {
          const updated = prev.map((x) =>
            x.user_id === id ? { ...x, saldo: 0 } : x
          );
          updateTotal(tutores, updated);
          return updated;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderRows = (rows, rol) => (
    <Table>
      <thead>
        <tr>
          <Th>Usuario</Th>
          <Th>Saldo</Th>
          <Th></Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={`${r.user_id}-${rol}`}>
            <Td>
              <a href={`/perfil/${r.profileId}`}>{r.nombre}</a>
            </Td>
            <Td>
              {
                rol === 'tutor'
                  ? -Math.abs(Number(r.saldo) || 0)
                  : Math.abs(Number(r.saldo) || 0)
              }
              €
            </Td>
            <Td>
              <PrimaryButton onClick={() => handleLiquidar(r.user_id, rol)}>
                Mandar factura
              </PrimaryButton>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <Page>
      <Container>
        <Title>Pagos</Title>
        <Counter>Beneficio total: {Math.abs(total)}€</Counter>
        {tutores.length > 0 && (
          <>
            <SectionTitle>Tutores</SectionTitle>
            {renderRows(tutores, 'tutor')}
          </>
        )}
        {profesores.length > 0 && (
          <>
            <SectionTitle>Profesores</SectionTitle>
            {renderRows(profesores, 'profesor')}
          </>
        )}
      </Container>
    </Page>
  );
}

