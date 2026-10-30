import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import styled from "styled-components";
import { evento } from "../lib/embudo";
import { fraseCupos } from "../lib/cupos";

// Landing del lead magnet para founders (Cande, 18/09/2026).
// Flujo: ella manda este link por DM después de preguntarles qué están
// construyendo. La página SÍ pide email: con eso entran a la cadena de
// nurture de founders (ver /api/drip-preguntas) y a la llamada.
// Mismo look que el PDF: fondo blanco, Charter en títulos y Helvetica en texto. Con ?o=hola los
// títulos van en Helvetica negrita (Cande, 19/10: la serif en un título le quedaba rara).
// Sin navbar ni footer (ver _app.js): es un embudo.

const PDF = "/guias/9-preguntas-entrevista-developer.pdf";
const LLAMADA = "https://strategy.opengatehub.com";
// La misma agenda a la que redirige strategy.opengatehub.com, metida en la página. Google no manda
// X-Frame-Options ni frame-ancestors (revisado el 19/10/2026). Si igual no carga, queda el link a LLAMADA.
const AGENDA = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1ThNS8Gy-jnfk0ofk43AmhVIiWWYchJ9YoZMzkmgQKElyTe0wsmtxGKXXuD8kuLKtndEf4pzEd?gv=true";
const DIGITOS = (v) => (String(v || "").match(/\d/g) || []).length;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// "martín pérez" → "Martín", para el "Listo, Martín".
const pila = (n) => {
  const p = String(n || "").trim().split(/\s+/)[0] || "";
  return p ? p[0].toUpperCase() + p.slice(1) : "";
};

