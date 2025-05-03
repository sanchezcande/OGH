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
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
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
