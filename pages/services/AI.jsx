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
} from "../../src/styles/pagesStyles/servicesStyles/AI.styles";
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

const aiSolutions = () => {
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
        <title>AI - OpenGateHub</title>
        <meta name="description" content={t("aiSolutions.description")} />
        <meta
          name="keywords"
          content="Graphic Design, Branding, Visual Identity, Professional Graphics, Digital Campaigns"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <ServiceContainer>
        <ServiceTitle className="animate">{t("aiSolutions.title")}</ServiceTitle>
        <Divider className="animate" />

        <ServiceListCross>
          <li className="animate">{t("aiSolutions.questions.q1")}</li>
          <li className="animate">{t("aiSolutions.questions.q2")}</li>
          <li className="animate">{t("aiSolutions.questions.q3")}</li>
        </ServiceListCross>

        <Description className="animate">{t("aiSolutions.description")}</Description>

        <ServiceTitle className="animate">
          {t("aiSolutions.solutions.title")}
        </ServiceTitle>
        <ServiceList>
          <li className="animate">{t("aiSolutions.solutions.automation")}</li>
          <li className="animate">{t("aiSolutions.solutions.analytics")}</li>
          <li className="animate">{t("aiSolutions.solutions.customAI")}</li>
        </ServiceList>

        <Description className="animate">{t("aiSolutions.vision")}</Description>

        <ServiceTitle className="animate">
          {t("aiSolutions.stepsTitle")}
        </ServiceTitle>
        <NumberedList>
          <li className="animate">{t("aiSolutions.steps.step1")}</li>
          <li className="animate">{t("aiSolutions.steps.step2")}</li>
          <li className="animate">{t("aiSolutions.steps.step3")}</li>
          <li className="animate">{t("aiSolutions.steps.step4")}</li>
        </NumberedList>

        <HighlightText className="animate">
          {t("aiSolutions.callToAction")}
        </HighlightText>
        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default aiSolutions;
