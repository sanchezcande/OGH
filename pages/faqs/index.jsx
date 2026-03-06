import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import SEO from "../../src/components/SEO/SEO";
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": Object.keys(faqs).flatMap(category =>
      faqs[category].questions.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    )
  };

  return (
    <>
      <SEO
        title="Workflow Automation FAQ — Common Questions Answered | OpenGateHub"
        description="Questions about workflow automation, staff augmentation, and AI for business? We answer the most common ones from companies like yours — honest, practical, no jargon."
        keywords="automation FAQ, workflow automation questions, AI for business FAQ, staff augmentation concerns"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </SEO>

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
