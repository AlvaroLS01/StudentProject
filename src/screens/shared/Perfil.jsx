// src/screens/shared/Perfil.jsx
import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useParams } from 'react-router-dom';
import { auth, db, storage } from '../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import cameraIcon from '../../assets/icons/camara.png';
import { getProgressData, getRoleTitle, levelThresholds } from '../../utils/levels';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useChild } from '../../ChildContext';

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

const ChildList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ChildItem = styled.li`
  display: flex;
  align-items: center;
  background: #f7faf9;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
`;

const ChildImg = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
`;

const AddChildForm = styled.div`
  margin-top: 1rem;
  background: #f7faf9;
  padding: 1rem;
  border-radius: 8px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const PhotoWrapper = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background: #e2e8f0;
  flex-shrink: 0;
  position: relative;
`;

const Photo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const PhotoLabel = styled.label`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

const CameraOverlay = styled.img`
  width: 40px;
  height: 40px;
  opacity: ${({ hasPhoto }) => (hasPhoto ? 1 : 0.7)};
  filter: ${({ hasPhoto }) => (hasPhoto ? 'invert(1)' : 'none')};
`;

const EditButton = styled.button`
  background: #006D5B;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
  &:hover {
    background: #005047;
  }
`;

const TextInput = styled.input`
  display: block;
  width: 100%;
  padding: 0.4rem 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ProgressWrapper = styled.div`
  margin-bottom: 2rem;
`;

const ProgressLabel = styled.div`
  font-weight: 600;
  color: #014F40;
  margin-bottom: 0.25rem;
`;

const ProgressBarBackground = styled.div`
  width: 100%;
  height: 16px;
  background: #e6e8eb;
  border-radius: 8px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: #02c37e;
  width: ${({ percent }) => percent}%;
  transition: width 0.3s ease;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
