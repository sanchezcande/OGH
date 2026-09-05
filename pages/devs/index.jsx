import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

// Red de devs de OpenGateHub — versión corta en PASOS.
// Decisiones (Cande, sept 2026):
// - Menos de 1 minuto: nada de CV, links (LinkedIn/GitHub/video) ni preguntas para desarrollar.
//   El CV se pide después por email.
// - Multi-step: la gente completa más cuando ve "Paso 1 de 3" que una sábana de campos.
// - Sin navbar ni footer (ver _app.js): la página es un embudo, no una sección del sitio.
// - Bilingüe ES/EN con el mismo i18n del sitio; el valor elegido se guarda en español
//   siempre (las opciones EN se mapean por índice) para que la base quede uniforme.

const PASOS = [
  {
    t: ["Quién sos", "Who you are"],
    campos: [
      { id: "nombre", label: ["Nombre completo", "Full name"], tipo: "texto", req: true, ph: ["Ariel Gómez", "John Smith"] },
      { id: "email", label: ["Email", "Email"], tipo: "email", req: true, ph: ["ariel@gmail.com", "john@gmail.com"] },
      { id: "pais", label: ["País y ciudad", "Country and city"], tipo: "texto", req: true, ph: ["Argentina, Córdoba", "Argentina, Córdoba"] },
    ],
  },
  {
    t: ["Tu perfil", "Your profile"],
    campos: [
      { id: "roles", label: ["Qué hacés", "What you do"], tipo: "principal", req: true,
        ayuda: ["Elegí todos los que hagas. Después marcás cuál es tu fuerte.", "Pick everything you do. Then mark your strongest one."],
        principalDe: "rolPrincipal", otro: "rolOtro",
        ops: ["Frontend", "Backend", "Full-stack", "Mobile", "DevOps", "Data/AI", "QA",
              "Product Designer", "Product Owner / PM", "Technical Writer"] },
      { id: "seniority", label: ["Seniority", "Seniority"], tipo: "opcion", req: true,
        ops: ["Junior", "Semi-senior", "Senior", "Lead", "Architect"] },
      { id: "experiencia", label: ["Años de experiencia", "Years of experience"], tipo: "opcion", req: true,
        ops: ["Menos de 2", "2 a 4", "5 a 8", "Más de 8"],
        opsEn: ["Under 2", "2 to 4", "5 to 8", "8+"] },
      { id: "stack", label: ["Stack", "Stack"], tipo: "varias", req: true, otro: "stackOtro",
        ayuda: ["Elegí todos los que uses. Si te falta alguno, escribilo en Otro.", "Pick everything you use. Missing one? Add it under Other."],
        ops: ["React", "Next.js", "Node", "TypeScript", "Python", "React Native", "Flutter",
              "PHP", "Java", ".NET", "Go", "DevOps", "Data/AI", "QA", "Otro"],
        opsEn: ["React", "Next.js", "Node", "TypeScript", "Python", "React Native", "Flutter",
              "PHP", "Java", ".NET", "Go", "DevOps", "Data/AI", "QA", "Other"] },
    ],
  },
  {
    t: ["Cómo trabajás", "How you work"],
    campos: [
      { id: "cuandoArrancas", label: ["Cuándo podrías arrancar", "When could you start"], tipo: "opcion", req: true,
        ops: ["Ya", "En 2 semanas", "En 1 mes", "Más de 1 mes"],
        opsEn: ["Right away", "In 2 weeks", "In 1 month", "In more than a month"],
        ayuda: ["Si estás trabajando, contá el preaviso que tenés que dar.", "If you're employed, count your notice period."] },
      { id: "dedicacion", label: ["Cuánto tiempo por semana", "Weekly availability"], tipo: "opcion", req: true,
        ops: ["Full-time", "Medio tiempo", "Algunas horas", "Depende del proyecto"],
        opsEn: ["Full-time", "Part-time", "A few hours", "Depends on the project"] },
      { id: "tarifa", label: ["Tarifa USD por hora", "Hourly rate (USD)"], tipo: "texto", req: true, ph: ["25", "25"] },
      { id: "situacion", label: ["Situación laboral actual", "Current work situation"], tipo: "opcion", req: true,
        ops: ["Buscando activamente", "Abierto a ofertas", "Empleado pero escucho", "Freelance con capacidad"],
        opsEn: ["Actively looking", "Open to offers", "Employed but listening", "Freelance with capacity"] },
      { id: "ingles", label: ["Inglés", "English level"], tipo: "opcion", req: true,
        ops: ["Básico", "Conversacional", "Fluido"],
        opsEn: ["Basic", "Conversational", "Fluent"] },
      { id: "clientesExt", label: ["Trabajaste con clientes de EEUU o Europa?", "Have you worked with US or EU clients?"], tipo: "opcion", req: true,
        ops: ["Sí, varios años", "Sí, alguna vez", "Todavía no"],
        opsEn: ["Yes, for years", "Yes, at some point", "Not yet"] },
      { id: "idiomas", label: ["Otros idiomas", "Other languages"], tipo: "idiomas",
        ayuda: ["Sumá los que hables y marcá el nivel. El inglés ya lo pusiste arriba.", "Add the ones you speak and mark the level. English is covered above."],
        ops: ["Portugués", "Francés", "Alemán", "Italiano", "Ruso", "Ucraniano", "Polaco",
              "Rumano", "Neerlandés", "Sueco", "Noruego", "Danés", "Finlandés", "Griego",
              "Turco", "Árabe", "Hebreo", "Hindi", "Chino (mandarín)", "Japonés", "Coreano",
              "Catalán", "Gallego", "Euskera", "Checo", "Húngaro", "Búlgaro", "Serbio",
              "Croata", "Eslovaco", "Esloveno", "Lituano", "Letón", "Estonio", "Vietnamita",
              "Tailandés", "Indonesio", "Filipino", "Persa", "Otro"] },
      { id: "comoLlegaste", label: ["Cómo llegaste a mí?", "How did you find me?"], tipo: "opcion", req: true,
        ops: ["Instagram", "LinkedIn", "YouTube", "TikTok", "X", "Un grupo de Telegram",
              "Me lo pasó alguien", "Otro"],
        opsEn: ["Instagram", "LinkedIn", "YouTube", "TikTok", "X", "A Telegram group",
              "Someone shared it", "Other"] },
      { id: "whatsapp", label: ["Teléfono / Whatsapp", "Phone / Whatsapp"], tipo: "texto", req: true, ph: ["+54 9 …", "+54 9 …"] },
    ],
  },
];

