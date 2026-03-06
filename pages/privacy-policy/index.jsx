import React from "react";
import {
  PrivacyPolicyContainer,
  PrivacyPolicyTitle,
  PrivacyPolicySection,
  SectionTitle,
  SectionContent,
  List,
} from "../../src/styles/pagesStyles/PrivacyPolicy.styles";
import { useTranslation } from "react-i18next";
import SEO from "../../src/components/SEO/SEO";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const privacyPolicy = t("privacyPolicy1", { returnObjects: true });

  return (
    <>
      <SEO
        title="Privacy Policy | OpenGateHub"
        description="Learn about how OpenGateHub handles your data and privacy. We are committed to transparency and the security of your information."
        robots="noindex, follow"
      />
      <PrivacyPolicyContainer>
        <PrivacyPolicyTitle>{privacyPolicy.title}</PrivacyPolicyTitle>
        <SectionContent>{privacyPolicy.introduction}</SectionContent>
        {privacyPolicy.sections.map((section, index) => (
          <PrivacyPolicySection key={index}>
            <SectionTitle>{section.title}</SectionTitle>
            {section.content.includes("\n-") ? (
              <List>
                {section.content
                  .split("\n-")
                  .slice(1)
                  .map((item, i) => (
                    <li key={i}>{item.trim()}</li>
                  ))}
              </List>
            ) : (
              <SectionContent>{section.content}</SectionContent>
            )}
          </PrivacyPolicySection>
        ))}
      </PrivacyPolicyContainer>
    </>
  );
};

export default PrivacyPolicy;
