import styled from "styled-components";

export const BlogContainer = styled.div`
  padding: 30px;
  background: linear-gradient(145deg, #0a0f22, #0e162e); /* Fondo con degradado sutil */
  color: #eaeaea;
  min-height: 100vh; /* Para que el fondo cubra toda la pantalla */
  position: relative;
`;

export const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Adaptativo: 1-3 columnas */
  gap: 24px; /* Espaciado entre tarjetas */
  margin-bottom: 60px; /* Espacio para la flecha */
`;

export const ArticleCard = styled.div`
  background: linear-gradient(145deg, #121d40, #192954); /* Fondo dinámico */
  border: 2px solid #1f2e5a;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
  transition: transform 0.4s, box-shadow 0.4s;
  overflow: hidden;

  &:hover {
    transform: scale(1.05); /* Zoom en hover */
    box-shadow: 0 12px 24px rgba(31, 50, 90, 0.8);
    border-color: #3b5998;
  }

  h2 {
    font-size: 1.6rem;
    margin-bottom: 12px;
    color: #00bcd4;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  }

  p {
    font-size: 1rem;
    color: #d1d9e6;
    line-height: 1.5;
  }

  a {
    display: inline-block;
    margin-top: 15px;
    color: #00bcd4;
    font-weight: bold;
    text-decoration: none;

    &:hover {
      color: #18ffff;
    }
  }
`;

export const ScrollToTopButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #00bcd4;
  border: none;
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: background 0.3s;
  z-index: 1000;

  &:hover {
    background: #18ffff;
  }
`;
