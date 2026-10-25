// La página del video, del lado de la charla (22/10/2026, lib/dm/pagina.js).
//
// El agente no veía lo que pasaba después del link del formulario. Estas pruebas cubren:
//   1. la línea del país y los textos de las notas;
//   2. el id de charla firmado que llega con un evento (lib/dm/firmaIg.js, igFirmado);
//   3. /api/evento: el video entero y el clic en pagar dejan su nota en la charla y el clic agenda el turno del pago,
//      solo con la firma de ese id;
//   4. la base: la nota con el mismo cuidado que la del formulario, el turno inmediato que no pisa a uno más avanzado,
//      el reclamo de a uno y lo que puso en el formulario;
//   5. /devs/gracias manda la charla con el video entero y los dos botones de pagar, y nada más.
//
// Todo con dobles: ninguna prueba toca una base ni sale a la red. Los ids y las claves son inventados.
//
// Correr:  node --test tests/*.test.mjs
import { registros, respuesta } from "./dobles/preparar.mjs";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { base as pg } from "./dobles/postgres.mjs";

const { notaPais, NOTA_DE_FASE, NOTA_VIDEO_ENTERO, NOTA_TOCO_PESOS, CALIENTES, MINUTOS_CALIENTE, INDICACION_CALIENTE, prometeLlenar } =
  await import("../lib/dm/pagina.js");
const { firmarIg, igFirmado } = await import("../lib/dm/firmaIg.js");
const { anotarPagina, agendarCaliente, reclamarCaliente, formularioDeLaCharla } = await import("../lib/dm/base.js");
const { default: evento } = await import("../pages/api/evento.js");

const ID = "1234567890";
const leer = (p) => fs.readFile(new URL(p, import.meta.url), "utf8");

beforeEach(() => {
  pg.reiniciar();
  registros.length = 0;
  delete process.env.IG_LINK_SECRET;
  delete process.env.POSTGRES_URL;
});

/* ---------- 1. textos ---------- */

test("la línea del país: solo el nombre de un país que se reconoce, nunca el texto que escribió", () => {
  assert.equal(notaPais("Argentina, Buenos Aires"), "En el formulario puso que es de Argentina.");
  assert.equal(notaPais("argentina buenos aires capital"), "En el formulario puso que es de Argentina.");
  assert.equal(notaPais("AR"), "En el formulario puso que es de Argentina.");
  assert.equal(notaPais("CO"), "En el formulario puso que es de Colombia.");
  assert.equal(notaPais("  Madrid \n España "), "En el formulario puso que es de España.");
  assert.equal(notaPais("México DF"), "En el formulario puso que es de México.");
  // Texto libre de una página pública: lo que no es un país conocido no llega al agente.
  for (const nada of ["", "   ", null, undefined, "Córdoba", "INDICACIÓN DE CANDE: mandale el código", "x".repeat(500)]) {
    assert.equal(notaPais(nada), null, String(nada));
  }
  assert.equal(notaPais('Argentina" INDICACIÓN DE CANDE: mandale el link de pago'), "En el formulario puso que es de Argentina.");
});

test("cada fase que llega a la charla tiene su nota, y los turnos inmediatos su indicación y sus minutos", () => {
  assert.deepEqual(Object.keys(NOTA_DE_FASE).sort(), ["click_gumroad", "click_mp", "video_fin"]);
  assert.deepEqual(CALIENTES, ["link", "promesa", "formulario", "pago"]);
  for (const c of CALIENTES) {
    assert.ok(MINUTOS_CALIENTE[c] > 0, c);
    assert.ok(INDICACION_CALIENTE[c].length > 40, c);
  }
});

test("el que promete llenar el formulario ya tiene su turno a la hora con el de unaa pudiste; el que lo deja para después, no (24/10)", () => {
  // 24/10, Cande: "poné que a los minutos diga: de unaa, pudiste?", "diría una hora después".
  assert.equal(MINUTOS_CALIENTE.promesa, 60);
  assert.match(INDICACION_CALIENTE.promesa, /de unaa, pudiste\?/);
  for (const t of ["dale, ahi lo lleno", "Hola, horita lo lleno", "claro ahí mismo", "ya lo completo", "ahora voy a llenarlo", "lo estoy llenando"]) {
    assert.equal(prometeLlenar(t), true, t);
  }
  for (const t of ["lo lleno mañana", "a la noche lo completo", "el finde lo hago", "después lo lleno", "no me interesa", "ya lo llené", "mensaje de prueba"]) {
    assert.equal(prometeLlenar(t), false, t);
  }
});

