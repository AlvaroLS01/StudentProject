// src/components/Contacto.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { PrimaryLink } from '../components/FormElements';
import whatsapp from '../assets/whatsapp.webp';
import correo from '../assets/correo.webp';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

// Styled Components
const Section = styled.section`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  animation: ${fadeIn} 0.8s ease-out;
`;

const Title = styled.h1`
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: #2d4149;
  text-align: center;
  margin-bottom: 1.25rem;
  animation: ${slideUp} 0.6s ease-out;
`;

const ContactWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start; /* alinea todo a la izquierda */
  gap: 2rem;
  margin-bottom: 3.5rem;       /* más espacio debajo */
  animation: ${slideUp} 0.6s ease-out 0.2s;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    align-items: center;
    gap: 1.5rem;
  }
`;

const TextContainer = styled.div`
  flex: 0 0 350px;
  max-width: 350px;
`;

const Text = styled.p`
  margin: 0;
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  line-height: 1.6;
  color: #2d4149;
  white-space: pre-line;
`;

const Icons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const IconLink = styled.a`
  width: 48px;
  height: 48px;
  display: block;
  img {
    width: 100%;
    height: 100%;
  }
`;

// “Comencemos” block
const InfoSection = styled.section`
  text-align: center;
  margin-top: 3rem;            /* más separación arriba */
  animation: ${slideUp} 0.6s ease-out 0.4s;
`;

const InfoTitle = styled.h2`
  font-size: clamp(1.5rem, 3.5vw, 1.875rem);
  color: #2d4149;
  margin-bottom: 0.5rem;
`;

const InfoSub = styled.p`
  font-size: clamp(0.9rem, 2vw, 1rem);
  color: #014f40;
  margin-bottom: 1.5rem;
  line-height: 1.4;
`;

const StartButton = styled(PrimaryLink).attrs({ accent: true })`
  padding: 0.6rem 1.75rem;
  font-size: 1rem;
  transition: transform 0.3s;
  &:hover {
    transform: translateY(-2px);
  }
`;

const Contacto = () => {
  const contactText = `Contáctanos a través de las
siguientes plataformas y aclara todas
tus dudas. Recibirás respuesta en
breves momentos.`;

  return (
    <Section>
      <Title>¡Estamos aquí para ayudarte!</Title>

      <ContactWrapper>
        <TextContainer>
          <Text>{contactText}</Text>
        </TextContainer>
        <Icons>
          <IconLink
            href="https://wa.me/123456789"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={whatsapp} alt="WhatsApp" />
          </IconLink>
          <IconLink href="mailto:info@tudominio.com">
            <img src={correo} alt="Correo electrónico" />
          </IconLink>
        </Icons>
      </ContactWrapper>

      <InfoSection>
        <InfoTitle>Encuentra al profesor que buscabas</InfoTitle>
        <InfoSub>
          Cuéntanos lo que necesitas para asignarte el profesor que mejor se adapta a ti.
        </InfoSub>
        <StartButton to="/alta">¡Comencemos!</StartButton>
      </InfoSection>
    </Section>
  );
};

export default Contacto;
