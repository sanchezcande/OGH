import {
  Container,
  Hero,
  Title,
  Subtitle,
  CTAButton,
  GradientOverlay,
  Highlight,
  Section,
  SectionTitle,
  FloatingBlob,
  PlanSteps,
  SectionText,
  ImageContainer,
  Glow,
  PlanSection,
} from "../src/styles/pagesStyles/HomePages.styles";
import { useTranslation } from "react-i18next";
import CallToActionBlock from "../src/components/CallToAction/CallToAction";
import Head from "next/head";
import { InView } from "../src/components/InView/InView";
import { ReviewsSection } from "../src/components/Reviews/ReviewsSection";
import { motion } from "framer-motion";
import { useState } from "react";
import React from "react";
import { FaProjectDiagram } from "react-icons/fa";

export async function getServerSideProps() {
  return { props: {} };
}

export const HomeCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("homeCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
    />
  );
};

const ServiceBox = ({ icon, title, description, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      className="service-box"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.15, delay: delay * 0.1 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.1 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
        borderRadius: "16px",
        padding: "2rem",
        height: "100%",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(249, 123, 114, 0.2)",
        transition: "all 0.15s ease"
      }}
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.1 }}
        style={{
          fontSize: "3rem",
          color: "var(--color-accent, #FF6B6B)",
          marginBottom: "1rem",
          display: "inline-block"
        }}
      >
        {icon}
      </motion.div>
      
      <h3 style={{ 
        fontSize: "1.5rem", 
        fontWeight: "700", 
        marginBottom: "1rem",
        color: "var(--color-text, #333)",
        transition: "color 0.2s ease",
        ...(isHovered ? { color: "#E35A52" } : {})
      }}>
        {title}
      </h3>
      
      <p style={{ 
        fontSize: "1rem", 
        lineHeight: "1.6",
        color: "#444444"
      }}>
        {description}
      </p>
      
      <motion.div 
        className="service-bg-circle"
        initial={{ scale: 0, opacity: 0 }}
        animate={isHovered ? { scale: 1, opacity: 0.1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "var(--color-accent, #FF6B6B)",
          right: "-150px",
          bottom: "-150px",
          zIndex: "-1"
        }}
      />
    </motion.div>
  );
};

const TestimonialCard = ({ author, role, company, content, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      className="testimonial-card"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.15, delay: delay * 0.1 }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.1 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "2rem",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(249, 123, 114, 0.2)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.15s ease",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {isHovered && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--color-accent, #FF6B6B)",
            zIndex: 0
          }}
        />
      )}
      
      <motion.div 
        style={{ 
          fontSize: "2rem", 
          color: "var(--color-accent, #FF6B6B)",
          marginBottom: "1rem",
          position: "relative",
          zIndex: 1
        }}
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.1 }}
      >
        "
      </motion.div>
      
      <p style={{ 
        fontSize: "1rem", 
        lineHeight: "1.8",
        flex: 1,
        marginBottom: "1.5rem",
        position: "relative",
        zIndex: 1
      }}>
        {content}
      </p>
      
      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{ 
          fontWeight: "700", 
          fontSize: "1.1rem",
          marginBottom: "0.2rem",
          color: isHovered ? "#E35A52" : "var(--color-text, #333)",
          transition: "color 0.2s ease"
        }}>
          {company}
        </p>
        <p style={{ 
          fontSize: "0.9rem", 
          color: "var(--color-text-muted, #666)" 
        }}>
          {role}
        </p>
      </div>
    </motion.div>
  );
};

