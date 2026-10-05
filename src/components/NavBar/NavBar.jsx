import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import OGHLogo from "../Logo/OGHLogo";
import { Button, color, font, mq, useLang } from "../../styles/kit";

const COPY = {
  es: {
    links: [
      { label: "Contratar developers", href: "/services/staff-augmentation" },
      { label: "Nuestro filtro", href: "/#como-evaluamos" },
      { label: "Nosotros", href: "/about-us" },
      { label: "Blog", href: "/blog" },
    ],
    dev: "Sos developer?",
    cta: "Agendá tu llamada",
    open: "Abrir menú",
    close: "Cerrar menú",
    lang: "Idioma",
  },
  en: {
    links: [
      { label: "Staff augmentation", href: "/services/staff-augmentation" },
      { label: "Our filter", href: "/#como-evaluamos" },
      { label: "About", href: "/about-us" },
      { label: "Blog", href: "/blog" },
    ],
    dev: "Are you a developer?",
    cta: "Book a call",
    open: "Open menu",
    close: "Close menu",
    lang: "Language",
  },
};

// "alternates" llega cuando la dirección de la página cambia según el idioma (artículos del blog).
const NavBar = ({ alternates }) => {
  const lang = useLang();
  const copy = COPY[lang];
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on("routeChangeStart", close);
    router.events.on("hashChangeStart", close);
    return () => {
      router.events.off("routeChangeStart", close);
      router.events.off("hashChangeStart", close);
    };
  }, [router]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href) => !href.includes("#") && router.pathname.startsWith(href);

  const langSwitch = (
    <Lang role="group" aria-label={copy.lang}>
      {["es", "en"].map((code) => (
        <a
          key={code}
          href={
            alternates?.[code] ||
            `${code === "en" ? "/en" : ""}${router.asPath === "/" && code === "en" ? "" : router.asPath}`
          }
          hrefLang={code}
          aria-current={lang === code ? "true" : undefined}
        >
          {code.toUpperCase()}
        </a>
      ))}
    </Lang>
  );

  return (
    <Bar $scrolled={scrolled || open}>
      <Inner>
        <Link href="/" aria-label="OpenGateHub">
          <OGHLogo size={20} />
        </Link>

        <Links aria-label="Principal">
          {copy.links.map((item) => (
            <NavLink key={item.href} href={item.href} $active={isActive(item.href)}>
              {item.label}
            </NavLink>
          ))}
        </Links>

        <Right>
          <DevLink href="/devs" locale={false}>
            {copy.dev}
          </DevLink>
          {langSwitch}
          <Button as={Link} href="/contact-us" style={{ minHeight: 42, padding: "0 18px" }}>
            {copy.cta}
          </Button>
        </Right>

        <Burger
          type="button"
          aria-label={open ? copy.close : copy.open}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span data-open={open} />
        </Burger>
      </Inner>

      {open && (
        <Panel>
          {copy.links.map((item) => (
            <PanelLink key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </PanelLink>
          ))}
          <PanelLink href="/devs" locale={false} $muted onClick={() => setOpen(false)}>
            {copy.dev}
          </PanelLink>
          <PanelFoot>
            {langSwitch}
            <Button as={Link} href="/contact-us" $block onClick={() => setOpen(false)}>
              {copy.cta}
            </Button>
          </PanelFoot>
        </Panel>
      )}
    </Bar>
  );
};

export default NavBar;

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid ${({ $scrolled }) => ($scrolled ? color.line : "transparent")};
  transition: border-color 0.2s ease;
  font-family: ${font.sans};
`;

const Inner = styled.div`
  max-width: 1120px;
  height: 72px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  align-items: center;
  gap: 40px;

  ${mq.mobile} {
    height: 64px;
    padding: 0 20px;
  }
`;

const Links = styled.nav`
  display: flex;
  align-items: center;
  gap: 28px;
  margin-right: auto;

  ${mq.tablet} {
    display: none;
  }
`;

const NavLink = styled(Link)`
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ $active }) => ($active ? color.ink : color.inkSoft)};
  padding: 6px 0;
  border-bottom: 1px solid ${({ $active }) => ($active ? color.accent : "transparent")};
  transition: color 0.2s ease, border-color 0.2s ease;

  &:hover {
    color: ${color.ink};
    border-bottom-color: ${color.accent};
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 22px;

  ${mq.tablet} {
    display: none;
  }
`;

const DevLink = styled(Link)`
  font-size: 0.875rem;
  color: ${color.muted};

  &:hover {
    color: ${color.accent};
  }
`;

const Lang = styled.div`
  display: inline-flex;
  align-items: center;
  font-family: ${font.brand};
  font-size: 0.75rem;
  letter-spacing: 0.08em;

  a {
    padding: 6px 7px;
    color: ${color.muted};
  }

  a + a {
    border-left: 1px solid ${color.line};
  }

  a[aria-current="true"] {
    color: ${color.ink};
    font-weight: 600;
  }

  a:hover {
    color: ${color.accent};
  }
`;

const Burger = styled.button`
  display: none;
  margin-left: auto;
  width: 44px;
  height: 44px;
  background: none;
  border: 0;
  cursor: pointer;
  align-items: center;
  justify-content: center;

  span,
  span::before,
  span::after {
    display: block;
    width: 22px;
    height: 1.5px;
    background: ${color.ink};
    transition: transform 0.2s ease, background 0.2s ease;
  }

  span {
    position: relative;
  }

  span::before,
  span::after {
    content: "";
    position: absolute;
    left: 0;
  }

  span::before {
    top: -7px;
  }

  span::after {
    top: 7px;
  }

  span[data-open="true"] {
    background: transparent;
  }

  span[data-open="true"]::before {
    transform: translateY(7px) rotate(45deg);
  }

  span[data-open="true"]::after {
    transform: translateY(-7px) rotate(-45deg);
  }

  ${mq.tablet} {
    display: inline-flex;
  }
`;

const Panel = styled.div`
  display: none;

  ${mq.tablet} {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - 64px);
    padding: 12px 20px 28px;
    background: ${color.paper};
    border-top: 1px solid ${color.line};
    overflow-y: auto;
  }
`;

const PanelLink = styled(Link)`
  font-family: ${({ $muted }) => ($muted ? font.sans : font.serif)};
  font-size: ${({ $muted }) => ($muted ? "1rem" : "1.625rem")};
  letter-spacing: ${({ $muted }) => ($muted ? "0" : "-0.01em")};
  color: ${({ $muted }) => ($muted ? color.muted : color.ink)};
  padding: 16px 0;
  border-bottom: 1px solid ${color.line};
`;

const PanelFoot = styled.div`
  margin-top: auto;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
