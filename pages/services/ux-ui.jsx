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
} from "./Services.styles";

const UxUi = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t("uxui.title")} - OpenGateHub</title>
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

        <ServiceTitle titleColor="#00aaff">
          {t("uxui.solutions.title2")}
        </ServiceTitle>
        <ServiceList>
          <li>{t("uxui.solutions.intuitive")}</li>
          <li>{t("uxui.solutions.engaging")}</li>
          <li>{t("uxui.solutions.functional")}</li>
        </ServiceList>

        <ServiceTitle titleColor="#00aaff">
          {t("uxui.businessImpactTitle")}
        </ServiceTitle>
        <Description>{t("uxui.businessImpact")}</Description>

        <ServiceTitle titleColor="#00aaff">{t("uxui.stepsTitle")}</ServiceTitle>
        <NumberedList>
          <li>{t("uxui.steps.step1")}</li>
          <li>{t("uxui.steps.step2")}</li>
          <li>{t("uxui.steps.step3")}</li>
          <li>{t("uxui.steps.step4")}</li>
        </NumberedList>

        <HighlightText highlightColor="#ffd700">
          {t("uxui.callToAction")}
        </HighlightText>
      </ServiceContainer>
    </>
  );
};

export default UxUi;