`;

const cursosGrouped = [
  {
    group: 'Primaria',
    options: [
      '1º Primaria',
      '2º Primaria',
      '3º Primaria',
      '4º Primaria',
      '5º Primaria',
      '6º Primaria',
    ],
  },
  { group: 'ESO', options: ['1º ESO', '2º ESO', '3º ESO', '4º ESO'] },
  {
    group: 'Bachillerato',
    options: ['1º Bachillerato', '2º Bachillerato'],
  },
];

export default function Perfil() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ telefono: '', ciudad: '' });
  const [role, setRole] = useState(null); // 'alumno' o 'profesor'
  const [unions, setUnions] = useState([]); // todas las uniones del usuario
  const [acceptedClasses, setAcceptedClasses] = useState([]); // solo las clases aceptadas
  const [metrics, setMetrics] = useState({
    totalHoras: 0,
    totalGanado: 0,
    totalClases: 0,
    participantes: 0,
    mediaHoras: 0,
  });
  const [chartData, setChartData] = useState([]); // datos para gráficas mensuales
  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childDate, setChildDate] = useState('');
  const [childCourse, setChildCourse] = useState('');
  const [savingChild, setSavingChild] = useState(false);

  const { setChildList, childList, setSelectedChild } = useChild();

  const isOwnProfile = auth.currentUser && auth.currentUser.uid === userId;
  const progressInfo = getProgressData(metrics.totalClases);
  const levelName = getRoleTitle(role, progressInfo.level);

  const handleSave = async () => {
    await updateDoc(doc(db, 'usuarios', userId), {
      telefono: formData.telefono,
      ciudad: formData.ciudad,
    });
    setProfile(p => ({ ...p, telefono: formData.telefono, ciudad: formData.ciudad }));
    setIsEditing(false);
  };

  const handlePhotoChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const storageRef = ref(storage, `perfiles/${userId}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, 'usuarios', userId), { photoURL: url });
    setProfile(p => ({ ...p, photoURL: url }));
  };

  const addChild = async () => {
    if (!childName || !childDate || !childCourse || savingChild || !isOwnProfile) return;
    setSavingChild(true);
    const photoURL = profile.photoURL || '';
    const nuevo = {
      id: Date.now().toString(),
      nombre: childName,
      fechaNacimiento: childDate,
      curso: childCourse,
      photoURL,
    };
    const nuevos = [...(profile.hijos || []), nuevo];
    await updateDoc(doc(db, 'usuarios', userId), { hijos: nuevos });
    setProfile(p => ({ ...p, hijos: nuevos }));
    if (auth.currentUser && auth.currentUser.uid === userId) {
      setChildList(nuevos);
      setSelectedChild(nuevo);
    }
    setChildName('');
    setChildDate('');
    setChildCourse('');
    setShowAddChild(false);
    setSavingChild(false);
  };

  // 1) Cargar datos de perfil y determinar rol/uniones
  useEffect(() => {
    async function fetchData() {
      if (!userId) return;

      const userSnap = await getDoc(doc(db, 'usuarios', userId));
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfile(data);
        setFormData({ telefono: data.telefono || '', ciudad: data.ciudad || '' });
        setRole(data.rol || null);
      }

      // Cargar uniones según rol
      const alumnoQuery = query(
        collection(db, 'clases_union'),
        where('alumnoId', '==', userId)
      );
      const alumnoSnap = await getDocs(alumnoQuery);
      if (!alumnoSnap.empty) {
        setUnions(alumnoSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        return;
      }

      const profQuery = query(
        collection(db, 'clases_union'),
        where('profesorId', '==', userId)
      );
      const profSnap = await getDocs(profQuery);
      if (!profSnap.empty) {
        setUnions(profSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }
    fetchData();
  }, [userId]);

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
        totalGanado: 0,
        totalClases: 0,
        participantes: 0,
        mediaHoras: 0,
      });
      setChartData([]);
      return;
    }

    // Horas totales y número de clases
    const totalHoras = acceptedClasses.reduce(
      (acc, c) => acc + (c.duracion || 0),
      0
    );
    const totalClases = acceptedClasses.length;

    // Ganancias para los profesores
    const totalGanado =
      role === 'profesor'
        ? acceptedClasses.reduce(
            (acc, c) => acc + (c.precioTotalProfesor || 0),
            0
          )
        : 0;

    // Número de alumnos o profesores distintos
    const partes = new Set();
    acceptedClasses.forEach((c) => {
      const u = unions.find((un) => un.id === c.unionId);
      if (!u) return;
      partes.add(role === 'profesor' ? u.alumnoId : u.profesorId);
    });
    const participantes = partes.size;

    const mediaHoras = totalClases ? totalHoras / totalClases : 0;

    setMetrics({
      totalHoras,
      totalGanado,
      totalClases,
      participantes,
      mediaHoras,
    });

    // Datos para las gráficas
    let agrupado = {};
    if (role === 'profesor') {
      acceptedClasses.forEach((c) => {
        const mes = c.fecha.slice(0, 7); // YYYY-MM
        if (!agrupado[mes]) agrupado[mes] = { mes, horas: 0, ganado: 0 };
        agrupado[mes].horas += c.duracion || 0;
        agrupado[mes].ganado += c.precioTotalProfesor || 0;
      });
      const dataGrafico = Object.values(agrupado).sort((a, b) => {
        return (
          new Date(a.mes + '-01').getTime() -
          new Date(b.mes + '-01').getTime()
        );
      });
      setChartData(dataGrafico);
    } else {
      acceptedClasses.forEach((c) => {
        const u = unions.find((un) => un.id === c.unionId);
        const prof = u?.profesorNombre || 'Profesor';
        if (!agrupado[prof]) agrupado[prof] = { profesor: prof, horas: 0 };
        agrupado[prof].horas += c.duracion || 0;
      });
      const dataGrafico = Object.values(agrupado).sort((a, b) => b.horas - a.horas);
      setChartData(dataGrafico);
    }
  }, [acceptedClasses, role, unions]);

  if (!profile) {
    return (
      <Page>
        <Container>
          <Title>Perfil</Title>
          <p style={{ textAlign: 'center', color: '#666' }}>
            No se encontró el perfil solicitado.
          </p>
        </Container>
      </Page>
    );
  }

  return (
    <Page>
      <Container>
        <Title>{profile.nombre} {profile.apellido}</Title>

        <ProfileHeader>
          <PhotoWrapper>
            {profile.photoURL ? (
              <Photo src={profile.photoURL} alt="Foto" />
            ) : (
              (!isOwnProfile || !isEditing) && (
                <CameraOverlay src={cameraIcon} hasPhoto={false} />
              )
            )}
            {isOwnProfile && isEditing && (
              <>
                <HiddenFileInput
                  id="photo-input"
                  type="file"
                  onChange={handlePhotoChange}
                />
                <PhotoLabel htmlFor="photo-input">
                  <CameraOverlay
                    src={cameraIcon}
                    hasPhoto={!!profile.photoURL}
                  />
                </PhotoLabel>
              </>
            )}
          </PhotoWrapper>
          <div>
            <h2>
              {profile.nombre} {profile.apellido}
            </h2>
            <p>{profile.email}</p>
            {isEditing ? (
              <>
                <TextInput
                  value={formData.telefono}
                  onChange={e =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="Teléfono"
                />
                <TextInput
                  value={formData.ciudad}
                  onChange={e =>
                    setFormData({ ...formData, ciudad: e.target.value })
                  }
                  placeholder="Ciudad"
                />
                <EditButton onClick={handleSave}>Guardar</EditButton>
              </>
            ) : (
              <>
                <p>Teléfono: {profile.telefono || '-'}</p>
                <p>Ciudad: {profile.ciudad || '-'}</p>
                {isOwnProfile && (
                  <EditButton onClick={() => setIsEditing(true)}>
                    Editar datos
                  </EditButton>
                )}
              </>
            )}
          </div>
        </ProfileHeader>

        {profile.rol === 'padre' && (
          <Section>
            <h2 style={{ textAlign: 'center', color: '#024837' }}>Hijos</h2>
            {(profile.hijos || []).length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>Aún no hay hijos registrados.</p>
            ) : (
              <ChildList>
                {profile.hijos.map(h => (
                  <ChildItem key={h.id}>
                    {h.photoURL && <ChildImg src={h.photoURL} alt="foto" />}
                    <div>
                      <div>{h.nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: '#555' }}>{h.fechaNacimiento}</div>
                    </div>
                  </ChildItem>
                ))}
              </ChildList>
            )}

            {isOwnProfile && (
              <>
                {!showAddChild && (
                  <EditButton onClick={() => setShowAddChild(true)}>Añadir hijo</EditButton>
                )}
                {showAddChild && (
                  <AddChildForm>
                    <div>
                      <input type="text" placeholder="Nombre" value={childName} onChange={e => setChildName(e.target.value)} />
                    </div>
                    <div>
                      <input type="date" value={childDate} onChange={e => setChildDate(e.target.value)} />
                    </div>
                    <div>
                      <select value={childCourse} onChange={e => setChildCourse(e.target.value)}>
                        <option value="">Selecciona curso</option>
                        {cursosGrouped.map(({ group, options }) => (
                          <optgroup key={group} label={group}>
                            {options.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <EditButton onClick={addChild} disabled={savingChild}>Guardar</EditButton>
                  </AddChildForm>
                )}
              </>
            )}
          </Section>
        )}

        <ProgressWrapper>
          <ProgressLabel>
            Nivel {progressInfo.level} - {levelName}
          </ProgressLabel>
          <ProgressBarBackground>
            <ProgressBarFill percent={progressInfo.progress} />
          </ProgressBarBackground>
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
            {metrics.totalClases}/{levelThresholds[levelThresholds.length - 1]} clases
          </div>
        </ProgressWrapper>

        {/* Métricas generales */}
        <Section>
          <MetricsGrid>
            <Card>
              <CardLabel>Total de horas</CardLabel>
              <CardValue>{metrics.totalHoras.toFixed(1)}h</CardValue>
            </Card>
            {role === 'profesor' && (
              <>
                <Card>
                  <CardLabel>Ingresos totales</CardLabel>
                  <CardValue>€{metrics.totalGanado.toFixed(2)}</CardValue>
                </Card>
                <Card>
                  <CardLabel>Clases impartidas</CardLabel>
                  <CardValue>{metrics.totalClases}</CardValue>
                </Card>
                <Card>
                  <CardLabel>Alumnos distintos</CardLabel>
                  <CardValue>{metrics.participantes}</CardValue>
                </Card>
              </>
            )}
            {role === 'alumno' && (
              <>
                <Card>
                  <CardLabel>Clases recibidas</CardLabel>
                  <CardValue>{metrics.totalClases}</CardValue>
                </Card>
                <Card>
                  <CardLabel>Profesores distintos</CardLabel>
                  <CardValue>{metrics.participantes}</CardValue>
                </Card>
                <Card>
                  <CardLabel>Promedio h/clase</CardLabel>
                  <CardValue>{metrics.mediaHoras.toFixed(1)}h</CardValue>
                </Card>
              </>
            )}
          </MetricsGrid>
        </Section>

        {/* Gráficas */}
        <Section>
          <h2 style={{ textAlign: 'center', color: '#024837' }}>
            {role === 'profesor' ? 'Evolución mensual' : 'Horas por profesor'}
          </h2>
          <ChartContainer>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis
                  dataKey={role === 'profesor' ? 'mes' : 'profesor'}
                  stroke="#014F40"
                />
                <YAxis stroke="#014F40" />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="horas" name="Horas" fill="#006D5B" />
                {role === 'profesor' && (
                  <Bar dataKey="ganado" name="€ Ganado" fill="#2c7a7b" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>

      </Container>
    </Page>
  );
}
