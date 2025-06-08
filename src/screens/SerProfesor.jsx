import React from 'react';
import styled, { keyframes } from 'styled-components';
import teacher from '../assets/profesores.png';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrapper = styled.section`
  max-width: 960px;
  margin: 2rem auto;
  padding: 0 1rem;
  animation: ${fadeIn} 0.8s ease-out;
`;

const Title = styled.h1`
  text-align: center;
  color: ${({ theme }) => theme.colors.heading};
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  margin-bottom: 1rem;
`;

const Img = styled.img`
  width: 100%;
  border-radius: 12px;
  margin: 1rem 0 2rem;
`;

const Paragraph = styled.p`
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  line-height: 1.6;
  margin-bottom: 1rem;
`;

export default function SerProfesor() {
  return (
    <Wrapper>
      <Title>Comparte tu conocimiento</Title>
      <Img src={teacher} alt="Profesor explicando" />
      <Paragraph>
        Si la enseñanza es tu vocación, en Student Project encontrarás un lugar donde crecer.
        Nuestro equipo te guiará para que puedas ofrecer clases de forma cómoda y segura.
      </Paragraph>
      <Paragraph>
        Regístrate y forma parte de una comunidad que apuesta por la educación de calidad.
      </Paragraph>
    </Wrapper>
  );
}
