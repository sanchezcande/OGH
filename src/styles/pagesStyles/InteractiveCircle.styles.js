import styled from "styled-components";

export const InteractiveCircle = styled.div`
  position: absolute;
  pointer-events: none;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: ${({ theme }) => `${theme.colors.accentDark}ee`};
  mix-blend-mode: exclusion;
  backdrop-filter: invert(100%) contrast(150%);
  -webkit-backdrop-filter: invert(100%) contrast(150%);
  transition: transform 0.2s ease, opacity 0.3s ease;
  z-index: 9999;
  will-change: transform, opacity;
  transform: translate(-50%, -50%);
`;
