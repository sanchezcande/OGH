import React from "react";
import Head from "next/head";
import styled from "styled-components";

// Página de después del formulario: el video de Cande y el botón de compra.
// Las dos cosas se configuran por variable de entorno para no tocar código
// cuando cambie el video o el link de pago:
//   NEXT_PUBLIC_DEVS_VIDEO_ID  → id de YouTube (el video "no listado")
//   NEXT_PUBLIC_DEVS_CHECKOUT  → link de Gumroad
// Van con NEXT_PUBLIC_ a propósito: son públicos, no son secretos.
const VIDEO = process.env.NEXT_PUBLIC_DEVS_VIDEO_ID || "";
const CHECKOUT = process.env.NEXT_PUBLIC_DEVS_CHECKOUT || "";
const PRECIO = process.env.NEXT_PUBLIC_DEVS_PRECIO || "USD 20";

const INCLUYE = [
  "Dónde están los trabajos que no ves publicados",
  "El CV que pasa el filtro automático y frena al humano",
  "El primer mensaje (el 90% manda copiar y pegar)",
  "Las 7 preguntas que hago, y qué busco en cada una",
  "Qué contar sin que te lo pregunten",
  "Las preguntas del final que te dejan bien parado",
  "Cuánto pedir, y cómo no dar el número primero",
];

export default function Gracias() {
  return (
    <>
      <Head>
        <title>Listo · Lo que yo noto y nadie te pregunta</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Fondo>
        <Caja>
          <Kicker>Ya estás anotado</Kicker>
          <H1>Mirá esto antes de irte</H1>
          <Bajada>Dos minutos. Te cuento qué miro yo cuando te entrevisto.</Bajada>

          {VIDEO ? (
            <Video>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${VIDEO}?rel=0`}
                title="Lo que yo noto y nadie te pregunta"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </Video>
          ) : (
            <Placeholder>
              Falta cargar el video.<br />
              <small>Poné NEXT_PUBLIC_DEVS_VIDEO_ID en Vercel con el id de YouTube.</small>
            </Placeholder>
          )}

          <Card>
            <CardTit>La guía completa</CardTit>
            <Lista>
              {INCLUYE.map((x, i) => (
                <li key={i}>
                  <b>{i + 1}</b>
                  {x}
                </li>
              ))}
            </Lista>
            <Bonus>+ la lista de grupos donde se publican las búsquedas antes que en ningún lado</Bonus>

            {CHECKOUT ? (
              <Comprar href={CHECKOUT} target="_blank" rel="noopener noreferrer">
                Quiero la guía · {PRECIO}
              </Comprar>
            ) : (
              <Placeholder as="div" style={{ margin: "22px 0 0" }}>
                Falta el link de pago.<br />
                <small>Poné NEXT_PUBLIC_DEVS_CHECKOUT en Vercel con el link de Gumroad.</small>
              </Placeholder>
            )}
            <Nota>Te llega por mail apenas pagás.</Nota>
          </Card>
        </Caja>
      </Fondo>
    </>
  );
}

const Fondo = styled.div`
  min-height: 100vh; background: #0d0d0e; color: #fff;
  display: flex; justify-content: center; padding: 48px 20px 80px;
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
`;
const Caja = styled.div` width: 100%; max-width: 620px; `;
const Kicker = styled.div`
  font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
  color: #cc5a50; font-weight: 700; margin-bottom: 14px;
`;
const H1 = styled.h1` font-size: clamp(26px, 5.5vw, 36px); line-height: 1.12; margin: 0 0 10px; font-weight: 700; `;
const Bajada = styled.p` font-size: 16px; line-height: 1.6; color: #b9b2b5; margin: 0 0 28px; `;
const Video = styled.div`
  position: relative; width: 100%; aspect-ratio: 16 / 9;
  border-radius: 12px; overflow: hidden; background: #161617; margin-bottom: 32px;
  iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0 }
`;
const Placeholder = styled.p`
  background: #2e2317; border: 1px dashed #6b5426; border-radius: 12px;
  padding: 26px; text-align: center; color: #e2ac5e; font-size: 14.5px;
  line-height: 1.6; margin: 0 0 32px;
  small { color: #a58248; font-size: 12.5px }
`;
const Card = styled.div` background: #161617; border: 1px solid #2a2a2c; border-radius: 14px; padding: 28px 26px; `;
const CardTit = styled.h2` font-size: 19px; margin: 0 0 18px; font-weight: 700; `;
const Lista = styled.ol`
  list-style: none; margin: 0; padding: 0;
  li { display: flex; gap: 12px; font-size: 14.5px; line-height: 1.5; color: #d6cfd2; margin-bottom: 11px }
  b { color: #cc5a50; font-variant-numeric: tabular-nums; flex: 0 0 14px }
`;
const Bonus = styled.p`
  font-size: 14px; color: #b9b2b5; border-top: 1px solid #2a2a2c;
  margin: 18px 0 0; padding-top: 16px;
`;
const Comprar = styled.a`
  display: block; text-align: center; text-decoration: none; margin-top: 22px;
  background: #cc5a50; color: #fff; font-size: 16px; font-weight: 700;
  border-radius: 10px; padding: 16px; transition: background .15s;
  &:hover { background: #b8483f }
`;
const Nota = styled.p` font-size: 12.5px; color: #6f686b; text-align: center; margin: 12px 0 0; `;
