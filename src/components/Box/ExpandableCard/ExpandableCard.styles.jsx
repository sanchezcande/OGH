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
  70% {
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
`;

export const Container = styled.div`
  z-index: 1000;
  position: absolute;
  animation: ${(props) => (props.fadeOut ? fadeOutAnimation : fadeInAnimation)};
  animation-duration: 0.5s;
  animation-timing-function: ease-in-out;
`;