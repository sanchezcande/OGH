import React, { useEffect, useState } from "react";
import Head from "next/head";
import styled from "styled-components";
import { evento } from "../../lib/embudo";

// Página post-formulario (rediseño Cande sept 2026):
// "Recibimos tu aplicación" → "Una cosa SÚPER importante" → el video.
// El video está en Wistia. Su player es un web component: hay que cargar dos
// scripts (el runtime y el del media) y recién ahí <wistia-player> se define.
// Mientras no está definido, el propio CSS de Wistia muestra el frame borroso.
// Video único desde el 19/10/2026: el de 2 min de siempre + las respuestas a las objeciones + los testimonios
// de alumnos. Cande decidió dejar un solo video y terminar la prueba A/B del 12/10 (al 18/10: A 52 llegaron y
// 10 tocaron comprar, B 46 y 17). Desde la tarde del 19/10 va la versión de 5 min 01, con el testimonio de
// Francisco Peña después del de Andrés y el cierre "Tocá abajo para acelerar tu carrera" (antes: "2r0ut42goj").
const WISTIA_A = "3b4jx1k83g";
// Sin B no hay prueba: todos ven el A y los eventos vuelven a sus nombres de siempre. Se ignora a propósito
// NEXT_PUBLIC_DEVS_VIDEO_B, que en Vercel apunta al video B, que ya no existe.
const WISTIA_B = "";

// A qué versión le toca cada persona. Queda guardada: si vuelve a entrar ve la MISMA, porque si
// no, una sola persona cuenta en las dos columnas y el embudo no cierra.
function versionDelVisitante() {
  if (!WISTIA_B) return "a";
  try {
    const guardada = localStorage.getItem("devs_video_ab");
    if (guardada === "a" || guardada === "b") return guardada;
    const nueva = Math.random() < 0.5 ? "a" : "b";
    localStorage.setItem("devs_video_ab", nueva);
    return nueva;
  } catch (e) {
    return "a";   // sin localStorage (modo privado) no se sortea: va el que ya conocemos
  }
}
// Link de compra. Cuando el video termina aparece el botón; si está vacío, no
// aparece nada (mejor eso que un botón que no lleva a ningún lado).
// Mientras no esté el link de Gumroad el botón igual aparece, pero no navega:
// sirve para ver el comportamiento sin mandar a nadie a una página que no existe.
const GUMROAD = process.env.NEXT_PUBLIC_DEVS_COMPRA || "https://get.opengatehub.com/l/acelerador-de-carrera";
// Pago en pesos (18/10/2026: de 41 argentinos que tocaron comprar, ninguno pagó en dólares, y el único
// que pagó lo hizo en pesos por MercadoPago). Abajo del botón de compra va "Si sos de Argentina, apretá
// acá" (Cande, 19/10: "no pagá en pesos"), para todos (así lo ven también los que entran por un link que
// les pasó Cande).
//
// 19/10, de noche: antes esto abría un cartelito con tres pasos (pagás, mandás el comprobante por
// Instagram, ella te pasa el código). Esos pasos ya no existen: `/api/pagar-pesos` arma el checkout y el
// código sale solo cuando MercadoPago confirma el pago, así que el botón va DERECHO a MercadoPago.
// Cande: "debería solamente decir si sos de argentina apretá acá y ya abrir directo mercadopago".
// El precio y la garantía los muestra el checkout, no hace falta repetirlos en un cartel.
const MERCADOPAGO = process.env.NEXT_PUBLIC_DEVS_COMPRA_MP || "/api/pagar-pesos";

export default function Gracias() {
  const [termino, setTermino] = useState(false);
  // El sorteo pasa en el navegador, no en el render del servidor: si no, Next devuelve la misma
  // versión cacheada a todo el mundo y la prueba no reparte.
  const [ver, setVer] = useState("a");
  const WISTIA_ID = ver === "b" ? WISTIA_B : WISTIA_A;   // lo usa el <wistia-player> de abajo

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = versionDelVisitante();
    setVer(v);
    const ev = f => evento(WISTIA_B ? f + "_" + v : f);   // sin prueba, los eventos van como siempre
    const id = v === "b" ? WISTIA_B : WISTIA_A;
    ev("gracias_vista");

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
    cargar(`https://fast.wistia.com/embed/${id}.js`, "module");

    // Wistia cambió de API con el web component y sus eventos ('end', 'ended') no
    // disparan parejo. Miramos el reloj del player, que sí es confiable y además
    // cubre el caso de que alguien arrastre la barra hasta el final.
    const reloj = setInterval(() => {
      const p = document.querySelector("wistia-player");
      if (!p || !p.duration) return;
      const frac = p.currentTime / p.duration;
      if (p.currentTime > 0.5) ev("video_play");
      if (frac >= 0.25) ev("video_25");
      if (frac >= 0.5) ev("video_50");
      if (frac >= 0.75) ev("video_75");
      // El botón de compra aparece a la MITAD del video (decisión Cande 17/09:
      // su primer candidato vio 65% y se fue sin haber visto nunca el botón).
      if (frac >= 0.5) setTermino(true);
      if (p.currentTime >= p.duration - 1.5) {
        ev("video_fin");
        clearInterval(reloj);
      }
    }, 500);
    return () => clearInterval(reloj);
  }, []);

  return (
    <>
      <Head>
        <title>Tenemos tu perfil</title>
        <meta name="robots" content="noindex" />
        <style>{`wistia-player[media-id='${WISTIA_ID}']:not(:defined){background:center / contain no-repeat url('https://fast.wistia.com/embed/medias/${WISTIA_ID}/swatch');display:block;filter:blur(5px);padding-top:56.25%;}`}</style>
      </Head>
      <Fondo>
        <Caja>
          <Kicker>✓ Tenemos tu perfil</Kicker>
          <H1>Ahora mirá esto, son 5 minutos</H1>
          <Bajada>Qué hace que alguien de esa lista termine quedando adentro.</Bajada>
          {/* El CV va chico y abajo del título: solo 65 de 247 lo mandan, pero pedirlo acá
              arriba le saca el lugar al video, que es lo que mueve la venta (Cande, 07/10:
              "para el funnel no suma, que quede chiquito"). */}
          <Chico>Ah, y mandame tu CV respondiendo el mail que te llegó.</Chico>

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
                onClick={e => { evento(WISTIA_B ? "click_gumroad_" + ver : "click_gumroad"); if (!GUMROAD) e.preventDefault(); }}
              >
                🔥 SÍ, LO QUIERO YA!
              </Comprar>
              {MERCADOPAGO && (
                <PesosBoton
                  href={MERCADOPAGO}
                  onClick={() => evento(WISTIA_B ? "click_mp_" + ver : "click_mp")}
                >
                  Si sos de Argentina, apretá acá
                </PesosBoton>
              )}
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
const Chico = styled.p`
  font-size: 13px; color: #a99ba1; margin: 6px 0 0;
`;
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
const PesosBoton = styled.a`
  display: block; margin: 16px auto 0; background: none; border: 0; cursor: pointer;
  font: inherit; font-size: 15px; font-weight: 600; color: #c9bcc2; text-decoration: underline;
  text-underline-offset: 3px;
  &:visited { color: #c9bcc2; }
  &:hover { color: #f5f0f2; }
  &:focus-visible { outline: 2px solid #fff; outline-offset: 3px; border-radius: 4px; }
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
