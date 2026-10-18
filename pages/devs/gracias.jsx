import React, { useEffect, useState } from "react";
import Head from "next/head";
import styled from "styled-components";
import { evento } from "../../lib/embudo";

// Página post-formulario (rediseño Cande sept 2026):
// "Recibimos tu aplicación" → "Una cosa SÚPER importante" → el video.
// El video está en Wistia. Su player es un web component: hay que cargar dos
// scripts (el runtime y el del media) y recién ahí <wistia-player> se define.
// Mientras no está definido, el propio CSS de Wistia muestra el frame borroso.
const WISTIA_A = "4a5ghftho0";                               // el de 2 min 06, el que viene corriendo
// Prueba A/B del 12/10/2026. El B es el guion nuevo (el de Hooman con los agregados de Cande),
// que dura 5 min 44. Mientras la variable esté vacía NO hay prueba: todos ven el A, que es lo
// que pasa hoy. El día que el video nuevo esté en Wistia se pone su ID en Vercel
// (NEXT_PUBLIC_DEVS_VIDEO_B) y la prueba arranca sola, sin tocar el código.
const WISTIA_B = process.env.NEXT_PUBLIC_DEVS_VIDEO_B || "";

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
// acá" (Cande, 19/10: "no pagá en pesos"), para todos (así lo ven también los que entran por un link que les pasó Cande), y al tocarlo
// se abre un cartelito: el link de MercadoPago y que le pase la captura por Instagram para el código.
const MERCADOPAGO = process.env.NEXT_PUBLIC_DEVS_COMPRA_MP || "https://mpago.li/1Ac31E4";
const PRECIO_PESOS = process.env.NEXT_PUBLIC_DEVS_PRECIO_PESOS || "39.750";
const IG_CANDE = "https://ig.me/m/candelaria.sanchezg";

export default function Gracias() {
  const [termino, setTermino] = useState(false);
  // El sorteo pasa en el navegador, no en el render del servidor: si no, Next devuelve la misma
  // versión cacheada a todo el mundo y la prueba no reparte.
  const [ver, setVer] = useState("a");
  const [cartel, setCartel] = useState(false);   // el cartelito del pago en pesos
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

  // El cartelito se cierra también con Escape.
  useEffect(() => {
    if (!cartel) return undefined;
    const tecla = (e) => { if (e.key === "Escape") setCartel(false); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [cartel]);

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
          <H1>Ahora mirá esto, son 2 minutos</H1>
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
                <PesosBoton type="button" onClick={() => setCartel(true)}>
                  Si sos de Argentina, apretá acá
                </PesosBoton>
              )}
            </Cierre>
          )}

          {cartel && (
            <Velo onClick={() => setCartel(false)}>
              <Cartel role="dialog" aria-modal="true" aria-labelledby="cartel-titulo" onClick={(e) => e.stopPropagation()}>
                <Cerrar type="button" aria-label="Cerrar" onClick={() => setCartel(false)}>×</Cerrar>
                {/* Con la estética de la página y un mensaje que empuje a entrar (Cande, 19/10). */}
                <CartelKicker>Para Argentina</CartelKicker>
                <CartelTitulo id="cartel-titulo">Pagalo en pesos y entrás hoy</CartelTitulo>
                <CartelPrecio>${PRECIO_PESOS} <span>un solo pago</span></CartelPrecio>
                <CartelTexto>Todo lo del video: dónde buscar, el CV comentado línea por línea y las preguntas que hago en cada entrevista.</CartelTexto>
                <Pasos>
                  <li>Usás un link de MercadoPago</li>
                  <li>Me mandás el comprobante por <a href={IG_CANDE} target="_blank" rel="noopener noreferrer">Instagram</a></li>
                  <li>Te paso tu código y entrás</li>
                </Pasos>
                <PagarPesos
                  href={MERCADOPAGO}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => evento(WISTIA_B ? "click_mp_" + ver : "click_mp")}
                >
                  🔥 SÍ, LO QUIERO YA!
                </PagarPesos>
                <CartelChico>Garantía de 30 días: si no te sirve, te devuelvo la plata.</CartelChico>
              </Cartel>
            </Velo>
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
const PesosBoton = styled.button`
  display: block; margin: 16px auto 0; background: none; border: 0; cursor: pointer;
  font: inherit; font-size: 15px; font-weight: 600; color: #c9bcc2; text-decoration: underline;
  text-underline-offset: 3px;
  &:hover { color: #f5f0f2; }
  &:focus-visible { outline: 2px solid #fff; outline-offset: 3px; border-radius: 4px; }
`;
const Velo = styled.div`
  position: fixed; inset: 0; z-index: 50; background: rgba(10,8,10,.72);
  display: flex; align-items: center; justify-content: center; padding: 20px;
`;
const Cartel = styled.div`
  position: relative; width: 100%; max-width: 420px; background: #131013; color: #f5f0f2;
  border: 1px solid rgba(204,90,80,.35); border-radius: 16px; padding: 30px 26px 24px; text-align: center;
  box-shadow: 0 24px 60px rgba(0,0,0,.55);
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
`;
const CartelKicker = styled.p`
  display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: #6fcf9f; background: rgba(46,125,91,.18);
  border-radius: 999px; padding: 6px 14px; margin: 0 0 16px;
`;
const CartelPrecio = styled.p`
  margin: 0 0 6px; font-size: 32px; font-weight: 700; letter-spacing: -.01em;
  span { font-size: 15px; font-weight: 600; color: #c9bcc2; letter-spacing: 0; margin-left: 6px; }
`;
const Pasos = styled.ol`
  list-style: none; counter-reset: paso; text-align: left; margin: 18px auto 22px; padding: 0; max-width: 300px;
  li { counter-increment: paso; position: relative; padding: 0 0 0 38px; margin: 0 0 12px; font-size: 15.5px; line-height: 1.4; color: #f5f0f2; font-weight: 600; }
  li::before {
    content: counter(paso); position: absolute; left: 0; top: -2px; width: 26px; height: 26px; border-radius: 50%;
    background: #cc5a50; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center;
  }
  a, a:visited, a:hover { color: #f5f0f2; text-decoration: underline; text-underline-offset: 3px; }
`;
const CartelChico = styled.p` margin: 14px 0 0; font-size: 13px; color: #a99ba1; `;
const Cerrar = styled.button`
  position: absolute; top: 8px; right: 12px; background: none; border: 0; cursor: pointer;
  color: #a99ba1; font-size: 26px; line-height: 1; padding: 4px;
  &:hover { color: #f5f0f2; }
`;
const CartelTitulo = styled.p` margin: 0 0 12px; font-size: 24px; line-height: 1.2; font-weight: 700; letter-spacing: -.01em; `;
const CartelTexto = styled.p`
  margin: 0 0 10px; font-size: 15px; line-height: 1.5; color: #c9bcc2;
  a, a:visited, a:hover { color: #f5f0f2; text-decoration: underline; }
`;
const PagarPesos = styled.a`
  /* El mismo botón que el de compra: un solo estilo de acción en toda la página. */
  display: inline-block; background: #cc5a50; color: #fff; text-decoration: none;
  font-size: 17px; font-weight: 700; letter-spacing: .03em; padding: 15px 30px; border-radius: 12px;
  box-shadow: 0 10px 30px rgba(204,90,80,.32);
  transition: transform .16s ease, background .16s ease;
  &:hover, &:focus, &:active, &:visited { color: #fff; }
  &:hover { background: #b84a41; transform: translateY(-2px); }
  &:active { transform: translateY(0); }
  &:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
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