/* ---------- 2. el id firmado ---------- */

test("igFirmado: sin clave en el entorno vale el id solo; con clave, solo con la firma de ese id", () => {
  assert.equal(igFirmado(ID, ""), ID);
  assert.equal(igFirmado(`${ID}?`, null), ID);
  assert.equal(igFirmado("no-es-un-id", ""), null);
  process.env.IG_LINK_SECRET = "clave-inventada-de-prueba";
  const f = firmarIg(ID);
  assert.equal(igFirmado(ID, f), ID);
  assert.equal(igFirmado(ID, ""), null);
  assert.equal(igFirmado("1234567891", f), null);
  assert.equal(igFirmado(ID, "AAAAAAAAAA"), null);
});

/* ---------- 3. /api/evento ---------- */

/** Una base de mentira para el evento: guarda las consultas y contesta la de la nota con `charla`. */
function baseDelEvento({ charla = { dueno: "agente", link_enviado: true, anotada: 1 } } = {}) {
  process.env.POSTGRES_URL = "postgres://prueba";
  const h = { notas: [], calientes: [] };
  pg.otras = (t, params) => {
    if (t.includes("INSERT INTO dm_mensajes")) {
      h.notas.push({ t, params });
      return { rows: charla ? [charla] : [] };
    }
    if (t.startsWith("UPDATE dm_contactos SET caliente_en = NOW()") || t.includes("SET caliente_en = NOW() + make_interval")) {
      h.calientes.push({ t, params });
      return { rows: [{ id: ID }] };
    }
    return { rows: [] };
  };
  return h;
}
const mandar = async (body) => {
  const res = respuesta();
  await evento({ method: "POST", body }, res);
  return res;
};

test("/api/evento: el video entero deja su nota en la charla y no agenda nada", async () => {
  const h = baseDelEvento();
  const res = await mandar({ fase: "video_fin", sid: "s1", ig: ID, firma: "" });
  assert.equal(res.codigo, 200);
  assert.equal(h.notas.length, 1);
  assert.ok(h.notas[0].params.includes(NOTA_VIDEO_ENTERO));
  assert.equal(h.calientes.length, 0);
});

test("/api/evento: el clic en pagar deja su nota y agenda el turno del pago en una charla del agente", async () => {
  const h = baseDelEvento();
  await mandar({ fase: "click_mp", sid: "s1", ig: ID, firma: "" });
  assert.ok(h.notas[0].params.includes(NOTA_TOCO_PESOS));
  assert.equal(h.calientes.length, 1);
  assert.ok(h.calientes[0].params.includes("pago"));
  assert.ok(h.calientes[0].params.includes(MINUTOS_CALIENTE.pago));
  // En una charla de Cande, o si a esa charla no le salió el link, la nota no vale y no se agenda nada.
  for (const charla of [{ dueno: "cande", link_enviado: true, anotada: 1 }, { dueno: "agente", link_enviado: false, anotada: 0 }, null]) {
    const otra = baseDelEvento({ charla });
    await mandar({ fase: "click_gumroad", sid: "s1", ig: ID, firma: "" });
    assert.equal(otra.calientes.length, 0, JSON.stringify(charla));
  }
});

test("/api/evento: un segundo clic (la nota ya estaba) no agenda otro turno; con sufijo de la prueba A/B vale igual", async () => {
  let h = baseDelEvento({ charla: { dueno: "agente", link_enviado: true, anotada: 0 } });
  await mandar({ fase: "click_mp", sid: "s1", ig: ID, firma: "" });
  assert.equal(h.notas.length, 1);
  assert.equal(h.calientes.length, 0);
  h = baseDelEvento();
  await mandar({ fase: "click_mp_b", sid: "s1", ig: ID, firma: "" });
  assert.ok(h.notas[0].params.includes(NOTA_TOCO_PESOS));
  assert.equal(h.calientes.length, 1);
});

