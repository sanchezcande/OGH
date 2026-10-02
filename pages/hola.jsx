import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import styled from "styled-components";
import { evento } from "../lib/embudo";

// Página bifurcación (Cande, oct 2026).
// El contenido de Cande atrae a los dos públicos a la vez: el founder que quiere
// contratar y el dev que mira de costado para ver cómo lo van a juzgar. Antes había
// que adivinar para quién era cada posteo (dos palabras distintas en ManyChat, DEV
// para la llamada y CV para el formulario). Acá elige la persona y se usa un solo
// link en todos lados.
//
// Dos opciones y nada más: con una tercera se cae el porcentaje de los que eligen.
//
// Medición: usa el mismo /api/evento que el resto del embudo (funnel_eventos, que
// solo guarda fase + sid anónimo). Si el link trae ?de=ig o ?de=li, se manda además
// una fase con el sufijo, así se puede contar por red sin tocar la base. El ?de=
// también viaja al destino para no perderlo en el camino.

const DESTINOS = {
  contrata: "https://strategy.opengatehub.com",
  dev: "/devs",
};

// Solo letras, números y guiones, hasta 24: es un parámetro público y se reenvía.
const limpiarOrigen = (v) =>
  typeof v === "string" && /^[a-zA-Z0-9_-]{1,24}$/.test(v) ? v.toLowerCase() : null;

export default function Hola() {
  const router = useRouter();
  const [de, setDe] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const d = limpiarOrigen(new URLSearchParams(window.location.search).get("de"));
    setDe(d);
    evento("hola_vista");
    if (d) evento(`hola_vista_${d}`);
  }, []);

  const elegir = (cual) => (e) => {
    e.preventDefault();
    evento(`hola_${cual}`);
    if (de) evento(`hola_${cual}_${de}`);
    const base = DESTINOS[cual];
    const url = de ? `${base}${base.includes("?") ? "&" : "?"}de=${de}` : base;
    // sendBeacon no bloquea, pero damos un respiro mínimo para que salga el evento.
    setTimeout(() => {
      if (base.startsWith("http")) window.location.href = url;
      else router.push(url);
    }, 80);
  };

  return (
    <>
      <Head>
        <title>Qué te describe más · OpenGateHub</title>
        <meta name="description" content="Dos caminos: contratar developers, o entrar a la lista donde busco cuando me entra un proyecto." />
        <meta name="robots" content="noindex" />
        {/* Esta página usa Inter y no la Space Grotesk del resto del sitio: es una
            bifurcación suelta, sin navbar ni footer, y Cande la quiere más seria. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </Head>

      <Fondo>
        <Caja>
          <H1>Qué te describe más?</H1>
          <Bajada>Elegí uno y seguimos por ahí.</Bajada>

          <Opciones>
            <Opcion href={DESTINOS.contrata} onClick={elegir("contrata")}>
              <Titulo>
                Quiero mi plan paso a paso para contratar un dev 5 estrellas en 7 días
              </Titulo>
              <Flecha aria-hidden="true">Este soy yo →</Flecha>
            </Opcion>

            <Opcion href={DESTINOS.dev} onClick={elegir("dev")}>
              <Titulo>
                Quiero acelerar mi carrera en tech y conseguir trabajo bien pago lo antes posible
              </Titulo>
              <Flecha aria-hidden="true">Este soy yo →</Flecha>
            </Opcion>
          </Opciones>

          <Pie>Candelaria Sanchez · OpenGateHub</Pie>
        </Caja>
      </Fondo>
    </>
  );
}

const Fondo = styled.div`
  min-height: 100vh; background: #fff; color: #1a1518;
  display: flex; align-items: center; justify-content: center;
  padding: 72px 20px 90px;
  @media (max-width: 760px) { padding: 46px 18px 70px; align-items: flex-start; }
  /* Inter en todo el cuerpo: la Space Grotesk del sitio queda bien en un título
     grande, pero en texto chico se lee poco seria (lo mismo que pasó en los PDFs). */
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
`;
const Caja = styled.div` width: 100%; max-width: 680px; `;
const H1 = styled.h1`
  font-family: "Space Grotesk", Inter, -apple-system, sans-serif;
  font-size: clamp(30px, 5.5vw, 40px); line-height: 1.14; margin: 0 0 12px;
  font-weight: 700; letter-spacing: -.01em;
`;
const Bajada = styled.p`
  font-size: 17.5px; line-height: 1.55; color: #5a4b51; margin: 0 0 34px; font-weight: 600;
`;
const Opciones = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;
const Opcion = styled.a`
  display: flex; flex-direction: column; gap: 10px; text-decoration: none; color: #1a1518;
  background: #fff; border: 1px solid #d8ced2; border-radius: 14px; padding: 26px 24px 22px;
  cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
  /* El sitio tiene un a:hover global que pinta de acento todo lo que esté dentro de
     un link. Como acá la tarjeta entera es el link, se teñía el texto completo: por
     eso el color se repite en cada estado. */
  &:hover, &:focus, &:active, &:visited { color: #1a1518; }
  &:hover, &:focus-visible {
    border-color: #cc5a50; box-shadow: 0 6px 22px rgba(204, 90, 80, .13); transform: translateY(-2px);
  }
  &:focus-visible { outline: 2px solid #cc5a50; outline-offset: 3px; }
`;
const Titulo = styled.span`
  font-size: 21px; font-weight: 700; line-height: 1.3; letter-spacing: -.01em; color: #1a1518;
  @media (max-width: 760px) { font-size: 19px; }
`;
const Flecha = styled.span`
  margin-top: auto; padding-top: 10px; font-size: 14.5px; font-weight: 700; line-height: 1.4;
  color: #cc5a50;
`;
const Pie = styled.p` font-size: 13px; color: #a99ba1; margin: 34px 0 0; text-align: center; `;