const TODOS = PASOS.flatMap((p) => p.campos);

const NIVELES = ["Básico", "Conversacional", "Fluido", "Nativo"];

const inicial = {};
for (const c of TODOS) {
  inicial[c.id] = ["varias", "principal", "idiomas"].includes(c.tipo) ? [] : "";
  if (c.otro) inicial[c.otro] = "";
  if (c.principalDe) inicial[c.principalDe] = "";
}
inicial.idiomasNivel = {}; // { "Francés": "Fluido", ... }

export default function RedDeDevs() {
  const router = useRouter();
  const { i18n } = useTranslation();
  // Por ahora la página va SIEMPRE en español (pedido de Cande). Toda la
  // traducción EN ya está escrita acá adentro: para activarla por idioma del
  // visitante, volver a: const en = !i18n.language?.startsWith("es");
  const en = false;
  const tx = (par) => (Array.isArray(par) ? par[en ? 1 : 0] : par);
  // La opción se muestra en el idioma del visitante pero se GUARDA en español,
  // mapeando por índice, para que la base de datos quede uniforme.
  const opVista = (c, i) => (en && c.opsEn ? c.opsEn[i] : c.ops[i]);

  const [paso, setPaso] = useState(0);
  const [f, setF] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const set = (id) => (e) => setF((p) => ({ ...p, [id]: e.target.value }));
  const pick = (id, v) => () => setF((p) => ({ ...p, [id]: p[id] === v ? "" : v }));
  const toggle = (id, v) => () =>
    setF((p) => ({ ...p, [id]: p[id].includes(v) ? p[id].filter((x) => x !== v) : [...p[id], v] }));

  const toggleRol = (c, v) => () =>
    setF((p) => {
      const ya = p[c.id].includes(v);
      const lista = ya ? p[c.id].filter((x) => x !== v) : [...p[c.id], v];
      const prin = ya && p[c.principalDe] === v ? "" : p[c.principalDe];
      return { ...p, [c.id]: lista, [c.principalDe]: lista.length === 1 ? lista[0] : prin };
    });

  const agregarIdioma = (e) => {
    const v = e.target.value;
    if (!v) return;
    setF((p) => (p.idiomas.includes(v) ? p : { ...p, idiomas: [...p.idiomas, v] }));
    e.target.value = "";
  };
  const sacarIdioma = (v) => () =>
    setF((p) => {
      const nivel = { ...p.idiomasNivel };
      delete nivel[v];
      return { ...p, idiomas: p.idiomas.filter((x) => x !== v), idiomasNivel: nivel };
    });
  const nivelIdioma = (v) => (e) =>
    setF((p) => ({ ...p, idiomasNivel: { ...p.idiomasNivel, [v]: e.target.value } }));

  function faltaEnPaso(n) {
    return PASOS[n].campos.find(
      (c) => c.req && (Array.isArray(f[c.id]) ? !f[c.id].length : !f[c.id].trim())
    );
  }

  function siguiente() {
    const falta = faltaEnPaso(paso);
    if (falta) {
      setError(en ? `Missing: ${tx(falta.label)}` : `Te falta: ${tx(falta.label)}`);
      document.getElementById(`campo-${falta.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError("");
    setPaso((p) => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function enviar(e) {
    e.preventDefault();
    const falta = faltaEnPaso(paso);
    if (falta) {
      setError(en ? `Missing: ${tx(falta.label)}` : `Te falta: ${tx(falta.label)}`);
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const r = await fetch("/api/devs-red", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!r.ok) throw new Error((await r.json()).error || (en ? "Something failed" : "Falló el envío"));
      router.push("/devs/gracias");
    } catch (err) {
      setError(err.message || (en ? "Something failed. Try again." : "Algo falló. Probá de nuevo."));
      setEnviando(false);
    }
  }

  const ultimo = paso === PASOS.length - 1;

  return (
    <>
      <Head>
        <title>{en ? "We will place you at a high paying tech job" : "Te consigo un trabajo tech bien pago, en la era de la IA"}</title>
        <meta name="description" content={en
          ? "We have the highest placement rate for tech roles. Under a minute, no CV needed."
          : "Tenemos la tasa de colocación más alta en roles tech. Menos de un minuto, sin CV."} />
      </Head>
      <Fondo>
        <Caja>
          <H1>{en ? "We will place you at a high paying tech job" : "Te consigo un trabajo tech bien pago, en la era de la IA"}</H1>
          <Bajada>
            {en ? "We have the highest placement rate for tech roles." : "Tenemos la tasa de colocación más alta en roles tech."}
          </Bajada>
          <Aplica>{en ? "Apply below:" : "Aplicá acá abajo:"}</Aplica>

          <Progreso>
            <ProgresoTxt>
              {en ? `Step ${paso + 1} of ${PASOS.length}` : `Paso ${paso + 1} de ${PASOS.length}`} · {tx(PASOS[paso].t)}
            </ProgresoTxt>
            <Barra><BarraFill style={{ width: `${((paso + 1) / PASOS.length) * 100}%` }} /></Barra>
          </Progreso>

          <form onSubmit={enviar} noValidate>
            <Bloque>
              {PASOS[paso].campos.map((c) => (
                <Campo key={c.id} id={`campo-${c.id}`}>
                  <Label htmlFor={c.id}>
                    {tx(c.label)}
                    {!c.req && <Opc>{en ? "optional" : "opcional"}</Opc>}
                  </Label>
                  {c.ayuda && <Ayuda>{tx(c.ayuda)}</Ayuda>}

                  {c.tipo === "opcion" && (
                    <Chips>
                      {c.ops.map((o, i) => (
                        <Chip key={o} type="button" $on={f[c.id] === o} onClick={pick(c.id, o)}>{opVista(c, i)}</Chip>
                      ))}
                    </Chips>
                  )}
                  {c.tipo === "varias" && (
                    <>
                      <Chips>
                        {c.ops.map((o, i) => (
                          <Chip key={o} type="button" $on={f[c.id].includes(o)} onClick={toggle(c.id, o)}>{opVista(c, i)}</Chip>
                        ))}
                      </Chips>
                      {c.otro && f[c.id].includes("Otro") && (
                        <Input style={{ marginTop: 10 }} value={f[c.otro]} onChange={set(c.otro)}
                               placeholder={en ? "Which ones? Comma separated" : "Cuál? Separalos con comas"} />
                      )}
                    </>
                  )}

                  {c.tipo === "principal" && (
                    <>
                      <Chips>
                        {[...c.ops, "Otro"].map((o) => (
                          <Chip key={o} type="button" $on={f[c.id].includes(o)} onClick={toggleRol(c, o)}>
                            {o === "Otro" ? (en ? "Other" : "Otro") : o}
                          </Chip>
                        ))}
                      </Chips>
                      {f[c.id].includes("Otro") && (
                        <Input style={{ marginTop: 10 }} value={f[c.otro]} onChange={set(c.otro)}
                               placeholder={en ? "Which role?" : "Cuál rol?"} />
                      )}
                      {f[c.id].length > 1 && (
                        <Sub>
                          <SubTit>{en ? "And which is your strongest?" : "Y cuál es tu fuerte?"}</SubTit>
                          <Chips>
                            {f[c.id].map((o) => (
                              <Chip key={o} type="button" $on={f[c.principalDe] === o}
                                    onClick={() => setF((p) => ({ ...p, [c.principalDe]: o }))}>
                                {o === "Otro" && f[c.otro] ? f[c.otro] : o === "Otro" ? (en ? "Other" : "Otro") : o}
                              </Chip>
                            ))}
                          </Chips>
                        </Sub>
                      )}
                    </>
                  )}

                  {c.tipo === "idiomas" && (
                    <>
                      <Select defaultValue="" onChange={agregarIdioma}>
                        <option value="" disabled>{en ? "Pick a language…" : "Elegí un idioma…"}</option>
                        {c.ops.filter((o) => !f.idiomas.includes(o)).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </Select>
                      {f.idiomas.length > 0 && (
                        <Idiomas>
                          {f.idiomas.map((o) => (
                            <Idioma key={o}>
                              <span>{o}</span>
                              <Select $chico value={f.idiomasNivel[o] || ""} onChange={nivelIdioma(o)}>
                                <option value="" disabled>{en ? "Level" : "Nivel"}</option>
                                {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                              </Select>
                              <Sacar type="button" onClick={sacarIdioma(o)} aria-label={`Sacar ${o}`}>✕</Sacar>
                            </Idioma>
                          ))}
                        </Idiomas>
                      )}
                    </>
                  )}

                  {(c.tipo === "texto" || c.tipo === "email") && (
                    <Input id={c.id} type={c.tipo === "email" ? "email" : "text"}
                           value={f[c.id]} onChange={set(c.id)} placeholder={tx(c.ph)} />
                  )}
                </Campo>
              ))}
            </Bloque>

            {error && <Error role="alert">{error}</Error>}

            <Botonera>
              {paso > 0 && (
                <Volver type="button" onClick={() => { setError(""); setPaso((p) => p - 1); }}>
                  {en ? "Back" : "Volver"}
                </Volver>
              )}
              {!ultimo && (
                <Boton type="button" onClick={siguiente}>
                  {en ? "Continue" : "Continuar"}
                </Boton>
              )}
              {ultimo && (
                <Boton type="submit" disabled={enviando}>
                  {enviando
                    ? (en ? "One second…" : "Un segundo…")
                    : (en ? "Find me a high paying job" : "Encontrame un trabajo bien pago")}
                </Boton>
              )}
            </Botonera>
            {ultimo && (
              <Nota>
                {en
                  ? "We'll email you right after so you can upload your CV."
                  : "Apenas envíes, te mandamos un email para que nos subas tu CV."}
              </Nota>
            )}
          </form>
        </Caja>
      </Fondo>
    </>
  );
}

const Fondo = styled.div`
  min-height: 100vh; background: #fff; color: #1a1518;
  display: flex; justify-content: center;
  /* Sin navbar en esta página: el aire de arriba es solo estético. */
  padding: 72px 20px 110px;
  @media (max-width: 760px) { padding: 46px 18px 90px; }
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
`;
const Caja = styled.div` width: 100%; max-width: 620px; `;
const H1 = styled.h1` font-size: clamp(30px, 5.5vw, 40px); line-height: 1.14; margin: 0 0 14px; font-weight: 700; letter-spacing: -.01em; `;
const Bajada = styled.p` font-size: 17.5px; line-height: 1.55; color: #5a4b51; margin: 0 0 34px; max-width: 30em; font-weight: 600; `;
const Aplica = styled.p` font-size: 15px; font-weight: 700; color: #cc5a50; margin: 0 0 14px; `;
const Progreso = styled.div` margin: 0 0 34px; `;
const ProgresoTxt = styled.p`
  font-size: 12px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700;
  color: #8e7e85; margin: 0 0 8px;
`;
const Barra = styled.div` height: 5px; background: #f0e6ea; border-radius: 999px; overflow: hidden; `;
const BarraFill = styled.div` height: 100%; background: #cc5a50; border-radius: 999px; transition: width .3s ease; `;
const Bloque = styled.section` margin-bottom: 36px; `;
const Campo = styled.div` display: flex; flex-direction: column; gap: 8px; margin-bottom: 26px; scroll-margin-top: 24px; `;
const Label = styled.label` font-size: 15px; font-weight: 600; color: #1a1518; `;
const Opc = styled.span` font-weight: 400; color: #a99ba1; margin-left: 7px; font-size: 13px; `;
const Ayuda = styled.p` font-size: 13px; color: #8e7e85; line-height: 1.5; margin: -2px 0 2px; `;
const base = `
  width: 100%; background: #fff; border: 1px solid #d8ced2; border-radius: 9px;
  color: #1a1518; font: inherit; font-size: 16px; padding: 12px 14px; outline: none;
  transition: border-color .15s, box-shadow .15s;
  &::placeholder { color: #b9adb2 }
  &:focus { border-color: #cc5a50; box-shadow: 0 0 0 3px rgba(204,90,80,.12) }
`;
const Input = styled.input`${base}`;
const Chips = styled.div` display: flex; flex-wrap: wrap; gap: 8px; `;
const Sub = styled.div` margin-top: 16px; padding-left: 13px; border-left: 2px solid #f0e6ea; `;
const SubTit = styled.p` font-size: 13.5px; font-weight: 600; color: #7a2e42; margin: 0 0 9px; `;
const Chip = styled.button`
  font: inherit; font-size: 14px; cursor: pointer; padding: 9px 15px; border-radius: 999px;
  background: ${(p) => (p.$on ? "#cc5a50" : "#fff")};
  border: 1px solid ${(p) => (p.$on ? "#cc5a50" : "#d8ced2")};
  color: ${(p) => (p.$on ? "#fff" : "#5a4b51")};
  transition: all .12s;
  &:hover { border-color: ${(p) => (p.$on ? "#cc5a50" : "#a99ba1")} }
`;
const FLECHA =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' " +
  "viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%238e7e85' stroke-width='1.8' " +
  "fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";
const Select = styled.select`
  appearance: none; -webkit-appearance: none; -moz-appearance: none;
  background-color: #fff;
  background-image: ${FLECHA};
  background-repeat: no-repeat;
  background-position: right ${(p) => (p.$chico ? "10px" : "14px")} center;
  border: 1px solid #d8ced2; border-radius: 9px; color: #1a1518;
  font: inherit; font-size: ${(p) => (p.$chico ? "14px" : "16px")};
  font-weight: ${(p) => (p.$chico ? "600" : "400")};
  padding: ${(p) => (p.$chico ? "8px 30px 8px 12px" : "12px 40px 12px 14px")};
  outline: none; cursor: pointer;
  width: ${(p) => (p.$chico ? "auto" : "100%")};
  min-width: ${(p) => (p.$chico ? "128px" : "auto")};
  transition: border-color .15s, box-shadow .15s;
  &:hover { border-color: #a99ba1 }
  &:focus { border-color: #cc5a50; box-shadow: 0 0 0 3px rgba(204,90,80,.12) }
  &:invalid, &:has(option[value=""]:checked) { color: #b9adb2 }
  option { color: #1a1518; background: #fff; font-weight: 400 }
  option[disabled] { color: #b9adb2 }
`;
const Idiomas = styled.div` display: flex; flex-direction: column; gap: 8px; margin-top: 12px; `;
const Idioma = styled.div`
  display: flex; align-items: center; gap: 10px;
  background: #faf6f7; border: 1px solid #eee3e7; border-radius: 9px; padding: 8px 10px 8px 14px;
  > span:first-child { flex: 1; font-size: 14.5px; font-weight: 600 }
`;
const Sacar = styled.button`
  font: inherit; font-size: 15px; line-height: 1; cursor: pointer; color: #a99ba1;
  background: none; border: 0; padding: 6px 4px;
  &:hover { color: #b03a2e }
`;
const Botonera = styled.div` display: flex; gap: 12px; `;
const Volver = styled.button`
  font: inherit; font-size: 15px; font-weight: 600; cursor: pointer;
  background: #fff; color: #5a4b51; border: 1px solid #d8ced2; border-radius: 10px; padding: 16px 22px;
  transition: border-color .15s;
  &:hover { border-color: #a99ba1 }
`;
const Boton = styled.button`
  flex: 1; font: inherit; font-size: 16px; font-weight: 700; cursor: pointer;
  background: #cc5a50; color: #fff; border: 0; border-radius: 10px; padding: 16px;
  transition: background .15s;
  &:hover:not(:disabled) { background: #b8483f }
  &:disabled { opacity: .55; cursor: default }
`;
const Nota = styled.p` font-size: 13px; color: #8e7e85; text-align: center; margin: 14px 0 0; `;
const Error = styled.p`
  font-size: 14.5px; color: #b03a2e; background: #fdeeec; border-radius: 9px;
  padding: 12px 15px; margin: 0 0 16px;
`;
