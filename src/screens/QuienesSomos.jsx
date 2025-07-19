import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import heroImg from '../assets/carlosyluis.jpg';
import tutorImg from '../assets/tutorBib.png';
import workImg from '../assets/padreyhijo.png';
import { PrimaryLink } from '../components/FormElements';

// Animaciones
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// Styled Components
const Hero = styled.section`
  width: 100%;
  height: 500px;
  background: url(${heroImg}) center 10%/cover no-repeat fixed;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  &:after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.4);
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
`;
const HeroTitle = styled.h1`
  font-size: clamp(2rem, 4vw, 3rem);
  margin: 0;
  animation: ${fadeIn} 1s ease-out;
`;
const HeroSubtitle = styled.h2`
  font-weight: 400;
  margin: 1rem 0 0;
  font-size: clamp(1.125rem, 3vw, 1.5rem);
  opacity: 0;
  animation: ${fadeIn} 1s ease-out 0.2s forwards;
`;

const Section = styled.section`
  padding: 3rem 1rem;
  opacity: 0;
  transition: opacity 0.6s ease-out;
  &.visible { opacity: 1; }

  .slide-left,
  .slide-right { opacity: 0; }

  &.visible .slide-left {
    animation: ${slideInLeft} 0.8s forwards;
  }
  &.visible .slide-right {
    animation: ${slideInRight} 0.8s forwards;
  }
`;

const Grid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const ColText = styled.div`
  flex: 1 1 50%;
`;

const ColImage = styled.div`
  flex: 1 1 50%;
  text-align: center;
  img {
    width: 100%;
    max-width: 600px;
    height: auto;
    border-radius: 8px;
    object-fit: cover;
    display: block;
    margin: 0 auto;
  }
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  margin-bottom: 0.75rem;
`;
const SectionText = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  line-height: 1.6;
  margin: 0.75rem 0;
`;
const List = styled.ul`
  list-style: disc inside;
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  line-height: 1.6;
  padding-left: 1rem;
  margin: 0.75rem 0;
`;

const CommunitySection = styled(Section)`
  background-color: #f5f5f5;
  padding: 2.5rem 1rem;
`;

const Cards = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
`;
const Card = styled.div`
  background: #fff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  min-width: 140px;
  text-align: center;
`;

const CTAButton = styled(PrimaryLink).attrs({ accent: true })`
  margin-top: 1rem;
  display: inline-block;
`;

// Componente
export default function QuienesSomos() {
  const sectionsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );
    sectionsRef.current.forEach(sec => sec && observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Hero */}
      <Hero>
        <HeroContent>
          <HeroTitle>Hola, somos Student Project</HeroTitle>
          <HeroSubtitle>
            By students for students: impulsamos el potencial de cada alumno.
          </HeroSubtitle>
        </HeroContent>
      </Hero>

      {/* Orígenes: texto izquierda, imagen derecha */}
      <Section ref={el => (sectionsRef.current[0] = el)}>
        <Grid>
          <ColText className="slide-left">
            <SectionTitle>Nuestros orígenes</SectionTitle>
            <SectionText>
              En marzo de 2023, en la Biblioteca de Derecho de la US, Carlos y Luis idearon Student Project tras comprobar lo difícil que era para familias encontrar tutores de confianza.
            </SectionText>
            <SectionText>
              Ambos compartían años de experiencia dando clases particulares durante la carrera de Ingeniería Civil y querían crear una plataforma que beneficiara a estudiantes universitarios y a familias por igual.
            </SectionText>
            <SectionText>
              Hoy, contamos con más de 250 tutores y la confianza de 100 familias en Sevilla, y seguimos creciendo para expandirnos a 10 ciudades en 2025.
            </SectionText>
          </ColText>
          <ColImage className="slide-right">
            <img src={tutorImg} alt="Tutor" />
          </ColImage>
        </Grid>
      </Section>

      {/* Proceso: texto y luego imagen */}
      <Section ref={el => (sectionsRef.current[1] = el)}>
        <Grid style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <ColText className="slide-left">
            <SectionTitle>Cómo trabajamos</SectionTitle>
            <List>
              <li>Rellena un breve formulario con las materias y horarios.</li>
              <li>Comparamos y seleccionamos al mejor tutor para las necesidades de tu hijo.</li>
              <li>Coordinamos la primera clase mediante un grupo de WhatsApp con padres, alumno, profesor y coordinador.</li>
              <li>Facturación semanal transparente: desde 11 €/h en Primaria hasta 13 €/h en Bachillerato.</li>
              <li>Clases 100% presenciales u online, con la posibilidad de reprogramar hasta 3 horas antes.</li>
            </List>
          </ColText>
          <ColImage className="slide-right">
            <img src={workImg} alt="Padre e hijo estudiando" />
          </ColImage>
        </Grid>
      </Section>

      {/* Comunidad: tarjetas + CTA integradas */}
      <CommunitySection ref={el => (sectionsRef.current[2] = el)}>
        <SectionTitle style={{ textAlign: 'center' }}>
          Nuestra comunidad
        </SectionTitle>
        <Cards>
          <Card>250+ tutores universitarios</Card>
          <Card>100+ familias satisfechas</Card>
          <Card>En 10 ciudades en 2025</Card>
        </Cards>
        <div style={{ textAlign: 'center' }}>
          <CTAButton to="/alta">
            Únete y despierta tu mejor versión
          </CTAButton>
        </div>
      </CommunitySection>
    </>
  );
}
