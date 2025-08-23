import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { TextInput, SelectInput, PrimaryButton, DangerButton } from '../../../components/FormElements';
import { auth, db } from '../../../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useChild } from '../../../ChildContext';
import { useAuth } from '../../../AuthContext';
import { Overlay, Modal, ModalText, ModalActions, ModalButton } from '../../../components/ModalStyles';
import { fetchCursos, registerAlumno } from '../../../utils/api';

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
  padding: 1.5rem;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;


export default function MisAlumnos() {
  const { childList, setChildList, setSelectedChild } = useChild();
  const { userData } = useAuth();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [date, setDate] = useState('');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [phone, setPhone] = useState('');
  const [phoneConfirm, setPhoneConfirm] = useState('');
  const [ownPhone, setOwnPhone] = useState(false);
  const [nif, setNif] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [barrio, setBarrio] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [childToDelete, setChildToDelete] = useState(null);

  useEffect(() => {
    fetchCursos().then(setCourses).catch(console.error);
  }, []);

  const addChild = async () => {
    if (
      !name ||
      !lastName ||
      !gender ||
      !date ||
        !courseId ||
        (ownPhone && (!phone || phone !== phoneConfirm)) ||
        !nif ||
        !address ||
        !district ||
        !city ||
        saving
      ) return;
    setSaving(true);
    try {
        await registerAlumno({
          tutor_email: userData?.email || auth.currentUser.email,
          alumno: {
            nombre: name,
            apellidos: lastName,
            direccion: address,
            NIF: nif,
            telefono: ownPhone ? phone : null,
            telefonoConfirm: ownPhone ? phoneConfirm : null,
            genero: gender,
            id_curso: courseId,
            distrito: district,
            barrio,
            codigo_postal: postalCode,
            ciudad: city,
          }
        });

      const courseName = courses.find(c => c.id_curso === parseInt(courseId))?.curso || '';
        const finalPhone = ownPhone ? phone : userData?.telefono || '';
        const nuevo = {
          id: Date.now().toString(),
          nombre: name,
          apellidos: lastName,
          genero: gender,
          fechaNacimiento: date,
          curso: courseName,
          telefono: finalPhone,
          NIF: nif,
          direccion: address,
          distrito: district,
          barrio,
          codigo_postal: postalCode,
          ciudad: city,
          photoURL: userData?.photoURL || auth.currentUser.photoURL || ''
        };
      const nuevos = [...childList, nuevo];
      await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { alumnos: nuevos });
      setChildList(nuevos.filter(c => !c.disabled));
      setSelectedChild(nuevo);
      setName('');
      setLastName('');
      setGender('');
      setDate('');
      setCourseId('');
      setPhone('');
      setPhoneConfirm('');
      setOwnPhone(false);
      setNif('');
      setAddress('');
      setDistrict('');
      setCity('');
      setBarrio('');
      setPostalCode('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const removeChild = async child => {
    const nuevos = childList.map(c =>
      c.id === child.id ? { ...c, disabled: true } : c
    );
    await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { alumnos: nuevos });
    const activos = nuevos.filter(c => !c.disabled);
    setChildList(activos);
    setSelectedChild(activos[0] || null);
  };

  return (
    <Page>
      <Container>
        <Title>Alumnos</Title>
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
                    ? 'Deberás añadir un alumno antes de eliminar el último que tienes'
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
          <h3 style={{ gridColumn: '1 / -1', margin: 0 }}>Añadir alumno</h3>
          <TextInput
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <TextInput
            type="text"
            placeholder="Apellidos"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
          <SelectInput value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">Género</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </SelectInput>
          <TextInput
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <SelectInput value={courseId} onChange={e => setCourseId(e.target.value)}>
            <option value="">Selecciona curso</option>
            {courses.map(c => (
              <option key={c.id_curso} value={c.id_curso}>{c.curso}</option>
            ))}
          </SelectInput>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={ownPhone}
              onChange={e => {
                setOwnPhone(e.target.checked);
                if (!e.target.checked) {
                  setPhone('');
                  setPhoneConfirm('');
                }
              }}
              style={{ marginRight: '0.5rem' }}
            />
            Número propio
          </label>
          {ownPhone && (
            <>
              <TextInput
                type="tel"
                placeholder="Teléfono"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <TextInput
                type="tel"
                placeholder="Repite teléfono"
                value={phoneConfirm}
                onChange={e => setPhoneConfirm(e.target.value)}
              />
            </>
          )}
          <TextInput
            type="text"
            placeholder="NIF"
            value={nif}
            onChange={e => setNif(e.target.value)}
          />
          <TextInput
            type="text"
            placeholder="Dirección"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          <TextInput
            type="text"
            placeholder="Distrito"
            value={district}
            onChange={e => setDistrict(e.target.value)}
          />
          <TextInput
            type="text"
            placeholder="Barrio (opcional)"
            value={barrio}
            onChange={e => setBarrio(e.target.value)}
          />
          <TextInput
            type="text"
            placeholder="Código postal (opcional)"
            value={postalCode}
            onChange={e => setPostalCode(e.target.value)}
          />
          <TextInput
            type="text"
            placeholder="Ciudad"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <PrimaryButton
            onClick={addChild}
            disabled={saving}
            style={{ gridColumn: '1 / -1' }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </PrimaryButton>
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
