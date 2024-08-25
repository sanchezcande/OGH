import React from "react";
import {
  FooterContainer,
  FooterContent,
  FooterText,
  Tel,
  Mail,
  Github,
  Instagram,
  Linkedin,
  SocialMediaContainer,
  TelMailContainer,
  Title,
  Logo,
} from "./Footer.styles";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation(); 
  return (
    <FooterContainer>
      <FooterContent>
        <div>
        <h4>{t("joinOurCommunity")}</h4>
          <SocialMediaContainer>
            <a href="https://github.com/OpenGateHub" target="_blank" rel="noreferrer">
              {" "}
              <Github />
            </a>{" "}
            <a href="https://www.instagram.com/opengatehub" target="_blank" rel="noreferrer">
            <Instagram />{" "}
            </a>
            <a href="https://www.linkedin.com/company/opengatehub" target="_blank"  rel="noreferrer">
              <Linkedin />
            </a>
          </SocialMediaContainer>
          <FooterText>{t("privacyPolicy")}</FooterText>
          <Title>
            <Logo />
            OpenGate<span>Hub</span>
          </Title>
        </div>
        <div>
        <h4>{t("aboutUs")}</h4>
        <FooterText>{t("faq")}</FooterText>
          <FooterText>{t("services")}</FooterText>
          <Title>
            <Logo />
            OpenGate<span>Hub</span>
          </Title>
        </div>
        <div>
        <h4>{t("connectWithUs")}</h4>
          <TelMailContainer>
            <Tel />
            <FooterText>+549 11 2348 5638</FooterText>
          </TelMailContainer>
          <TelMailContainer>
            <Mail /> <FooterText>info@opengatehub.com</FooterText>
          </TelMailContainer>
          <Title>
            <Logo />
            OpenGate<span>Hub</span>
          </Title>
        </div>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;
