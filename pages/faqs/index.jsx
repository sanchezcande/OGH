import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Head from "next/head";
import {
  FAQContainer,
  FAQTitle,
  FAQTitle1,
  FAQList,
  Question,
  Answer,
} from "../../src/styles/pagesStyles/FAQs.styles";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";

export const FAQsCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("faqsCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
      highlightWord="Questions"
    />
  );
};

const FAQs = () => {
  const { t } = useTranslation();
  const faqs = t("faqs", { returnObjects: true });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    const items = document.querySelectorAll("li");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Workflow Automation FAQ — Common Questions Answered | OpenGateHub</title>
        <meta
          name="description"
          content="Questions about workflow automation, staff augmentation, and AI for business? We answer the most common ones from companies like yours — honest, practical, no jargon."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Workflow Automation FAQ | OpenGateHub" />
        <meta property="og:description" content="Common questions about workflow automation, staff augmentation, and AI for business — answered honestly." />
        <meta property="og:image" content="https://opengatehub.com/Reducido4oscuro.png" />
        <meta name="robots" content="index, follow" />
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