export default function Preguntas() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [web, setWeb] = useState("");
  // Cuándo se abrió el formulario: lo mira el guardia de la API (lib/antispam.js), que descarta los
  // envíos de menos de dos segundos. La trampa de esta página es el campo `web` de acá arriba, que
  // ya existía desde el 18/09 y se queda como está.
  const abierto = useRef(Date.now());
  const [whatsapp, setWhatsapp] = useState("");
  const [estado, setEstado] = useState("form"); // form | enviando | listo
  const [error, setError] = useState("");
  const [mandado, setMandado] = useState(true);
  const [quiere, setQuiere] = useState("reunion"); // reunion | guia, solo con ?o=hola
  const listoRef = useRef(null);

  const cupos = fraseCupos();

  // El que llega desde "quiero contratar" en /hola ya quiere HABLAR (Cande, 19/10, después de
  // investigar embudos: el que pide reunión compra mucho más que el que baja contenido). Para él,
  // la reunión gratis va PRIMERO: un solo formulario, el botón grande pide la reunión y muestra la
  // agenda apenas deja los datos, y uno de texto chico se lleva solo la guía. Los dos caminos dejan
  // mail y WhatsApp, así nadie se pierde. Para cualquier otro origen (LinkedIn) la página no cambia.
  const deHola = router.query.o === "hola";

  useEffect(() => { evento("preguntas_vista"); }, []);
  useEffect(() => { if (deHola) evento("preguntas_vista_hola"); }, [deHola]);
  // En el celu el formulario es largo: al quedar "listo", la página baja sola hasta la agenda
  // (o hasta el aviso de la guía), si no queda fuera de la pantalla.
  useEffect(() => {
    if (estado === "listo" && deHola) listoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [estado, deHola]);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    // Los dos botones mandan el mismo formulario: el de la reunión lleva value="reunion" y el de
    // la guía value="guia". Si no viene nada (Enter en un campo, navegador viejo), es reunión.
    const pide = deHola ? (e.nativeEvent?.submitter?.value === "guia" ? "guia" : "reunion") : undefined;
    if (!EMAIL_RE.test(email.trim())) return setError("Revisá el email, parece que le falta algo.");
    // Solo al que viene de "quiero contratar" se le pide el WhatsApp, porque a ese le escribe
    // ella. Al que entra a bajar la guía desde LinkedIn no se le cambia nada.
    if (deHola && DIGITOS(whatsapp) < 8) return setError("Dejame tu WhatsApp con el código de país, así te escribo.");
    if (pide) setQuiere(pide);
    setEstado("enviando");
    try {
      const r = await fetch("/api/preguntas-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, web, whatsapp, origen: router.query.o || "dm", quiere: pide, t0: abierto.current }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setEstado("form");
        return setError(j.error || "Algo falló. Probá de nuevo en un minuto.");
      }
      setMandado(j.mandado !== false);
      setEstado("listo");
      evento("preguntas_email_enviado");
      if (pide === "reunion") evento("preguntas_reunion_pedida_hola");
      if (pide === "guia") evento("preguntas_guia_pedida_hola");
    } catch {
      setEstado("form");
      setError("Algo falló. Probá de nuevo en un minuto.");
    }
  };

  const enviando = estado === "enviando";
  const quien = pila(nombre);

  return (
    <>
      <Head>
        <title>9 de las preguntas que hago para entrevistar a un developer</title>
        <meta name="description" content="Para founders que no son técnicos: qué mide cada pregunta, qué escuchar en la respuesta y qué repreguntar." />
        <meta property="og:title" content="9 de las preguntas que hago para entrevistar a un developer" />
        <meta property="og:description" content="Qué mide cada pregunta, qué escuchar en la respuesta y qué repreguntar. Gratis, en PDF." />
        <meta property="og:image" content="https://opengatehub.com/guias/preguntas-tapa.png" />
      </Head>
      <Fondo>
        <Barra />
        {/* La página es estática: en el HTML del servidor el ?o=hola todavía no se conoce y saldría un instante
            la versión de LinkedIn. Hasta que el router lo lee, el contenido ocupa su lugar sin verse. */}
        <Grid style={router.isReady ? undefined : { visibility: "hidden" }}>
          <Texto>
            {deHola ? (
              <>
                <Autora>
                  <Image src="/images/cande-2026.jpg" alt="" width={56} height={56} priority />
                  <div>
                    <b>Candelaria Sanchez</b>
                    <span>Founder de OpenGateHub</span>
                  </div>
                </Autora>
                <Kicker>Para founders que quieren contratar un developer</Kicker>
                <H1Hola>Agendá una reunión <Coral>gratis</Coral> conmigo</H1Hola>
                <Bajada>Me contás qué estás construyendo y en 30 minutos te dejo un plan concreto para encontrar y contratar al developer que necesitás. No hace falta que seas técnico y no te comprometés a nada.</Bajada>
              </>
            ) : (
              <>
                <Kicker>Guía gratis para founders</Kicker>
                <H1>9 de las preguntas que hago para entrevistar a un developer</H1>
                <Bajada>No hace falta que seas técnico. Cada pregunta viene con lo que tenés que escuchar en la respuesta.</Bajada>

                <Lista>
                  <li><b>Qué mide</b> cada pregunta</li>
                  <li><b>Buenas y malas señales</b> en la respuesta</li>
                  <li><b>La repregunta</b> que separa al que lo vivió del que preparó la entrevista</li>
                </Lista>
              </>
            )}

            {estado !== "listo" ? (
              <Form onSubmit={enviar} noValidate>
                {deHola && <CuposArriba>Son pocos lugares. {cupos}.</CuposArriba>}
                {deHola && <Pedido>Dejame tus datos y elegí tu horario</Pedido>}
                <Campo>
                  <label htmlFor="nombre">Nombre</label>
                  <input id="nombre" autoComplete="given-name" value={nombre}
                    onChange={(e) => setNombre(e.target.value)} placeholder="Martín" />
                </Campo>
                <Campo>
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" inputMode="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="martin@tuempresa.com" />
                  {deHola && <Ayuda>Ahí te llega de regalo mi guía: 9 de las preguntas que hago para entrevistar a un developer.</Ayuda>}
                </Campo>
                {deHola && (
                  <Campo>
                    <label htmlFor="whatsapp">WhatsApp</label>
                    <input id="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required
                      value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+54 9 11 1234 5678" />
                    <Ayuda>Con el código de país. Te escribo yo por acá para coordinar.</Ayuda>
                  </Campo>
                )}
                <Trampa aria-hidden="true">
                  <input tabIndex={-1} autoComplete="off" value={web} onChange={(e) => setWeb(e.target.value)} />
                </Trampa>
                {error && <Error role="alert">{error}</Error>}
                {deHola ? (
                  <>
                    <BotonForm type="submit" name="quiere" value="reunion" disabled={enviando}>
                      {enviando && quiere === "reunion" ? "Enviando…" : "Quiero mi reunión gratis →"}
                    </BotonForm>
                    <Chico>Después elegís el día y la hora. La guía te llega igual, reserves o no.</Chico>
                    <SoloGuia>
                      <p>Todavía no estás por contratar?</p>
                      {/* Antes del botón se dice qué guía es (Cande, 19/10: "nunca introducís qué es la guía"). */}
                      <QueGuia>Empezá por mi guía gratis: <b>9 de las preguntas que hago para entrevistar a un developer</b>, con lo que tenés que escuchar en cada respuesta.</QueGuia>
                      <BotonTexto type="submit" name="quiere" value="guia" disabled={enviando}>
                        {enviando && quiere === "guia" ? "Enviando…" : "Descargá la guía y seguimos en contacto\u00a0→"}
                      </BotonTexto>
                    </SoloGuia>
                  </>
                ) : (
                  <>
                    <BotonForm type="submit" disabled={enviando}>
                      {enviando ? "Enviando…" : "Mandámelas por mail →"}
                    </BotonForm>
                    <Chico>Te llega en un minuto. Si no lo ves, fijate en spam o promociones.</Chico>
                  </>
                )}
              </Form>
            ) : deHola && quiere === "reunion" ? (
              <Reunion ref={listoRef}>
                <Check>✓</Check>
                <H2Hola>{quien ? `Listo, ${quien}. Ahora elegí tu horario` : "Listo. Ahora elegí tu horario"}</H2Hola>
                {/* El respaldo va ARRIBA de la agenda: si queda en blanco (Instagram en Android), abajo
                    quedaría escondido detrás de 720 px vacíos, y si carga, el dedo mueve la agenda y no la página. */}
                <Respaldo href={LLAMADA} target="_blank" rel="noopener noreferrer" onClick={() => evento("preguntas_llamada_click_hola")}>
                  No te carga? Abrí la agenda en otra pestaña →
                </Respaldo>
                <Agenda src={AGENDA} title="Agenda de Candelaria Sanchez"
                  onLoad={() => evento("preguntas_agenda_vista_hola")} />
                <Nota>Si ningún horario te sirve, tranqui: te escribo por WhatsApp con dos opciones.</Nota>
                <NotaChica>Google te pide nombre y mail de nuevo para mandarte la invitación.</NotaChica>
                <NotaChica>
                  {mandado ? "Tu guía ya está en tu mail. " : "No pude mandarte el mail, pero tu guía está acá: "}
                  <a href={PDF} target="_blank" rel="noopener noreferrer" onClick={() => evento("preguntas_pdf_click")}>Descargala ahora →</a>
                </NotaChica>
              </Reunion>
            ) : deHola ? (
              <Listo ref={listoRef}>
                <Check>✓</Check>
                <H2Hola>{!mandado ? "Listo, acá la tenés" : quien ? `Listo, ${quien}. Te la mandé a tu mail` : "Listo. Te la mandé a tu mail"}</H2Hola>
                <p>
                  {mandado
                    ? "Si no la ves en un minuto, fijate en spam o promociones."
                    : "No pude mandarte el mail, pero la podés bajar ahora mismo."}
                </p>
                <Link href={PDF} target="_blank" rel="noopener noreferrer" onClick={() => evento("preguntas_pdf_click")}>
                  Descargarla ahora
                </Link>
                <Siguiente>
                  <p><b>Seguimos en contacto por WhatsApp.</b></p>
                  <p>Y si querés hablar antes, la reunión es gratis y dura 30 minutos.</p>
                  <CuposCoral>Son pocos lugares. {cupos}.</CuposCoral>
                  <BotonReunion href={LLAMADA} target="_blank" rel="noopener noreferrer" onClick={() => evento("preguntas_llamada_click_hola")}>
                    Agendá tu reunión gratis →
                  </BotonReunion>
                </Siguiente>
              </Listo>
            ) : (
              <Listo>
                <Check>✓</Check>
                <H2>{mandado ? "Listo, revisá tu mail" : "Listo, acá la tenés"}</H2>
                <p>
                  {mandado
                    ? <>Te la mandé a <b>{email.trim().toLowerCase()}</b>. Si no la ves en un minuto, fijate en spam o promociones.</>
                    : "No pude mandarte el mail, pero la podés bajar ahora mismo."}
                </p>
                <Link href={PDF} target="_blank" rel="noopener noreferrer" onClick={() => evento("preguntas_pdf_click")}>
                  Descargarla ahora
                </Link>
                <Siguiente>
                  <p><b>Estás por contratar a tu developer?</b></p>
                  <p>Si querés contratar un programador del top 5%, de esos que te siguen el ritmo fácil, armo sesiones de planificación personalizadas, gratis. En 30 minutos te dejo un plan de acción concreto para encontrar y contratar al dev estrella de tu proyecto, sin que tengas que saber una línea de código ni ser técnico. No tiene costo.</p>
                  <Cupos>Son pocos lugares. {cupos}. Reservá el tuyo.</Cupos>
                  <BotonSec href={LLAMADA} target="_blank" rel="noopener noreferrer" onClick={() => evento("preguntas_llamada_click")}>
                    Agendá tu llamada gratis →
                  </BotonSec>
                </Siguiente>
              </Listo>
            )}

            {/* Con ?o=hola el nombre ya está arriba, con la foto. */}
            {!deHola && (
              <Firma>
                <b>Candelaria Sanchez</b>
                <span>Founder, OpenGateHub</span>
              </Firma>
            )}
          </Texto>

          <Muestra aria-hidden="true">
            <img className="atras" src="/guias/preguntas-p3.png" alt="" />
            <img className="adelante" src="/guias/preguntas-tapa.png" alt="" />
          </Muestra>
        </Grid>
      </Fondo>
    </>
  );
}

