import { createGlobalStyle, keyframes } from "styled-components";

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
    margin: 0;
    padding: 0;
    min-height: 100vh;
    overflow-x: hidden;
  }

  #__next {
    display: flex;
    flex-direction: column;
    min-height: 100vh; 
  }
  
  a {
    text-decoration: none;
    color: inherit;
  }
     @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
     @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

export default GlobalStyles;
