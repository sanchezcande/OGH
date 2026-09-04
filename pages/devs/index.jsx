import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import styled from "styled-components";
import { upload } from "@vercel/blob/client";

// Red de devs de OpenGateHub. Reemplaza al formulario de Notion.
//
// Los campos viven en BLOQUES para poder reordenarlos sin tocar el render:
// primero lo que define si sirve para un proyecto, y todo lo opcional al final,
// que es donde la gente abandona.

const BLOQUES = [
  {
    t: "Quién sos",
    campos: [
      { id: "nombre", label: "Nombre completo", tipo: "texto", req: true, ph: "Ariel Gómez" },
      { id: "email", label: "Email", tipo: "email", req: true, ph: "ariel@gmail.com" },
      { id: "pais", label: "País y ciudad", tipo: "texto", req: true, ph: "Argentina, Córdoba" },
    ],
  },
  {
    t: "Tu perfil",
    campos: [
      { id: "roles", label: "Qué hacés", tipo: "principal", req: true,
        ayuda: "Elegí todos los que hagas. Después marcás cuál es tu fuerte.",
        principalDe: "rolPrincipal", otro: "rolOtro",
        ops: ["Frontend", "Backend", "Full-stack", "Mobile", "DevOps", "Data/AI", "QA",
              "Product Designer", "Product Owner / PM", "Technical Writer"] },
      { id: "seniority", label: "Seniority", tipo: "opcion", req: true,
        ops: ["Junior", "Semi-senior", "Senior", "Lead", "Architect"] },
      { id: "experiencia", label: "Años de experiencia", tipo: "opcion", req: true,
        ops: ["Menos de 2", "2 a 4", "5 a 8", "Más de 8"] },
      { id: "stack", label: "Stack", tipo: "varias", req: true, otro: "stackOtro",
        ayuda: "Elegí todos los que uses. Si te falta alguno, escribilo en Otro.",
        ops: ["React", "Next.js", "Node", "TypeScript", "Python", "React Native", "Flutter",
              "PHP", "Java", ".NET", "Go", "DevOps", "Data/AI", "QA", "Otro"] },
    ],
  },
  {
    t: "Cómo trabajás",
    campos: [
      { id: "cuandoArrancas", label: "Cuándo podrías arrancar", tipo: "opcion", req: true,
        ops: ["Ya", "En 2 semanas", "En 1 mes", "Más de 1 mes"],
        ayuda: "Si estás trabajando, contá el preaviso que tenés que dar." },
      { id: "dedicacion", label: "Cuánto tiempo por semana", tipo: "opcion", req: true,
        ops: ["Full-time", "Medio tiempo", "Algunas horas", "Depende del proyecto"] },
      { id: "tarifa", label: "Tarifa USD por hora", tipo: "texto", req: true, ph: "25" },
      { id: "situacion", label: "Situación laboral actual", tipo: "opcion", req: true,
        ops: ["Buscando activamente", "Abierto a ofertas", "Empleado pero escucho", "Freelance con capacidad"] },
      { id: "ingles", label: "Inglés", tipo: "opcion", req: true,
        ops: ["Básico", "Conversacional", "Fluido"] },
      { id: "clientesExt", label: "Trabajaste con clientes de EEUU o Europa?", tipo: "opcion", req: true,
        ops: ["Sí, varios años", "Sí, alguna vez", "Todavía no"] },
      { id: "comoLlegaste", label: "Cómo llegaste a mí?", tipo: "opcion", req: true,
        ops: ["Instagram", "LinkedIn", "YouTube", "TikTok", "X", "Un grupo de Telegram",
              "Me lo pasó alguien", "Otro"] },
    ],
  },
  {
    t: "Mostrame",
    campos: [
      { id: "linkedin", label: "LinkedIn", tipo: "texto", ph: "linkedin.com/in/…" },
      { id: "github", label: "GitHub o portfolio", tipo: "texto", ph: "github.com/…" },
      { id: "cv", label: "Tu CV", tipo: "archivo", req: true,
        ayuda: "PDF o Word, hasta 5 MB." },
      { id: "proyecto", label: "Contame un proyecto que te haya importado de verdad", tipo: "largo", req: true,
        ayuda: "No hace falta que sea el más grande. El que te importó.",
        ph: "Qué era, qué hiciste vos, y por qué te importó" },
    ],
  },
  {
    t: "Lo último, y es opcional",
    opcional: true,
    campos: [
      { id: "idiomas", label: "Otros idiomas", tipo: "idiomas",
        ayuda: "Sumá los que hables y marcá el nivel de cada uno. El inglés ya lo pusiste arriba.",
        ops: ["Portugués", "Francés", "Alemán", "Italiano", "Ruso", "Ucraniano", "Polaco",
              "Rumano", "Neerlandés", "Sueco", "Noruego", "Danés", "Finlandés", "Griego",
              "Turco", "Árabe", "Hebreo", "Hindi", "Chino (mandarín)", "Japonés", "Coreano",
              "Catalán", "Gallego", "Euskera", "Checo", "Húngaro", "Búlgaro", "Serbio",
              "Croata", "Eslovaco", "Esloveno", "Lituano", "Letón", "Estonio", "Vietnamita",
              "Tailandés", "Indonesio", "Filipino", "Persa", "Ucraniano", "Otro"] },
      { id: "whatsapp", label: "WhatsApp", tipo: "texto", ph: "+54 9 …" },
      { id: "telegram", label: "Telegram", tipo: "texto", ph: "@usuario" },
      { id: "trabadoEn", label: "Qué es lo que más te cuesta de conseguir trabajo", tipo: "largo",
        ayuda: "Contame en serio. Me sirve para saber en qué ayudar.",
        ph: "Mando muchos CVs y no me contesta nadie" },
      { id: "video", label: "Video de presentación", tipo: "texto",
        ayuda: "Un minuto, en inglés, con link de Loom o YouTube. Los que lo mandan quedan primeros en la lista.",
        ph: "loom.com/share/…" },
    ],
  },
];

