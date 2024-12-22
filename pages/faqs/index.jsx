import { useTranslation } from "react-i18next";
import Head from "next/head";
import { FAQContainer, FAQTitle,FAQTitle1, FAQList, Question, Answer } from "./FAQs.styles";

const FAQs = () => {
  const { t } = useTranslation();

  const faqs = t("faqs", { returnObjects: true });

  return (
    <>
      <Head>
        <title>{t("faqsTitle")} - OpenGateHub</title>
        <meta name="description" content={t("faqs.description")} />
      </Head>

      <FAQContainer>
        <FAQTitle1>{t("faqsTitle")}</FAQTitle1>
        <FAQList>
          {Object.keys(faqs).map((category) => (
            <div key={category}>
              <FAQTitle>{faqs[category].title}</FAQTitle>
              {faqs[category].questions.map((faq, index) => (
                <li key={index}>
                  <Question>{faq.question}</Question>
                  <Answer>{faq.answer}</Answer>
                </li>
              ))}
            </div>
          ))}
        </FAQList>
      </FAQContainer>
    </>
  );
};

export default FAQs;
