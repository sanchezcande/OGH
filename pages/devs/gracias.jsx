import React, { useEffect, useState } from "react";
import Head from "next/head";
import styled from "styled-components";
import { evento } from "../../lib/embudo";
import { firmaDeLaPestana, idDeLaPestana } from "../../lib/dm/linkFormulario";

// Página post-formulario (rediseño Cande sept 2026):
// "Recibimos tu aplicación" → "Una cosa SÚPER importante" → el video.
// El video está en Wistia. Su player es un web component: hay que cargar dos
// scripts (el runtime y el del media) y recién ahí <wistia-player> se define.
// Mientras no está definido, el propio CSS de Wistia muestra el frame borroso.
// Video único de Gumroad, actualizado por Cande el 25/10/2026 con el último testimonio.
const WISTIA_A = "gzpbw7xoib";
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
  // La charla de Instagram de esta persona, si llegó con el link del agente: /devs la dejó en la pestaña. Va con el
  // video entero y con el clic en pagar, así el agente sabe qué pasó acá (lib/dm/pagina.js, 22/10).
  const [charla, setCharla] = useState(null);
  const WISTIA_ID = ver === "b" ? WISTIA_B : WISTIA_A;   // lo usa el <wistia-player> de abajo

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = versionDelVisitante();
    setVer(v);
    const almacen = () => window.sessionStorage;
    const ig = idDeLaPestana("", almacen);
    const ch = ig ? { ig, firma: firmaDeLaPestana("", almacen) } : null;
    setCharla(ch);
    // Sin prueba, los eventos van como siempre. La charla, solo con las fases que le importan al agente.
    const ev = f => evento(WISTIA_B ? f + "_" + v : f, f === "video_fin" ? ch : null);
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
          <H1>Ahora mirá esto</H1>
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
                onClick={e => { evento(WISTIA_B ? "click_gumroad_" + ver : "click_gumroad", charla); if (!GUMROAD) e.preventDefault(); }}
              >
                🔥 SÍ, LO QUIERO YA!
              </Comprar>
              {MERCADOPAGO && (
                <PesosBoton
                  href={MERCADOPAGO}
                  onClick={() => evento(WISTIA_B ? "click_mp_" + ver : "click_mp", charla)}
                >
                  Si sos de Argentina, apretá acá
                </PesosBoton>
              )}
            </Cierre>
          )}

          <Testimonios aria-labelledby="testimonios-titulo">
            <TestimoniosHeader>
              <TestimoniosEtiqueta>Experiencias reales</TestimoniosEtiqueta>
              <TestimoniosTitulo id="testimonios-titulo">Qué les sirvió del programa</TestimoniosTitulo>
              <TestimoniosIntro>Lo cuentan ellos, con sus palabras.</TestimoniosIntro>
            </TestimoniosHeader>
            <TestimoniosGrid>
              {[
                {
                  nombre: "Mariano Frias",
                  lugar: "Cotuí, República Dominicana",
                  texto: "He descargado varios módulos y lo que he visto me ha encantado. Tu contenido tiene un espacio especial en un gap que tenemos los developers…",
                },
                {
                  nombre: "Carlos Chung",
                  lugar: "Chiclayo, Perú",
                  texto: "Todos los modulos me ayudaron pero en especial los de como responder las preguntas y prepararme, el de que preguntar según quien te entreviste…",
                },
                {
                  nombre: "Walter Cordero",
                  lugar: "Ciudad de Guatemala",
                  texto: "El programa realmente da muy buenos consejos con respecto a como llevar un proceso en una entrevista, como preparar y mejorar tu CV, en mi caso pude darme cuenta que tenía cierta información mal ubicada en donde no se mostraba mi potencial a primera vista…",
                },
              ].map((persona) => (
                <Testimonio key={persona.nombre}>
                  <Cita>“{persona.texto}”</Cita>
                  <Firma>
                    <Nombre>{persona.nombre}</Nombre>
                    <Lugar>{persona.lugar}</Lugar>
                  </Firma>
                </Testimonio>
              ))}
            </TestimoniosGrid>
          </Testimonios>

        </Caja>
      </Fondo>
    </>
  );
}