const SERIF = `Charter, "Bitstream Charter", "Iowan Old Style", Georgia, serif`;
const SANS = `"Helvetica Neue", Helvetica, Arial, sans-serif`;
const CORAL = "#CC5A50";

const Fondo = styled.div`
  min-height: 100vh; background: #ffffff; color: #111111; font-family: ${SANS};
  padding: 0 20px 80px;
`;
const Barra = styled.div` height: 6px; background: ${CORAL}; margin: 0 -20px; `;
const Grid = styled.div`
  max-width: 1080px; margin: 0 auto; padding-top: 72px;
  display: grid; grid-template-columns: 1.05fr .95fr; gap: 64px; align-items: start;
  @media (max-width: 860px) { grid-template-columns: 1fr; gap: 40px; padding-top: 40px; }
`;
const Texto = styled.div` max-width: 520px; min-width: 0; `;
const Autora = styled.div`
  display: flex; align-items: center; gap: 12px; margin: 0 0 26px;
  img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; object-position: 50% 35%; flex: none; }
  b { display: block; font-size: 15px; font-weight: 600; color: #111111; }
  span { display: block; font-size: 13.5px; color: #71717A; margin-top: 2px; }
`;
const Kicker = styled.p`
  font-size: 12px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: ${CORAL}; margin: 0 0 18px;
`;
const H1 = styled.h1`
  font-family: ${SERIF}; font-weight: 700; font-size: clamp(32px, 5vw, 46px); line-height: 1.1;
  letter-spacing: -.01em; margin: 0 0 18px; color: #111111;
`;
// Hola: Helvetica negrita, sin el letter-spacing negativo, como el título del cartel de pesos (#84).
const H1Hola = styled(H1)` font-family: ${SANS}; letter-spacing: 0; text-wrap: balance; `;
const Coral = styled.span` color: ${CORAL}; `;
const H2 = styled.h2` font-family: ${SERIF}; font-weight: 700; font-size: 28px; margin: 0 0 10px; color: #111111; `;
// Los títulos de "listo" de hola son más largos y en el celu van en dos renglones: sin esto quedan muy separados.
const H2Hola = styled(H2)` font-family: ${SANS}; line-height: 1.2; text-wrap: balance; `;
const Bajada = styled.p` font-size: 18px; line-height: 1.5; color: #52525B; margin: 0 0 26px; `;
const Lista = styled.ul`
  list-style: none; padding: 0; margin: 0 0 34px; border-top: 1px solid #E4E4E7;
  li { padding: 11px 0 11px 26px; border-bottom: 1px solid #E4E4E7; font-size: 15.5px; line-height: 1.45; position: relative; color: #3F3F46; }
  li::before { content: "✓"; position: absolute; left: 0; color: #2E7D5B; font-weight: 700; }
  b { color: #111111; font-weight: 600; }
`;
const Form = styled.form` display: flex; flex-direction: column; gap: 14px; `;
const Campo = styled.div`
  display: flex; flex-direction: column; gap: 6px;
  label { font-size: 13px; font-weight: 600; color: #111111; }
  input {
    font: inherit; font-size: 16px; padding: 13px 14px; border: 1px solid #D4D4D8; border-radius: 4px;
    background: #FAFAFA; color: #111111; outline: none; transition: border-color .15s, background .15s;
  }
  input:focus { border-color: #111111; background: #ffffff; }
`;
const Trampa = styled.div` position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; `;
const Error = styled.p` margin: 0; font-size: 14px; color: #B03A2E; `;
const BotonForm = styled.button`
  font: inherit; font-size: 16px; font-weight: 600; cursor: pointer; border: 0; border-radius: 4px;
  background: ${CORAL}; color: #ffffff; padding: 15px 22px; margin-top: 6px; min-height: 48px; text-decoration: none;
  display: inline-block; text-align: center; transition: background .15s;
  &:hover, &:focus, &:visited, &:active { color: #ffffff; }
  &:hover { background: #B84A41; }
  &:disabled { opacity: .6; cursor: default; }
  &:focus-visible { outline: 3px solid #111111; outline-offset: 2px; }
`;
const Ayuda = styled.p` margin: 6px 0 0; font-size: 12.5px; line-height: 1.45; color: #71717A; `;
const Chico = styled.p` margin: 0; font-size: 13px; color: #71717A; `;
const Pedido = styled.p` margin: 0 0 2px; font-size: 18px; font-weight: 700; color: #111111; `;
const CuposArriba = styled.p` margin: 0; font-size: 14px; font-weight: 600; color: ${CORAL}; `;
const SoloGuia = styled.div`
  margin-top: 10px; padding-top: 18px; border-top: 1px solid #E4E4E7;
  p { margin: 0; font-size: 14.5px; color: #71717A; }
`;
const QueGuia = styled.p`
  && { margin: 6px 0 0; font-size: 15.5px; line-height: 1.5; color: #3F3F46; }
  b { color: #111111; }
`;
const BotonTexto = styled.button`
  font: inherit; font-size: 15.5px; line-height: 1.4; color: #111111; background: none; border: 0; cursor: pointer;
  padding: 12px 0; min-height: 48px; text-align: left; text-decoration: underline; text-underline-offset: 3px;
  &:hover { color: ${CORAL}; }
  &:disabled { opacity: .6; cursor: default; }
  &:focus-visible { outline: 3px solid ${CORAL}; outline-offset: 2px; }
`;
const Listo = styled.div`
  background: #FAFAFA; border: 1px solid #E4E4E7; border-radius: 4px; padding: 28px;
  scroll-margin-top: 16px;
  p { font-size: 15.5px; line-height: 1.55; color: #3F3F46; margin: 0; }
`;
// Sin la caja gris de Listo: la agenda necesita todo el ancho que haya en el celu.
const Reunion = styled.div` scroll-margin-top: 16px; `;
const Nota = styled.p` margin: 14px 0 0; font-size: 15.5px; line-height: 1.55; color: #3F3F46; `;
const NotaChica = styled(Chico)`
  margin-top: 10px; line-height: 1.5;
  a { color: #111111; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
  a:hover { color: ${CORAL}; }
`;
const Respaldo = styled.a`
  display: inline-flex; align-items: center; min-height: 48px; font-size: 14px; color: #52525B;
  text-decoration: underline; text-underline-offset: 2px;
  &:hover { color: ${CORAL}; }
`;
const Agenda = styled.iframe`
  /* Alto de la agenda entera (a 375 px Google apila calendario y horarios: unos 1440 px), así se baja con la
     página y no adentro de un recuadro. */
  display: block; width: 100%; height: 1450px; border: 0; margin: 4px 0 4px;
`;
const Check = styled.div`
  width: 36px; height: 36px; border-radius: 50%; background: #2E7D5B; color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 14px;
`;
const Link = styled.a`
  display: inline-block; margin-top: 14px; font-size: 15px; font-weight: 600; color: #111111; text-decoration: underline;
  &:hover { color: ${CORAL}; }
`;

