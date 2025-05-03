import styled from "styled-components";
import { FaInstagram, FaLinkedin, FaGithub, FaEnvelope, FaWhatsapp } from "react-icons/fa";

export const FooterContainer = styled.footer`
background-color: #FFF5F5;
  color: ${({ theme }) => theme.colors.text};
  padding: 20px;
  text-align: center;
  width: 100%; 
  min-width: 100vw; 
  position: relative; 

  h4 {
    margin-bottom: 10px;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.primaryDark};
  }
  a {
    text-decoration: underline;
  }
`;

export const FooterContent = styled.div`
  display: grid;
  padding-left: 20px;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  text-align: left;

  @media (max-width: 550px) {
    grid-template-columns: 1fr;
    text-align: center;
    padding-left: 0;
  }
`;

export const FooterText = styled.p`
  font-size: 12px;
  margin: 10px 0;
  color: ${({ theme }) => theme.colors.text};
`;

export const SocialMediaContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 10px;
  align-items: center;

  a svg {
    fill: ${({ theme }) => theme.colors.primaryDark};
    transition: all 0.3s ease;
    text-decoration: underline !important;
  }

  a:hover svg {
    fill: ${({ theme }) => theme.colors.accent};
    transform: scale(1.1);
  }
`;

const iconBase = `
  width: 20px;
  height: 20px;
  fill: #fff;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;
export const Linkedin = styled(FaLinkedin)`
  width: 20px;
  height: 20px;
  fill: #fff;
    transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;
export const Github = styled(FaGithub)`
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.1);
  }`;

export const Mail = styled(FaEnvelope)`
  width: 15px;
  height: 15px;
  fill: ${({ theme }) => theme.colors.primaryDark};
`;
// export const Tel = styled(FaWhatsapp)`
//   width: 20px;
//   height: 20px;
//   fill: #fff;
//   margin-bottom: 5px;
// `;
export const TelMailContainer = styled.div`
  margin-top: -5px;
  display: flex;
  gap: 10px;
  align-items: center;

  a {
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;

    &:hover {
      text-decoration: underline;
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
  margin-left:-6px;
`;
export const Instagram = styled(FaInstagram)`
  width: 20px;
  height: 20px;
  fill: #fff;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;
