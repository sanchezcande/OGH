// Los crons que tocan la base corren cada 15 minutos, todos en los mismos minutos (lib/crons.js, 21/10): así la base de
// Neon se despierta una vez por vuelta y duerme entre una y la otra. Con crons cada 2 o 3 minutos no dormía nunca y se
// quedó sin las horas de cómputo del plan gratis. Las cadenas de mails corren una vez por día y no se tocan.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { CADA_CRON_MIN, CADA_CRON_MS, HORARIO_CRON } = await import("../lib/crons.js");
const leer = async (ruta) => readFile(new URL(ruta, import.meta.url), "utf8");

/** Las que corren una vez por día, con su hora (las cadenas de mails). */
const DIARIOS = { "/api/drip": "0 13 * * *", "/api/drip-preguntas": "45 12 * * *" };
/** Las que tocan la base cada vuelta. */
const CADA_VUELTA = ["/api/cola-publicar", "/api/dm/toques", "/api/dm/instagram", "/api/dm/espera", "/api/dm/bandeja", "/api/dm/controlador", "/api/dm/comentarios"];

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
  // Uno nuevo entra en una de las dos listas: si no, despertaría la base en otros minutos.
  for (const c of crons) assert.ok(c.schedule === HORARIO_CRON || DIARIOS[c.path] === c.schedule, `${c.path}: ${c.schedule}`);
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
