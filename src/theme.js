import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    primary: '#034640',
    secondary: '#ccf3e5',
    accent: '#02c37e',
    accentHover: '#02b36e',
    background: '#ffffff',
    text: '#014F40',
    heading: '#2d4149'
  },
  breakpoints: {
    mobile: '768px'
  }
};

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: 'Poppins', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    transition: background-color 0.3s ease, color 0.3s ease;
    scroll-behavior: smooth;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, input, select, textarea {
    font-family: inherit;
  }
`;