const TODOS = BLOQUES.flatMap((b) => b.campos);
const NIVELES = ["Básico", "Conversacional", "Fluido", "Nativo"];

// Además del valor de cada campo, guardamos los "acompañantes": el texto de Otro,
// cuál rol es el principal, y el nivel de cada idioma.
const inicial = {};
for (const c of TODOS) {
  inicial[c.id] = ["varias", "principal", "idiomas"].includes(c.tipo) ? [] : "";
  if (c.otro) inicial[c.otro] = "";
  if (c.principalDe) inicial[c.principalDe] = "";
}
inicial.idiomasNivel = {};   // { "Francés": "Fluido", ... }
inicial.cvNombre = "";       // qué archivo eligió, para mostrárselo

export default function RedDeDevs() {
  const router = useRouter();
  const [f, setF] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const set = (id) => (e) => setF((p) => ({ ...p, [id]: e.target.value }));
  const pick = (id, v) => () => setF((p) => ({ ...p, [id]: p[id] === v ? "" : v }));
  const toggle = (id, v) => () =>
    setF((p) => ({ ...p, [id]: p[id].includes(v) ? p[id].filter((x) => x !== v) : [...p[id], v] }));

  // Si destildás el rol que estaba marcado como fuerte, hay que limpiar la marca
  // o queda apuntando a algo que ya no eligió.
  const toggleRol = (c, v) => () =>
    setF((p) => {
      const ya = p[c.id].includes(v);
      const lista = ya ? p[c.id].filter((x) => x !== v) : [...p[c.id], v];
      const prin = ya && p[c.principalDe] === v ? "" : p[c.principalDe];
      return { ...p, [c.id]: lista, [c.principalDe]: lista.length === 1 ? lista[0] : prin };
    });

  const [subiendo, setSubiendo] = useState(false);

  async function subirCV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("El CV no puede pesar más de 5 MB.");
    setError("");
    setSubiendo(true);
    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/cv-upload",
      });
      setF((p) => ({ ...p, cv: blob.url, cvNombre: file.name }));
    } catch (err) {
      setError("No pude subir el CV: " + (err.message || "probá de nuevo"));
    } finally {
      setSubiendo(false);
    }
  }

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

  async function enviar(e) {
    e.preventDefault();
    setError("");
    const falta = TODOS.find((c) => c.req && (Array.isArray(f[c.id]) ? !f[c.id].length : !f[c.id].trim()));
    if (falta) {
      setError(`Te falta: ${falta.label}`);
      document.getElementById(`campo-${falta.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setEnviando(true);
    try {
      const r = await fetch("/api/devs-red", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Falló el envío");
      router.push("/devs/gracias");
    } catch (err) {
      setError(err.message || "Algo falló. Probá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <>
      <Head>
        <title>Sumate a la red de devs de OpenGateHub</title>
        <meta name="description" content="Dejá tus datos y quedás en el radar para los próximos proyectos de OpenGateHub." />
      </Head>
      <Fondo>
        <Caja>
          <H1>Sumate a la red de devs de OpenGateHub</H1>
          <Bajada>
            Dejá tus datos y quedás en el radar para los próximos proyectos.
            Son cinco minutos y lo mira una persona, no un filtro automático.
          </Bajada>

          <form onSubmit={enviar} noValidate>
            {BLOQUES.map((b) => (
              <Bloque key={b.t}>
                <BloqueTit $op={b.opcional}>{b.t}</BloqueTit>
                {b.campos.map((c) => (
                  <Campo key={c.id} id={`campo-${c.id}`}>
                    <Label htmlFor={c.id}>
                      {c.label}
                      {!c.req && <Opc>opcional</Opc>}
                    </Label>
                    {c.ayuda && <Ayuda>{c.ayuda}</Ayuda>}

                    {c.tipo === "opcion" && (
                      <Chips>
                        {c.ops.map((o) => (
                          <Chip key={o} type="button" $on={f[c.id] === o} onClick={pick(c.id, o)}>{o}</Chip>
                        ))}
                      </Chips>
                    )}
                    {c.tipo === "varias" && (
                      <>
                        <Chips>
                          {c.ops.map((o) => (
                            <Chip key={o} type="button" $on={f[c.id].includes(o)} onClick={toggle(c.id, o)}>{o}</Chip>
                          ))}
                        </Chips>
                        {c.otro && f[c.id].includes("Otro") && (
                          <Input style={{ marginTop: 10 }} value={f[c.otro]} onChange={set(c.otro)}
                                 placeholder="Cuál? Separalos con comas" />
                        )}
                      </>
                    )}

                    {c.tipo === "principal" && (
                      <>
                        <Chips>
                          {[...c.ops, "Otro"].map((o) => (
                            <Chip key={o} type="button" $on={f[c.id].includes(o)} onClick={toggleRol(c, o)}>{o}</Chip>
                          ))}
                        </Chips>
                        {f[c.id].includes("Otro") && (
                          <Input style={{ marginTop: 10 }} value={f[c.otro]} onChange={set(c.otro)}
                                 placeholder="Cuál rol?" />
                        )}
                        {f[c.id].length > 1 && (
                          <Sub>
                            <SubTit>Y cuál es tu fuerte?</SubTit>
                            <Chips>
                              {f[c.id].map((o) => (
                                <Chip key={o} type="button" $on={f[c.principalDe] === o}
                                      onClick={() => setF((p) => ({ ...p, [c.principalDe]: o }))}>
                                  {o === "Otro" && f[c.otro] ? f[c.otro] : o}
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
                          <option value="" disabled>Elegí un idioma…</option>
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
                                  <option value="" disabled>Nivel</option>
                                  {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                                </Select>
                                <Sacar type="button" onClick={sacarIdioma(o)} aria-label={`Sacar ${o}`}>✕</Sacar>
                              </Idioma>
                            ))}
                          </Idiomas>
                        )}
                      </>
                    )}
                    {c.tipo === "largo" && (
                      <Area id={c.id} rows={4} value={f[c.id]} onChange={set(c.id)} placeholder={c.ph} />
                    )}
                    {c.tipo === "archivo" && (
                      <>
                        <Subir $listo={Boolean(f.cv)}>
                          <input type="file" accept=".pdf,.doc,.docx" onChange={subirCV} hidden />
                          {subiendo ? "Subiendo…" : f.cv ? `✓ ${f.cvNombre}` : "Elegir archivo"}
                        </Subir>
                        {f.cv && <Cambiar type="button" onClick={() => setF((p) => ({ ...p, cv: "", cvNombre: "" }))}>Cambiar</Cambiar>}
                      </>
                    )}

                    {(c.tipo === "texto" || c.tipo === "email") && (
                      <Input id={c.id} type={c.tipo === "email" ? "email" : "text"}
                             value={f[c.id]} onChange={set(c.id)} placeholder={c.ph} />
                    )}
                  </Campo>
                ))}
              </Bloque>
            ))}

            {error && <Error role="alert">{error}</Error>}
            <Boton type="submit" disabled={enviando}>
              {enviando ? "Un segundo…" : "Sumarme a la red"}
            </Boton>
            <Nota>Te escribimos solo si aparece un proyecto que encaje con lo tuyo.</Nota>
          </form>
        </Caja>
      </Fondo>
    </>
  );
}

const Fondo = styled.div`
  min-height: 100vh; background: #fff; color: #1a1518;
  display: flex; justify-content: center;
  /* El header del sitio flota arriba de todo, así que el título necesita
     despejarlo o se le monta encima. */
  padding: 170px 20px 110px;
  @media (max-width: 760px) { padding: 130px 18px 90px; }
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
`;
const Caja = styled.div` width: 100%; max-width: 620px; `;
const H1 = styled.h1` font-size: clamp(30px, 5.5vw, 40px); line-height: 1.14; margin: 0 0 16px; font-weight: 700; letter-spacing: -.01em; `;
const Bajada = styled.p` font-size: 16.5px; line-height: 1.65; color: #5a4b51; margin: 0 0 56px; max-width: 30em; `;
const Bloque = styled.section` margin-bottom: 52px; `;
const BloqueTit = styled.h2`
  font-size: 11px; letter-spacing: .18em; text-transform: uppercase; font-weight: 700;
  color: ${(p) => (p.$op ? "#8e7e85" : "#cc5a50")};
  border-bottom: 1px solid #e2dadd; padding-bottom: 10px; margin: 0 0 24px;
`;
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
const Area = styled.textarea`${base} resize: vertical; line-height: 1.55;`;
const Chips = styled.div` display: flex; flex-wrap: wrap; gap: 8px; `;
const Sub = styled.div` margin-top: 16px; padding-left: 13px; border-left: 2px solid #f0e6ea; `;
const SubTit = styled.p` font-size: 13.5px; font-weight: 600; color: #7a2e42; margin: 0 0 9px; `;
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

  /* El menú desplegado lo dibuja el sistema: al menos que no herede el fondo
     gris del select y que el texto se lea con el color de la marca. */
  option { color: #1a1518; background: #fff; font-weight: 400 }
  option[disabled] { color: #b9adb2 }
`;
const Subir = styled.label`
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  font: inherit; font-size: 15px; font-weight: 600; padding: 13px 20px; border-radius: 9px;
  border: 1px dashed ${(p) => (p.$listo ? "#2e7d5b" : "#d8ced2")};
  background: ${(p) => (p.$listo ? "#eef7f2" : "#fff")};
  color: ${(p) => (p.$listo ? "#2e7d5b" : "#5a4b51")};
  transition: all .15s;
  &:hover { border-color: #cc5a50; color: #cc5a50 }
`;
const Cambiar = styled.button`
  font: inherit; font-size: 13px; cursor: pointer; background: none; border: 0;
  color: #8e7e85; text-decoration: underline; padding: 6px 0 0; align-self: flex-start;
  &:hover { color: #cc5a50 }
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
const Chip = styled.button`
  font: inherit; font-size: 14px; cursor: pointer; padding: 9px 15px; border-radius: 999px;
  background: ${(p) => (p.$on ? "#cc5a50" : "#fff")};
  border: 1px solid ${(p) => (p.$on ? "#cc5a50" : "#d8ced2")};
  color: ${(p) => (p.$on ? "#fff" : "#5a4b51")};
  transition: all .12s;
  &:hover { border-color: ${(p) => (p.$on ? "#cc5a50" : "#a99ba1")} }
`;
const Boton = styled.button`
  width: 100%; font: inherit; font-size: 16px; font-weight: 700; cursor: pointer;
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