export default function HomePage() {
  const { t } = useTranslation();

  const parseHighlightedText = (text) => {
    if (!text) return [];
    const parts = text.split(/<highlight>|<\/highlight>/);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <span key={index} className="highlighted-word">{part}</span>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const testimonialData = [
    {
      content: t("reviews.skylar.text"),
      company: t("reviews.skylar.company"),
      role: t("reviews.skylar.role")
    },
    {
      content: t("reviews.techvision.text"),
      company: t("reviews.techvision.company"),
      role: t("reviews.techvision.role")
    },
    {
      content: t("reviews.greenleaf.text"),
      company: t("reviews.greenleaf.company"),
      role: t("reviews.greenleaf.role")
    },
    {
      content: t("reviews.innovatelab.text"),
      company: t("reviews.innovatelab.company"),
      role: t("reviews.innovatelab.role")
    }
  ];

  return (
    <>
      <Head>
        <title>OpenGateHub</title>
        <meta name="description" content="OpenGateHub" />
        <link rel="canonical" href="https://opengatehub.com/" />
        <meta property="og:title" content={t("OpenGateHub")} />
        <meta property="og:description" content={t("pageDescription")} />
        <meta property="og:url" content="https://opengatehub.com/" />
        <meta
          name="keywords"
          content="OpenGateHub, Open Gate Hub, Open GateHub, software develop, web develop, páginas web"
        />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
      </Head>

      <Container>
        <FloatingBlob />
        <Hero>
          <GradientOverlay />
          {/* <ImageContainer>
            <LottieAnimation
              animationPath="/animations/home.json"
              width="100%"
              height="auto"
            />
          </ImageContainer> */}
          {/* ⬅ este! */}

          <Glow />
          <Title>
            <span className="animated">
              {t("heroAnimatedText.part1")}{" "}
              <span className="highlighted-word">
                {t("heroAnimatedText.highlight1")}
              </span>{" "}
              {t("heroAnimatedText.part2")}{" "}
              <span className="highlighted-word">
                {t("heroAnimatedText.highlight2")}
              </span>
              .
            </span>
          </Title>
          <Subtitle>
            {t("heroSubtitle")}
          </Subtitle>
          <CTAButton
            href="https://calendly.com/sanchezgcandelaria"
            target="_blank"
            rel="noopener noreferrer"
            className="primary-cta"
          >
            {t("ctaButton")}
          </CTAButton>
        </Hero>
        
        <Section className="serious-block">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15 }}
          >
            <SectionTitle style={{"--i": 0}}>
              {parseHighlightedText(t("problemTitle"))}
            </SectionTitle>
            <SectionText>{t("problemText")}</SectionText>
          </motion.div>
        </Section>

        <Section className="serious-block">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15 }}
          >
            <SectionTitle style={{"--i": 1}}>
              {parseHighlightedText(t("weGetYouTitle"))}
            </SectionTitle>
            <SectionText>{t("weGetYouText")}</SectionText>
          </motion.div>
        </Section>
        
        {/* Services Section with Interactive Boxes */}
        <Section className="full-width">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: "center", marginBottom: "3rem" }}
          >
            <h2 style={{ 
              fontSize: "2.8rem", 
              fontWeight: "800",
              marginBottom: "1rem"
            }}>
              <span style={{ color: "var(--color-accent, #FF6B6B)" }}>{t("homeServicesSection.title")}</span>
            </h2>
            <p style={{ 
              fontSize: "1.2rem", 
              maxWidth: "800px", 
              margin: "0 auto", 
              color: "var(--color-text-muted, #666)"
            }}>
              {t("homeServicesSection.subtitle")}
            </p>
          </motion.div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1rem"
          }}>
            <ServiceBox 
              icon="💻"
              title={t("homeServicesSection.cards.softwareDevelopment.title")}
              description={t("homeServicesSection.cards.softwareDevelopment.description")}
              delay={0.1}
            />
            <ServiceBox 
              icon="🎨"
              title={t("homeServicesSection.cards.uxUiDesign.title")}
              description={t("homeServicesSection.cards.uxUiDesign.description")}
              delay={0.15}
            />
            <ServiceBox 
              icon="🤖"
              title={t("homeServicesSection.cards.aiSolutions.title")}
              description={t("homeServicesSection.cards.aiSolutions.description")}
              delay={0.2}
            />
            <ServiceBox 
              icon="📊"
              title={t("homeServicesSection.cards.dataAnalytics.title")}
              description={t("homeServicesSection.cards.dataAnalytics.description")}
              delay={0.25}
            />
            <ServiceBox 
              icon={<FaProjectDiagram style={{ color: '#E35A52' }}/>} // ícono de automatización
              title={t("homeServicesSection.cards.n8nAutomation.title")}
              description={t("homeServicesSection.cards.n8nAutomation.description")}
              delay={0.3}
            />
            <ServiceBox 
              icon="📱"
              title={t("homeServicesSection.cards.mobileDevelopment.title")}
              description={t("homeServicesSection.cards.mobileDevelopment.description")}
              delay={0.35}
            />
          </div>
        </Section>
        
        {/* Original Plan Section */}
        <PlanSection>
          <SectionTitle style={{"--i": 2}}>
            {t("planTitle")}
          </SectionTitle>
          <InView>
            {(isInView) => (
              <PlanSteps className={isInView ? 'in-view' : ''}>
                <li style={{"--i": 0}}>
                  <strong>1.</strong> {t("planSteps.step1")}
                </li>
                <li style={{"--i": 1}}>
                  <strong>2.</strong> {t("planSteps.step2")}
                </li>
                <li style={{"--i": 2}}>
                  <strong>3.</strong> {t("planSteps.step3")}
                </li>
              </PlanSteps>
            )}
          </InView>
          
          {/* New CTA button below plan section */}
          <div style={{textAlign: "center", marginTop: "3rem"}}>
            <CTAButton
              href="https://calendly.com/sanchezgcandelaria"
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-cta"
            >
              {t("homeServicesSection.startJourneyButton")}
            </CTAButton>
          </div>
        </PlanSection>
        
        {/* Testimonials / Social Proof Section */}
        <Section className="full-width testimonials-section" style={{
          background: "#f9f9f9",
          padding: "4rem 1rem",
          margin: "4rem 0"
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: "center", marginBottom: "3rem" }}
          >
            <h2 style={{ 
              fontSize: "2.8rem", 
              fontWeight: "800",
              marginBottom: "1rem"
            }}>
              {t("reviewsTitle")}
            </h2>
            <p style={{ 
              fontSize: "1.2rem", 
              maxWidth: "800px", 
              margin: "0 auto", 
              color: "#444444"
            }}>
               {t("reviewsSubtitle")}
          
            </p>
          </motion.div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            maxWidth: "1200px",
            margin: "0 auto"
          }}>
            {testimonialData.map((testimonial, index) => (
              <TestimonialCard 
                key={index}
                content={testimonial.content}
                company={testimonial.company}
                role={testimonial.role}
                delay={index * 0.05 + 0.1}
              />
            ))}
          </div>
        </Section>

        {/* Final CTA Section */}
        <HomeCallToAction />
      </Container>
    </>
  );
}
