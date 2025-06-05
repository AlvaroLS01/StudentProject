// src/screens/shared/Perfil.jsx
import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { auth, db } from '../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Animación de fade-in
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  padding: 2rem;
  background: #eef6f5;
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 900px;
  margin: auto;
  animation: ${fadeIn} 0.4s ease-out;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  padding: 2rem;
`;

const Title = styled.h1`
  text-align: center;
  color: #034640;
  margin-bottom: 1.5rem;
  font-size: 2.5rem;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const Card = styled.div`
  background: #f7faf9;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  text-align: center;
`;

const CardLabel = styled.div`
  font-weight: 600;
  color: #014F40;
  margin-bottom: 0.5rem;
`;

const CardValue = styled.div`
  font-size: 1.75rem;
  color: #006D5B;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
`;

export default function Perfil() {
  const [role, setRole] = useState(null); // 'alumno' o 'profesor'
  const [unions, setUnions] = useState([]); // todas las uniones del usuario
  const [acceptedClasses, setAcceptedClasses] = useState([]); // solo las clases aceptadas
  const [metrics, setMetrics] = useState({
    totalHoras: 0,
    totalFacturado: 0,
    totalGastado: 0,
    totalGanado: 0,
  });
  const [chartData, setChartData] = useState([]); // datos para gráficas mensuales

  // 1) Determinar rol y cargar uniones
  useEffect(() => {
    async function fetchUnions() {
      const user = auth.currentUser;
      if (!user) return;

      // Verificar si es alumno
      const qAlumno = query(
        collection(db, 'clases_union'),
        where('alumnoId', '==', user.uid)
      );
      const snapAlumno = await getDocs(qAlumno);
      if (!snapAlumno.empty) {
        setRole('alumno');
        setUnions(snapAlumno.docs.map((d) => ({ id: d.id, ...d.data() })));
        return;
      }

      // Si no es alumno, verificar si es profesor
      const qProfesor = query(
        collection(db, 'clases_union'),
        where('profesorId', '==', user.uid)
      );
      const snapProfesor = await getDocs(qProfesor);
      if (!snapProfesor.empty) {
        setRole('profesor');
        setUnions(snapProfesor.docs.map((d) => ({ id: d.id, ...d.data() })));
        return;
      }

      // Si no pertenece a ninguna unión
      setRole(null);
      setUnions([]);
    }
    fetchUnions();
  }, []);

  // 2) Suscribirse a “clases_asignadas” aceptadas de cada unión
  useEffect(() => {
    if (!unions.length) {
      setAcceptedClasses([]);
      return;
    }

    const unsubObservers = unions.map((u) => {
      const q = query(
        collection(db, 'clases_union', u.id, 'clases_asignadas'),
        where('estado', '==', 'aceptada')
      );
      return onSnapshot(q, (snap) => {
        const clases = snap.docs.map((d) => ({
          id: d.id,
          unionId: u.id,
          ...d.data(),
        }));
        setAcceptedClasses((prev) => {
          // Reemplazar todas las clases de esta unión
          const restantes = prev.filter((cc) => cc.unionId !== u.id);
          return [...restantes, ...clases];
        });
      });
    });

    return () => {
      unsubObservers.forEach((unsub) => unsub());
      setAcceptedClasses([]);
    };
  }, [unions]);

  // 3) Calcular métricas y datos de gráfico cuando cambian acceptedClasses o role
  useEffect(() => {
    if (!acceptedClasses.length) {
      setMetrics({
        totalHoras: 0,
        totalFacturado: 0,
        totalGastado: 0,
        totalGanado: 0,
      });
      setChartData([]);
      return;
    }

    // 3.1) Total de horas
    const totalHoras = acceptedClasses.reduce(
      (acc, c) => acc + (c.duracion || 0),
      0
    );

    // 3.2) Total facturado (sumar precioTotal)
    const totalFacturado = acceptedClasses.reduce(
      (acc, c) => acc + (c.precioTotal || 0),
      0
    );

    // 3.3) Gasto de alumno vs Ganancia de profesor
    const totalGastado =
      role === 'alumno'
        ? acceptedClasses.reduce(
            (acc, c) => acc + (c.precioTotal || 0),
            0
          )
        : 0;
    const totalGanado =
      role === 'profesor'
        ? acceptedClasses.reduce(
            (acc, c) => acc + (c.precioTotal || 0),
            0
          )
        : 0;

    setMetrics({ totalHoras, totalFacturado, totalGastado, totalGanado });

    // 3.4) Agrupar por mes para gráfico
    const agrupado = {};
    acceptedClasses.forEach((c) => {
      const mes = c.fecha.slice(0, 7); // "YYYY-MM"
      if (!agrupado[mes]) agrupado[mes] = { mes, horas: 0, facturado: 0 };
      agrupado[mes].horas += c.duracion || 0;
      agrupado[mes].facturado += c.precioTotal || 0;
    });
    const dataGrafico = Object.values(agrupado).sort((a, b) => {
      return (
        new Date(a.mes + '-01').getTime() -
        new Date(b.mes + '-01').getTime()
      );
    });
    setChartData(dataGrafico);
  }, [acceptedClasses, role]);

  if (role === null) {
    return (
      <Page>
        <Container>
          <Title>Perfil</Title>
          <p style={{ textAlign: 'center', color: '#666' }}>
            No tienes un perfil asociado, o no perteneces a ninguna unión activa.
          </p>
        </Container>
      </Page>
    );
  }

  return (
    <Page>
      <Container>
        <Title>Mi Perfil ({role === 'alumno' ? 'Alumno' : 'Profesor'})</Title>

        {/* Métricas generales */}
        <Section>
          <MetricsGrid>
            <Card>
              <CardLabel>Total de horas</CardLabel>
              <CardValue>{metrics.totalHoras.toFixed(1)}h</CardValue>
            </Card>
            <Card>
              <CardLabel>Total facturado</CardLabel>
              <CardValue>€{metrics.totalFacturado.toFixed(2)}</CardValue>
            </Card>
            {role === 'alumno' && (
              <Card>
                <CardLabel>Total gastado</CardLabel>
                <CardValue>€{metrics.totalGastado.toFixed(2)}</CardValue>
              </Card>
            )}
            {role === 'profesor' && (
              <Card>
                <CardLabel>Total ganado</CardLabel>
                <CardValue>€{metrics.totalGanado.toFixed(2)}</CardValue>
              </Card>
            )}
          </MetricsGrid>
        </Section>

        {/* Gráfica mensual */}
        <Section>
          <h2 style={{ textAlign: 'center', color: '#024837' }}>
            Evolución mensual
          </h2>
          <ChartContainer>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="mes" stroke="#014F40" />
                <YAxis stroke="#014F40" />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="horas" name="Horas" fill="#006D5B" />
                <Bar dataKey="facturado" name="€ Facturado" fill="#2c7a7b" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>
      </Container>
    </Page>
  );
}
