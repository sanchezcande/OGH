import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Head from "next/head";
import {
  ServiceContainer,
  ServiceTitle,
  ServiceList,
  HighlightText,
  Divider,
  Description,
  NumberedList,
} from "../../src/styles/pagesStyles/servicesStyles/Frontend.styles";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";

export const ServicesCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("servicesCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
    />
  );
};

const FrontEnd = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = document.querySelectorAll(".animate");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Frontend - OpenGateHub</title>
        <meta name="description" content={t("frontend.description")} />
        <meta
          name="keywords"
          content="Frontend, Responsive Design, React, Modern Frameworks, Web Development"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <ServiceContainer>
        <ServiceTitle className="animate">{t("frontend.title")}</ServiceTitle>
        <Divider className="animate" />
        <Description className="animate">{t("frontend.description")}</Description>

        <ServiceTitle className="animate">
          {t("frontend.solutions.title")}
        </ServiceTitle>
        <Divider className="animate" />

        <ServiceList>
          <li className="animate">{t("frontend.solutions.responsive")}</li>
          <li className="animate">{t("frontend.solutions.interactive")}</li>
          <li className="animate">{t("frontend.solutions.customized")}</li>
        </ServiceList>

        <ServiceTitle className="animate">{t("frontend.stepsTitle")}</ServiceTitle>
        <Divider className="animate" />

        <NumberedList>
          <li className="animate">{t("frontend.steps.step1")}</li>
          <li className="animate">{t("frontend.steps.step2")}</li>
          <li className="animate">{t("frontend.steps.step3")}</li>
        </NumberedList>

        <HighlightText className="animate">
          <span>{t("frontend.callToAction")}</span>
        </HighlightText>
        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default FrontEnd;
