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

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <div>
          <h4>Join Our Community</h4>
          <SocialMediaContainer>
            <a href="https://github.com/OpenGateHub" target="_blank" rel="noreferrer">
              {" "}
              <Github />
            </a>{" "}
            <Instagram />{" "}
            <a href="https://www.linkedin.com/company/opengatehub" target="_blank"  rel="noreferrer">
              <Linkedin />
            </a>
          </SocialMediaContainer>
          <FooterText>Privacy Policy</FooterText>
          <Title>
            <Logo />
            OpenGate<span>Hub</span>
          </Title>
        </div>
        <div>
          <h4>About Us </h4>
          <FooterText>FAQ</FooterText>
          <FooterText>Services</FooterText>
          <Title>
            <Logo />
            OpenGate<span>Hub</span>
          </Title>
        </div>
        <div>
          <h4>Connect With Us</h4>
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
