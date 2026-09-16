import React, { useEffect, useState } from "react";
import Head from "next/head";
import styled from "styled-components";
import { evento } from "../../lib/embudo";

// Página post-formulario (rediseño Cande sept 2026):
// "Recibimos tu aplicación" → "Una cosa SÚPER importante" → el video.
// El video está en Wistia. Su player es un web component: hay que cargar dos
// scripts (el runtime y el del media) y recién ahí <wistia-player> se define.
// Mientras no está definido, el propio CSS de Wistia muestra el frame borroso.
const WISTIA_ID = "4a5ghftho0";
// Link de compra. Cuando el video termina aparece el botón; si está vacío, no
// aparece nada (mejor eso que un botón que no lleva a ningún lado).
// Mientras no esté el link de Gumroad el botón igual aparece, pero no navega:
// sirve para ver el comportamiento sin mandar a nadie a una página que no existe.
const GUMROAD = process.env.NEXT_PUBLIC_DEVS_COMPRA || "https://get.opengatehub.com/l/acelerador-de-carrera";

export default function Gracias() {
  const [termino, setTermino] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    evento("gracias_vista");

    // Los dos scripts de Wistia, a mano. Con next/script el del media (type=module)
    // no llegaba nunca al DOM y el <wistia-player> se quedaba sin definir.
    const cargar = (src, tipo) => {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      if (tipo) el.type = tipo;
      document.head.appendChild(el);
    };
    cargar("https://fast.wistia.com/player.js");
    cargar(`https://fast.wistia.com/embed/${WISTIA_ID}.js`, "module");

    // Wistia cambió de API con el web component y sus eventos ('end', 'ended') no
    // disparan parejo. Miramos el reloj del player, que sí es confiable y además
    // cubre el caso de que alguien arrastre la barra hasta el final.
    const reloj = setInterval(() => {
      const p = document.querySelector("wistia-player");
      if (!p || !p.duration) return;
      const frac = p.currentTime / p.duration;
      if (p.currentTime > 0.5) evento("video_play");
      if (frac >= 0.25) evento("video_25");
      if (frac >= 0.5) evento("video_50");
      if (frac >= 0.75) evento("video_75");
      if (p.currentTime >= p.duration - 1.5) {
        evento("video_fin");
        setTermino(true);
        clearInterval(reloj);
      }
    }, 500);
    return () => clearInterval(reloj);
  }, []);

  return (
    <>
      <Head>
        <title>Recibimos tu aplicación</title>
        <meta name="robots" content="noindex" />
        <style>{`wistia-player[media-id='${WISTIA_ID}']:not(:defined){background:center / contain no-repeat url('https://fast.wistia.com/embed/medias/${WISTIA_ID}/swatch');display:block;filter:blur(5px);padding-top:56.25%;}`}</style>
      </Head>
      <Fondo>
        <Caja>
          <Kicker>✓ Recibimos tu aplicación</Kicker>
          <H1>Una cosa SÚPER importante</H1>
          <Bajada>Mirá este video muy importante acá abajo 👇</Bajada>

          <VideoMarco>
            <wistia-player media-id={WISTIA_ID} aspect="1.7777777777777777"></wistia-player>
          </VideoMarco>

          {termino && (
            <Cierre>
              <Comprar
                href={GUMROAD || undefined}
                target={GUMROAD ? "_blank" : undefined}
                rel={GUMROAD ? "noopener noreferrer" : undefined}
                $listo={!!GUMROAD}
                onClick={e => { evento("click_gumroad"); if (!GUMROAD) e.preventDefault(); }}
              >
                🔥 SÍ, LO QUIERO YA!
              </Comprar>
            </Cierre>
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
  wistia-player { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
`;
const Nota = styled.p` font-size: 14px; color: #9d8e95; margin: 26px 0 0; `;

const Cierre = styled.div`
  margin-top: 30px;
  animation: entrar .5s cubic-bezier(.32,.72,0,1) both;
  @keyframes entrar { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
const Pendiente = styled.p`
  margin: 12px 0 0; font-size: 13px; color: #8a7f84;
`;
const Comprar = styled.a`
  cursor: ${p => (p.$listo ? "pointer" : "not-allowed")};
  display: inline-block; background: #cc5a50; color: #fff; text-decoration: none;
  font-size: 18px; font-weight: 700; letter-spacing: .03em;
  padding: 17px 34px; border-radius: 12px;
  box-shadow: 0 10px 30px rgba(204,90,80,.32);
  transition: transform .16s ease, background .16s ease;
  /* El sitio tiene un a:hover global que le pisa el color y el texto quedaba
     casi del mismo tono que el fondo. Por eso se repite el blanco en cada estado. */
  &:hover, &:focus, &:active, &:visited { color: #fff; }
  &:hover { background: #b84a41; transform: translateY(-2px); }
  &:active { transform: translateY(0); }
  &:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
`;
