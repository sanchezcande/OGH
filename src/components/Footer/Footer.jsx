import React from "react";
import {
  FooterContainer,
  FooterContent,
  FooterText,
  Mail,
  Github,
  Instagram,
  Linkedin,
  SocialMediaContainer,
  TelMailContainer,
  Title,
  LogoImgContainer,
  ServicesGrid,
} from "./Footer.styles";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import Logo from "../../assets/logo/Logo2.png";
import Link from "next/link";

const LogoImg = () => (
  <LogoImgContainer>
    <Image src={Logo} alt="software development company" width={130} />
  </LogoImgContainer>
);

const Footer = () => {
  const { t } = useTranslation();
  const servicesList = [
    { text: "Staff Augmentation", href: "/services/staff-augmentation" },
    { text: "n8n Automation", href: "/services/n8n-automation" },
    { text: t("aiTitle"), href: "/services/AI" },
    { text: t("frontendTitle"), href: "/services/front-end" },
    { text: t("backendTitle"), href: "/services/back-end" },
    { text: t("uxuiTitle"), href: "/services/ux-ui" },
    { text: t("graphicDesignTitle"), href: "/services/graphic-design" },
  ];

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
          <h4>{t("services")}</h4>
          <ServicesGrid>
            {servicesList.map((service, index) => (
              <FooterText key={index}>
                <Link href={service.href} className="footer-link">
                  {service.text}
                </Link>
              </FooterText>
            ))}
          </ServicesGrid>
        </div>
        <div>
          <h4>{t("aboutUs")}</h4>
          <FooterText>
            <Link href="/blog" className="footer-link">
              {t("Blog")}
            </Link>
          </FooterText>
          <FooterText>
            <Link href="/about-us" className="footer-link">
              {t("aboutUs")}
            </Link>
          </FooterText>
          <FooterText>
            <Link href="/faqs" className="footer-link">
              {t("faq")}
            </Link>
          </FooterText>
          <FooterText>
            <Link href="/privacy-policy" className="footer-link">
              {t("privacyPolicy")}
            </Link>{" "}
          </FooterText>
        </div>
        <div>
          <h4>{t("connectWithUs")}</h4>
          <TelMailContainer>
            {/* <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
            >
              <Tel />
              <FooterText>+549 11 2348 5638</FooterText>
            </a> */}
          </TelMailContainer>
          <TelMailContainer>
            <Mail />{" "}
            <FooterText>
              {" "}
              <a href="mailto:info@opengatehub.com">info@opengatehub.com</a>
            </FooterText>
          </TelMailContainer>
          <LogoImg />
        </div>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;
