import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import heroImg from '../assets/carlosyluis.jpg';
import tutorImg from '../assets/tutorBib.png';
import workImg from '../assets/padreyhijo.png';
import { PrimaryLink } from '../components/FormElements';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Hero = styled.section`
  width: 100%;
  height: 500px;
  background: url(${heroImg}) center 20%/cover no-repeat fixed;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &:after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
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
  font-weight: normal;
  margin-top: 1rem;
  font-size: clamp(1.125rem, 3vw, 1.5rem);
  opacity: 0;
  animation: ${fadeIn} 1s ease-out 0.2s;
  animation-fill-mode: forwards;
`;

const Section = styled.section`
  padding: 3rem 1rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease-out;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Grid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
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
    max-width: 100%;
    border-radius: 8px;
  }
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  margin-bottom: 1rem;
`;

const SectionText = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  line-height: 1.6;
`;

const List = styled.ul`
  list-style: disc inside;
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  line-height: 1.6;
  padding-left: 1rem;
`;

const CommunitySection = styled(Section)`
  background-color: ${({ theme }) => theme.colors.secondary};
`;

const Cards = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin: 2rem 0;
`;

const Card = styled.div`
  background: #fff;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  min-width: 160px;
  text-align: center;
`;

const CTAButton = styled(PrimaryLink).attrs({ accent: true })`
  margin-top: 1.5rem;
`;

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
      <Hero>
        <HeroContent>
          <HeroTitle>Somos Student Project</HeroTitle>
          <HeroSubtitle>
            De estudiantes para estudiantes: clases personalizadas, cercanas y flexibles de Primaria a Bachillerato.
          </HeroSubtitle>
        </HeroContent>
      </Hero>

      <Section ref={el => (sectionsRef.current[0] = el)}>
        <Grid>
          <ColText>
            <SectionTitle>Nuestra misión</SectionTitle>
            <SectionText>
              Student Project nació en Sevilla para acercar la experiencia universitaria a las aulas. Carlos y Luis comenzaron dando clase para pagarse sus estudios y hoy conectan a cientos de familias con jóvenes profesores que entienden a cada alumno.
            </SectionText>
            <SectionText>
              Creemos en una educación cercana y flexible que impulse a cada estudiante a superarse.
            </SectionText>
          </ColText>
          <ColImage>
            <img src={tutorImg} alt="Tutor" />
          </ColImage>
        </Grid>
      </Section>

      <Section ref={el => (sectionsRef.current[1] = el)}>
        <Grid>
          <ColImage>
            <img src={workImg} alt="Padre e hijo estudiando" />
          </ColImage>
          <ColText>
            <SectionTitle>Cómo trabajamos</SectionTitle>
            <List>
              <li>Formulario rápido para necesidades y horarios.</li>
              <li>Los profesores “pujan”; nosotros seleccionamos al mejor.</li>
              <li>Seguimiento vía grupo de WhatsApp.</li>
              <li>Facturación semanal: transparente y sin sorpresas.</li>
            </List>
          </ColText>
        </Grid>
      </Section>

      <CommunitySection ref={el => (sectionsRef.current[2] = el)}>
        <SectionTitle style={{ textAlign: 'center' }}>Nuestra comunidad</SectionTitle>
        <Cards>
          <Card>+250 profesores</Card>
          <Card>150+ familias en Sevilla</Card>
          <Card>Expansión a 10 ciudades en 2025</Card>
        </Cards>
        <div style={{ textAlign: 'center' }}>
          <CTAButton to="/alta">
            Únete a Student Project y despierta tu potencial
          </CTAButton>
        </div>
      </CommunitySection>
    </>
  );
}
