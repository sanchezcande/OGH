import styled from "styled-components";

export const InteractiveCircle = styled.div`
  position: fixed;
  pointer-events: none;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  backdrop-filter: invert(100%);
  -webkit-backdrop-filter: invert(100%);
  mix-blend-mode: difference;
  opacity: 0.8;
  transition: transform 0.15s ease;
  z-index: 5;
`;
