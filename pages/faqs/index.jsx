import { useTranslation } from "react-i18next";
import Head from "next/head";
import { FAQContainer, FAQTitle,FAQTitle1, FAQList, Question, Answer } from "../../src/styles/pagesStyles/FAQs.styles";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";

export const FAQsCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("faqsCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
    />
  );
};

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
        <FAQsCallToAction />
      </FAQContainer>
    </>
  );
};

export default FAQs;
