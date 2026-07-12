import styled from "styled-components";

export const FooterContainer = styled.footer`
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
  color: #1f2937;
  width: 100%;
  box-sizing: border-box;
`;

export const FooterTop = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
  gap: 48px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 60px 32px;
  text-align: left;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
    padding: 40px 40px 24px;
  }

  @media (max-width: 550px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 28px;
    padding: 32px 24px 20px;
  }
`;

export const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  &.brand-col {
    gap: 12px;
  }

  .brand-desc {
    font-size: 13px;
    color: #6B7280;
    line-height: 1.6;
    margin: 0;
    max-width: 240px;
  }

  @media (max-width: 550px) {
    align-items: center;

    .brand-desc {
      max-width: 300px;
      text-align: center;
    }
  }
`;

export const FooterHeading = styled.h4`
  font-size: 11px;
  font-weight: 600;
  color: #111111;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 12px;
`;

export const FooterLink = styled.a`
  font-size: 13px;
  color: #4B5563;
  text-decoration: none;
  padding: 4px 0;
  transition: color 0.2s ease;
  display: inline-block;

  &:hover {
    color: #CC5A50;
  }
`;

export const SocialRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 4px;

  @media (max-width: 550px) {
    justify-content: center;
  }
`;

export const SocialIcon = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  svg {
    width: 15px;
    height: 15px;
    fill: #374151;
    transition: fill 0.2s ease;
  }

  &:hover {
    background: rgba(204, 90, 80, 0.08);

    svg {
      fill: #CC5A50;
    }
  }
`;

export const EmailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;

  svg {
    width: 14px;
    height: 14px;
    fill: #6B7280;
    flex-shrink: 0;
  }

  a {
    color: #4B5563;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #CC5A50;
    }
  }

  @media (max-width: 550px) {
    justify-content: center;
  }
`;

export const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 60px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 12px;
    color: #9CA3AF;
    letter-spacing: 0.01em;
  }

  @media (max-width: 900px) {
    padding: 16px 40px;
  }

  @media (max-width: 550px) {
    padding: 16px 24px;
  }
`;
