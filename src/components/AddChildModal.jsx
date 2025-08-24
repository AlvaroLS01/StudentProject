import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TextInput, SelectInput, PrimaryButton } from './FormElements';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useChild } from '../ChildContext';
import { useAuth } from '../AuthContext';
import { fetchCursos, fetchCities, registerAlumno } from '../utils/api';
import { Overlay, Modal, ModalTitle } from './ModalStyles';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
`;

const Form = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;


export default function AddChildModal({ open, onClose }) {
  const { childList, setChildList, setSelectedChild } = useChild();
  const { userData } = useAuth();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [cities, setCities] = useState([]);
  const [phone, setPhone] = useState('');
  const [phoneConfirm, setPhoneConfirm] = useState('');
  const [ownPhone, setOwnPhone] = useState(false);
  const [nif, setNif] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCursos().then(setCourses).catch(console.error);
      fetchCities().then(setCities).catch(console.error);
    }
  }, [open]);

  const addChild = async () => {
    if (
      !name ||
      !lastName ||
        !gender ||
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
            ciudad: city,
          }
        });

        const courseName = courses.find(c => c.id_curso === parseInt(courseId))?.nombre || '';
        const finalPhone = ownPhone ? phone : userData?.telefono || '';
        const nuevo = {
          id: Date.now().toString(),
          nombre: name,
          apellidos: lastName,
          genero: gender,
          curso: courseName,
          telefono: finalPhone,
          NIF: nif,
          direccion: address,
          distrito: district,
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
      setCourseId('');
      setPhone('');
      setPhoneConfirm('');
      setOwnPhone(false);
      setNif('');
      setAddress('');
      setDistrict('');
      setCity('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <ModalTitle>Añadir alumno</ModalTitle>
        <Form>
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
          <SelectInput value={courseId} onChange={e => setCourseId(e.target.value)}>
            <option value="">Selecciona curso</option>
              {courses.map(c => (
                <option key={c.id_curso} value={c.id_curso}>{c.nombre}</option>
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
              <PhoneInput
                country={'es'}
                value={phone}
                onChange={value => setPhone(value)}
                inputStyle={{ width: '100%' }}
                placeholder="Teléfono"
              />
              <PhoneInput
                country={'es'}
                value={phoneConfirm}
                onChange={value => setPhoneConfirm(value)}
                inputStyle={{ width: '100%' }}
                placeholder="Repite teléfono"
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
          <SelectInput value={city} onChange={e => setCity(e.target.value)}>
            <option value="">Selecciona ciudad</option>
            {cities.map(c => (
              <option key={c.id_ciudad} value={c.nombre}>{c.nombre}</option>
            ))}
          </SelectInput>
          <PrimaryButton onClick={addChild} disabled={saving} style={{ gridColumn: '1 / -1' }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </PrimaryButton>
        </Form>
      </Modal>
    </Overlay>
  );
}
