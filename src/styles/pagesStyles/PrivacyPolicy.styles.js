import styled from "styled-components";
import { color, font, mq } from "../kit";

// Páginas legales (privacidad y términos): una columna de lectura, sin tarjeta.
export const PrivacyPolicyContainer = styled.section`
  max-width: 760px;
  margin: 0 auto;
  padding: clamp(56px, 8vw, 104px) 32px clamp(72px, 9vw, 120px);
  font-family: ${font.sans};
  color: ${color.inkSoft};

  ${mq.mobile} {
    padding-left: 20px;
    padding-right: 20px;
  }
`;

export const PrivacyPolicyTitle = styled.h1`
  font-family: ${font.serif};
  font-weight: 400;
  font-size: clamp(2.25rem, 4.4vw, 3.25rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: ${color.ink};
  margin-bottom: 32px;
`;

export const PrivacyPolicySection = styled.div`
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid ${color.line};
`;

export const SectionTitle = styled.h2`
  font-family: ${font.serif};
  font-weight: 500;
  font-size: 1.375rem;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: ${color.ink};
  margin-bottom: 14px;
`;

export const SectionContent = styled.p`
  font-size: 1rem;
  line-height: 1.7;
  color: ${color.inkSoft};
  margin-bottom: 14px;
`;

export const List = styled.ul`
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
  font-size: 1rem;
  line-height: 1.7;

  li {
    margin-bottom: 8px;
    color: ${color.inkSoft};
  }

  li::marker {
    color: ${color.accent};
  }
`;