const Fondo = styled.div`
  min-height: 100vh; background: #f7f5f2; color: #171416;
  display: flex; justify-content: center;
  padding: 72px 20px 110px;
  @media (max-width: 760px) { padding: 46px 18px 90px; }
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
`;
const Caja = styled.div` width: 100%; max-width: 980px; text-align: center; `;
const Kicker = styled.p`
  display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: #2f755a; background: #e7f2ec;
  border-radius: 999px; padding: 8px 16px; margin: 0 0 26px;
`;
const H1 = styled.h1` font-size: clamp(30px, 5.5vw, 42px); line-height: 1.12; margin: 0 0 14px; font-weight: 700; letter-spacing: -.01em; color: #171416; `;
const Bajada = styled.p` font-size: 18px; line-height: 1.55; color: #625b5e; margin: 0 0 34px; font-weight: 600; `;
const Chico = styled.p`
  font-size: 13px; color: #756b70; margin: 6px 0 0;
`;
const VideoMarco = styled.div`
  position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 14px; overflow: hidden;
  background: #000; box-shadow: 0 18px 50px rgba(26,21,24,.18);
  wistia-player { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
`;
const Nota = styled.p` font-size: 14px; color: #9d8e95; margin: 26px 0 0; `;

const Testimonios = styled.section`
  margin: 58px 0 0; padding-top: 38px; border-top: 1px solid #ded8d5; text-align: left;
`;
const TestimoniosHeader = styled.header`text-align: center; margin: 0 auto 26px;`;
const TestimoniosEtiqueta = styled.p`
  margin: 0 0 10px; color: #b84f46; font-size: 11px; font-weight: 700;
  letter-spacing: .13em; text-transform: uppercase;
`;
const TestimoniosTitulo = styled.h2`
  margin: 0; color: #171416; font: 400 clamp(26px, 4vw, 36px)/1.1 Georgia, "Times New Roman", serif;
  letter-spacing: -.02em;
`;
const TestimoniosIntro = styled.p`margin: 10px 0 0; color: #625b5e; font-size: 15px; line-height: 1.5;`;
const TestimoniosGrid = styled.div`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;
  @media (max-width: 720px) {
    display: flex; overflow-x: auto; gap: 12px; padding: 0 0 10px;
    scroll-snap-type: x mandatory; overscroll-behavior-inline: contain;
    scrollbar-width: thin; scrollbar-color: #c9bebb transparent;
    > * { flex: 0 0 min(82vw, 330px); scroll-snap-align: start; }
  }
`;
const Testimonio = styled.article`
  min-height: 270px; padding: 23px; background: #fff; border: 1px solid #e6e1df;
  border-radius: 15px; display: flex; flex-direction: column;
  box-shadow: 0 5px 15px rgba(37,27,31,.045);
`;
const Cita = styled.blockquote`
  margin: 0 0 24px; color: #2a2427; font: 400 16px/1.55 Georgia, "Times New Roman", serif;
  letter-spacing: -.008em;
`;
const Firma = styled.div`margin-top: auto; padding-top: 14px; border-top: 1px solid #eee9e7;`;
const Nombre = styled.p`margin: 0; color: #211c1f; font-size: 13px; line-height: 1.3; font-weight: 700;`;
const Lugar = styled.p`margin: 3px 0 0; color: #756b6f; font-size: 11px; line-height: 1.35;`;

const Cierre = styled.div`
  margin-top: 30px;
  animation: entrar .5s cubic-bezier(.32,.72,0,1) both;
  @keyframes entrar { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
const PesosBoton = styled.a`
  display: block; margin: 16px auto 0; background: none; border: 0; cursor: pointer;
  font: inherit; font-size: 15px; font-weight: 600; color: #625b5e; text-decoration: underline;
  text-underline-offset: 3px;
  &:visited { color: #625b5e; }
  &:hover { color: #171416; }
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
