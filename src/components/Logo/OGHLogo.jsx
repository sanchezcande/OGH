import React from "react";
import styled from "styled-components";

const ACCENT = "#CC5A50";

const Wrapper = styled.span`
  display: inline-flex;
  align-items: center;
  font-family: "Space Grotesk", sans-serif;
  font-weight: 700;
  font-size: ${({ $size }) => $size}px;
  letter-spacing: -0.04em;
  color: ${({ $variant }) => ($variant === "light" ? "#fff" : "#111")};
  white-space: nowrap;
  user-select: none;
  line-height: 1;
`;

const Accent = styled.span`
  color: ${ACCENT};
`;

const OGHLogo = ({ size = 22, variant = "dark" }) => (
  <Wrapper $size={size} $variant={variant}>
    open<Accent>gate</Accent>hub
  </Wrapper>
);

export default OGHLogo;
export { ACCENT as OGH_ACCENT };
