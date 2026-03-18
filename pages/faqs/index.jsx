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
        title="Workflow Automation & Staff Augmentation FAQ | LATAM | OpenGateHub"
        description="Questions about workflow automation, staff augmentation in Latin America, nearshore development, and AI for business? Honest, practical answers — no jargon."
        keywords="automation FAQ, workflow automation questions, staff augmentation FAQ LATAM, AI for business FAQ, nearshore development questions, staff augmentation Latin America FAQ"
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