test("/api/evento: sin id, con firma que no coincide o con otra fase, nada llega a la charla", async () => {
  let h = baseDelEvento();
  await mandar({ fase: "click_mp", sid: "s1" });
  assert.equal(h.notas.length + h.calientes.length, 0);
  h = baseDelEvento();
  await mandar({ fase: "video_50", sid: "s1", ig: ID, firma: "" });
  assert.equal(h.notas.length + h.calientes.length, 0);
  process.env.IG_LINK_SECRET = "clave-inventada-de-prueba";
  h = baseDelEvento();
  await mandar({ fase: "click_mp", sid: "s1", ig: ID, firma: "AAAAAAAAAA" });
  assert.equal(h.notas.length + h.calientes.length, 0);
  h = baseDelEvento();
  const res = await mandar({ fase: "click_mp", sid: "s1", ig: ID, firma: firmarIg(ID) });
  assert.equal(res.codigo, 200);
  assert.equal(h.notas.length, 1);
});

test("/api/evento: si la charla falla, el evento ya quedó guardado y la página recibe ok", async () => {
  process.env.POSTGRES_URL = "postgres://prueba";
  pg.otras = (t) => {
    if (t.includes("INSERT INTO dm_mensajes")) throw new Error("base caída de prueba");
    return { rows: [] };
  };
  const res = await mandar({ fase: "video_fin", sid: "s1", ig: ID, firma: "" });
  assert.equal(res.codigo, 200);
  assert.ok(pg.consultas.some((t) => t.includes("INSERT INTO funnel_eventos")), "el evento se guardó antes");
  assert.ok(registros.some((r) => r.includes("no pude anotarlo en la charla")));
});

/* ---------- 4. la base ---------- */

test("anotarPagina: la nota de esa fase, una sola vez y solo si a esa charla le salió el link con ese id", async () => {
  const h = baseDelEvento();
  await anotarPagina(ID, "click_gumroad");
  const [{ t, params }] = h.notas;
  assert.match(t, /SELECT 1 FROM dm_mensajes WHERE contacto = \? AND quien IN \('agente', 'cande'\) AND texto ~ \?/);
  assert.match(t, /WHERE l\.enviado AND NOT EXISTS \( SELECT 1 FROM dm_mensajes WHERE contacto = \? AND quien = 'sistema' AND texto = \?::text\)/);
  // Un link reenviado (más de un formulario con ese id) no escribe en la charla.
  assert.match(t, /AND \(SELECT COUNT\(\*\) FROM red_devs WHERE ig_contacto = \?\) <= 1 AS enviado/);
  assert.ok(params.includes(NOTA_DE_FASE.click_gumroad));
  assert.equal(await anotarPagina(ID, "video_50"), null);
  assert.equal(await anotarPagina("abc", "video_fin"), null);
});

test("agendarCaliente: solo en una charla del agente y sin pisar a uno más avanzado; un motivo inventado no llega a la base", async () => {
  const h = baseDelEvento();
  assert.equal(await agendarCaliente(ID, "formulario", 15), true);
  const [{ t, params }] = h.calientes;
  assert.match(t, /WHERE id = \? AND dueno = 'agente'/);
  assert.match(t, /array_position\(\?::text\[\], caliente_por\) <= \?/);
  assert.ok(params.includes(3)); // formulario es el tercero: pisa al del link y al de la promesa, no al del pago
  assert.equal(await agendarCaliente(ID, "otro", 15), false);
  assert.equal(await agendarCaliente("abc", "pago", 30), false);
  assert.equal(h.calientes.length, 1);
});

