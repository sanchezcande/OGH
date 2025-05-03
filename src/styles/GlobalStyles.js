import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.main};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    min-height: 100vh;
    overflow-x: hidden;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  #__next {
    display: flex;
    flex-direction: column;
    min-height: 100vh; 
  }

  a {
    text-decoration: none;
    color: ${({ theme }) => theme.colors.text};
    transition: color 0.2s ease;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }
`;

export default GlobalStyles;
