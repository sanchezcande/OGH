// Charlas retomadas (20/10, lib/dm/instagram.js): Cande contesta a mano, desde el celular, charlas viejas y quiere que
// después las siga el agente aunque no pegue tal cual el texto anotado. Acá: la acción retomar_marcar de
// /api/dm/config, el texto de las consultas nuevas de lib/dm/base.js y que las piezas reales estén conectadas. Lo que
// hacen la mirada, el cron de Instagram, la red de la bandeja y el agente está en dmInstagram, dmBandeja y dm.test.mjs.
//
// Lo que NO cubren: las consultas contra un Postgres de verdad (el doble no las conoce). Se probaron contra un Postgres
// 16 local y descartable, con las tablas de tablas(): anotarCandeDesdeIg anota como de Cande, no repite un ig_mid, no
// anota en una charla de Cande, contesta lo del lead hasta el último mensaje anotado (por la hora) y cancela el toque;
// marcarRetomadas suma marcas sin pisar las otras, limpia las vencidas y con quitar saca solo esas; cualesDelAgente
// devuelve solo las del agente. Los ids y textos son inventados (este repo es público).
//
// Correr:  node --test tests/*.test.mjs
import { respuesta } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { base: pg } = await import("./dobles/postgres.mjs");
const { CLAVE_RETOMADAS, DIAS_RETOMADA } = await import("../lib/dm/instagram.js");

const DIA = 86400000;
const leer = (r) => readFile(new URL(r, import.meta.url), "utf8");
/** El cuerpo de una función exportada de un archivo, hasta la siguiente. */
const cuerpoDe = (src, nombre) => {
  const i = src.indexOf(`export async function ${nombre}(`);
  assert.ok(i > -1, `falta ${nombre}`);
  const fin = src.indexOf("\nexport ", i + 10);
  return src.slice(i, fin === -1 ? undefined : fin);
};

test("retomar_marcar marca las charlas por 7 días (o los que se digan), dice cuáles no son del agente y con quitar les saca la marca", async () => {
  const { default: handler } = await import("../pages/api/dm/config.js");
  const pedidos = [];
  let guardado = {};
  pg.otras = (t, params) => {
    // Como la consulta: suma las nuevas, limpia las vencidas y saca las de `fuera`.
    if (t.startsWith(`INSERT INTO dm_config (clave, valor) VALUES ('${CLAVE_RETOMADAS}', ?::jsonb)`)) {
      const [nuevas, ahora, fuera] = [JSON.parse(params[0]), Number(params[1]), JSON.parse(params[2])];
      pedidos.push({ nuevas, fuera });
      guardado = Object.fromEntries(Object.entries({ ...guardado, ...nuevas }).filter(([k, v]) => v.hasta > ahora && !fuera.includes(k)));
      return { rows: [{ valor: guardado }] };
    }
    if (t.startsWith("SELECT id FROM dm_contactos WHERE dueno = 'agente' AND id IN")) {
      return { rows: JSON.parse(params[0]).filter((x) => x !== "333").map((id) => ({ id })) };
    }
    if (/^(CREATE|ALTER|UPDATE)/.test(t)) return { rows: [] };
    return undefined;
  };
  process.env.COLA_SECRET = "secreto-de-prueba";
  process.env.POSTGRES_URL = "postgres://de-prueba";
  const llamar = async (body) => {
    const res = respuesta();
    await handler({ method: "POST", headers: { authorization: "Bearer secreto-de-prueba" }, body: { accion: "retomar_marcar", ...body } }, res);
    return res;
  };
  try {
    const antes = Date.now();
    const bien = await llamar({ contactos: ["111", " 222 ", "111", "333"] });
    assert.equal(bien.codigo, 200);
    assert.deepEqual(Object.keys(pedidos[0].nuevas), ["111", "222", "333"]);
    assert.deepEqual(pedidos[0].fuera, []);
    const hasta = pedidos[0].nuevas["111"].hasta;
    assert.equal(DIAS_RETOMADA, 7);
    assert.ok(hasta >= antes + 7 * DIA && hasta <= Date.now() + 7 * DIA, "vence en 7 días");
    assert.deepEqual(bien.cuerpo, { ok: true, recibidos: 3, vigentes: 3, hasta: new Date(hasta).toISOString(), no_son_del_agente: ["333"] });

    const tres = await llamar({ contactos: ["444"], dias: 3 });
    assert.equal(tres.codigo, 200);
    assert.ok(Math.abs(pedidos[1].nuevas["444"].hasta - (Date.now() + 3 * DIA)) < 5000, "vence en 3 días");
    assert.equal(tres.cuerpo.vigentes, 4);

    const quitar = await llamar({ contactos: ["222"], quitar: true });
    assert.deepEqual(pedidos.at(-1), { nuevas: {}, fuera: ["222"] });
    assert.deepEqual(quitar.cuerpo, { ok: true, recibidos: 1, vigentes: 3 });
    assert.deepEqual(Object.keys(guardado).sort(), ["111", "333", "444"]);

    const malos = [{}, { contactos: [] }, { contactos: "111" }, { contactos: ["no vale!"] }, { contactos: ["1"], dias: 0 }, { contactos: ["1"], dias: 31 },
      { contactos: ["1"], dias: "7" }, { contactos: ["1"], dias: 2.5 }, { contactos: Array.from({ length: 1001 }, (_, i) => String(i)) }];
    for (const mal of malos) assert.equal((await llamar(mal)).codigo, 400, JSON.stringify(mal).slice(0, 60));
    assert.equal(pedidos.length, 3, "con un pedido malo no se guarda nada");
  } finally {
    pg.otras = null;
    delete process.env.COLA_SECRET;
    delete process.env.POSTGRES_URL;
  }
});

