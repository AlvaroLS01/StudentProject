// src/components/Alta.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { PrimaryLink } from '../components/FormElements';
import alumnosImg from '../assets/alumnos.jpg';
import profesoresImg from '../assets/profesores.png';

// Animación del título
const slideFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Section = styled.section`
  max-width: 1200px;
  margin: 3rem auto;
  padding: 0 1rem;
`;

const Title = styled.h2`
  text-align: center;
  color: #034640;
  font-size: 2.25rem;
  margin-bottom: 2.5rem;
  opacity: 0;
  animation: ${slideFadeIn} 0.8s ease-out forwards;
`;

const CardsContainer = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Card = styled.div`
  flex: 1;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  }
`;

const ImageWrapper = styled.div`
  padding: 1.5rem 1.5rem 0;
  background: #fff;
`;

const CardImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
  object-position: center 30%; /* centra horizontalmente y desplaza el foco al 30% superior */
  border-radius: 8px;
  display: block;
`;

const CardContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CardTitle = styled.h3`
  color: #014F40;
  font-size: 1.6rem;
  margin-bottom: 0.75rem;
`;

const CardDesc = styled.p`
  color: #034640;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex: 1;
`;

const CardButton = styled(PrimaryLink).attrs({ accent: true })`
  padding: 0.85rem 1.75rem;
  font-size: 1rem;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const Alta = () => (
  <Section>
    <Title>Primeros pasos con StudentProject</Title>
    <CardsContainer>
      <Card>
        <ImageWrapper>
          <CardImage src={alumnosImg} alt="Padres e hijos aprendiendo" />
        </ImageWrapper>
        <CardContent>
          <CardTitle>Registra a tu hijo para empezar</CardTitle>
          <CardDesc>
            Crea tu cuenta de tutor y te ayudaremos a encontrar al profesor ideal para tu hijo.
          </CardDesc>
          <CardButton to="/alta-padre">
            Soy tutor
          </CardButton>
        </CardContent>
      </Card>

      <Card>
        <ImageWrapper>
          <CardImage src={profesoresImg} alt="Profesor explicando en vídeo" />
        </ImageWrapper>
        <CardContent>
          <CardTitle>Únete a nuestra red de docentes</CardTitle>
          <CardDesc>
            Si la enseñanza es tu pasión, regístrate y te guiaremos paso a paso para incorporarte a nuestra comunidad internacional.
          </CardDesc>
          <CardButton to="/alta-profesor">
            Regístrate como docente
          </CardButton>
        </CardContent>
      </Card>
    </CardsContainer>
  </Section>
);

export default Alta;