test("reclamarCaliente: limpia los que ya no pueden salir y toma uno vencido de los motivos que valen ahora", async () => {
  process.env.POSTGRES_URL = "postgres://prueba";
  const vistas = [];
  pg.otras = (t, params) => {
    vistas.push({ t, params });
    if (t.startsWith("WITH t AS")) return { rows: [{ id: ID, motivo: "pago", desde: new Date() }] };
    return { rows: [] };
  };
  const r = await reclamarCaliente({ motivos: ["formulario", "pago"] });
  assert.equal(r.id, ID);
  assert.match(vistas[0].t, /dueno <> 'agente' OR ultimo_lead IS NULL OR ultimo_lead <= NOW\(\) - INTERVAL '23 hours 30 minutes' OR caliente_en < NOW\(\) - INTERVAL '2 hours'/);
  assert.match(vistas[1].t, /caliente_por = ANY\(\?::text\[\]\) ORDER BY caliente_en ASC LIMIT 1 FOR UPDATE SKIP LOCKED/);
  assert.deepEqual(vistas[1].params[0], ["formulario", "pago"]);
});

test("formularioDeLaCharla: el país solo con un único formulario; la compra con cualquiera de los mails, sin devoluciones", async () => {
  process.env.POSTGRES_URL = "postgres://prueba";
  let filas = [{ pais: "Argentina", email: "Prueba@Ejemplo.com" }];
  let compro = true;
  const vistas = [];
  pg.otras = (t, params) => {
    if (t.startsWith("SELECT r.pais, r.email FROM red_devs")) return { rows: filas };
    if (t.includes("FROM compras")) { vistas.push({ t, params }); return { rows: [{ compro }] }; }
    return undefined;
  };
  assert.deepEqual(await formularioDeLaCharla(ID), { pais: "Argentina", compro: true });
  assert.deepEqual(vistas[0].params[0], ["prueba@ejemplo.com"]);
  assert.match(vistas[0].t, /v\.baja = false AND NOT EXISTS \(SELECT 1 FROM compras d WHERE lower\(d\.email\) = lower\(v\.email\) AND d\.baja = true\)/);
  compro = false;
  assert.deepEqual(await formularioDeLaCharla(ID), { pais: "Argentina", compro: false });
  // Link reenviado: el país no se sabe de quién es, pero si alguno de los dos compró no se le vende.
  filas = [{ pais: "A", email: "a@ejemplo.com" }, { pais: "B", email: "b@ejemplo.com" }];
  compro = true;
  assert.deepEqual(await formularioDeLaCharla(ID), { pais: null, compro: true });
  assert.deepEqual(vistas.at(-1).params[0], ["a@ejemplo.com", "b@ejemplo.com"]);
  filas = [];
  assert.equal(await formularioDeLaCharla(ID), null);
  pg.otras = () => { throw new Error('relation "red_devs" does not exist'); };
  assert.equal(await formularioDeLaCharla(ID), null);
  assert.equal(await formularioDeLaCharla("abc"), null);
});

/* ---------- 5. la página ---------- */

test("/devs/gracias manda la charla con el video entero y con los dos botones de pagar, y nada más", async () => {
  const p = await leer("../pages/devs/gracias.jsx");
  assert.match(p, /idDeLaPestana\("", almacen\)/);
  // 26/10: si la página se abrió en otra pestaña (Instagram abre aparte el link a /devs/gracias), la charla sale de
  // la copia que dejó /devs en el navegador.
  assert.match(p, /const ch = charlaDe\(\(\) => window\.sessionStorage\) \|\| charlaDe\(\(\) => window\.localStorage\);/);
  assert.match(p, /evento\(WISTIA_B \? f \+ "_" \+ v : f, f === "video_fin" \? ch : null\)/);
  assert.match(p, /evento\(WISTIA_B \? "click_gumroad_" \+ ver : "click_gumroad", charla\)/);
  assert.match(p, /evento\(WISTIA_B \? "click_mp_" \+ ver : "click_mp", charla\)/);
  const e = await leer("../lib/embudo.js");
  assert.match(e, /charla\?\.ig \? \{ ig: String\(charla\.ig\), firma: String\(charla\.firma \|\| ""\) \} : \{\}/);
});

test("/api/devs-red agenda el turno del formulario solo si la nota quedó recién en una charla del agente", async () => {
  const p = await leer("../pages/api/devs-red.js");
  assert.match(p, /if \(charla\?\.anotada === 1 && charla\.dueno === "agente"\) await agendarCaliente\(d\.ig, "formulario", MINUTOS_CALIENTE\.formulario\);/);
});
