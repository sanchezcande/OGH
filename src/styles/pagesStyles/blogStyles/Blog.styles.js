import styled from "styled-components";

export const BlogContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Aseguramos que todo esté alineado a la izquierda */
  padding: 30px;
  background: linear-gradient(145deg, #0a0f22, #0e162e);
  color: #eaeaea;
  min-height: 100vh;
`;

export const SearchBarContainer = styled.div`
  width: 100%;
  max-width: 300px; /* Limita el ancho del buscador */
  margin-bottom: 20px;
`;

export const SearchInput = styled.input`
  width: 280px;
  padding: 10px 15px;
  border: none; 
  border-bottom: 2px solid #1f2e5a;
  background: transparent; 
  font-size: 1rem;
  color: #ffffff; 
  outline: none;
  margin-left: 10px;
margin-bottom: 20px;

  &::placeholder {
    color: #d1d9e6; 
    opacity: 0.7; 
  }

  &:focus {
    border-bottom-color: #00bcd4; 
  }
`;


export const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  width: 100%;
  justify-items: center;
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

export const ArticleCard = styled.div`
  background: linear-gradient(145deg, #121d40, #192954);
  border: 2px solid #1f2e5a;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
  transition: transform 0.4s, box-shadow 0.4s;
  overflow: hidden;
  width: 100%;

  img {
    width: 20%;
    height: auto;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 12px;
  }

  &:hover {
    transform: scale(1.05);
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
