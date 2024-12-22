import styled from "styled-components";

export const CallToActionContainer = styled.div`
  text-align: center;
  margin: 3rem auto;
  padding: 2rem;
  background-color: #122a54; 
  color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
  }
`;

export const CallToActionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #ffffff;
`;

export const CallToActionDescription = styled.p`
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #d1d1d1; /* Texto suave y no tan contrastante */
`;

export const CallToActionButton = styled.button`
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  background-color: #1a73e8; 
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease, transform 0.3s ease;

  &:hover {
    background-color: #105bb5;
    transform: scale(1.05);
  }
`;
