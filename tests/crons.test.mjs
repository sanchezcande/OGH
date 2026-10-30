// Los crons que tocan la base corren cada 15 minutos, todos en los mismos minutos (lib/crons.js, 21/10): así la base de
// Neon se despierta una vez por vuelta y duerme entre una y la otra. Con crons cada 2 o 3 minutos no dormía nunca y se
// quedó sin las horas de cómputo del plan gratis. Las cadenas de mails corren una vez por día y no se tocan.
//
// La única excepción es la pasada rápida de la bandeja (30/10, cada 3 minutos): es el aviso de que hay un mensaje
// nuevo, que antes daba ManyChat, y ya no hay cuota que cuidar (Cande pagó el plan de Neon el 21/10). Sus minutos
// (1, 4, 7… 58) no caen nunca en los del resto, así que ninguna vuelta del barrido se cruza con una rápida.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { CADA_CRON_MIN, CADA_CRON_MS, HORARIO_CRON, RAPIDA_CRON_MIN, RAPIDA_CRON_MS, HORARIO_RAPIDA } = await import("../lib/crons.js");
const leer = async (ruta) => readFile(new URL(ruta, import.meta.url), "utf8");

/** Las que corren una vez por día, con su hora (las cadenas de mails). */
const DIARIOS = { "/api/drip": "0 13 * * *", "/api/drip-preguntas": "45 12 * * *" };
/** Las que tocan la base cada vuelta. */
const CADA_VUELTA = ["/api/cola-publicar", "/api/dm/toques", "/api/dm/instagram", "/api/dm/espera", "/api/dm/bandeja", "/api/dm/controlador", "/api/dm/comentarios"];
/** La pasada rápida de la bandeja, la única que va en otra cadencia. */
const RAPIDOS = { "/api/dm/bandeja-rapida": HORARIO_RAPIDA };

test("la cadencia es una sola: cada 15 minutos, a los 0, 15, 30 y 45 de cada hora", () => {
  assert.equal(CADA_CRON_MIN, 15);
  assert.equal(CADA_CRON_MS, 15 * 60000);
  assert.equal(HORARIO_CRON, "*/15 * * * *");
});

test("vercel.json: todos los crons que tocan la base van cada 15 minutos, en los mismos minutos; los diarios, como estaban", async () => {
  const crons = JSON.parse(await leer("../vercel.json")).crons;
  const porRuta = Object.fromEntries(crons.map((c) => [c.path, c.schedule]));
  assert.equal(crons.length, Object.keys(porRuta).length, "un cron por ruta");
  for (const ruta of CADA_VUELTA) assert.equal(porRuta[ruta], HORARIO_CRON, ruta);
  for (const [ruta, horario] of Object.entries(DIARIOS)) assert.equal(porRuta[ruta], horario, ruta);
  for (const [ruta, horario] of Object.entries(RAPIDOS)) assert.equal(porRuta[ruta], horario, ruta);
  // Uno nuevo entra en una de las tres listas: si no, despertaría la base en otros minutos.
  for (const c of crons) {
    assert.ok(c.schedule === HORARIO_CRON || DIARIOS[c.path] === c.schedule || RAPIDOS[c.path] === c.schedule, `${c.path}: ${c.schedule}`);
  }
});

test("la pasada rápida va cada 3 minutos y en minutos que no son los del barrido", () => {
  assert.equal(RAPIDA_CRON_MIN, 3);
  assert.equal(RAPIDA_CRON_MS, 3 * 60000);
  assert.equal(HORARIO_RAPIDA, "1-59/3 * * * *");
  // Los minutos de cada reloj, para que no se pisen: la rápida arranca en el 1 y el barrido, en el 0.
  const rapidos = new Set();
  for (let m = 1; m <= 59; m += RAPIDA_CRON_MIN) rapidos.add(m);
  for (let m = 0; m < 60; m += CADA_CRON_MIN) assert.ok(!rapidos.has(m), `el minuto ${m} tiene las dos vueltas`);
  // Y que sea más seguido que el barrido: si no, no arregla nada.
  assert.ok(RAPIDA_CRON_MS < CADA_CRON_MS);
});

test("el reloj de GitHub para la cola también va cada 15 minutos, con los de Vercel", async () => {
  const yml = await leer("../.github/workflows/cola-publicar.yml");
  const horarios = [...yml.matchAll(/cron:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(horarios, [HORARIO_CRON]);
});

test("cada vuelta del cron de Instagram mira hasta una página (50 charlas): las movidas en 15 minutos no se quedan afuera", async () => {
  const { CHARLAS_POR_VUELTA } = await import("../pages/api/dm/instagram.js");
  assert.equal(CHARLAS_POR_VUELTA, 50);
  assert.match(await leer("../pages/api/dm/instagram.js"), /limite: ultimo \? CHARLAS_POR_VUELTA : 10,/);
});