test("anotarCandeDesdeIg: como de Cande, una vez por id de Instagram, solo en charlas del agente, y contesta lo del lead hasta su último mensaje por la hora", async () => {
  const cuerpo = cuerpoDe(await leer("../lib/dm/base.js"), "anotarCandeDesdeIg");
  assert.match(cuerpo, /WITH c AS \(SELECT id FROM dm_contactos WHERE id = \$\{id\} AND dueno = 'agente'\)/);
  assert.match(cuerpo, /SELECT c\.id, 'cande', x\.m->>'texto', \(x\.m->>'creado'\)::timestamptz, x\.m->>'mid'/);
  assert.match(cuerpo, /ON CONFLICT DO NOTHING/);
  assert.match(cuerpo, /l\.quien = 'lead' AND l\.creado <= \(SELECT MAX\(creado\) FROM n\)/);
  assert.match(cuerpo, /proximo_toque = NULL/);
  assert.match(cuerpo, /WHERE id = \$\{id\} AND EXISTS \(SELECT 1 FROM n\)/);
  assert.doesNotMatch(cuerpo, /SET dueno|ultimo_lead/, "no cambia de dueño ni abre la ventana de 24 horas");
});

test("marcarRetomadas: una sola sentencia que suma sin pisar, limpia las vencidas y con quitar saca solo esas", async () => {
  const cuerpo = cuerpoDe(await leer("../lib/dm/base.js"), "marcarRetomadas");
  assert.match(cuerpo, new RegExp(`VALUES \\('${CLAVE_RETOMADAS}', \\$\\{JSON\\.stringify\\(nuevas\\)\\}::jsonb\\)`));
  assert.match(cuerpo, /ON CONFLICT \(clave\) DO UPDATE SET valor = \(/);
  assert.match(cuerpo, /jsonb_each\(dm_config\.valor \|\| EXCLUDED\.valor\)/);
  assert.match(cuerpo, /\(e\.v->>'hasta'\)::bigint > \$\{Date\.now\(\)\}::bigint/);
  assert.match(cuerpo, /e\.k NOT IN \(SELECT jsonb_array_elements_text\(\$\{JSON\.stringify\(fuera\)\}::jsonb\)\)/);
  const cuales = cuerpoDe(await leer("../lib/dm/base.js"), "cualesDelAgente");
  assert.match(cuales, /WHERE dueno = 'agente' AND id IN \(SELECT jsonb_array_elements_text/);
});

test("las piezas reales están conectadas: la base, la red de la bandeja, el cron de Instagram y la prueba de la conexión", async () => {
  const baseJs = await import("../lib/dm/base.js");
  for (const f of ["anotarCandeDesdeIg", "marcarRetomadas", "cualesDelAgente"]) assert.equal(typeof baseJs[f], "function", f);
  // Las reglas de verdad (lib/dm/armado.js) tienen la base entera: anotarRetomada usa su anotarCandeDesdeIg.
  assert.match(await leer("../lib/dm/armado.js"), /crearReglasInstagram\(\{\s*ig: instagram, base, manychat/);
  assert.match(await leer("../pages/api/dm/bandeja.js"), /tomar, soltar, anotarDesdeBandeja, anotarCandeDesdeIg, darDeAltaDesdeBandeja/);
  const cron = await leer("../pages/api/dm/instagram.js");
  assert.match(cron, /\(\{ miradas, sacadas, anotadas \} = r\)/);
  assert.match(cron, /miradas, sacadas, anotadas, usuarios \}/);
  assert.match(await leer("../pages/api/dm/config.js"), /retomada: esRetomada\(await leerConfig\(CLAVE_RETOMADAS\), id\)/);
});
