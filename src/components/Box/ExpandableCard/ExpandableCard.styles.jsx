import styled, { keyframes } from "styled-components";

const fadeInAnimation = keyframes`
0% {
  opacity: 0;
  transform: translateY(20px);
}
100% {
  opacity: 1;
  transform: translateY(0);
}
`;

const fadeOutAnimation = keyframes`
0% {
  opacity: 1;
  transform: translateY(0);
}
100% {
  opacity: 0;
  transform: translateY(20px);
}
`;

export const Container = styled.div`
  z-index: 1000;
  top: 50%;
  left: 20%;
  right: 20%;
  bottom: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  animation: ${(props) => (props.fadeOut ? fadeOutAnimation : fadeInAnimation)};
  animation-duration: 0.5s;
  animation-timing-function: ease-in-out;

  @media (max-width: 768px) {
    left: 0;
    right: 0;
  }
`;

export const CardContent = styled.div`‡
  width: 70%;
  gap: 1rem;
  display: flex;
  flex-direction: column;
  padding: 1.35rem 20px;
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.secondary};
  opacity: 0.95;
  max-width: calc(100% - 40px);
  max-height:90vh;
  margin: 0 20px;
`;

export const CloseButton = styled.button`
  position: absolute;
  right: -8px;
  z-index: 9999;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.secondary};
  border-radius: 20%;
  width: 38px;
  height: 34px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
  font-size: 26px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2);
    color: ${(props) => props.theme.colors.secondary};
  }
`;

export const CardTitle = styled.h3`
  font-weight: 600;
  font-size: 1.4em;
`;

export const CardDescription = styled.p`
  margin-top: 1rem;
  font-size: 14px;
  width: 90%;
`;

export const CardSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ImageContainer = styled.div`
  width: 70%;
  height: auto;
  z-index: 1000;
  position: relative;
  display: flex;
  align-items: center;
`;
