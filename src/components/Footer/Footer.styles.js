import styled from "styled-components";
import { FaInstagram, FaLinkedin, FaGithub, FaEnvelope, FaPhone } from "react-icons/fa";

export const FooterContainer = styled.footer`
background-color: rgba(21, 62, 108, 0.3);
  color: #fff;
  padding: 20px;
  text-align: center;
  width: 100%; 
  min-width: 100vw; 
  position: relative; 

  h4 {
    margin-bottom: 10px;
    font-size: 14px;
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
  }
`;

export const FooterText = styled.p`
  font-size: 12px;
  margin: 10px 0;
`;

export const SocialMediaContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 10px;
  align-items: center;
`;

export const Instagram = styled(FaInstagram)`
  width: 20px;
  height: 20px;
  fill: #fff;
`;
export const Linkedin = styled(FaLinkedin)`
  width: 20px;
  height: 20px;
  fill: #fff;
`;
export const Github = styled(FaGithub)``;

export const Mail = styled(FaEnvelope)`
  width: 15px;
  height: 15px;
  fill: #fff;
`;
export const Tel = styled(FaPhone)`
  width: 15px;
  height: 15px;
  fill: #fff;
`;
export const TelMailContainer = styled.div`
  margin-top: -10px;
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const Title = styled.h3`
  font-weight: 800;
  font-size: 12px;
  display: flex;
  align-items: center;
  margin-left_10px;

  span {
    font-weight: 400;
  }
`;

export const LogoImgContainer = styled.div`
  display: flex;
  gap: 5px;
  margin-left:-10px;
`;
