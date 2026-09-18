import React, { useEffect } from "react";
import Head from "next/head";
import styled from "styled-components";
import { evento } from "../lib/embudo";

// Landing del lead magnet para founders (Cande, 18/09/2026).
// Flujo: ella manda este link por DM después de preguntarles qué están
// construyendo. Página SIN formulario de email — el link ya es la entrega:
// un botón clickeable que abre el PDF directo. El próximo paso es la llamada.
// Mismo look que el PDF: fondo blanco, Charter en títulos y Helvetica en texto.
// Sin navbar ni footer (ver _app.js): es un embudo.

const PDF = "/guias/9-preguntas-entrevista-developer.pdf";
const LLAMADA = "https://strategy.opengatehub.com";

export default function Preguntas() {
  useEffect(() => { evento("preguntas_vista"); }, []);

  return (
    <>
      <Head>
        <title>9 de las preguntas que hago para entrevistar a un developer</title>
        <meta name="description" content="Para founders que no son técnicos: qué mide cada pregunta, qué escuchar en la respuesta y qué repreguntar." />
        <meta property="og:title" content="9 de las preguntas que hago para entrevistar a un developer" />
        <meta property="og:description" content="Qué mide cada pregunta, qué escuchar en la respuesta y qué repreguntar. Gratis, en PDF." />
        <meta property="og:image" content="https://opengatehub.com/guias/preguntas-tapa.png" />
      </Head>
      <Fondo>
        <Barra />
        <Grid>
          <Texto>
            <Kicker>Guía gratis para founders</Kicker>
            <H1>9 de las preguntas que hago para entrevistar a un developer</H1>
            <Bajada>No hace falta que seas técnico. Cada pregunta viene con lo que tenés que escuchar en la respuesta.</Bajada>

            <Lista>
              <li><b>Qué mide</b> cada pregunta</li>
              <li><b>Buenas y malas señales</b> en la respuesta</li>
              <li><b>La repregunta</b> que separa al que lo vivió del que preparó la entrevista</li>
            </Lista>

            <Boton
              href={PDF}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => evento("preguntas_pdf_click")}
            >
              Descargar el PDF →
            </Boton>
            <Chico>Se abre directo, sin nada que completar.</Chico>

            <Siguiente>
              <p><b>¿Estás por contratar a tu developer?</b> En «Tu plan claro en 30 minutos» te armo el plan para encontrar y contratar al indicado para tu proyecto. Es gratis.</p>
              <BotonSec
                href={LLAMADA}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => evento("preguntas_llamada_click")}
              >
                Agendá tu llamada gratis →
              </BotonSec>
            </Siguiente>

            <Firma>
              <b>Candelaria Sanchez</b>
              <span>Founder &amp; CTO, OpenGateHub</span>
            </Firma>
          </Texto>

          <Muestra aria-hidden="true">
            <img className="atras" src="/guias/preguntas-p3.png" alt="" />
            <img className="adelante" src="/guias/preguntas-tapa.png" alt="" />
          </Muestra>
        </Grid>
      </Fondo>
    </>
  );
}

const SERIF = `Charter, "Bitstream Charter", "Iowan Old Style", Georgia, serif`;
const SANS = `"Helvetica Neue", Helvetica, Arial, sans-serif`;

const Fondo = styled.div`
  min-height: 100vh; background: #ffffff; color: #111111; font-family: ${SANS};
  padding: 0 20px 80px;
`;
const Barra = styled.div` height: 6px; background: #CC5A50; margin: 0 -20px; `;
const Grid = styled.div`
  max-width: 1080px; margin: 0 auto; padding-top: 72px;
  display: grid; grid-template-columns: 1.05fr .95fr; gap: 64px; align-items: start;
  @media (max-width: 860px) { grid-template-columns: 1fr; gap: 40px; padding-top: 40px; }
`;
const Texto = styled.div` max-width: 520px; `;
const Kicker = styled.p`
  font-size: 12px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: #CC5A50; margin: 0 0 18px;
`;
const H1 = styled.h1`
  font-family: ${SERIF}; font-weight: 700; font-size: clamp(32px, 5vw, 46px); line-height: 1.1;
  letter-spacing: -.01em; margin: 0 0 18px; color: #111111;
`;
const Bajada = styled.p` font-size: 18px; line-height: 1.5; color: #52525B; margin: 0 0 26px; `;
const Lista = styled.ul`
  list-style: none; padding: 0; margin: 0 0 30px; border-top: 1px solid #E4E4E7;
  li { padding: 11px 0 11px 26px; border-bottom: 1px solid #E4E4E7; font-size: 15.5px; line-height: 1.45; position: relative; color: #3F3F46; }
  li::before { content: "✓"; position: absolute; left: 0; color: #2E7D5B; font-weight: 700; }
  b { color: #111111; font-weight: 600; }
`;
const Boton = styled.a`
  font: inherit; font-size: 17px; font-weight: 600; cursor: pointer; border: 0; border-radius: 4px;
  background: #CC5A50; color: #ffffff; padding: 17px 24px; text-decoration: none;
  display: inline-block; text-align: center; transition: background .15s;
  &:hover, &:focus, &:visited, &:active { color: #ffffff; }
  &:hover { background: #B84A41; }
  &:focus-visible { outline: 3px solid #111111; outline-offset: 2px; }
`;
const Chico = styled.p` margin: 10px 0 0; font-size: 13px; color: #71717A; `;
const Siguiente = styled.div`
  margin-top: 34px; padding-top: 26px; border-top: 1px solid #E4E4E7;
  p { font-size: 15.5px; line-height: 1.55; color: #3F3F46; margin: 0 0 14px; }
  b { color: #111111; }
`;
const BotonSec = styled.a`
  font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; border: 1px solid #111111; border-radius: 4px;
  background: transparent; color: #111111; padding: 13px 20px; text-decoration: none;
  display: inline-block; text-align: center; transition: background .15s, color .15s;
  &:hover, &:focus, &:visited, &:active { color: #111111; }
  &:hover { background: #111111; color: #ffffff; }
  &:focus-visible { outline: 3px solid #CC5A50; outline-offset: 2px; }
`;
const Firma = styled.div`
  margin-top: 40px; display: flex; flex-direction: column; gap: 2px; font-size: 14px;
  b { font-weight: 600; } span { color: #71717A; }
`;
const Muestra = styled.div`
  position: relative; height: 620px;
  img { position: absolute; width: 74%; border: 1px solid #E4E4E7; border-radius: 4px; background: #fff;
        box-shadow: 0 24px 60px rgba(17,17,17,.12); }
  .atras { right: 0; top: 70px; transform: rotate(3deg); }
  .adelante { left: 0; top: 0; transform: rotate(-2deg); }
  @media (max-width: 860px) { height: 400px; img { width: 62%; } .atras { top: 40px; } }
  @media (max-width: 480px) { height: 330px; }
`;
