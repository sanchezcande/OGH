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
        <ServiceTitle>{t("graphicDesign.title")}</ServiceTitle>
        <Divider />

        <ServiceListCross>
          <li>{t("graphicDesign.questions.q1")}</li>
          <li>{t("graphicDesign.questions.q2")}</li>
          <li>{t("graphicDesign.questions.q3")}</li>
        </ServiceListCross>

        <Description>{t("graphicDesign.description")}</Description>

        <ServiceTitle>
          {t("graphicDesign.solutions.title")}
        </ServiceTitle>
        <ServiceList>
          <li>{t("graphicDesign.solutions.branding")}</li>
          <li>{t("graphicDesign.solutions.materials")}</li>
          <li>{t("graphicDesign.solutions.consistency")}</li>
        </ServiceList>

        <Description>{t("graphicDesign.vision")}</Description>

        <ServiceTitle>
          {t("graphicDesign.stepsTitle")}
        </ServiceTitle>
        <NumberedList>
          <li>{t("graphicDesign.steps.step1")}</li>
          <li>{t("graphicDesign.steps.step2")}</li>
          <li>{t("graphicDesign.steps.step3")}</li>
          <li>{t("graphicDesign.steps.step4")}</li>
        </NumberedList>

        <HighlightText>
          {t("graphicDesign.callToAction")}
        </HighlightText>
        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default GraphicDesign;
