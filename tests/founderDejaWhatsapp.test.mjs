import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

// 18/10/2026, pedido de Cande: "si no que me dejen su mail y whatsapp y los contacto o algo así".
// El WhatsApp es la parte que importa: con mail el founder entra a una cadena automática, con
// WhatsApp le escribe ella, que es como consiguió los dos founders que tiene. El campo se pide
// SOLO al que viene de "quiero contratar" (?o=hola); al que baja la guía desde LinkedIn no se
// le cambia nada, porque ahí pedir un teléfono es fricción sin motivo.
const leer = (p) => fs.readFile(new URL(p, import.meta.url), "utf8");

test("el campo se pide solo al que viene de quiero contratar", async () => {
  const src = await leer("../pages/preguntas.jsx");
  const i = src.indexOf('htmlFor="whatsapp"');
  assert.ok(i > -1, "no está el campo de WhatsApp");
  const antes = src.slice(0, i);
  assert.ok(/\{deHola && \(\s*<Campo>[\s\S]*$/.test(antes.slice(-400)),
    "el campo no está condicionado a deHola: se lo estaríamos pidiendo a todos");
});

test("no se puede mandar sin WhatsApp cuando viene de hola", async () => {
  const src = await leer("../pages/preguntas.jsx");
  assert.match(src, /if \(deHola && DIGITOS\(whatsapp\) < 8\)/,
    "falta la validación: entraría un founder sin teléfono y la promesa de escribirle no se puede cumplir");
  assert.match(src, /body: JSON\.stringify\(\{[^}]*whatsapp[^}]*\}\)/, "el whatsapp no viaja en el POST");
});

test("la API lo guarda y no lo pisa con vacío si el lead vuelve", async () => {
  const src = await leer("../pages/api/preguntas-lead.js");
  assert.match(src, /ADD COLUMN IF NOT EXISTS whatsapp TEXT/, "falta la migración de la columna");
  assert.match(src, /INSERT INTO leads_preguntas \(nombre, email, origen, whatsapp\)/);
  // El que ya dejó el teléfono y vuelve a bajar la guía desde LinkedIn (sin el campo) no
  // puede borrarse el número a sí mismo.
  assert.match(src, /whatsapp = COALESCE\(NULLIF\(EXCLUDED\.whatsapp, ''\), leads_preguntas\.whatsapp\)/,
    "el ON CONFLICT pisa el whatsapp con vacío");
});

test("el aviso que le llega a Cande trae el teléfono", async () => {
  const src = await leer("../pages/api/preguntas-lead.js");
  const i = src.indexOf('avisar("Founder bajó las 9 preguntas"');
  assert.ok(i > -1);
  assert.match(src.slice(i, i + 320), /WhatsApp: whatsapp/,
    "el aviso no trae el teléfono: tendría que abrir el CRM para contestar");
});

test("el CRM trae la columna, si no el dato queda enterrado en la base", async () => {
  const src = await leer("../scripts/crm_sync.mjs");
  const i = src.indexOf("FROM leads_preguntas");
  assert.ok(i > -1);
  assert.match(src.slice(Math.max(0, i - 220), i), /whatsapp/,
    "crm_sync no selecciona whatsapp: no aparece en crm_founders.json");
});

test("al que baja la guía desde LinkedIn no se le cambió el formulario", async () => {
  const src = await leer("../pages/preguntas.jsx");
  // El texto de siempre sigue existiendo para el que no viene de hola.
  assert.match(src, /Te llega en un minuto\. Si no lo ves, fijate en spam o promociones\./);
  assert.match(src, /"Mandámelas por mail →"/);
});
