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
} from "../../src/styles/pagesStyles/servicesStyles/Services.styles";
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

const UxUi = () => {
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
        <title>UxUi - OpenGateHub</title>
        <meta name="description" content={t("uxui.description")} />
        <meta
          name="keywords"
          content="UX Design, UI Design, User Experience, Wireframes, Prototypes, Intuitive Interfaces"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <ServiceContainer>
        <ServiceTitle className="animate">{t("uxui.title")}</ServiceTitle>
        <Divider className="animate" />
        <Description className="animate">{t("uxui.description")}</Description>

        <ServiceTitle className="animate">
          {t("uxui.solutions.title2")}
        </ServiceTitle>
        <ServiceList>
          <li className="animate">{t("uxui.solutions.intuitive")}</li>
          <li className="animate">{t("uxui.solutions.engaging")}</li>
          <li className="animate">{t("uxui.solutions.functional")}</li>
        </ServiceList>

        <ServiceTitle className="animate">
          {t("uxui.businessImpactTitle")}
        </ServiceTitle>
        <Description className="animate">{t("uxui.businessImpact")}</Description>

        <ServiceTitle className="animate">{t("uxui.stepsTitle")}</ServiceTitle>
        <NumberedList>
          <li className="animate">{t("uxui.steps.step1")}</li>
          <li className="animate">{t("uxui.steps.step2")}</li>
          <li className="animate">{t("uxui.steps.step3")}</li>
          <li className="animate">{t("uxui.steps.step4")}</li>
        </NumberedList>

        <HighlightText className="animate">
          {t("uxui.callToAction")}
        </HighlightText>
        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default UxUi;
