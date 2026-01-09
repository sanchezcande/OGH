import React from "react";
import styled from "styled-components";
import gif from "../../assets/icons/Animacion-Carga-OGH.gif";

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const SpinnerElement = styled.img`
  width: 100px;
  height: 100px;
`;

const Spinner = () => (
  <SpinnerWrapper>
    <SpinnerElement src={gif} alt="Animated Loading" />
  </SpinnerWrapper>
);

export default Spinner;
