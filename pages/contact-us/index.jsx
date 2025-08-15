import ContactForm from "../../src/components/ContactForm/ContactForm";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  MainWrapper,
  LeftColumn,
  RightColumn,
  Title,
  HighlightedText,
  SubTitle,
  ContactInfo,
  ContactItem,
  IconWrapper,
} from "../../src/styles/pagesStyles/ContactUs.styles";
import Head from "next/head";
import { FaPhone, FaEnvelope } from 'react-icons/fa';

const ContactUs = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  const mainWrapperRef = useRef(null);

  const contactDetails = {
    email: t('contactPage.email', "info@opengatehub.com"),
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.animate-on-visible').forEach(el => {
                el.classList.add('visible');
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentMainWrapperRef = mainWrapperRef.current;
    if (currentMainWrapperRef) {
      observer.observe(currentMainWrapperRef);
    }

    return () => {
      if (currentMainWrapperRef) {
        observer.unobserve(currentMainWrapperRef);
      }
    };
  }, []);

  return (
    <Container ref={ref}>
      <Head>
        <title>{t("contactUsMetaTitle", "Contact Us - OpenGateHub")}</title>
        <meta name="description" content={t("contactUsMetaDescription", "Get in touch with OpenGateHub. We are here to help you with your digital transformation needs.")} />
      </Head>

      <MainWrapper ref={mainWrapperRef}>
        <LeftColumn className="animate-on-visible">
          <Title className="animate-on-visible">
            {t("contactPage.getIn", "Get in")}{" "}
            <HighlightedText>{t("contactPage.touch", "Touch")}</HighlightedText>
          </Title>
          <SubTitle>
            {t("contactPage.getInTouchSubtitleNew", "Let's connect! We're here to understand your vision and explore how we can create impactful solutions together.")}
          </SubTitle>
          <ContactInfo>
            <ContactItem>
              <IconWrapper><FaEnvelope /></IconWrapper>
              <div>
                <span>{t("contactPage.emailLabel", "Email")}</span>
                <p>{contactDetails.email}</p>
              </div>
            </ContactItem>
          </ContactInfo>
        </LeftColumn>

        <RightColumn className="animate-on-visible">
           <Title className="form-title animate-on-visible">
            {t("contactPage.comeAnd", "Come and")}{" "}
            <HighlightedText>{t("contactPage.joinUs", "Join Us")}</HighlightedText>
          </Title>
          <ContactForm />
        </RightColumn>
      </MainWrapper>
    </Container>
  );
});

ContactUs.displayName = 'ContactUs';

export default ContactUs;
