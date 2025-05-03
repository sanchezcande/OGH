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
} from "../../src/styles/pagesStyles/servicesStyles/Backend.styles";
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

const BackEnd = () => {
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
        <title>Backend - OpenGateHub</title>
        <meta name="description" content={t("backend.description")} />
        <meta
          name="keywords"
          content="Backend, back-end, Cloud, Node.js, Python, AWS, Google Cloud, Azure, Scalable Systems"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <ServiceContainer>
        <ServiceTitle className="animate">{t("backend.title")}</ServiceTitle>
        <Divider className="animate" />
        <Description className="animate">{t("backend.description")}</Description>

        <ServiceTitle className="animate">
          {t("backend.solutions.title2")}
        </ServiceTitle>
        <ServiceList>
          <li className="animate">{t("backend.solutions.scalable")}</li>
          <li className="animate">{t("backend.solutions.secure")}</li>
          <li className="animate">{t("backend.solutions.cloud")}</li>
          <li className="animate">{t("backend.solutions.efficient")}</li>
        </ServiceList>

        <ServiceTitle className="animate">{t("backend.stepsTitle")}</ServiceTitle>
        <NumberedList>
          <li className="animate">{t("backend.steps.step1")}</li>
          <li className="animate">{t("backend.steps.step2")}</li>
          <li className="animate">{t("backend.steps.step3")}</li>
        </NumberedList>

        <HighlightText className="animate">
          <span>{t("backend.callToAction")}</span>
        </HighlightText>
        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default BackEnd;
