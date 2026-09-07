import React from "react";
import Head from "next/head";
import Script from "next/script";
import styled from "styled-components";

// Página post-formulario (rediseño Cande sept 2026):
// "Recibimos tu aplicación" → "Una cosa SÚPER importante" → el video.
// El video está en Wistia. Su player es un web component: hay que cargar dos
// scripts (el runtime y el del media) y recién ahí <wistia-player> se define.
// Mientras no está definido, el propio CSS de Wistia muestra el frame borroso.
const WISTIA_ID = "4a5ghftho0";

export default function Gracias() {
  return (
    <>
      <Head>
        <title>Recibimos tu aplicación</title>
        <meta name="robots" content="noindex" />
        <style>{`wistia-player[media-id='${WISTIA_ID}']:not(:defined){background:center / contain no-repeat url('https://fast.wistia.com/embed/medias/${WISTIA_ID}/swatch');display:block;filter:blur(5px);padding-top:56.25%;}`}</style>
      </Head>
      {/* afterInteractive: el video no bloquea el primer pintado de la página */}
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script src={`https://fast.wistia.com/embed/${WISTIA_ID}.js`} type="module" strategy="afterInteractive" />
      <Fondo>
        <Caja>
          <Kicker>✓ Recibimos tu aplicación</Kicker>
          <H1>Una cosa SÚPER importante</H1>
          <Bajada>Mirá este video muy importante acá abajo 👇</Bajada>

          <VideoMarco>
            <wistia-player media-id={WISTIA_ID} aspect="1.7777777777777777"></wistia-player>
          </VideoMarco>

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
  wistia-player { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
`;
const Nota = styled.p` font-size: 14px; color: #9d8e95; margin: 26px 0 0; `;
