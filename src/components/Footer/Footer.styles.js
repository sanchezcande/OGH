import styled from "styled-components";
import { ReactComponent as instagram } from "../../assets/icons/instagram.svg";
import { ReactComponent as linkedin } from "../../assets/icons/linkedin.svg";
import { ReactComponent as github } from "../../assets/icons/github.svg";
import { ReactComponent as mail } from "../../assets/icons/mail.svg";
import { ReactComponent as tel } from "../../assets/icons/tel.svg";
import { ReactComponent as LogoSvg } from "../../assets/logo/Logo1.svg";

export const FooterContainer = styled.footer`
  background-color: rgba(21, 62, 108, 0.2);
  color: #fff;
  padding: 20px;
  position: absolute;
  margin-left: 0;
  margin-right: 0;
  left: 0;
  right: 0;
  width: 100%;

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

export const Instagram = styled(instagram)`
  width: 20px;
  height: 20px;
  fill: #fff;
`;
export const Linkedin = styled(linkedin)`
  width: 20px;
  height: 20px;
  fill: #fff;
`;
export const Github = styled(github)``;

export const Mail = styled(mail)`
  width: 15px;
  height: 15px;
  fill: #fff;
`;
export const Tel = styled(tel)`
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

  span {
    font-weight: 400;
  }
`;

export const Logo = styled(LogoSvg)`
  width: 30px;
  height: 30px;
  margin-right: 7px;
  border-radius: 50%;

`;

