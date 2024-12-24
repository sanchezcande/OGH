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


const UxUi = () => {
  const { t } = useTranslation();

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
        <ServiceTitle>{t("uxui.title")}</ServiceTitle>
        <Divider />
        <Description>{t("uxui.description")}</Description>

        <ServiceTitle>
          {t("uxui.solutions.title2")}
        </ServiceTitle>
        <ServiceList>
          <li>{t("uxui.solutions.intuitive")}</li>
          <li>{t("uxui.solutions.engaging")}</li>
          <li>{t("uxui.solutions.functional")}</li>
        </ServiceList>

        <ServiceTitle>
          {t("uxui.businessImpactTitle")}
        </ServiceTitle>
        <Description>{t("uxui.businessImpact")}</Description>

        <ServiceTitle>{t("uxui.stepsTitle")}</ServiceTitle>
        <NumberedList>
          <li>{t("uxui.steps.step1")}</li>
          <li>{t("uxui.steps.step2")}</li>
          <li>{t("uxui.steps.step3")}</li>
          <li>{t("uxui.steps.step4")}</li>
        </NumberedList>

        <HighlightText>
          {t("uxui.callToAction")}
        </HighlightText>
        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default UxUi;
