// La palabra clave de una historia (lib/dm/palabraClave.js).
//
// Lo que no puede fallar: que se dispare con la palabra sola y NUNCA en medio de una charla. El
// automático viejo de ManyChat era "contiene CV" y saltaba cuando alguien escribía "mandé muchos
// cv", también en una charla personal con una amiga. Hubo que apagarlo (08/10).
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { palabraClaveDe, PALABRAS } = await import("../lib/dm/palabraClave.js");

test("la palabra sola dispara", () => {
  for (const t of ["TRABAJO", "trabajo", "Trabajo", "  trabajo  ", "trabajo!", "TRABAJO.", "trabajó"]) {
    assert.equal(palabraClaveDe(t)?.nombre, "trabajo", `tendría que disparar con ${JSON.stringify(t)}`);
  }
});

test("adentro de una frase NO dispara", () => {
  const frases = [
    "busco trabajo",
    "hola, estoy buscando trabajo hace meses",
    "trabajo en una fintech",
    "gracias por el trabajo que haces",
    "me quedé sin trabajo",
    "trabajo remoto",
  ];
  for (const f of frases) assert.equal(palabraClaveDe(f), null, `no tendría que disparar con ${JSON.stringify(f)}`);
});

test("otras palabras no disparan", () => {
  for (const t of ["cv", "dev", "hola", "", null, undefined, "   "]) assert.equal(palabraClaveDe(t), null);
});

test("lo que contesta lleva el doc y no el link de pago", () => {
  const { textos } = PALABRAS.trabajo;
  const todo = textos.join(" ");
  assert.match(todo, /docs\.google\.com/, "el que va es el doc");
  assert.ok(!/gumroad|pagar-pesos/.test(todo), "el link de pago sirve solo para pagar (Hooman, 28/10)");
});

test("no repite lo que ya dice la historia", () => {
  const todo = PALABRAS.trabajo.textos.join(" ");
  assert.ok(!/buscando 5 devs/i.test(todo), "eso ya lo leyó en la historia, no se lo repetimos");
  assert.ok(!/vas a ser vos o alguien/i.test(todo), "la pregunta de la historia tampoco se repite");
  assert.match(todo, /detalle/, "entrega lo que la historia prometió");
  assert.match(todo, /docs\.google\.com/, "y el detalle es el doc");
});

test("el último mensaje pide una decisión, no una opinión", () => {
  const ultimo = PALABRAS.trabajo.textos[PALABRAS.trabajo.textos.length - 1].trim();
  // Puede ser una pregunta ("te cierra?") o un pedido directo ("decime si te cierra"): lo que no
  // puede es solo informar. Si el último mensaje no pide nada, la charla se muere ahí.
  // La pregunta puede no ser lo último: "Te guardo un lugar o se lo queda otro? Son 5 no más!"
  // cierra con el cupo. Lo que no puede faltar es la pregunta.
  assert.match(ultimo, /\?/, "el cierre lleva una pregunta siempre (Cande, 30/10)");
  assert.match(ultimo, /lugar/i, "y lo que pide es el lugar, no un comentario");
  assert.ok(!/qué te parece/i.test(ultimo), "eso pide una opinión; el cierre pide un sí o un no");
});

test("nada de nosotros: se lee como que está contratando", () => {
  const todo = PALABRAS.trabajo.textos.join(" ");
  assert.ok(!/\bnosotros\b|trabajamos|seguimos/i.test(todo));
});

test("sin signos de apertura", () => {
  for (const t of PALABRAS.trabajo.textos) assert.ok(!/[¿¡]/.test(t), t);
});

test("sin guion largo", () => {
  for (const t of PALABRAS.trabajo.textos) assert.ok(!t.includes("—"), t);
});

// Pedido de Cande, 30/10: "sacalos del agente y mandámelos a mí". El que contesta la palabra recibe
// los dos mensajes y la charla pasa a ella, en código y no en el guion: el que levanta la mano por
// una oferta de 473 lo atiende ella.
import { readFileSync } from "node:fs";

test("después de la palabra clave, la charla pasa a Cande", () => {
  const src = readFileSync(new URL("../lib/dm/agente.js", import.meta.url), "utf8");
  const i = src.indexOf("const clave = !evento");
  assert.ok(i > 0, "no encontré el corte de la palabra clave en agente.js");
  const bloque = src.slice(i, i + 2600);
  assert.match(bloque, /pasarACande\(/, "sin esto el agente le sigue hablando al que pidió el 1 a 1");
  assert.match(bloque, /palabra clave/, "y el motivo tiene que decir por qué se la pasa");
});
