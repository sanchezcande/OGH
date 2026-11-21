import React, { useEffect, useState } from "react";
import Head from "next/head";
import styled from "styled-components";
import { evento } from "../../lib/embudo";
import { firmaDeLaPestana, idDeLaPestana } from "../../lib/dm/linkFormulario";
import { CLAVE_BOTON_VISTO, botonVisible } from "../../lib/botonCompra";

// Página post-formulario (rediseño Cande sept 2026):
// "Recibimos tu aplicación" → "Una cosa SÚPER importante" → el video.
// El video está en Wistia. Su player es un web component: hay que cargar dos
// scripts (el runtime y el del media) y recién ahí <wistia-player> se define.
// Mientras no está definido, el propio CSS de Wistia muestra el frame borroso.
// 21/11/2026: el video post formulario (guion de Hooman, 84 s, editado en Videos/Editor/GRACIAS_1): cuenta qué pasa
// ahora con su perfil y lo manda a la agenda de 15 minutos. El anterior era jsuv1v61g0, el video de Gumroad de 9:39
// (sigue en Wistia, no se borró).
const WISTIA_A = "ruxfpqaqfx";
const TESTIMONIOS_VIDEO = [
  { nombre: "Martiniano Olivera", lugar: "Concepción del Uruguay, Argentina", id: "c6yuoqzkm2" },
  { nombre: "Manrique Ulate", lugar: "San José, Costa Rica", id: "bk8t9jduhd" },
  // 19/11: Daiana Quiroz (CRM 310). Versión vertical de su corte del editor (historias/historia_daiana.py).
  { nombre: "Daiana Quiroz", lugar: "Buenos Aires, Argentina", id: "sx25rk5qjv" },
  { nombre: "Francisco Peña", lugar: "Mérida, Venezuela", id: "06y0i47nkb" },
  { nombre: "Eduardo Hidalgo", lugar: "Ambato, Ecuador", id: "rqqzkavkxe" },
  { nombre: "Andrés Murillo", lugar: "Soledad, Colombia", id: "0mib7zqd5d" },
];
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
// 21/11/2026: la página ya no vende. Cande: "poné en vez de los links a gumroad, link a mi calendario que
// pasamos por ig". El video nuevo (guion de Hooman) dice "abajo de este video te dejo horarios en mi
// calendario. Son 15 minutos conmigo, en vivo", así que el botón va a la misma agenda que pasa el agente
// por Instagram: /15min, que cuenta el clic del lado del servidor y redirige a Google (pages/15min.js).
// Antes acá había checkout por país (Gumroad en dólares, MercadoPago en pesos): está en el historial de git.
const AGENDA = "/15min";

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
    // La charla de esta pestaña (vino del formulario) o, si la página se abrió aparte, la que dejó /devs en este
    // navegador: el link a /devs/gracias que manda el agente lo abre Instagram en otra pestaña (26/10).
    const charlaDe = (almacen) => {
      const ig = idDeLaPestana("", almacen);
      return ig ? { ig, firma: firmaDeLaPestana("", almacen) } : null;
    };
    const ch = charlaDe(() => window.sessionStorage) || charlaDe(() => window.localStorage);
    setCharla(ch);
    // Sin prueba, los eventos van como siempre. La charla, solo con las fases que le importan al agente.
    const ev = f => evento(WISTIA_B ? f + "_" + v : f, f === "video_fin" ? ch : null);
    const id = v === "b" ? WISTIA_B : WISTIA_A;
    ev("gracias_vista");
    // El que ya vio el botón en este navegador lo tiene desde que entra (lib/botonCompra.js).
    try {
      if (window.localStorage.getItem(CLAVE_BOTON_VISTO)) setTermino(true);
    } catch {
      // sin localStorage (navegador privado): sale con el video, como a todos
    }

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
    TESTIMONIOS_VIDEO.forEach(({ id: testimonioId }) => {
      cargar(`https://fast.wistia.com/embed/${testimonioId}.js`, "module");
    });

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
      // El botón de compra aparece cuando el video lo pide: a los 110 s o a la mitad, lo que llegue primero
      // (lib/botonCompra.js, 08/11). Antes era solo la mitad, y con el video de 9:39 salía a las 4:49.
      if (botonVisible(p.currentTime, p.duration)) {
        setTermino(true);
        try {
          window.localStorage.setItem(CLAVE_BOTON_VISTO, "1");
        } catch {
          // sin localStorage: la próxima vez sale con el video
        }
      }
      if (p.currentTime >= p.duration - 1.5) {
        ev("video_fin");
        clearInterval(reloj);
      }
    }, 500);
    return () => clearInterval(reloj);
  }, []);

  // El botón va a la agenda en otra pestaña, así el video queda abierto. El clic se cuenta dos veces a
  // propósito: /15min lo cuenta para todas las puertas juntas, y click_agenda dice que vino de esta página.
  const agenda = (
        <Cierre>
          <Precio>15 minutos conmigo, en vivo.</Precio>
          <Comprar
            href={AGENDA}
            target="_blank"
            rel="noopener noreferrer"
            $listo
            onClick={() => evento("click_agenda", charla)}
          >
            Agendá tus 15 minutos
          </Comprar>
        </Cierre>
  );

  return (
    <>
      <Head>
        <title>Tenemos tu perfil</title>
        <meta name="robots" content="noindex" />
        <style>{`wistia-player[media-id='${WISTIA_ID}']:not(:defined){background:center / contain no-repeat url('https://fast.wistia.com/embed/medias/${WISTIA_ID}/swatch');display:block;filter:blur(5px);padding-top:56.25%;}`}</style>
        <style>{TESTIMONIOS_VIDEO.map(({ id }) => `wistia-player[media-id='${id}']:not(:defined){background:center / cover no-repeat url('https://fast.wistia.com/embed/medias/${id}/swatch');display:block;}`).join("")}</style>
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

          {agenda}

          <VideoMarco>
            <wistia-player media-id={WISTIA_ID} aspect="1.7777777777777777"></wistia-player>
          </VideoMarco>

          {/* 15/11/2026: los botones van ARRIBA del video y tambien abajo. Antes aparecian
              recien a los 110 s (botonVisible), asi que cerca de la mitad de los que entraban no
              llegaba a verlos, y los clicks por visita cayeron de 30 y 46% a 9 y 11% cuando el
              video se alargo a 9:39. Cande, 15/11: "pone los botones de compra al principio". El
              que ya decidio compra sin mirar nada, y el que duda baja, mira el video y se encuentra
              el mismo bloque al final. `termino` se sigue calculando porque lo usan la prueba A/B y
              el evento video_fin. */}
          {agenda}

          <Testimonios aria-labelledby="testimonios-titulo">
            <TestimoniosHeader>
              <TestimoniosEtiqueta>Experiencias reales</TestimoniosEtiqueta>
              <TestimoniosTitulo id="testimonios-titulo">Qué les sirvió del programa</TestimoniosTitulo>
              <TestimoniosIntro>Lo cuentan ellos, con sus palabras.</TestimoniosIntro>
            </TestimoniosHeader>
            <VideosGrid>
              {TESTIMONIOS_VIDEO.map((persona) => (
                <VideoTestimonio key={persona.id}>
                  <VideoRetrato>
                    <wistia-player
                      media-id={persona.id}
                      aspect="0.5625"
                      preload="none"
                    ></wistia-player>
                  </VideoRetrato>
                  <VideoFirma>
                    <Estrellas aria-label="5 de 5 estrellas">★★★★★</Estrellas>
                    <Nombre>{persona.nombre}</Nombre>
                    {persona.lugar && <Lugar>{persona.lugar}</Lugar>}
                  </VideoFirma>
                </VideoTestimonio>
              ))}
            </VideosGrid>
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
                    <Estrellas aria-label="5 de 5 estrellas">★★★★★</Estrellas>
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
const VideosGrid = styled.div`
  /* 6 videos: dos filas de tres (con 5 eran tres arriba y dos abajo, centrados) */
  display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; margin-bottom: 28px;
  > * { flex: 0 0 calc((100% - 36px) / 3); min-width: 0; }
  @media (max-width: 720px) {
    display: flex; flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; gap: 12px; padding: 0 0 10px;
    scroll-snap-type: x mandatory; overscroll-behavior-inline: contain;
    scrollbar-width: thin; scrollbar-color: #c9bebb transparent;
    > * { flex: 0 0 min(72vw, 270px); scroll-snap-align: start; }
  }
`;
const VideoTestimonio = styled.article`
  padding: 12px 12px 16px; background: #fff; border: 1px solid #e6e1df;
  border-radius: 15px; box-shadow: 0 5px 15px rgba(37,27,31,.045);
`;
const VideoRetrato = styled.div`
  position: relative; width: 100%; aspect-ratio: 9 / 16; overflow: hidden;
  border-radius: 10px; background: #eee9e7;
  wistia-player { display: block; width: 100%; height: 100%; }
`;
const Estrellas = styled.p`
  margin: 0 0 6px; color: #b87927; font-size: 12px; letter-spacing: .08em;
  line-height: 1; text-align: left;
`;
const VideoFirma = styled.div`margin-top: 12px; text-align: center; ${Estrellas} { text-align: center; }`;
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
  /* El bloque va dos veces (arriba y abajo del video), asi que lleva aire de los dos lados:
     sin el de abajo, el "Si sos de Argentina" del de arriba queda pegado al marco del video. */
  margin: 30px 0 28px;
  animation: entrar .5s cubic-bezier(.32,.72,0,1) both;
  @keyframes entrar { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
const Precio = styled.p`
  margin: 0 0 16px; font-size: 15px; color: #625b5e;
  strong { color: #171416; font-size: 17px; }
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
