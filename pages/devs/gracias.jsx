import React from "react";
import Head from "next/head";
import styled from "styled-components";

// Página post-formulario (rediseño Cande sept 2026):
// "Recibimos tu aplicación" → "Una cosa SÚPER importante" → el video.
// El video se configura por variable de entorno para no tocar código:
//   NEXT_PUBLIC_DEVS_VIDEO_ID → id de YouTube (video "no listado")
// Mientras no esté seteado, se muestra un placeholder para maquetar.
const VIDEO = process.env.NEXT_PUBLIC_DEVS_VIDEO_ID || "";

export default function Gracias() {
  return (
    <>
      <Head>
        <title>Recibimos tu aplicación</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Fondo>
        <Caja>
          <Kicker>✓ Recibimos tu aplicación</Kicker>
          <H1>Una cosa SÚPER importante</H1>
          <Bajada>Mirá este video muy importante acá abajo 👇</Bajada>

          {VIDEO ? (
            <VideoMarco>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${VIDEO}?rel=0`}
                title="Un mensaje importante"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </VideoMarco>
          ) : (
            <Placeholder>
              <Play>▶</Play>
              <PlaceholderTxt>Acá va el video de Cande</PlaceholderTxt>
              <PlaceholderSub>(placeholder — se configura con NEXT_PUBLIC_DEVS_VIDEO_ID)</PlaceholderSub>
            </Placeholder>
          )}

        </Caja>
      </Fondo>
    </>
  );
}

const Fondo = styled.div`
  min-height: 100vh; background: #131013; color: #f5f0f2;
  display: flex; justify-content: center;
  padding: 72px 20px 110px;
  @media (max-width: 760px) { padding: 46px 18px 90px; }
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
`;
const Caja = styled.div` width: 100%; max-width: 680px; text-align: center; `;
const Kicker = styled.p`
  display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: #6fcf9f; background: rgba(46,125,91,.18);
  border-radius: 999px; padding: 8px 16px; margin: 0 0 26px;
`;
const H1 = styled.h1` font-size: clamp(30px, 5.5vw, 42px); line-height: 1.12; margin: 0 0 14px; font-weight: 700; letter-spacing: -.01em; `;
const Bajada = styled.p` font-size: 18px; line-height: 1.55; color: #c9bcc2; margin: 0 0 34px; font-weight: 600; `;
const VideoMarco = styled.div`
  position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 14px; overflow: hidden;
  background: #000; box-shadow: 0 18px 50px rgba(26,21,24,.18);
  iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
`;
const Placeholder = styled.div`
  width: 100%; aspect-ratio: 16 / 9; border-radius: 14px;
  background: linear-gradient(135deg, #1e191c, #3a2b31); border: 1px solid #322b2f;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 18px 50px rgba(26,21,24,.18);
`;
const Play = styled.div`
  width: 74px; height: 74px; border-radius: 50%; background: #cc5a50; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; padding-left: 6px; margin-bottom: 6px;
`;
const PlaceholderTxt = styled.p` color: #fff; font-size: 17px; font-weight: 700; margin: 0; `;
const PlaceholderSub = styled.p` color: rgba(255,255,255,.55); font-size: 12.5px; margin: 0; `;
const Nota = styled.p` font-size: 14px; color: #9d8e95; margin: 26px 0 0; `;
