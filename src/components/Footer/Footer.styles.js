import styled from "styled-components";
import {
  FaInstagram,
  FaLinkedin,
  FaGithub,
  FaEnvelope,
  FaWhatsapp,
} from "react-icons/fa";

export const FooterContainer = styled.footer`
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  color: #1f2937;
  padding: 32px 60px 24px 60px;
  text-align: center;
  width: 100%;
  min-width: 100vw;
  position: relative;
  box-sizing: border-box;

  h4 {
    margin-bottom: 12px;
    margin-top: 0;
    font-size: 14px;
    font-weight: 700;
    color: #000000 !important;
  }

  a {
    text-decoration: none;
    color: #1f2937;
    transition: color 0.2s ease;

    &:hover {
      color: #f97b72;
    }
  }

  @media (max-width: 900px) {
    padding: 32px 40px 24px 40px;
  }

  @media (max-width: 550px) {
    padding: 32px 20px 24px 20px;
  }
`;

export const FooterContent = styled.div`
  display: grid;
  grid-template-columns: minmax(140px, 1.2fr) minmax(180px, 1.6fr) minmax(120px, 1fr) minmax(120px, 1fr);
  gap: 40px;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
  justify-content: space-between;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }

  @media (max-width: 550px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 18px;
    justify-items: center;
    align-items: center;
    > div {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
  }
`;

export const FooterText = styled.p`
  font-size: 13px;
  margin: 6px 0;
  color: #000000 !important;
  line-height: 1.5;
  transition: color 0.2s ease;

  a {
    color: #000000 !important;
    font-weight: 400;
    
    &:hover {
      color: #f97b72 !important;
    }
  }
`;

export const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 24px;
  column-gap: 24px;
  row-gap: 4px;

  @media (max-width: 550px) {
    grid-template-columns: 1fr;
    gap: 4px 0;
  }
`;

export const SocialMediaContainer = styled.div`
  display: flex;
  gap: 16px;
  margin: 0 0 12px 0;
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;

  a svg {
    width: 20px;
    height: 20px;
    fill: #000000;
    transition: all 0.2s ease;
    vertical-align: middle;
    display: block;
  }

  a {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
  }

  a:hover svg {
    fill: #f97b72;
    transform: scale(1.05);
  }

  @media (max-width: 550px) {
    margin: 0 auto 12px auto;
    justify-content: center;
    align-items: center;
    flex-direction: row;
  }
`;

export const Linkedin = styled(FaLinkedin)`
  width: 20px;
  height: 20px;
  fill: #000000;
  transition: all 0.2s ease;
  display: block;
  &:hover {
    fill: #f97b72;
    transform: scale(1.05);
  }
`;
export const Github = styled(FaGithub)`
  width: 20px;
  height: 20px;
  fill: #000000;
  transition: all 0.2s ease;
  display: block;
  &:hover {
    fill: #f97b72;
    transform: scale(1.05);
  }
`;
export const Instagram = styled(FaInstagram)`
  width: 20px;
  height: 20px;
  fill: #000000;
  transition: all 0.2s ease;
  display: block;
  &:hover {
    fill: #f97b72;
    transform: scale(1.05);
  }
`;

export const Mail = styled(FaEnvelope)`
  width: 16px;
  height: 16px;
  fill: #000000;
  transition: fill 0.2s ease;
`;
// export const Tel = styled(FaWhatsapp)`
//   width: 20px;
//   height: 20px;
//   fill: #fff;
//   margin-bottom: 5px;
// `;
export const TelMailContainer = styled.div`
  margin: 0 0 12px 0;
  display: flex;
  gap: 8px;
  align-items: center;

  &:empty {
    display: none;
    margin: 0;
  }

  a {
    display: flex;
    flex-direction: row;
    gap: 6px;
    align-items: center;
    color: #000000 !important;
    transition: color 0.2s ease;

    &:hover {
      color: #f97b72 !important;
      
      ${Mail} {
        fill: #f97b72;
      }
    }
  }
`;

export const Title = styled.h3`
  font-weight: 800;
  font-size: 12px;
  display: flex;
  align-items: center;
  margin-left: 10px;

  span {
    margin-top: 2px;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const LogoImgContainer = styled.div`
  display: flex;
  gap: 5px;
  margin-left: -6px;
  margin-top: 0;
  margin-bottom: 0;
`;
