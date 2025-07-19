import React from 'react';
import styled, { keyframes } from 'styled-components';
import profesoresImg from '../assets/profesores.png';
import serProfeImg from '../assets/serprofe.png';
import { useNavigate } from 'react-router-dom';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Section = styled.section`
  max-width: 1200px;
  margin: 3rem auto;
  padding: 0 1rem;
  animation: ${fadeInUp} 0.8s ease-out forwards;
  opacity: 0;
`;

const Heading = styled.h1`
  text-align: center;
  font-size: clamp(2rem, 5vw, 3rem);
  margin-bottom: 0.5rem;
  color: #000;
  font-weight: 700;
`;

const Subtitle = styled.p`
  text-align: center;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #444;
  margin-bottom: 2rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const Card = styled.div`
  background: ${({ variant }) => (variant === 'dark' ? '#25363D' : '#C8F9E6')};
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  animation: ${fadeInUp} 0.8s ease-out forwards;
  opacity: 0;
  &:nth-child(2) { animation-delay: 0.1s; }
  &:nth-child(3) { animation-delay: 0.2s; }
`;

const Number = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${({ variant }) => (variant === 'dark' ? '#C8F9E6' : '#000')};
  margin-bottom: 0.5rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: ${({ variant }) => (variant === 'dark' ? '#C8F9E6' : '#000')};
  font-weight: 600;
`;

const Text = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ variant }) => (variant === 'dark' ? '#C8F9E6' : '#000')};
`;

const Button = styled.button`
  display: block;
  margin: 2rem auto;
  background: #06c17b;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  width: fit-content;
  transition: background 0.2s ease, transform 0.2s ease;
  &:hover { background: #04a166; }
`;

const EarningsSection = styled.section`
  background: #006837;
  border-radius: 20px;
  padding: 1.5rem;
  color: #fff;
  margin: 2rem auto 0;
  max-width: 1000px;
  animation: ${fadeInUp} 0.8s ease-out forwards;
  opacity: 0;
`;

const EarningsHeading = styled.h2`
  text-align: center;
  font-size: clamp(2rem, 5vw, 2.5rem);
  margin-bottom: 2rem;
  font-weight: 700;
`;

const EarningsContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const EarningsImage = styled.img`
  width: 100%;
  border-radius: 12px;
`;

const EarningsText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RangeLabels = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  justify-content: center;
`;

const Range = styled.span`
  background: ${({ variant }) => (variant === 'low' ? '#D72C31' : '#18C171')};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.95rem;
`;

const CTASection = styled.section`
  max-width: 800px;
  margin: 3rem auto;
  padding: 0 1rem;
  text-align: center;
  animation: ${fadeInUp} 0.8s ease-out forwards;
  opacity: 0;
`;

const CTAHeading = styled.h2`
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  margin-bottom: 1rem;
  color: #000;
  font-weight: 700;
`;

const CTASubtitle = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  color: #334048;
  margin-bottom: 2rem;
`;

/* Nuevo bloque de incentivos */
const IncentivesSection = styled.section`
  max-width: 1000px;
  margin: 3rem auto;
  padding: 0 1rem;
  animation: ${fadeInUp} 0.8s ease-out forwards;
  opacity: 0;
`;

const IncentivesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

export default function JoinTeachers() {
  const navigate = useNavigate();

  return (
    <>
      {/* Bloque principal */}
      <Section>
        <Heading>Únete a nuestra comunidad de profesores</Heading>
        <Subtitle>
          Con Student Project, olvídate de buscar estudiantes y simplifica la gestión. ¡Da el paso hoy mismo!
        </Subtitle>
        <Grid>
          <Card variant="light">
            <Number variant="light">1</Number>
            <Title variant="light">Rellena el formulario</Title>
            <Text variant="light">
              Haz clic en “Ser profesor/a” y rellena con tus datos. Nos pondremos en contacto en menos 24 horas.
            </Text>
          </Card>
          <Card variant="dark">
            <Number variant="dark">2</Number>
            <Title variant="dark">Ofertas diarias</Title>
            <Text variant="dark">
              Una vez aceptado como profesor, te unirás a nuestra comunidad y recibirás ofertas diarias.
            </Text>
          </Card>
          <Card variant="light">
            <Number variant="light">3</Number>
            <Title variant="light">Tus clases, tus horarios</Title>
            <Text variant="light">
              Elige la oferta que te interese y coordina las clases con el alumno.
            </Text>
          </Card>
        </Grid>
      </Section>

      {/* Botón Ser profesor/a */}
      <Button onClick={() => navigate('/alta-profesor')}>
        Ser profesor/a
      </Button>

      {/* Sección de ganancias */}
      <EarningsSection>
        <EarningsHeading>¿Cuánto puedes ganar?</EarningsHeading>
        <EarningsContent>
          <EarningsImage src={serProfeImg} alt="Profesor enseñando" />
          <EarningsText>
            <Subtitle style={{ color: '#fff', marginBottom: '0.5rem' }}>
              Por solo 10 clases mensuales:
            </Subtitle>
            <RangeLabels>
              <Range variant="low">Desde – 105 €</Range>
              <Range variant="high">Hasta – 230 €</Range>
            </RangeLabels>
            <Text variant="dark">
              Tienes total libertad para dar la cantidad de clases que desees. ¡Tú pones tus propios límites!
            </Text>
          </EarningsText>
        </EarningsContent>
      </EarningsSection>

      {/* CTA final */}
      <CTASection>
        <CTAHeading>¿Preparado para unirte a nuestra comunidad de profesores?</CTAHeading>
        <CTASubtitle>
          Cuéntanos de lo que eres capaz y empieza a dar clases.
        </CTASubtitle>
        <Button onClick={() => navigate('/alta-profesor')}>
          ¡Comencemos!
        </Button>
      </CTASection>

      {/* Bloque de incentivos */}
      <IncentivesSection>
        <IncentivesGrid>
          <Card variant="light">
            <Title variant="light">Premiamos tu esfuerzo</Title>
            <Text variant="light">
              Si alcanzas las 20 clases mensuales, serás recompensado con un bonus económico.
            </Text>
          </Card>
          <Card variant="light">
            <Title variant="light">Bonificación por recomendación</Title>
            <Text variant="light">
              Recomend​ános y obtén bonificaciones por cada alumno que se una.
            </Text>
          </Card>
        </IncentivesGrid>
      </IncentivesSection>
    </>
  );
}
