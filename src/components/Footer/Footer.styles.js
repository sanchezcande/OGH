import styled from "styled-components";
import { ReactComponent as instagram } from "../../assets/icons/instagram.svg";
import { ReactComponent as linkedin } from "../../assets/icons/linkedin.svg";
import { ReactComponent as github } from "../../assets//icons/github.svg";
import { ReactComponent as mail } from "../../assets//icons/mail.svg";
import { ReactComponent as tel } from "../../assets//icons/tel.svg";

export const FooterContainer = styled.footer`
  background-color:rgba(21, 62, 108, 0.20);
  color: #fff;
  padding: 20px;
  position: absolute;
  margin-left: 0;
  margin-right: 0;
  left: 0;
  right: 0;
  width: 100%;
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
  font-size: 14px;
    margin: 10px 0;
`;

export const SocialMediaContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 10px;
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
export const Github = styled(github)`
    width: 20px;
    height: 20px;
    fill: #fff;
    `;

export const Mail = styled(mail)`
    width: 18px;
    height: 18px;
    fill: #fff;
    `;
export const Tel = styled(tel)`
    width: 18px;
    height: 18px;
    fill: #fff;
    `;
export const TelMailContainer = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
    `;