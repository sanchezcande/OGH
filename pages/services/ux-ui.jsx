import { useTranslation } from "react-i18next";
import Head from "next/head";

const UxUi = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t("uxui.title")} - OpenGateHub</title>
        <meta name="description" content={t("uxui.description")} />
        <meta name="keywords" content="UX Design, UI Design, User Experience, Wireframes, Prototypes, Intuitive Interfaces" />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>{t("uxui.title")}</h1>
        <p>{t("uxui.description")}</p>

        <h2>{t("uxui.solutions.title2")}</h2>
        <ul>
          <li>{t("uxui.solutions.intuitive")}</li>
          <li>{t("uxui.solutions.engaging")}</li>
          <li>{t("uxui.solutions.functional")}</li>
        </ul>

        <h2>How will this transform your business?</h2>
        <p>{t("uxui.businessImpact")}</p>

        <h2>{t("uxui.stepsTitle")}</h2>
        <ol>
          <li>{t("uxui.steps.step1")}</li>
          <li>{t("uxui.steps.step2")}</li>
          <li>{t("uxui.steps.step3")}</li>
          <li>{t("uxui.steps.step4")}</li>
        </ol>

        <p>
          <strong>{t("uxui.callToAction")}</strong>
        </p>
      </div>
    </>
  );
};

export default UxUi;
