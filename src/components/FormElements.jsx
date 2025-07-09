import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const TextInput = styled.input`
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(3, 70, 64, 0.2);
  }
`;

export const SelectInput = styled.select`
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(3, 70, 64, 0.2);
  }
`;

export const PrimaryButton = styled.button`
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? 'none' : 'auto')};
  &:hover {
    background: ${({ theme }) => theme.colors.accent};
    transform: translateY(-2px);
  }
`;

export const DangerButton = styled.button`
  background: ${p => (p.disabled ? '#ccc' : '#e53e3e')};
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.75rem;
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  transition: background 0.2s ease;
  &:hover {
    background: ${p => (p.disabled ? '#ccc' : '#c53030')};
  }
`;

export const PrimaryLink = styled(Link)`
  display: inline-block;
  background: ${({ theme, accent }) =>
    accent ? theme.colors.accent : theme.colors.secondary};
  color: ${({ theme, accent }) =>
    accent ? '#ffffff' : theme.colors.primary};
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  pointer-events: ${p => (p.disabled ? 'none' : 'auto')};
  &:hover {
    background: ${({ theme, accent }) =>
      accent ? theme.colors.accentHover : theme.colors.accent};
    transform: translateY(-2px);
  }
`;
