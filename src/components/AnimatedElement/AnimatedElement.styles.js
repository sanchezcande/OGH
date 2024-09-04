import styled, { keyframes, css } from "styled-components";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(80px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOutDown = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(80px);
  }
`;

export const AnimatedDiv = styled.div`
  opacity: 0;
  transform: translateY(80px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;

  ${({ inView, hasExited }) =>
    inView
      ? css`
          animation: ${fadeInUp} 0.6s ease-out forwards;
        `
      : hasExited &&
        css`
          animation: ${fadeOutDown} 0.6s ease-out forwards;
        `}
`;
