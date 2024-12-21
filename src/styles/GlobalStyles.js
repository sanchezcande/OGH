import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: "Poppins", sans-serif;
    background: 
    linear-gradient(120deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0) 50%),
    linear-gradient(300deg, #001f3f, #001f3f 50%),
    linear-gradient(60deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0) 50%);
    color: ${({ theme }) => theme.colors.text};
    margin-left: 20px;
    margin-right: 20px;

  }

  #__next {
    margin: 0 auto;
    padding: 0;
    left: 0;
    width: 100%;
    right: 0;
    max-width: 100vw;
  }
  
  a {
    text-decoration: none;
    color: inherit;
  }
`;

export default GlobalStyles;
