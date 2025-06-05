// src/components/ReservaClase.jsx

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import personas from '../assets/personas.jpg';
import escribiendo from '../assets/escribiendo.jpg';

/* ========== Animaciones ========== */
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const slideUp = keyframes`
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

/* ===== Styled Components ===== */
const Section = styled.section`
  width: 100%;
  margin-top: 5px;            /* empieza más arriba */
  padding: 1rem 1rem;
  text-align: center;
  opacity: 0;
  animation: ${fadeIn} 1.2s ease-out forwards;
`;

const Title = styled.h1`
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  color: #2d4149;
  margin-bottom: 0.5rem;
  font-weight: 700;
  opacity: 0;
  animation: ${slideUp} 1s ease-out forwards;
`;

const Description = styled.p`
  max-width: 700px;
  margin: 0 auto 2rem;
  font-size: clamp(0.9rem, 2vw, 1rem);
  color: #2d4149;
  line-height: 1.5;
  strong { font-weight: 700; }
  opacity: 0;
  animation: ${slideUp} 1s ease-out 0.2s forwards;
`;

const CardsWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: ${slideUp} 1s ease-out 0.4s forwards;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Card = styled.div`
  background-color: ${p => (p.dark ? '#2e3f46' : '#ccf3e5')};
  color: ${p => (p.dark ? '#ccf3e5' : '#2e3f46')};
  border-radius: 1rem;
  padding: 2rem 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  flex: ${p => (p.featured ? '1.4 1 0' : '1 1 0')};
  max-width: ${p => (p.featured ? '360px' : '280px')};
`;

const StepNumber = styled.span`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  margin: 0.5rem 0 1rem;
  font-weight: 700;
`;

const CardText = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  flex-grow: 1;
`;

const ReserveButton = styled(Link)`
  display: inline-block;
  background-color: #014f40;
  color: #ffffff;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: none;
  margin-top: 1rem;
  opacity: 0;
  animation: ${slideUp} 1s ease-out 0.6s forwards;

  &:hover {
    background-color: #02332a;
  }
`;

const VideoSection = styled.section`
  width: 80%;
  max-width: 600px;
  margin: 3rem auto;
  display: flex;
  justify-content: center;
  opacity: 0;
  animation: ${fadeIn} 1.2s ease-out 0.8s forwards;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 */
  iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    border: none;
  }
`;

const InfoSection = styled.section`
  width: 90%;
  max-width: 600px;
  margin: 2.5rem auto 1rem; /* menos espacio abajo */
  text-align: center;
  opacity: 0;
  animation: ${slideUp} 1s ease-out 1s forwards;
`;

const InfoTitle = styled.h2`
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  color: #2d4149;
  margin-bottom: 0.75rem;
`;

const InfoSub = styled.p`
  font-size: clamp(0.875rem, 2vw, 1rem);
  color: #014f40;
  margin-bottom: 1.5rem;
  line-height: 1.4;
`;

const StartButton = styled(Link)`
  display: inline-block;
  background-color: #02c37e;
  color: #ffffff;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  opacity: 0;
  animation: ${slideUp} 1s ease-out 1.2s forwards;

  &:hover {
    background-color: #02b36e;
  }
`;

const ProfSection = styled.section`
  width: 90%;
  max-width: 1000px;
  margin: 1rem auto;          /* empieza más cerca */
  background-color: #046b46;
  border-radius: 16px;
  padding: 3rem 2rem;
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(0,0,0,0.2);
  opacity: 0;
  animation: ${fadeIn} 1.2s ease-out 1.4s forwards;
`;

const ProfTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  margin-bottom: 2rem;
  font-weight: 700;
`;

const ProfGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfImage = styled.img`
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  opacity: 0;
  animation: ${slideUp} 1s ease-out 1.6s forwards;
`;

const ProfCardText = styled.div`
  display: flex;
  flex-direction: column;
  opacity: 0;
  animation: ${slideUp} 1s ease-out 1.6s forwards;
`;

const ProfCardTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const ProfDesc = styled.p`
  font-size: 1rem;
  line-height: 1.6;
`;

const ProfButton = styled(Link)`
  display: block;
  background-color: #ccf3e5;
  color: #014f40;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  margin: 2.5rem auto 0;
  width: fit-content;
  opacity: 0;
  animation: ${slideUp} 1s ease-out 1.8s forwards;

  &:hover {
    background-color: #b2e8d4;
  }
`;

/* ========== Componente ========== */
const ReservaClase = () => (
  <>
    <Section>
      <Title>Reserva tu primera clase</Title>
      <Description>
        Sin importar el día ni la hora, estamos disponibles todo el año.{' '}
        <strong>Cuéntanos qué necesitas y nos encargamos del resto.</strong>{' '}
        Respondemos en menos de 24 h.
      </Description>

      <CardsWrapper>
        <Card>
          <StepNumber>1</StepNumber>
          <CardTitle>¿Qué necesitas?</CardTitle>
          <CardText>
            Haz clic en “Reservar clase” y te contactaremos en menos de 24 h.
          </CardText>
        </Card>

        <Card featured dark>
          <StepNumber>2</StepNumber>
          <CardTitle>Nos ocupamos del resto</CardTitle>
          <CardText>
            Te asignamos al profesor ideal mediante nuestro riguroso proceso de selección.
          </CardText>
        </Card>

        <Card>
          <StepNumber>3</StepNumber>
          <CardTitle>Comienza tu clase</CardTitle>
          <CardText>
            Organiza tu primera sesión y disfruta aprendiendo al máximo.
          </CardText>
        </Card>
      </CardsWrapper>

      <ReserveButton to="/alta-alumno">Reservar clase</ReserveButton>

      <VideoSection>
        <VideoWrapper>
          <iframe
            src="https://www.youtube.com/embed/9gREQk6OF04"
            title="Así funcionamos en Student Project"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </VideoWrapper>
      </VideoSection>

      <InfoSection>
        <InfoTitle>Encuentra al profesor que buscabas</InfoTitle>
        <InfoSub>
          Cuéntanos tus objetivos y te conectamos con el profesor que mejor encaje.
        </InfoSub>
        <StartButton to="/alta">¡Comencemos!</StartButton>
      </InfoSection>
    </Section>

    <ProfSection>
      <ProfTitle>Nuestros Profesores</ProfTitle>

      <ProfGrid>
        <ProfImage src={personas} alt="Profesores colaborando" />

        <ProfCardText>
          <ProfCardTitle>Buscamos la excelencia</ProfCardTitle>
          <ProfDesc>
            Nuestros profesores son estudiantes universitarios altamente cualificados y apasionados por la enseñanza. Combinando su conocimiento académico con habilidades pedagógicas, ofrecemos clases particulares personalizadas que se adaptan a las necesidades individuales de cada alumno.
          </ProfDesc>
        </ProfCardText>

        <ProfCardText>
          <ProfCardTitle>Tu profesor ideal</ProfCardTitle>
          <ProfDesc>
            Encontrar el profesor adecuado es clave para el éxito educativo. Si no conectas o no te sientes cómodo con un profesor, te ofrecemos la flexibilidad de cambiar hasta encontrar el que mejor se adapte a tu estilo de aprendizaje.
          </ProfDesc>
        </ProfCardText>

        <ProfImage src={escribiendo} alt="Manos escribiendo en papel" />
      </ProfGrid>

      <ProfButton to="/contacto">¿Alguna pregunta?</ProfButton>
    </ProfSection>
  </>
);

export default ReservaClase;
