import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const ArticleContainer = styled.div`
  padding: 30px 40px;
background: linear-gradient(145deg, #0a0f22, #121d40);
  color: #eaeaea;
  line-height: 1.8;
  font-size: 1.1rem;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} 0.6s ease-out; 
  margin-bottom: 20px;
`;


export const Title = styled.h1`
  font-size: 2rem;
  font-family: "Poppins", sans-serif;
  color: #00bcd4;
  text-align: left;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
`;

export const ImageContainer = styled.div`
  margin: 15px 0;
  display: flex;
  justify-content: left;

  img {
    max-width: 70%;
    height: auto;
    border-radius: 8px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
`;

export const Content = styled.div`
  margin-top: 20px;
  display: flex;
  font-family: "Poppins", sans-serif;
  flex-direction: column;
  gap: 16px; 
  text-align: justify;
  font-size: 14px;

  p {
    margin: 0;
  }

  ul {
    margin: 10px 0;
    padding-left: 20px;

    li {
      margin: 5px 0;
    }
  }
`;

export const Highlight = styled.span`
  color: #18ffff;
  font-weight: bold;
`;
