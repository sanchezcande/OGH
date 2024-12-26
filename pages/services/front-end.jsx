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

const FrontEnd = () => {
  const { t } = useTranslation();

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
        <ServiceTitle>{t("frontend.title")}</ServiceTitle>
        <Divider />
        <Description>{t("frontend.description")}</Description>

        <ServiceTitle>
          {t("frontend.solutions.title")}
        </ServiceTitle>
        <ServiceList>
          <li>{t("frontend.solutions.responsive")}</li>
          <li>{t("frontend.solutions.interactive")}</li>
          <li>{t("frontend.solutions.customized")}</li>
        </ServiceList>

        <ServiceTitle>{t("frontend.stepsTitle")}</ServiceTitle>
        <NumberedList>
          <li>{t("frontend.steps.step1")}</li>
          <li>{t("frontend.steps.step2")}</li>
          <li>{t("frontend.steps.step3")}</li>
        </NumberedList>

        <HighlightText>
          {t("frontend.callToAction")}
        </HighlightText>
        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default FrontEnd;
