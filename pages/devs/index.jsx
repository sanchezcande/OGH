import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import styled from "styled-components";

// Formulario de captura para la guía de devs. Sobrio y a una columna, como el de
// Notion que veníamos usando: una sola cosa por pantalla y nada que distraiga.
// Solo nombre y mail son obligatorios; el resto suma contexto sin frenar a nadie.

const SENIORITY = ["Junior", "Semi senior", "Senior", "Estoy estudiando"];
const BUSCANDO = ["Trabajo en relación de dependencia", "Freelance / por proyecto", "Todavía no busco, miro"];

export default function DevsForm() {
  const router = useRouter();
  const [f, setF] = useState({ nombre: "", email: "", seniority: "", buscando: "", trabadoEn: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const pick = (k, v) => () => setF((p) => ({ ...p, [k]: p[k] === v ? "" : v }));

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (!f.nombre.trim() || !f.email.trim()) return setError("Necesito tu nombre y tu mail.");
    setEnviando(true);
    try {
      const r = await fetch("/api/devs-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, origen: router.query.ref || "devs" }),
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
        <title>La guía · Lo que yo noto y nadie te pregunta</title>
        <meta name="description" content="Cómo conseguir un trabajo de dev bien pago, contado por la que está del otro lado contratando." />
        <meta name="robots" content="noindex" />
      </Head>
      <Fondo>
        <Caja>
          <Kicker>Guía para developers</Kicker>
          <H1>Lo que yo noto y nadie te pregunta</H1>
          <Bajada>
            Entrevisto devs hace años, del otro lado de la mesa. Dejame tus datos y
            te muestro qué miro antes de decidir.
          </Bajada>

          <Form onSubmit={enviar}>
            <Campo>
              <Label htmlFor="nombre">Cómo te llamás</Label>
              <Input id="nombre" value={f.nombre} onChange={set("nombre")} autoComplete="name" placeholder="Ariel" />
            </Campo>

            <Campo>
              <Label htmlFor="email">Tu mail</Label>
              <Input id="email" type="email" value={f.email} onChange={set("email")} autoComplete="email" placeholder="ariel@gmail.com" />
            </Campo>

            <Campo>
              <Label>Dónde estás hoy <Opc>opcional</Opc></Label>
              <Chips>
                {SENIORITY.map((s) => (
                  <Chip key={s} type="button" $on={f.seniority === s} onClick={pick("seniority", s)}>{s}</Chip>
                ))}
              </Chips>
            </Campo>

            <Campo>
              <Label>Qué estás buscando <Opc>opcional</Opc></Label>
              <Chips>
                {BUSCANDO.map((s) => (
                  <Chip key={s} type="button" $on={f.buscando === s} onClick={pick("buscando", s)}>{s}</Chip>
                ))}
              </Chips>
            </Campo>

            <Campo>
              <Label htmlFor="trabado">En qué parte te trabás más <Opc>opcional</Opc></Label>
              <Area id="trabado" rows={3} value={f.trabadoEn} onChange={set("trabadoEn")}
                    placeholder="Mando muchos CVs y no me contesta nadie" />
            </Campo>

            {error && <Error role="alert">{error}</Error>}

            <Boton type="submit" disabled={enviando}>
              {enviando ? "Un segundo…" : "Ver la guía"}
            </Boton>
            <Nota>Es un mail cada tanto. Te podés borrar cuando quieras.</Nota>
          </Form>
        </Caja>
      </Fondo>
    </>
  );
}

const Fondo = styled.div`
  min-height: 100vh; background: #0d0d0e; color: #fff;
  display: flex; justify-content: center; padding: 48px 20px 80px;
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
`;
const Caja = styled.div` width: 100%; max-width: 560px; `;
const Kicker = styled.div`
  font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
  color: #cc5a50; font-weight: 700; margin-bottom: 14px;
`;
const H1 = styled.h1` font-size: clamp(28px, 6vw, 40px); line-height: 1.1; margin: 0 0 14px; font-weight: 700; `;
const Bajada = styled.p` font-size: 16px; line-height: 1.6; color: #b9b2b5; margin: 0 0 36px; `;
const Form = styled.form` display: flex; flex-direction: column; gap: 24px; `;
const Campo = styled.div` display: flex; flex-direction: column; gap: 9px; `;
const Label = styled.label` font-size: 14px; font-weight: 600; color: #f2ecee; `;
const Opc = styled.span` font-weight: 400; color: #6f686b; margin-left: 6px; font-size: 12.5px; `;
const base = `
  width: 100%; background: #161617; border: 1px solid #2a2a2c; border-radius: 10px;
  color: #fff; font: inherit; font-size: 16px; padding: 13px 15px; outline: none;
  transition: border-color .15s;
  &::placeholder { color: #565053 }
  &:focus { border-color: #cc5a50 }
`;
const Input = styled.input`${base}`;
const Area = styled.textarea`${base} resize: vertical; line-height: 1.5;`;
const Chips = styled.div` display: flex; flex-wrap: wrap; gap: 8px; `;
const Chip = styled.button`
  font: inherit; font-size: 14px; cursor: pointer; padding: 9px 15px; border-radius: 999px;
  background: ${(p) => (p.$on ? "#cc5a50" : "#161617")};
  border: 1px solid ${(p) => (p.$on ? "#cc5a50" : "#2a2a2c")};
  color: ${(p) => (p.$on ? "#fff" : "#b9b2b5")};
  transition: all .15s;
  &:hover { border-color: ${(p) => (p.$on ? "#cc5a50" : "#4a4448")} }
`;
const Boton = styled.button`
  font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 6px;
  background: #cc5a50; color: #fff; border: 0; border-radius: 10px; padding: 16px;
  transition: background .15s;
  &:hover:not(:disabled) { background: #b8483f }
  &:disabled { opacity: .55; cursor: default }
`;
const Nota = styled.p` font-size: 12.5px; color: #6f686b; text-align: center; margin: -8px 0 0; `;
const Error = styled.p`
  font-size: 14px; color: #f0897b; background: #2f1b18; border-radius: 9px;
  padding: 11px 14px; margin: 0;
`;
