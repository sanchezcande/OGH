import React from "react";
import {
  FooterContainer,
  FooterTop,
  FooterColumn,
  FooterHeading,
  FooterLink,
  FooterBottom,
  SocialRow,
  SocialIcon,
  EmailRow,
} from "./Footer.styles";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import OGHLogo from "../Logo/OGHLogo";
import { FaGithub, FaInstagram, FaLinkedin, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <FooterContainer>
      <FooterTop>
        {/* Brand */}
        <FooterColumn className="brand-col">
          <OGHLogo size={18} />
          <p className="brand-desc">
            {t("footerTagline", "Workflow automation & staff augmentation for teams that move fast.")}
          </p>
          <SocialRow>
            <SocialIcon href="https://github.com/OpenGateHub" target="_blank" rel="noreferrer" aria-label="GitHub">
              <FaGithub />
            </SocialIcon>
            <SocialIcon href="https://www.instagram.com/candelaria.sanchezg/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </SocialIcon>
            <SocialIcon href="https://www.linkedin.com/in/candelaria-sanchez/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <FaLinkedin />
            </SocialIcon>
          </SocialRow>
        </FooterColumn>

        {/* Services */}
        <FooterColumn>
          <FooterHeading>{t("services")}</FooterHeading>
          <FooterLink as={Link} href="/services/workflow-automation">Workflow Automation</FooterLink>
          <FooterLink as={Link} href="/services/staff-augmentation">Staff Augmentation</FooterLink>
        </FooterColumn>

        {/* Company */}
        <FooterColumn>
          <FooterHeading>{t("aboutUs")}</FooterHeading>
          <FooterLink as={Link} href="/blog">{t("Blog")}</FooterLink>
          <FooterLink as={Link} href="/about-us">{t("aboutUs")}</FooterLink>
          <FooterLink as={Link} href="/faqs">{t("faq")}</FooterLink>
        </FooterColumn>

        {/* Resources & Contact */}
        <FooterColumn>
          <FooterHeading>{t("connectWithUs")}</FooterHeading>
          <FooterLink as={Link} href="/calculator">{t("calculator.footerLink")}</FooterLink>
          <FooterLink as={Link} href="/privacy-policy">{t("privacyPolicy")}</FooterLink>
          <EmailRow>
            <FaEnvelope />
            <a href="mailto:info@opengatehub.com">info@opengatehub.com</a>
          </EmailRow>
        </FooterColumn>
      </FooterTop>

      <FooterBottom>
        <span>&copy; {new Date().getFullYear()} OpenGateHub. All rights reserved.</span>
      </FooterBottom>
    </FooterContainer>
  );
};

export default Footer;
