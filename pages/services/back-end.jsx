import { useTranslation } from "react-i18next";
import Head from "next/head";
import {
  ServiceContainer,
  ServiceTitle,
  ServiceList,
  HighlightText,
  Divider,
  Description,
  NumberedList,
} from "../../src/styles/pagesStyles/Services.styles";
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

  return (
    <>
      <Head>
        <title>Back-end - OpenGateHub</title>
        <meta name="description" content={t("backend.description")} />
        <meta
          name="keywords"
          content="Backend, back-end, Cloud, Node.js, Python, AWS, Google Cloud, Azure, Scalable Systems"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <ServiceContainer>
        <ServiceTitle>{t("backend.title")}</ServiceTitle>
        <Divider />
        <Description>{t("backend.description")}</Description>

        <ServiceTitle titleColor="#00aaff">
          {t("backend.solutions.title2")}
        </ServiceTitle>
        <ServiceList>
          <li>{t("backend.solutions.scalable")}</li>
          <li>{t("backend.solutions.secure")}</li>
          <li>{t("backend.solutions.cloud")}</li>
          <li>{t("backend.solutions.efficient")}</li>
        </ServiceList>

        <ServiceTitle titleColor="#00aaff">{t("backend.stepsTitle")}</ServiceTitle>
        <NumberedList>
          <li>{t("backend.steps.step1")}</li>
          <li>{t("backend.steps.step2")}</li>
          <li>{t("backend.steps.step3")}</li>
        </NumberedList>



        <HighlightText highlightColor="#ffd700">
          {t("backend.callToAction")}
        </HighlightText>
        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default BackEnd;
