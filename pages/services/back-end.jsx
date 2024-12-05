import { useTranslation } from "react-i18next";
import Head from "next/head";

const BackEnd = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t("backend.title")} - OpenGateHub</title>
        <meta name="description" content={t("backend.description")} />
        <meta name="keywords" content="Backend, back-end, Cloud, Node.js, Python, AWS, Google Cloud, Azure, Scalable Systems" />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>{t("backend.title")}</h1>
        <p>{t("backend.description")}</p>

        <h2>{t("backend.solutions.title2")}</h2>
        <ul>
          <li>{t("backend.solutions.scalable")}</li>
          <li>{t("backend.solutions.secure")}</li>
          <li>{t("backend.solutions.cloud")}</li>
          <li>{t("backend.solutions.efficient")}</li>
        </ul>

        <h2>{t("backend.stepsTitle")}</h2>
        <ol>
          <li>{t("backend.steps.step1")}</li>
          <li>{t("backend.steps.step2")}</li>
          <li>{t("backend.steps.step3")}</li>
        </ol>

        <p>
          <strong>{t("backend.callToAction")}</strong>
        </p>
      </div>
    </>
  );
};

export default BackEnd;
