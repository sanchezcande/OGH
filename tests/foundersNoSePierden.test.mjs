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

// Esta es la prueba que cierra la clase de bug entera, no solo este cambio. Ya pasó tres veces
// en un mes: el embudo del video el 12/10 (sufijos _a/_b sin aceptar), preguntas_email_enviado
// (desde el 18/09, cero filas en la base) y el embudo en ingles completo de /apply (nueve fases
// con sufijo _en, cero filas desde que existe). Siempre igual: la pagina manda una fase, la API
// contesta 400 y el dato se tira sin que nadie se entere. Si alguien suma una fase nueva y se
// olvida de habilitarla, esto falla antes de que se pierda un solo evento.
test("ninguna pagina manda una fase que la API no acepte", async () => {
  const path = await import("node:path");
  const api = await leer("../pages/api/evento.js");
  const origenForm = await leer("../lib/origenForm.js");
  const videoAB = await leer("../lib/videoAB.js");
  const listas = api + origenForm + videoAB;

  // Los patrones salen del codigo de verdad, no escritos a mano acá: si alguien borra uno,
  // esta prueba tiene que fallar. Escribirlos a mano la volveria una prueba de mentira.
  // Los de evento.js son literales y se leen del archivo; el de videoAB se arma con
  // new RegExp(), asi que ese se importa.
  const { CON_VERSION } = await import("../lib/videoAB.js");
  const patrones = [...api.matchAll(/=\s*\/(\^.+?\$)\/[gimsuy]*\s*;/g)].map((m) => new RegExp(m[1]));
  patrones.push(CON_VERSION);
  assert.ok(patrones.length >= 3, `esperaba los patrones acotados de la API, encontre ${patrones.length}`);

  // Solo las fases literales: evento("x"). Las armadas por concatenacion, como
  // evento("form_visto_" + de) en /devs, tienen su propia prueba en eventoOrigenForm y acá
  // darian un falso positivo. Por eso el patron exige la comilla Y el parentesis que cierra.
  const raiz = new URL("../pages/", import.meta.url);
  const usadas = new Map();
  const recorrer = async (dir) => {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const hijo = new URL(e.name + (e.isDirectory() ? "/" : ""), dir);
      if (e.isDirectory()) { await recorrer(hijo); continue; }
      if (!/\.(jsx?|tsx?)$/.test(e.name)) continue;
      const src = await fs.readFile(hijo, "utf8");
      for (const m of src.matchAll(/evento\(\s*"([a-z0-9_]+)"\s*\)/g)) {
        if (!usadas.has(m[1])) usadas.set(m[1], path.basename(hijo.pathname));
      }
    }
  };
  await recorrer(raiz);

  assert.ok(usadas.size > 10, "no encontre las fases: cambio la forma de llamar a evento()");
  const huerfanas = [];
  for (const [fase, archivo] of usadas) {
    // O esta escrita tal cual en alguna lista, o la matchea alguno de los patrones acotados.
    const literal = listas.includes(`"${fase}"`);
    const porPatron = patrones.some((re) => re.test(fase));
    if (!literal && !porPatron) huerfanas.push(`${fase} (${archivo})`);
  }
  assert.deepEqual(huerfanas, [], `fases que la API rechaza con 400 y se pierden en silencio:\n  ${huerfanas.join("\n  ")}`);
});

test("el embudo en ingles de /apply esta aceptado, no solo el de /devs", async () => {
  const api = await leer("../pages/api/evento.js");
  const m = /const CON_IDIOMA = \/(.+)\/;/.exec(api);
  assert.ok(m, "falta el patron CON_IDIOMA en /api/evento");
  const re = new RegExp(m[1]);
  for (const f of ["form_visto_en", "enviado_en", "gracias_vista_en", "video_play_en",
                   "video_25_en", "video_50_en", "video_75_en", "video_fin_en", "click_gumroad_en"]) {
    assert.ok(re.test(f), `${f} sigue sin aceptarse`);
  }
  // Acotado: no abre la puerta a cualquier cosa terminada en _en.
  for (const mala of ["cualquiera_en", "_en", "form_visto_es", "form_visto_en_en"]) {
    assert.ok(!re.test(mala), `el patron acepta ${mala} y no deberia`);
  }
});
