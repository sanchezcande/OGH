import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Puedes ajustar esto según tu necesidad */
`;

const SpinnerElement = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #3498db; /* Color del spinner */
  border-radius: 50%;
  width: 40px; /* Tamaño del spinner */
  height: 40px; /* Tamaño del spinner */
  animation: ${spin} 1s linear infinite;
`;

const Spinner = () => (
  <SpinnerWrapper>
    <SpinnerElement />
  </SpinnerWrapper>
);

export default Spinner;
