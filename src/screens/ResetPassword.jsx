import React, { useState } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { resetPassword } from '../utils/password';
import logo from '../assets/logo-fondo.jpg';

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: #004640;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 6rem 2rem 2rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 360px;
  text-align: center;
`;

const LogoImg = styled.img`
  width: 300px;
  height: auto;
  display: block;
  margin: 0 auto 2rem;
`;

const Title = styled.h1`
  color: #ffffff;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const ErrorText = styled.p`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const SuccessText = styled.p`
  color: #02b36e;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
`;

const Button = styled.button`
  background-color: #ccf3e5;
  color: #004640;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.5rem;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password1 !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!token) {
      setError('Token inválido');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, password: password1 });
      setSuccess('Contraseña actualizada. Ya puedes iniciar sesión.');
      setPassword1('');
      setPassword2('');
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Card>
        <LogoImg src={logo} alt="Student Project" />
        <Title>Nueva contraseña</Title>
        {error && <ErrorText>{error}</ErrorText>}
        {success && <SuccessText>{success}</SuccessText>}
        <Form onSubmit={handleSubmit}>
          <Input
            type="password"
            placeholder="Nueva contraseña"
            value={password1}
            onChange={e => setPassword1(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Repite la contraseña"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </Form>
      </Card>
    </PageWrapper>
  );
}
