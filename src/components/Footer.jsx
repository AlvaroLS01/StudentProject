// src/components/Footer.jsx
import React from 'react';
import styled from 'styled-components';
import logo from '../assets/logo-sin-fondo-negro.png';
import { Link } from 'react-router-dom';

const FooterContainer = styled.footer`
  background-color: ${({ theme }) => theme.colors.secondary};
  padding: 4rem 1rem 3rem;
`;

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Column = styled.div`
  flex: 1;
  padding-bottom: 0.5rem;

  &:first-child {
    padding-right: 2rem;
  }

  @media (max-width: 768px) {
    padding-right: 0;
    text-align: center;
  }
`;

const LogoImage = styled.img`
  width: 303px;
  height: 105px;
  object-fit: contain;
  display: block;
  margin: 0 auto 1rem;
`;

const ContactLabel = styled.strong`
  display: block;
  font-size: 1rem;
  font-weight: 700;          /* Negrita */
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
  letter-spacing: 1px;
  text-align: center;
`;

const ContactText = styled.p`
  margin: 0.25rem 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.125rem;
  text-align: center;
`;

const ServicesWrapper = styled.nav``;

const ServicesLabel = styled.strong`
  display: block;
  font-size: 1rem;
  font-weight: 700;          /* Negrita */
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
`;

const ServicesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: center;
`;

const ServicesItem = styled.li`
  margin: 0.5rem 0;
`;

const ServicesLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  font-size: 1.125rem;
`;

const Footer = () => (
  <FooterContainer>
    <FooterInner>
      <Column>
        <LogoImage src={logo} alt="Student Project" />
        <ContactLabel>CONTACTO</ContactLabel>
        <ContactText>+34 645159003</ContactText>
        <ContactText>studentproject.es@gmail.com</ContactText>
      </Column>

      <Column>
        <ServicesWrapper aria-label="Servicios">
          <ServicesLabel>SERVICIOS</ServicesLabel>
          <ServicesList>
            <ServicesItem>
              <ServicesLink to="/contacto">Contáctanos</ServicesLink>
            </ServicesItem>
            <ServicesItem>
              <ServicesLink to="/reserva-tu-clase">Reserva tu clase</ServicesLink>
            </ServicesItem>
            <ServicesItem>
              <ServicesLink to="/ser-profesor">Ser profesor/a</ServicesLink>
            </ServicesItem>
            <ServicesItem>
              <ServicesLink to="/quienes-somos">Quiénes somos</ServicesLink>
            </ServicesItem>
          </ServicesList>
        </ServicesWrapper>
      </Column>
    </FooterInner>
  </FooterContainer>
);

export default Footer;
