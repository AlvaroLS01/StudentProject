import React from 'react';
import styled, { keyframes } from 'styled-components';
import rocket from '../assets/rocket-and-space-travel6a67.jpg';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Hero = styled.section`
  width: 100%;
  height: 50vh;
  background: url(${rocket}) center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: relative;
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
  }
`;

const HeroTitle = styled.h1`
  position: relative;
  z-index: 1;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  text-align: center;
  animation: ${fadeIn} 0.8s ease-out;
`;

const Section = styled.section`
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
  animation: ${fadeIn} 1s ease-out;
`;

const Paragraph = styled.p`
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  line-height: 1.6;
  margin-bottom: 1rem;
`;

export default function QuienesSomos() {
  return (
    <>
      <Hero>
        <HeroTitle>Conoce Student Project</HeroTitle>
      </Hero>
      <Section>
        <Paragraph>
          Somos un equipo apasionado que conecta alumnos con profesores cualificados.
          Nuestro objetivo es impulsar el aprendizaje personalizado con la tecnología
          como aliada.
        </Paragraph>
        <Paragraph>
          Trabajamos día a día para ofrecerte una experiencia flexible, sencilla y
          efectiva, manteniendo siempre el caracter cercano que nos identifica.
        </Paragraph>
      </Section>
    </>
  );
}
