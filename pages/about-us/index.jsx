import React, { useEffect, useRef } from "react";
import {
  ImageText,
  Container,
  HighlightedWord,
  CompanyDescription,
} from "../../src/styles/pagesStyles/AboutUs.styles";
import { useTranslation } from "react-i18next";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import Head from "next/head";
import Image from "next/image";
import AboutTimeline from "../../src/components/Timeline/AboutTimeline";
import TeamSection from "../../src/components/TeamSection/TeamSection";

export const AboutUsCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("aboutUsCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
      highlightWord="Right"
    />
  );
};

const AboutUs = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  const imageRef = useRef(null);
  const textRef = useRef(null);
  const companyDescRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" },
    );

    const currentImageRef = imageRef.current;
    const currentTextRef = textRef.current;
    const currentCompanyDescRef = companyDescRef.current;

    if (currentImageRef) observer.observe(currentImageRef);
    if (currentTextRef) observer.observe(currentTextRef);
    if (currentCompanyDescRef) observer.observe(currentCompanyDescRef);

    return () => {
      if (currentImageRef) observer.unobserve(currentImageRef);
      if (currentTextRef) observer.unobserve(currentTextRef);
      if (currentCompanyDescRef) observer.unobserve(currentCompanyDescRef);
    };
  }, []);

  return (
    <Container ref={ref}>
      <Head>
        <title>About OpenGateHub — Workflow Automation & Engineering Team | OpenGateHub</title>
        <meta
          name="description"
          content="We're a human-first automation and engineering company from Latin America. Near-timezone, senior teams that embed into your workflow — 9.7/10 CSAT, 87% on-time delivery."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="About OpenGateHub — Workflow Automation & Engineering Team" />
        <meta
          property="og:description"
          content="Human-first execution, measurable outcomes. We embed senior engineers and automate workflows for impact-driven companies — 9.7/10 CSAT, 7.3-day kickoff."
        />
        <meta property="og:image" content="https://opengatehub.com/Reducido4oscuro.png" />
        <meta
          name="keywords"
          content="OpenGateHub, workflow automation company, staff augmentation, engineering team, process automation, near-shore development"
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <CompanyDescription ref={companyDescRef}>
        <h1>
          {t("aboutUsTitle_part1")}
          <HighlightedWord className="animate">
            {t("aboutUsTitle_highlight")}
          </HighlightedWord>
        </h1>
        <h2 className="subtitle">{t("aboutUsSubtitle")}</h2>
        <p>
          {t("aboutUsText")}
          {t("aboutUsLastLine")}
          <span className="bold-text">{t("aboutUsTextBold")}</span>
        </p>
      </CompanyDescription>

      <ImageText>
        <div className="image-container" ref={imageRef}>
          <Image
            src="/images/Cande.png"
            width={250}
            height={250}
            quality={100}
            alt={t("heroAlt") || "OpenGateHub Team"}
            priority
          />

          <div className="founder-info">
            <h3 className="founder-name">Candelaria Sanchez</h3>
            <p className="founder-role">Co-founder & CTO</p>
          </div>
        </div>

        <div className="founder-bio" ref={textRef}>
          <p className="bio-text">{t("aboutUsFounderBio")}</p>
        </div>
      </ImageText>

      <AboutTimeline />

      <TeamSection />

      <AboutUsCallToAction />
    </Container>
  );
});

AboutUs.displayName = "AboutUs";

export default AboutUs;
