import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import styled from "styled-components";
import { evento } from "../lib/embudo";
import { firmaDeLaPestana, idDeLaPestana, sinIg } from "../lib/dm/linkFormulario";
import { PAISES, destinoDePago, faseDePago, nombreDePais, pagaEnPesos, paisDeCabecera, paisDeTextoLibre } from "../lib/paisCompra";
import { paisDelLead } from "../lib/db";
import { firmaValida } from "../lib/dm/firmaIg";
import { firmaDeLink, idDeLink } from "../lib/dm/linkFormulario";

// La puerta única de pago del programa de 27 (Cande, 09/11: "un solo link para el agente").
//
// Antes el agente tenía que elegir el checkout: el de dólares o el de pesos. Para eso tenía que
// saber de dónde era la persona, y casi siempre mandaba el de dólares. Eso cuesta plata: de 41
// argentinos que tocaron comprar ninguno pagó en dólares (18/10), y el checkout de pesos convierte
// ~1 de 4 contra ~1 de 8 el de dólares.
//
// Acá la persona elige su país, con el que trae Vercel ya puesto, y el botón la lleva a donde
// puede pagar. Lo elige ella y no la IP a secas porque hay argentinos viviendo afuera (y al revés).
//
// La página no vende: a esto se llega decidido, desde el DM del agente o desde /devs/gracias. Por
// eso es una sola decisión y nada más. La venta ya la hizo el video.
const GUMROAD = process.env.NEXT_PUBLIC_DEVS_COMPRA || "https://get.opengatehub.com/l/acelerador-de-carrera";
const MERCADOPAGO = "/api/pagar-pesos";
const INSTAGRAM = "https://ig.me/m/candelaria.sanchezg";

export default function Comprar({ paisDetectado, delFormulario, precioArs, precioUsd }) {
  const router = useRouter();
  const [pais, setPais] = useState(paisDetectado);
  // La charla de Instagram, si llegó con el link del agente: va con el clic en pagar, así el agente
  // sabe que tocó pagar y no le vuelve a vender (lib/dm/pagina.js).
  const [charla, setCharla] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    try {
      const ig = idDeLaPestana(window.location.search, () => window.sessionStorage);
      const firma = firmaDeLaPestana(window.location.search, () => window.sessionStorage);
      if (ig) setCharla({ ig, firma });
      // El id sale de la barra una vez leído: quien copia la dirección para pasársela a otro no le
      // pasa también su charla.
      const ahora = window.location.pathname + window.location.search + window.location.hash;
      const limpia = sinIg(ahora);
      if (limpia !== ahora) {
        const st = window.history.state;
        window.history.replaceState(st?.__N ? { ...st, url: sinIg(st.url), as: sinIg(st.as) } : st, "", limpia);
      }
    } catch (e) { /* la charla es un dato de más: nunca rompe la página */ }
  }, [router.isReady]);

  useEffect(() => { evento("comprar_vista"); }, []);

  const enPesos = pagaEnPesos(pais);
  const destino = destinoDePago(pais, { pesos: MERCADOPAGO, gumroad: GUMROAD });
  const precio = enPesos ? `$${Number(precioArs).toLocaleString("es-AR")} ARS` : `USD ${precioUsd}`;

  return (
    <>
      <Head>
        <title>Acelerador de Carrera Tech</title>
        {/* No es una página para buscar en Google: se llega por el link del agente. */}
        <meta name="robots" content="noindex" />
      </Head>
      <Fondo>
        <Caja>
          <Kicker>Acelerador de Carrera Tech</Kicker>
          <H1>Un paso y entrás</H1>
          <Bajada>
            {delFormulario
              ? "Te llevo a donde podés pagar."
              : "Decime de dónde sos y te llevo a donde podés pagar."}
          </Bajada>

          <Campo>
            <Etiqueta htmlFor="pais">
              {/* A quien llenó el formulario no se le pregunta de nuevo: se le muestra lo que puso,
                  por si se mudó o escribió cualquier cosa. */}
              {delFormulario ? "Pusiste que sos de" : "De dónde sos"}
            </Etiqueta>
            <Select id="pais" value={pais} onChange={(e) => setPais(e.target.value)}>
              {PAISES.map((p) => (
                <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
              ))}
            </Select>
          </Campo>

          {destino ? (
            <>
              <Precio>
                {precio}
                <Pago>{enPesos ? "en pesos, con MercadoPago" : "en dólares, con tarjeta"}</Pago>
              </Precio>
              <Boton
                href={destino}
                /* El checkout en pesos lo arma nuestra propia API y redirige: va en la misma
                   pestaña, si no la persona queda mirando una pestaña en blanco mientras se crea
                   el pago en MercadoPago. */
                target={enPesos ? undefined : "_blank"}
                rel={enPesos ? undefined : "noopener noreferrer"}
                onClick={() => evento(faseDePago(pais), charla)}
              >
                Quiero entrar
              </Boton>
              <Chico>El acceso te llega al momento de pagar.</Chico>
            </>
          ) : (
            /* Desde donde Gumroad no cobra (Cuba) no hay botón: un checkout que rechaza la tarjeta
               sin decir por qué es peor que una explicación. Va al DM, que es donde está el camino. */
            <SinCheckout>
              <p>Desde {nombreDePais(pais)} el checkout no cobra.</p>
              <Escribime href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
                Escribime por Instagram y lo vemos
              </Escribime>
            </SinCheckout>
          )}

          <Garantia>60 días de garantía. Si hacés tu parte y no te sirve, te devuelvo todo.</Garantia>
        </Caja>
      </Fondo>
    </>
  );
}

