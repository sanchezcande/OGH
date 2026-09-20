import React from "react";
import {
  PrivacyPolicyContainer,
  PrivacyPolicyTitle,
  PrivacyPolicySection,
  SectionTitle,
  SectionContent,
  List,
} from "../../src/styles/pagesStyles/PrivacyPolicy.styles";
import SEO from "../../src/components/SEO/SEO";

// Terms of Service. La pidieron las plataformas (TikTok exige una URL de términos para
// aprobar la app de publicación, 20/09/2026) y además es lo mínimo que corresponde tener
// junto a la política de privacidad. Reusa los estilos de /privacy-policy.

const ACTUALIZADO = "September 20, 2026";

const SECCIONES = [
  {
    title: "1. Who we are",
    content:
      "OpenGateHub is a software company that builds automation and provides nearshore development teams. These terms cover this website (opengatehub.com), its forms and downloadable resources, and the internal tools we run under the OpenGateHub name. You can reach us at candelaria@opengatehub.com.",
  },
  {
    title: "2. Using this site",
    content:
      "You may browse the site, read our content and download the resources we offer for free. You agree not to misuse the site: no attempts to break into it, scrape it at a volume that degrades it, or use it to send unsolicited messages to anyone.",
  },
  {
    title: "3. Forms and resources",
    content:
      "Some resources ask for your name and email. We use that information to send you the resource you asked for and, occasionally, related content from us. You can unsubscribe at any time from any email we send. How we store and handle that data is described in our Privacy Policy.",
  },
  {
    title: "4. Our content",
    content:
      "The text, guides, PDFs and designs on this site belong to OpenGateHub. You can read them, share them and use them inside your own company. You cannot resell them, republish them as your own, or present them as someone else's work.",
  },
  {
    title: "5. Services and quotes",
    content:
      "Anything you see here about our services, including timelines, pricing ranges or results, is informational. The terms that apply to actual work are the ones in the written agreement we sign for that project.",
  },
  {
    title: "6. Internal tools",
    content:
      "We run internal tools that connect to our own social media accounts to schedule and publish our own content. These tools are not offered to third parties, have no sign-up, and never access anyone else's accounts or data.",
  },
  {
    title: "7. No warranty",
    content:
      "The site and its free resources are provided as they are. We put care into them, but we cannot promise they fit every situation, and we are not liable for decisions you make based on them.",
  },
  {
    title: "8. Changes",
    content:
      "We may update these terms. The date at the top always reflects the current version, and continuing to use the site after a change means you accept it.",
  },
  {
    title: "9. Governing law",
    content:
      "These terms are governed by the laws of Argentina, where OpenGateHub is registered.",
  },
];

const Terms = () => (
  <>
    <SEO
      title="Terms of Service | OpenGateHub"
      description="The terms that apply to opengatehub.com, its resources and our internal tools."
      robots="noindex, follow"
    />
    <PrivacyPolicyContainer>
      <PrivacyPolicyTitle>Terms of Service</PrivacyPolicyTitle>
      <SectionContent>Last updated: {ACTUALIZADO}</SectionContent>
      <SectionContent>
        These terms apply to opengatehub.com and to the resources and tools we publish under
        the OpenGateHub name. By using the site you agree to them.
      </SectionContent>
      {SECCIONES.map((s, i) => (
        <PrivacyPolicySection key={i}>
          <SectionTitle>{s.title}</SectionTitle>
          <SectionContent>{s.content}</SectionContent>
        </PrivacyPolicySection>
      ))}
      <PrivacyPolicySection>
        <SectionTitle>10. Contact</SectionTitle>
        <List>
          <li>candelaria@opengatehub.com</li>
          <li>opengatehub.com</li>
        </List>
      </PrivacyPolicySection>
    </PrivacyPolicyContainer>
  </>
);

export default Terms;
