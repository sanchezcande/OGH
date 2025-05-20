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
  ServiceListCross,
} from "../../src/styles/pagesStyles/servicesStyles/GraphicDesing.styles";
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

const GraphicDesign = () => {
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
        <title>Graphic Design - OpenGateHub</title>
        <meta name="description" content={t("graphicDesign.description")} />
        <meta
          name="keywords"
          content="Graphic Design, Branding, Visual Identity, Professional Graphics, Digital Campaigns"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <ServiceContainer>
        <ServiceTitle className="animate">{t("graphicDesign.title")}</ServiceTitle>
 

        <ServiceListCross>
          <li className="animate">{t("graphicDesign.questions.q1")}</li>
          <li className="animate">{t("graphicDesign.questions.q2")}</li>
          <li className="animate">{t("graphicDesign.questions.q3")}</li>
        </ServiceListCross>

        <Description className="animate">{t("graphicDesign.description")}</Description>

        <ServiceTitle className="animate">
          {t("graphicDesign.solutions.title")}
        </ServiceTitle>
        <ServiceList>
          <li className="animate">{t("graphicDesign.solutions.branding")}</li>
          <li className="animate">{t("graphicDesign.solutions.materials")}</li>
          <li className="animate">{t("graphicDesign.solutions.consistency")}</li>
        </ServiceList>

        <Description className="animate">{t("graphicDesign.vision")}</Description>

        <ServiceTitle className="animate">
          {t("graphicDesign.stepsTitle")}
        </ServiceTitle>
        <NumberedList>
          <li className="animate">{t("graphicDesign.steps.step1")}</li>
          <li className="animate">{t("graphicDesign.steps.step2")}</li>
          <li className="animate">{t("graphicDesign.steps.step3")}</li>
          <li className="animate">{t("graphicDesign.steps.step4")}</li>
        </NumberedList>

        <HighlightText className="animate">
          {t("graphicDesign.callToAction")}
        </HighlightText>
        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default GraphicDesign;
