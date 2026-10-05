// Base de diseño del sitio corporativo (home, servicio, contacto, Nosotros, preguntas frecuentes).
// Qué transmite: una firma seria y chica, no una plataforma. Por eso títulos en serif editorial,
// texto en una sans neutra, casi todo en tinta sobre papel y un solo acento usado con cuentagotas.
// Space Grotesk queda para el logo y las etiquetas chicas, que es donde suma sin restar seriedad.
// Los embudos (/devs, /hola, /preguntas, /apply) tienen sus propios estilos y no usan este archivo.
import React, { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { useRouter } from "next/router";

export const font = {
  serif: `Newsreader, "Source Serif 4", Charter, "Iowan Old Style", Georgia, serif`,
  sans: `Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`,
  brand: `"Space Grotesk", Inter, -apple-system, sans-serif`,
};

export const color = {
  ink: "#111111",
  inkSoft: "#3F3F46",
  muted: "#6B6B73",
  line: "#E4E4E7",
  lineDark: "rgba(255, 255, 255, 0.14)",
  paper: "#FFFFFF",
  paperAlt: "#F7F5F2",
  // El acento de marca (#CC5A50) no llega al contraste mínimo como texto chico sobre blanco (4,08:1).
  // Sobre fondos claros se usa un tono apenas más profundo (5,30:1); sobre tinta, el de marca (4,63:1).
  // Cada sección oscura redefine --accent, así el mismo token sirve en los dos contextos.
  accent: "var(--accent, #B5483F)",
  accentBrand: "#CC5A50",
  accentDark: "#A23F37",
  onInk: "#FFFFFF",
  onInkSoft: "rgba(255, 255, 255, 0.72)",
};

export const mq = {
  tablet: "@media (max-width: 960px)",
  mobile: "@media (max-width: 640px)",
};

// El idioma sale de la dirección: / es español, /en es inglés (ver i18n en next.config.js).
export const useLang = () => (useRouter().locale === "en" ? "en" : "es");

/* ───────── Estructura ───────── */

export const Page = styled.div`
  background: ${color.paper};
  color: ${color.ink};
  font-family: ${font.sans};
  font-size: 1rem;
  line-height: 1.65;
  overflow-x: clip;
`;

const tone = {
  paper: css`
    background: ${color.paper};
    color: ${color.ink};
  `,
  alt: css`
    background: ${color.paperAlt};
    color: ${color.ink};
  `,
  ink: css`
    --accent: ${color.accentBrand};
    background: ${color.ink};
    color: ${color.onInk};
  `,
};

export const Section = styled.section`
  ${({ $tone = "paper" }) => tone[$tone]}
  padding: ${({ $tight }) => ($tight ? "clamp(56px, 7vw, 96px)" : "clamp(72px, 10vw, 136px)")} 0;
  scroll-margin-top: 72px;
`;

export const Wrap = styled.div`
  width: 100%;
  max-width: ${({ $narrow }) => ($narrow ? "760px" : "1120px")};
  margin: 0 auto;
  padding: 0 32px;

  ${mq.mobile} {
    padding: 0 20px;
  }
`;

export const Rule = styled.hr`
  border: 0;
  border-top: 1px solid ${({ $onInk }) => ($onInk ? color.lineDark : color.line)};
  margin: 0;
`;

/* ───────── Texto ───────── */

export const Eyebrow = styled.p`
  font-family: ${font.brand};
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${({ $onInk }) => ($onInk ? color.onInkSoft : color.accent)};
  margin: 0 0 20px;
`;

export const Display = styled.h1`
  font-family: ${font.serif};
  font-weight: 400;
  font-size: clamp(2.5rem, 5.6vw, 4.5rem);
  line-height: 1.06;
  letter-spacing: -0.022em;
  text-wrap: balance;
  margin: 0;
  /* Newsreader tiene descendentes largos: este aire evita que toquen lo que sigue. */
  padding-bottom: 0.08em;

  em {
    font-style: italic;
    color: ${color.accent};
  }
`;

export const H2 = styled.h2`
  font-family: ${font.serif};
  font-weight: 400;
  font-size: clamp(1.9rem, 3.6vw, 3rem);
  line-height: 1.12;
  letter-spacing: -0.018em;
  text-wrap: balance;
  margin: 0;
  padding-bottom: 0.06em;
`;

export const H3 = styled.h3`
  font-family: ${font.serif};
  font-weight: 500;
  font-size: clamp(1.25rem, 1.8vw, 1.5rem);
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin: 0;
`;

export const Lead = styled.p`
  font-size: clamp(1.0625rem, 1.35vw, 1.25rem);
  line-height: 1.6;
  color: ${({ $onInk }) => ($onInk ? color.onInkSoft : color.inkSoft)};
  max-width: 60ch;
  margin: 0;
`;

export const Body = styled.p`
  font-size: 1.0625rem;
  line-height: 1.6;
  color: ${({ $onInk }) => ($onInk ? color.onInkSoft : color.inkSoft)};
  max-width: 62ch;
  margin: 0;
`;

export const Small = styled.p`
  font-size: 0.875rem;
  line-height: 1.55;
  color: ${({ $onInk }) => ($onInk ? color.onInkSoft : color.muted)};
  margin: 0;
`;

/* ───────── Acciones ───────── */

const variants = {
  primary: css`
    background: ${color.ink};
    color: ${color.onInk};
    border-color: ${color.ink};
    &:hover {
      background: ${color.accentDark};
      border-color: ${color.accentDark};
      color: ${color.onInk};
    }
  `,
  secondary: css`
    background: transparent;
    color: ${color.ink};
    border-color: ${color.ink};
    &:hover {
      background: ${color.ink};
      color: ${color.onInk};
    }
  `,
  onInk: css`
    background: ${color.onInk};
    color: ${color.ink};
    border-color: ${color.onInk};
    &:hover {
      background: ${color.accent};
      border-color: ${color.accent};
      color: ${color.onInk};
    }
  `,
  ghostOnInk: css`
    background: transparent;
    color: ${color.onInk};
    border-color: rgba(255, 255, 255, 0.4);
    &:hover {
      border-color: ${color.onInk};
      color: ${color.onInk};
    }
  `,
};

export const Button = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 26px;
  border: 1px solid;
  border-radius: 4px;
  font-family: ${font.sans};
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  ${({ $variant = "primary" }) => variants[$variant]}

  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 3px;
  }

  ${mq.mobile} {
    width: ${({ $block }) => ($block ? "100%" : "auto")};
  }
`;

export const TextLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${font.sans};
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ $onInk }) => ($onInk ? color.onInk : color.ink)};
  text-decoration: underline;
  text-decoration-color: ${({ $onInk }) => ($onInk ? "rgba(255, 255, 255, 0.4)" : color.accent)};
  text-decoration-thickness: 1px;
  text-underline-offset: 5px;
  transition: color 0.2s ease, text-decoration-color 0.2s ease;

  &:hover {
    color: ${color.accent};
    text-decoration-color: ${color.accent};
  }
`;

/* ───────── Entrada suave al hacer scroll ─────────
   Lo que ya está a la vista al cargar no se esconde nunca: sin JavaScript o con
   movimiento reducido, todo el contenido se ve igual. */

export function Reveal({ as: Tag = "div", delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [state, setState] = useState("visible");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return undefined;

    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={state}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
