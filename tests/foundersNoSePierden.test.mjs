import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

// 18/10/2026. El boton "quiero contratar" de /hola iba derecho a la agenda de Google.
// El que no reservaba en ese momento se perdia entero: ni nombre ni mail, y el embudo
// terminaba en el click. Nueve clicks en 30 dias dejaron CERO founders en leads_preguntas,
// mientras /preguntas, que SI captura, tenia 16 visitas en toda su historia.
// Estas pruebas fallan si alguien vuelve a mandar esa puerta a un lugar que no captura,
// o si las fases nuevas se usan en la pagina pero no se aceptan en la API.

const leer = (p) => fs.readFile(new URL(p, import.meta.url), "utf8");

test("quiero contratar va a una pagina que captura, no a la agenda", async () => {
  const src = await leer("../pages/hola.jsx");
  const m = /contrata:\s*"([^"]+)"/.exec(src);
  assert.ok(m, "no encontre el destino contrata en pages/hola.jsx");
  const destino = m[1];
  assert.ok(destino.startsWith("/"), `contrata sale del sitio y no se puede medir: ${destino}`);
  const u = new URL(destino, "https://x.test");
  assert.equal(u.pathname, "/preguntas");
  assert.equal(u.searchParams.get("o"), "hola", "sin ?o=hola el lead entra sin saber de donde vino");
});

test("al que llega desde hola se le ofrece la llamada ANTES del formulario", async () => {
  const src = await leer("../pages/preguntas.jsx");
  assert.match(src, /const deHola = router\.query\.o === "hola"/);
  const iPrimero = src.indexOf("<Primero>");
  const iForm = src.indexOf("<Form onSubmit={enviar}");
  assert.ok(iPrimero > -1, "falta el bloque de la llamada para el que viene de /hola");
  assert.ok(iPrimero < iForm, "la llamada quedo DEBAJO del formulario: el founder caliente se va");
});

test("la llamada no queda detras del mail", async () => {
  const src = await leer("../pages/preguntas.jsx");
  // El bloque de arriba tiene que estar fuera del estado "listo", que es el de despues de enviar.
  const bloque = src.slice(src.indexOf("<Primero>"), src.indexOf("</Primero>"));
  assert.match(bloque, /BotonSec href=\{LLAMADA\}/);
  assert.ok(!/estado === "listo"/.test(bloque), "el boton de la llamada quedo detras del formulario");
});

test("las fases nuevas estan aceptadas en la API, si no el dato se pierde en silencio", async () => {
  const pagina = await leer("../pages/preguntas.jsx");
  const api = await leer("../pages/api/evento.js");
  const usadas = [...pagina.matchAll(/evento\("([a-z0-9_]+)"\)/g)].map((m) => m[1]);
  assert.ok(usadas.includes("preguntas_vista_hola"));
  assert.ok(usadas.includes("preguntas_llamada_click_hola"));
  for (const f of usadas) {
    assert.ok(api.includes(`"${f}"`), `la pagina manda ${f} y /api/evento no la acepta: contesta 400`);
  }
});
