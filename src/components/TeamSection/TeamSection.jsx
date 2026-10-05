import React from "react";
import Image from "next/image";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Body, Eyebrow, H2, H3, Reveal, Section, Wrap, color, font, mq, useLang } from "../../styles/kit";

// Nombre y rol salen de las traducciones (teamSection.members).
// La línea de cada persona resume su bio de ahí mismo: solo su oficio, sin cifras ni adjetivos.
const COPY = {
  es: {
    eyebrow: "El equipo",
    title: "Las personas detrás de OpenGateHub",
    intro: "Entrevistamos a cada developer antes de presentártelo: Candelaria o alguien de este equipo.",
    lines: {
      gustavo: "Lideró el desarrollo de sistemas de gran escala. Trabaja con PHP, Java, Python, Angular, Node.js y Laravel.",
      ilia: "Arma sistemas de testing en Python, con pruebas end-to-end e integración con CI/CD.",
      vadym: "Frontend moderno y experiencias 3D con Three.js, con backend en Node.js y Python.",
      javier: "Nuestro referente en React, Vue y arquitecturas en la nube. Resuelve problemas difíciles sin complicarlos.",
      giuliano: "Trabaja con Node.js, PHP, .NET y React, del backend al frontend.",
      laura: "Sitios en WordPress con foco en SEO. Tiene formación en artes visuales.",
      alejandria: "Planifica y ejecuta pruebas funcionales, de regresión e integración en web y móvil.",
    },
  },
  en: {
    eyebrow: "The team",
    title: "The people behind OpenGateHub",
    intro: "We interview every developer before presenting them to you: Candelaria or someone on this team.",
    lines: {
      gustavo: "Has led the development of large-scale systems. Works with PHP, Java, Python, Angular, Node.js and Laravel.",
      ilia: "Builds testing systems in Python, with end-to-end tests and CI/CD integration.",
      vadym: "Modern frontend and 3D experiences with Three.js, with backend work in Node.js and Python.",
      javier: "Our go-to for React, Vue and cloud architectures. Solves hard problems without overcomplicating them.",
      giuliano: "Works with Node.js, PHP, .NET and React, from backend to frontend.",
      laura: "WordPress sites with a focus on SEO. Has a background in visual arts.",
      alejandria: "Plans and runs functional, regression and integration tests across web and mobile.",
    },
  },
};

// Todas las fotos van en el mismo cuadro 1:1 y en blanco y negro. Como vienen de encuadres muy
// distintos, cada una lleva su punto de recorte y, las que están tomadas de lejos, un acercamiento
// para que las caras queden de un tamaño parecido. "detail" pide una imagen más grande para esos casos.
const MEMBERS = [
  { key: "gustavo", src: "/team/gus.jpg", position: "24% 50%", zoom: 1.3, origin: "50% 45%", detail: 1.7 },
  { key: "ilia", src: "/team/Ilia.jpeg", position: "50% 50%", zoom: 1.7, origin: "50% 60%", detail: 2.6 },
  { key: "vadym", src: "/team/Vadym.JPG", position: "50% 0%", zoom: 1.5, origin: "50% 30%", detail: 1.5 },
  { key: "javier", src: "/team/javi.jpg", position: "50% 32%" },
  { key: "giuliano", src: "/team/giuli.jpg" },
  { key: "laura", src: "/team/lau.jpg" },
  { key: "alejandria", src: "/team/ale.jpg", position: "50% 25%" },
];

const sizesFor = (detail = 1) =>
  `(max-width: 640px) ${Math.round(96 * detail)}px, (max-width: 960px) ${Math.round(33 * detail)}vw, ${Math.round(260 * detail)}px`;

const TeamSection = ({ tone = "paper", id }) => {
  const { t } = useTranslation();
  const copy = COPY[useLang()];

  return (
    <Section $tone={tone} id={id}>
      <Wrap>
        <Reveal>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <H2>{copy.title}</H2>
          <Intro>{copy.intro}</Intro>
        </Reveal>

        <Grid>
          {MEMBERS.map((member, i) => {
            const name = t(`teamSection.members.${member.key}.name`);
            const role = t(`teamSection.members.${member.key}.role`);

            return (
              <Reveal as="li" key={member.key} delay={(i % 4) * 60}>
                <Photo>
                  <Image
                    src={member.src}
                    alt={`${name}, ${role}`}
                    fill
                    sizes={sizesFor(member.detail)}
                    style={{
                      objectFit: "cover",
                      objectPosition: member.position || "50% 50%",
                      transform: member.zoom ? `scale(${member.zoom})` : undefined,
                      transformOrigin: member.origin,
                    }}
                  />
                </Photo>
                <div>
                  <H3>{name}</H3>
                  <Role>{role}</Role>
                  <Body>{copy.lines[member.key]}</Body>
                </div>
              </Reveal>
            );
          })}
        </Grid>
      </Wrap>
    </Section>
  );
};

export default TeamSection;

/* ───────── Estilos ───────── */

const Intro = styled(Body)`
  margin-top: 20px;
  max-width: 54ch;
`;

const Grid = styled.ul`
  list-style: none;
  padding: 0;
  margin: clamp(40px, 5vw, 64px) 0 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 48px 32px;

  ${H3} {
    margin-top: 20px;
  }

  ${Body} {
    margin-top: 12px;
    font-size: 0.9375rem;
    line-height: 1.55;
  }

  ${mq.tablet} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 40px 24px;
  }

  /* En celular pasa a una lista: foto chica a la izquierda y el texto al lado. */
  ${mq.mobile} {
    grid-template-columns: 1fr;
    gap: 0;
    border-top: 1px solid ${color.ink};

    li {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      gap: 18px;
      align-items: start;
      padding: 24px 0;
      border-bottom: 1px solid ${color.line};
    }

    ${H3} {
      margin-top: 0;
    }

    ${Body} {
      margin-top: 10px;
    }
  }
`;

const Photo = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  isolation: isolate;
  border-radius: 4px;
  background: ${color.line};

  img {
    filter: grayscale(1);
  }
`;

const Role = styled.p`
  margin: 8px 0 0;
  font-family: ${font.brand};
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  line-height: 1.45;
  text-transform: uppercase;
  color: ${color.muted};
`;
