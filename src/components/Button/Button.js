import styled, { keyframes } from "styled-components";

// Definición del keyframe para el pulso del botón
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(249, 123, 114, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(249, 123, 114, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 123, 114, 0); }
`;

export const LightButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.secondary};
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  font-size: 1em;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #0034ee;
    transform: translateY(-2px);
  }
`;

export const DarkButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1em;
  font-weight: bold;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden; /* Para contener el efecto de brillo */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  /* Efecto de brillo */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    z-index: 1;
    transition: left 0.7s ease;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.background};
    transform: scale(1.05); /* Escala en lugar de trasladarse */
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);

    &::before {
      left: 100%; /* El brillo se desplaza al hacer hover */
    }
  }
`;
