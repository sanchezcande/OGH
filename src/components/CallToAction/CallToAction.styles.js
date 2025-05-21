import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(249, 123, 114, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(249, 123, 114, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 123, 114, 0); }
`;

export const CallToActionContainer = styled.div`
  text-align: center;
  margin: 5rem auto;
  padding: 4rem 2rem;
  background: linear-gradient(145deg, ${({ theme }) => theme.colors.accent}11, ${({ theme }) => theme.colors.accent}22);
  color: ${({ theme }) => theme.colors.text};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.boxShadow || '0 10px 30px rgba(0, 0, 0, 0.1)'};
  max-width: 1000px;
  position: relative;
  overflow: hidden;

  /* Estado inicial para la animación */
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;

  /* Cuando el componente es visible */
  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Background elements */
  &::before {
    content: "";
    position: absolute;
    width: 300px;
    height: 300px;
    background: ${({ theme }) => theme.colors.accent}22;
    border-radius: 50%;
    top: -150px;
    right: -150px;
    z-index: 0;
  }
  
  &::after {
    content: "";
    position: absolute;
    width: 200px;
    height: 200px;
    background: ${({ theme }) => theme.colors.accent}22;
    border-radius: 50%;
    bottom: -100px;
    left: -100px;
    z-index: 0;
  }

  @media (max-width: 768px) {
    margin: 3rem 1rem;
    padding: 3rem 1.5rem;
  }
`;

export const CallToActionTitle = styled.h2`
  font-size: 2.8rem;
  font-weight: 900;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  position: relative;
  z-index: 1;
  
  span {
    color: ${({ theme }) => theme.colors.accent};
    position: relative;
    display: inline-block;
    
    &::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 0.2em;
      bottom: 0.05em;
      left: 0;
      background-color: ${({ theme }) => theme.colors.accent}22;
      z-index: -1;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

export const CallToActionDescription = styled.p`
  font-size: 1.3rem;
  margin-bottom: 2.5rem;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.85;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }
`;

export const CallToActionButton = styled.a`
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  background-color: ${({ theme }) => theme.colors.accent};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(249, 123, 114, 0.3);
  display: inline-block;
  text-decoration: none;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  animation: ${pulse} 3s infinite;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentDark});
    z-index: -1;
    transition: all 0.4s ease;
    border-radius: 8px;
  }

  &:hover {
    transform: translateY(-5px);
    color: white;
    box-shadow: 0 10px 25px rgba(249, 123, 114, 0.5);
  }
  
  @media (max-width: 768px) {
    padding: 0.9rem 2rem;
    font-size: 1rem;
  }
`;
