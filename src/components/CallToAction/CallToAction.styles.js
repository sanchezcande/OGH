import styled from "styled-components";

export const CallToActionContainer = styled.div`
  text-align: center;
  margin: 3rem auto;
  padding: 2.5rem;
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  max-width: 800px;

  /* Estado inicial para la animación */
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;

  /* Cuando el componente es visible */
  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Interacciones */
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 768px) {
    margin-left: 1rem;
    margin-right: 1rem;
  }
`;

export const CallToActionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

export const CallToActionDescription = styled.p`
  font-size: 1.125rem;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.85;
`;

export const CallToActionButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: ${({ theme }) => theme.colors.accent};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  box-shadow: 0 6px 12px rgba(0, 87, 255, 0.2);
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.accentDark};
    transform: translateY(-2px);
  }
`;