/**
 * El país preseleccionado sale de la cabecera que pone Vercel en cada request
 * (`x-vercel-ip-country`). Va del lado del servidor y no en el navegador porque la cabecera solo
 * existe acá; si no viene (desarrollo local, o un proxy que la saca) queda "Otro país", que es la
 * opción segura: elegir Argentina de prepo mandaría a un checkout en pesos a quien no puede pagar
 * en pesos.
 *
 * El precio también sale de acá: el de pesos lo decide la misma variable que cobra MercadoPago
 * (`MP_PRECIO_ARS`), así la página nunca muestra un número distinto al que va a pagar.
 */
export async function getServerSideProps({ req, query }) {
  // Primero, lo que la persona YA contestó en el formulario. Llega acá por el id de la charla que
  // el agente le pone al link (?ig=, con su firma), igual que /devs. Si la firma no es la de ese
  // id no se mira nada: el id viaja en claro y cualquiera podría poner el de otro.
  let delFormulario = null;
  try {
    const ig = idDeLink(query?.ig);
    if (ig && firmaValida(ig, firmaDeLink(query?.f))) {
      delFormulario = paisDeTextoLibre(await paisDelLead(ig));
    }
  } catch (e) {
    console.error("comprar: no pude ver el país del formulario:", e.message);
  }
  return {
    props: {
      // El del formulario gana: lo dijo ella misma. La cabecera de Vercel es la IP, que miente
      // seguido (VPN, viajando, vivir afuera), y es solo el plan B.
      paisDetectado: delFormulario || paisDeCabecera(req.headers["x-vercel-ip-country"]),
      delFormulario: Boolean(delFormulario),
      precioArs: Number(process.env.MP_PRECIO_ARS || 39750),
      precioUsd: Number(process.env.PRECIO_USD || 27),
    },
  };
}

const Fondo = styled.div`
  min-height: 100vh; background: #f7f5f2; color: #171416;
  display: flex; justify-content: center; align-items: center;
  padding: 72px 20px 110px;
  @media (max-width: 760px) { padding: 46px 18px 90px; }
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
`;
const Caja = styled.div` width: 100%; max-width: 520px; text-align: center; `;
const Kicker = styled.p`
  display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: #2f755a; background: #e7f2ec;
  border-radius: 999px; padding: 8px 16px; margin: 0 0 26px;
`;
const H1 = styled.h1`
  font-size: clamp(30px, 5.5vw, 42px); line-height: 1.12; margin: 0 0 14px;
  font-weight: 700; letter-spacing: -.01em; color: #171416;
`;
const Bajada = styled.p` font-size: 18px; line-height: 1.55; color: #625b5e; margin: 0 0 34px; font-weight: 600; `;
const Campo = styled.div` text-align: left; margin: 0 0 26px; `;
const Etiqueta = styled.label`
  display: block; font-size: 13px; font-weight: 700; color: #625b5e;
  letter-spacing: .04em; text-transform: uppercase; margin: 0 0 8px;
`;
const Select = styled.select`
  width: 100%; font: inherit; font-size: 17px; font-weight: 600; color: #171416;
  background: #fff; border: 1px solid #ded8d5; border-radius: 12px;
  padding: 15px 16px; cursor: pointer;
  &:focus-visible { outline: 2px solid #cc5a50; outline-offset: 2px; }
`;
const Precio = styled.p`
  margin: 0 0 18px; font-size: 30px; font-weight: 700; color: #171416; letter-spacing: -.01em;
`;
const Pago = styled.span`
  display: block; margin-top: 4px; font-size: 14px; font-weight: 600; color: #756b70; letter-spacing: 0;
`;
const Boton = styled.a`
  display: block; background: #cc5a50; color: #fff; text-decoration: none; cursor: pointer;
  font-size: 18px; font-weight: 700; letter-spacing: .03em;
  padding: 17px 34px; border-radius: 12px;
  box-shadow: 0 10px 30px rgba(204,90,80,.32);
  transition: transform .16s ease, background .16s ease;
  /* El sitio tiene un a:hover global que le pisa el color: por eso se repite el blanco. */
  &:hover, &:focus, &:active, &:visited { color: #fff; }
  &:hover { background: #b84a41; transform: translateY(-2px); }
  &:active { transform: translateY(0); }
  &:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
`;
const Chico = styled.p` font-size: 13px; color: #756b70; margin: 14px 0 0; `;
const SinCheckout = styled.div`
  background: #fff; border: 1px solid #e6e1df; border-radius: 15px; padding: 22px;
  p { margin: 0 0 14px; font-size: 16px; line-height: 1.5; color: #2a2427; font-weight: 600; }
`;
const Escribime = styled.a`
  display: block; background: #171416; color: #fff; text-decoration: none;
  font-size: 16px; font-weight: 700; padding: 14px 20px; border-radius: 11px;
  &:hover, &:focus, &:active, &:visited { color: #fff; }
  &:hover { background: #000; }
`;
const Garantia = styled.p` font-size: 13px; color: #9d8e95; margin: 30px 0 0; line-height: 1.5; `;
