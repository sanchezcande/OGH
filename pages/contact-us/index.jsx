import ContactForm from "../../src/components/ContactForm/ContactForm";
import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "../../src/styles/pagesStyles/ContactUs.styles";
import Head from "next/head";

const ContactUs = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  return (
    <Container ref={ref}>
      <Head>
        <title>{t("contactUsTitle")}</title>
      </Head>
      <div style={{ marginBottom: "20px" }} />
      <h1>{t("contactUsTitle")}</h1>
      <h2>{t("contactUsSubtitle")}</h2>
      <ContactForm />
    </Container>
  );
});

export default ContactUs;
