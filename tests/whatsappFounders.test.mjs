import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

// 18/10/2026. Cande trabaja por WhatsApp: con el mail el founder entra a la cadena de goteo,
// con el telefono lo puede llamar. Se pide OPCIONAL a proposito, porque obligarlo frena al que
// solo queria el PDF y ese lead ya no se pierde con el mail.
// Estas pruebas fallan si alguien lo vuelve obligatorio, si deja de viajar al servidor, o si
// una segunda bajada sin telefono pisa el que la persona ya habia dejado.

const leer = (p) => fs.readFile(new URL(p, import.meta.url), "utf8");

test("el formulario manda el whatsapp al servidor", async () => {
  const src = await leer("../pages/preguntas.jsx");
  assert.match(src, /id="whatsapp"/, "no esta el campo en el formulario");
  assert.match(src, /JSON\.stringify\(\{[^}]*whatsapp[^}]*\}\)/,
    "el campo existe pero no viaja en el body");
});

test("el whatsapp es opcional: solo el email corta el envio", async () => {
  const form = await leer("../pages/preguntas.jsx");
  const campo = /<input id="whatsapp"[^>]*>/.exec(form);
  assert.ok(campo, "no encontre el input de whatsapp");
  assert.ok(!/\brequired\b/.test(campo[0]), "el whatsapp quedo obligatorio y frena al que solo quiere el PDF");

  const api = await leer("../pages/api/preguntas-lead.js");
  assert.match(api, /if \(!email\) return res\.status\(400\)/, "el email dejo de ser el unico obligatorio");
  assert.ok(!/if \(!whatsapp\) return res\.status\(400\)/.test(api),
    "la API esta rechazando a quien no deja telefono");
});

test("volver a bajar la guia sin telefono no borra el que ya habia dejado", async () => {
  const api = await leer("../pages/api/preguntas-lead.js");
  assert.match(api, /ADD COLUMN IF NOT EXISTS whatsapp/, "la columna no se crea");
  assert.match(api, /whatsapp = COALESCE\(EXCLUDED\.whatsapp, leads_preguntas\.whatsapp\)/,
    "el upsert pisa el telefono viejo con null cuando vuelve sin telefono");
});

test("el aviso de Telegram dice si dejo telefono o no", async () => {
  const api = await leer("../pages/api/preguntas-lead.js");
  assert.match(api, /WhatsApp: whatsapp \|\| "no dejó"/,
    "sin esto hay que entrar a la base para saber si se puede llamar");
});
