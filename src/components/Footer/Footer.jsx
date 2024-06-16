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
  TelMailContainer
} from "./Footer.styles";

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <div>
          <h3>HubOpenGate</h3>
          <FooterText>Careers</FooterText>
          <FooterText>News</FooterText>
          <FooterText>Privacy Policy</FooterText>
          <h4>Join Our Community</h4>
          <SocialMediaContainer>
            <Github /> <Instagram /> <Linkedin />
          </SocialMediaContainer>
        </div>
        <div>
          <h3>About Us </h3>
          <FooterText>FAQ</FooterText>
          <FooterText>Blog</FooterText>
          <FooterText>Services</FooterText>
          <FooterText>Testimonials</FooterText>
          <FooterText>Accesibility</FooterText>
        </div>
        <div>
          <h3>Support</h3>
          <FooterText>User Guides</FooterText>
          <FooterText>Social Responsibility</FooterText>
          <h4>Connect With Us</h4>
          <TelMailContainer>
            <Tel />
            <FooterText>+55121486324986</FooterText>
          </TelMailContainer>
          <TelMailContainer>
            <Mail /> <FooterText>hubopengate@gmail.com</FooterText>
          </TelMailContainer>
        </div>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;
