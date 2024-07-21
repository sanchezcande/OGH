import styled, { keyframes } from "styled-components";

const fadeInAnimation = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  70% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const fadeOutAnimation = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  75% {
    transform: scale(1)
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
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
  color: white;
  background-color: rgba(0, 31, 63, 0.8);
  max-width: calc(100% - 40px);
  max-height:90vh;
  margin: 0 20px;
`;

export const CloseButton = styled.button`
  position: absolute;
  right: 0;
  z-index: 9999;
  background: #001f3f;
  color: blue;
`;

export const CardTitle = styled.h3`
  font-weight: 600;
  font-size: 1.4em;
`;

export const CardImage = styled.img`
  width: 70%;
  height: auto;
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
