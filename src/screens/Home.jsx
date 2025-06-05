import React, { useRef, useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import banner from '../assets/banner.jpg';
import personas from '../assets/personas.jpg';
import bolis from '../assets/bolis.jpg';
import chicas from '../assets/chicas.jpg';
import diario from '../assets/diariodesevilla.jpeg';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const slideUp = keyframes`
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Hero = styled.section`
  width: 100%;
  margin-top: 45px;
  background: url(${banner}) no-repeat center center;
  background-size: cover;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 1.2s ease-out;
`;

const TitlesWrapper = styled.div`
  width: 100%;
  padding: 0 2rem;
  text-align: center;
  animation: ${slideUp} 1s ease-out;
`;

const Title = styled.h1`
  font-size: clamp(2rem, 5vw, 3rem);
  color: #2d4149;
  line-height: 1.2;
  margin: 0;
  font-weight: 700;
`;

const TitleAccent = styled.span`
  display: block;
  font-size: clamp(2rem, 5vw, 3rem);
  color: #2d4149;
  margin-top: 0.5rem;
  font-weight: 700;
`;

const Content = styled.div`
  text-align: center;
  max-width: 800px;
  padding: 3rem 2rem;
  animation: ${slideUp} 1.2s ease-out 0.3s;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const Subtitle = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #014f40;
  margin: 2rem 0 3rem;
`;

const Button = styled(Link)`
  display: inline-block;
  background-color: #ccf3e5;
  color: #034640;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 1.125rem;
  text-decoration: none;
  margin-bottom: 1rem;
  transition: background-color 0.3s, transform 0.3s;
  &:hover {
    background-color: #b2e8d4;
    transform: translateY(-4px);
  }
`;

const InfoText = styled.p`
  font-size: 1rem;
  color: #014f40;
  margin: 0;
`;

/* ============ CARD SECTION ============ */
const CardSection = styled.div`
  width: 90%;
  max-width: 1000px;
  margin: 2rem auto;
  background-color: #004640;
  color: white;
  border-radius: 16px;
  padding: 2rem 3rem;
  box-shadow: 0 12px 24px rgba(0,0,0,0.3);
  animation: ${fadeIn} 1.2s ease-out 0.5s;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ColText = styled.div`
  flex: 1 1 45%;
  padding: 0.5rem;
  animation: ${slideUp} 1s ease-out 0.7s;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const ColImage = styled.div`
  flex: 1 1 45%;
  padding: 0.5rem;
  text-align: center;
  animation: ${slideUp} 1s ease-out 0.9s;
  opacity: 0;
  animation-fill-mode: forwards;

  img {
    max-width: 100%;
    border-radius: 6px;
    transition: transform 0.3s;
    &:hover {
      transform: scale(1.02);
    }
  }
`;

const TitleText = styled.h3`
  font-weight: 700;
  font-size: clamp(1.25rem, 3.5vw, 1.75rem);
  margin: 0 0 0.5rem;
  color: #ffffff;
`;

const SubtitleText = styled.p`
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  line-height: 1.4;
  margin: 0;
  color: #e8fff7;
`;

const CardButton = styled(Link)`
  display: block;
  background-color: #e8fff7;
  color: #004640;
  padding: 0.65rem 1.25rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  width: fit-content;
  margin: 2rem auto 0;
  transition: background-color 0.3s, transform 0.3s;
  &:hover {
    background-color: #cbe9e0;
    transform: translateY(-4px);
  }
`;

/* ============ SCROLL-REVEAL SECTION ============ */
const RevealSection = styled.section`
  width: 90%;
  max-width: 1000px;
  margin: 4rem auto;
  background-color: #d3f5e6;
  border-radius: 16px;
  padding: 1.5rem 3rem;
  box-shadow: 0 12px 24px rgba(0,0,0,0.3);
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.8s ease-out;
  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

const RevealRow = styled(Row)`
  @media (max-width: 768px) {
    > div:nth-child(odd) { order: 0; }
    > div:nth-child(even) { order: 1; }
  }
`;

const RevealTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  color: #2d4149;
  margin-bottom: 1.5rem;
`;

const RevealColText = styled.div`
  flex: 1 1 45%;
  padding: 0.5rem;
`;

const RevealColImage = styled(ColImage)`
  flex: 1 1 45%;
`;

const RevealButton = styled(Link)`
  display: block;
  background-color: #02c37e;
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  width: fit-content;
  margin: 1.5rem auto 0;
  box-shadow: 0 12px 24px rgba(0,0,0,0.3);
  transition: background-color 0.3s, transform 0.3s;
  &:hover {
    background-color: #02b36e;
    transform: translateY(-4px);
  }
`;

/* ============ VIDEO SECTION ============ */
const VideoSection = styled.section`
  width: 80%;
  max-width: 600px;
  margin: 4rem auto;
  display: flex;
  justify-content: center;
  animation: ${fadeIn} 1.2s ease-out 0.5s;
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

/* ============ FINAL INFO SECTION ============ */
const InfoSection = styled.section`
  width: 90%;
  max-width: 600px;
  margin: 3rem auto 1.5rem;
  text-align: center;
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
  display: block;
  background-color: #02c37e;
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  width: fit-content;
  margin: 1rem auto 0;
  transition: background-color 0.3s, transform 0.3s;
  &:hover {
    background-color: #02b36e;
    transform: translateY(-4px);
  }
`;

/* ============ PARTNER SECTION ============ */
const PartnerSection = styled.section`
  width: 100%;
  padding: 1rem 0;
  background-color: #ffffff;
  display: flex;
  justify-content: center;
`;

const PartnerImage = styled.img`
  max-width: 200px;
`;

const Home = () => {
  const revealRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (revealRef.current) obs.observe(revealRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Hero>
        <TitlesWrapper>
          <Title>Reserva tu clase particular y empieza a brillar</Title>
          <TitleAccent>académicamente.</TitleAccent>
        </TitlesWrapper>
        <Content>
          <Subtitle>
            Enfocados en tus resultados: nuestros profesores se comprometen con tu éxito académico.
          </Subtitle>
          <Button to="/reserva-tu-clase">Reserva GRATIS tu primera clase</Button>
          <InfoText>Reserva GRATIS tu primera clase y págala después de darla.</InfoText>
        </Content>
      </Hero>

      <CardSection>
        <Row>
          <ColText>
            <TitleText>Clases presencial u online.</TitleText>
            <SubtitleText>
              En Student Project, nos adaptamos a ti con servicios tanto presenciales como online.
            </SubtitleText>
          </ColText>
          <ColImage>
            <img src={bolis} alt="Bolígrafos y libro" />
          </ColImage>
        </Row>

        <Row>
          <ColImage>
            <img src={personas} alt="Alumnos con portátiles" />
          </ColImage>
          <ColText>
            <TitleText>Elige el número de clases que necesites.</TitleText>
            <SubtitleText>
              Te brindamos máxima flexibilidad para contratar el número de clases que desees.
              No es necesario que adquieras un plan mensual, puedes recibir clases individuales
              cuando más lo necesites.
            </SubtitleText>
          </ColText>
        </Row>

        <CardButton to="/contacto">Contacta con nosotros</CardButton>
      </CardSection>

      <RevealSection ref={revealRef} className={revealed ? 'visible' : ''}>
        <RevealTitle>Prueba nuestras clases dobles y triples</RevealTitle>
        <RevealRow>
          <RevealColText>
            <SubtitleText style={{ color: '#2d4149', marginBottom: '1rem' }}>
              Nuestras clases dobles y triples son la opción perfecta para aquellos estudiantes
              que desean aprender junto a sus amigos o familiares del mismo curso. Obtén un ahorro
              económico en comparación con las clases individuales.
            </SubtitleText>
            <SubtitleText style={{ color: '#2d4149', marginTop: '0.5rem' }}>
              ¡Unidos hacia tu éxito académico!
            </SubtitleText>
          </RevealColText>
          <RevealColImage>
            <img src={chicas} alt="Alumnas estudiando juntas" />
          </RevealColImage>
        </RevealRow>
        <RevealButton to="/reserva-tu-clase">Infórmate</RevealButton>
      </RevealSection>

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
          Cuéntanos lo que necesitas para asignarte el profesor que mejor se adapta a ti.
        </InfoSub>
        <StartButton to="/alta">¡Comencemos!</StartButton>
      </InfoSection>

      <PartnerSection>
        <a
          href="https://www.diariodesevilla.es/sevilla/student-project-puedes-encontrar-profesores_0_2000978431.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          <PartnerImage src={diario} alt="Diario de Sevilla" />
        </a>
      </PartnerSection>
    </>
  );
};

export default Home;
