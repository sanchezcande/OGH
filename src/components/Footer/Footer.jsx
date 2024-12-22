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
  LogoImgContainer,
} from "./Footer.styles";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import Logo from "../../assets/logo/Logo2.png";
import Link from "next/link";

const LogoImg = () => (
  <LogoImgContainer>
    <Image src={Logo} alt="software development company" width={30} />
    <Title>
      OpenGate<span>Hub</span>
    </Title>
  </LogoImgContainer>
);

const Footer = () => {
  const { t } = useTranslation();
  return (
    <FooterContainer>
      <FooterContent>
        <div>
          <h4>{t("joinOurCommunity")}</h4>
          <SocialMediaContainer>
            <a
              href="https://github.com/OpenGateHub"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              <Github />
            </a>{" "}
            <a
              href="https://www.instagram.com/opengatehub"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram />{" "}
            </a>
            <a
              href="https://www.linkedin.com/company/opengatehub"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin />
            </a>
          </SocialMediaContainer>
          <LogoImg />
        </div>
        <div>
          <h4>{t("aboutUs")}</h4>
          <Link href="/faqs" className="footer-link">
  {t("faq")}
</Link>
          <FooterText>{t("privacyPolicy")}</FooterText>
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
        </div>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;
