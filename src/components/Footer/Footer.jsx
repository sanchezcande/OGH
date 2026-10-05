import React from "react";
import Link from "next/link";
import styled from "styled-components";
import OGHLogo from "../Logo/OGHLogo";
import { color, font, mq, useLang } from "../../styles/kit";

const COPY = {
  es: {
    tagline: "Staff augmentation y contratación de developers senior, 100% remotos.",
    columns: [
      {
        title: "Para empresas",
        links: [
          { label: "Contratar developers", href: "/services/staff-augmentation" },
          { label: "Nuestro filtro", href: "/#como-evaluamos" },
          { label: "Preguntas frecuentes", href: "/faqs" },
          { label: "Agendá tu llamada", href: "/contact-us" },
        ],
      },
      {
        title: "Para developers",
        links: [{ label: "Entrá a la lista", href: "/devs" }],
      },
      {
        title: "Empresa",
        links: [
          { label: "Nosotros", href: "/about-us" },
          { label: "Blog", href: "/blog" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacidad", href: "/privacy-policy" },
          { label: "Términos", href: "/terms" },
        ],
      },
    ],
    rights: "Todos los derechos reservados.",
  },
  en: {
    tagline: "Staff augmentation and hiring of senior remote developers.",
    columns: [
      {
        title: "For companies",
        links: [
          { label: "Staff augmentation", href: "/services/staff-augmentation" },
          { label: "Our filter", href: "/#como-evaluamos" },
          { label: "FAQ", href: "/faqs" },
          { label: "Book a call", href: "/contact-us" },
        ],
      },
      {
        title: "For developers",
        links: [{ label: "Join the list", href: "/devs" }],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about-us" },
          { label: "Blog", href: "/blog" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy-policy" },
          { label: "Terms", href: "/terms" },
        ],
      },
    ],
    rights: "All rights reserved.",
  },
};

const SOCIAL = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/candelaria-sanchez/" },
  { label: "Instagram", href: "https://www.instagram.com/candelaria.sanchezg/" },
  { label: "GitHub", href: "https://github.com/OpenGateHub" },
];

const Footer = () => {
  const copy = COPY[useLang()];

  return (
    <Wrapper>
      <Inner>
        <Brand>
          <OGHLogo size={20} variant="light" />
          <p>{copy.tagline}</p>
          <a href="mailto:info@opengatehub.com">info@opengatehub.com</a>
        </Brand>

        <Columns>
          {copy.columns.map((column) => (
            <div key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} locale={item.href === "/devs" ? false : undefined}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Columns>
      </Inner>

      <Bottom>
        <span>
          &copy; {new Date().getFullYear()} OpenGateHub. {copy.rights}
        </span>
        <ul>
          {SOCIAL.map((item) => (
            <li key={item.label}>
              <a href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </Bottom>
    </Wrapper>
  );
};

export default Footer;

const Wrapper = styled.footer`
  --accent: ${color.accentBrand};
  background: ${color.ink};
  color: ${color.onInkSoft};
  font-family: ${font.sans};
  font-size: 0.9375rem;

  a {
    color: ${color.onInkSoft};
    transition: color 0.2s ease;
  }

  a:hover {
    color: ${color.onInk};
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
`;

const Inner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 80px 32px 56px;
  display: grid;
  grid-template-columns: 1.1fr 2fr;
  gap: 64px;

  ${mq.tablet} {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  ${mq.mobile} {
    padding: 56px 20px 40px;
  }
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;

  p {
    max-width: 32ch;
    line-height: 1.6;
    margin: 0;
  }

  a {
    color: ${color.onInk};
    text-decoration: underline;
    text-decoration-color: rgba(255, 255, 255, 0.3);
    text-underline-offset: 5px;
  }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;

  h2 {
    font-family: ${font.brand};
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    margin: 0 0 18px;
  }

  li + li {
    margin-top: 12px;
  }

  ${mq.mobile} {
    grid-template-columns: repeat(2, 1fr);
    gap: 40px 24px;
  }
`;

const Bottom = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 32px 32px;
  border-top: 1px solid ${color.lineDark};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.5);

  ul {
    display: flex;
    gap: 24px;
  }

  ${mq.mobile} {
    flex-direction: column-reverse;
    align-items: flex-start;
    padding: 24px 20px 32px;
  }
`;