const Siguiente = styled.div`
  margin-top: 26px; padding-top: 22px; border-top: 1px solid #E4E4E7;
  p { margin-bottom: 14px; }
  b { color: #111111; }
`;
const Cupos = styled.p`
  font-size: 13.5px; font-weight: 600; color: ${CORAL}; margin: -6px 0 14px !important;
`;
// Dentro de Listo, la regla "p" de la caja le gana al color y al tamaño de Cupos y el renglón sale gris
// y grande: el && lo deja en coral y del mismo tamaño que los cupos de arriba del formulario.
const CuposCoral = styled(Cupos)` && { color: ${CORAL}; font-size: 14px; } `;
const BotonSec = styled.a`
  font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; border: 1px solid #111111; border-radius: 4px;
  background: transparent; color: #111111; padding: 13px 20px; text-decoration: none;
  display: inline-block; text-align: center; transition: background .15s, color .15s;
  &:hover, &:focus, &:visited, &:active { color: #111111; }
  &:hover { background: #111111; color: #ffffff; }
  &:focus-visible { outline: 3px solid ${CORAL}; outline-offset: 2px; }
`;
const BotonReunion = styled(BotonSec)` min-height: 48px; display: inline-flex; align-items: center; justify-content: center; `;
const Firma = styled.div`
  margin-top: 40px; display: flex; flex-direction: column; gap: 2px; font-size: 14px;
  b { font-weight: 600; } span { color: #71717A; }
`;
const Muestra = styled.div`
  position: relative; height: 620px;
  img { position: absolute; width: 74%; border: 1px solid #E4E4E7; border-radius: 4px; background: #fff;
        box-shadow: 0 24px 60px rgba(17,17,17,.12); }
  .atras { right: 0; top: 70px; transform: rotate(3deg); }
  .adelante { left: 0; top: 0; transform: rotate(-2deg); }
  @media (max-width: 860px) { height: 400px; img { width: 62%; } .atras { top: 40px; } }
  @media (max-width: 480px) { height: 330px; }
`;
