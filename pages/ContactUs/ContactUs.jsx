import ContactForm from "../../components/ContactForm/ContactForm";
import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./ContactUs.styles";

const ContactUs = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  return (
    <Container ref={ref}>
      <div style={{ marginBottom: "20px" }} />
      <h1>{t("contactUsTitle")}</h1>
      <h2>{t("contactUsSubtitle")}</h2>
      <ContactForm />
    </Container>
  );
});

export default ContactUs;
