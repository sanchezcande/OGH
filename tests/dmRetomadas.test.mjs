// Charlas retomadas (20/10, lib/dm/instagram.js): Cande contesta a mano, desde el celular, charlas viejas y quiere que
// después las siga el agente aunque no pegue tal cual el texto anotado. Acá: la acción retomar_marcar de
// /api/dm/config, el texto de las consultas nuevas de lib/dm/base.js y que las piezas reales estén conectadas. Lo que
// hacen la mirada, el cron de Instagram, la red de la bandeja y el agente está en dmInstagram, dmBandeja y dm.test.mjs.
//
// Lo que NO cubren: las consultas contra un Postgres de verdad (el doble no las conoce). Se probaron contra un Postgres
// 16 local y descartable, con las tablas de tablas(): anotarCandeDesdeIg anota como de Cande, no repite un ig_mid, no
// anota en una charla de Cande, contesta lo del lead hasta el último mensaje anotado (por la hora) y cancela el toque;
// marcarRetomadas suma marcas sin pisar las otras, limpia las vencidas y con quitar saca solo esas; cualesDelAgente
// devuelve solo las del agente. Revisión del 21/10, contra el mismo Postgres: anotarCandeDesdeIg descarta lo pendiente
// que contestaba algo de antes del último mensaje de ella (creado antes o después de ese mensaje) y deja lo que contesta
// algo que el lead escribió después; si no anotó nada nuevo, no toca lo pendiente; estadoRetomadas trae dueño, último
// del lead, último de la cuenta (sin los automáticos) y si hay algo por salir después del último del lead, y no trae
// las que no están. Segunda revisión del 21/10, otra vez contra un Postgres 16 local y descartable (el SQL tal cual):
// sembrar deja toda la historia con la misma hora, y estadoRetomadas trae el id de lo último de cada lado por la hora y,
// a la misma hora, por el id (en una sembrada con el lead al final, el del lead es el más alto); anotarCandeDesdeIg deja
// la marca "usada" con la hora de lo que anotó, no la cambia si no anotó nada nuevo ni si ya estaba usada, y no crea
// una marca donde no había; marcarRetomadas deja sin usar la que se marca de nuevo, guarda una vencida hace 10 días y
// limpia las de más de 30, y con quitar saca solo esas. Tercera vuelta del 21/10, contra el mismo Postgres 16 local y
// descartable (el SQL tal cual): marcarRetomadas guarda la hora en que se marcó; marcada de nuevo, la que seguía vigente
// y sin usar se queda con la hora de la primera vez y la usada, la vencida o la que no tenía hora toman la nueva (con
// el hasta nuevo y sin "usada"); con quitar no toca las otras; anotarCandeDesdeIg deja la marca usada sin perder su
// hora; textosDeLaCuenta con desde trae lo del agente, lo anotado y los automáticos escritos después de esa hora, lo que
// el agente armó antes y salió después, lo pendiente, y los automáticos cargados, sin lo del lead, las notas, lo de
// control, lo descartado ni lo de otra charla. Tercera revisión del 21/10, contra otro Postgres 16 local y descartable
// (el SQL tal cual, armado con las funciones de lib/dm/base.js): sembrar con ig_id e ig_usuario deja los dos en el
// contacto; en una charla retomada donde el lead contestó por el webhook antes de que se anotara lo pegado (que queda
// con un id más alto y la hora de Instagram), --retomar por la hora deja abierto lo del lead (respondido_hasta en lo
// sembrado, 1 abierto) y por el id, como en main, lo daba por contestado (0 abiertos). Los ids y textos son inventados
// (este repo es público).
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
    // Como la consulta: suma las nuevas (una que seguía vigente y sin usar se queda con la hora en que se marcó la
    // primera vez), limpia las vencidas y saca las de `fuera`.
    if (t.startsWith(`INSERT INTO dm_config (clave, valor) VALUES ('${CLAVE_RETOMADAS}', ?::jsonb)`)) {
      const [nuevas, ahora, fuera] = [JSON.parse(params[0]), Number(params[1]), JSON.parse(params[3])];
      pedidos.push({ nuevas, fuera });
      const queda = (k, v) => {
        const antes = guardado[k];
        return antes && antes.usada == null && antes.marcada != null && antes.hasta > ahora ? { ...v, marcada: antes.marcada } : v;
      };
      guardado = Object.fromEntries(Object.entries({ ...guardado, ...Object.fromEntries(Object.entries(nuevas).map(([k, v]) => [k, queda(k, v)])) })
        .filter(([k, v]) => v.hasta > ahora && !fuera.includes(k)));
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
    // Guarda la hora en que se marcó: lo que la cuenta escriba después se mira con la marca (lib/dm/instagram.js).
    const marcada = pedidos[0].nuevas["111"].marcada;
    assert.ok(marcada >= antes && marcada <= Date.now(), "con la hora en que se marcó");
    assert.deepEqual(bien.cuerpo, { ok: true, recibidos: 3, vigentes: 3, hasta: new Date(hasta).toISOString(), no_son_del_agente: ["333"] });

    const tres = await llamar({ contactos: ["444", "111"], dias: 3 });
    assert.equal(tres.codigo, 200);
    assert.ok(Math.abs(pedidos[1].nuevas["444"].hasta - (Date.now() + 3 * DIA)) < 5000, "vence en 3 días");
    assert.equal(tres.cuerpo.vigentes, 4);
    assert.equal(guardado["111"].marcada, marcada, "marcada de nuevo sin usar: queda la hora de la primera vez");

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
  // Las vencidas se limpian a los 30 días de vencer, no al vencer: lo escrito con la marca vigente cuenta aunque se vea
  // después (revisión del 21/10). Vigentes son las que no vencieron.
  assert.match(cuerpo, /\(e\.v->>'hasta'\)::bigint > \$\{ahora - GUARDAR_RETOMADA_MS\}::bigint/);
  assert.match(await leer("../lib/dm/base.js"), /const GUARDAR_RETOMADA_MS = 30 \* 86400000;/);
  assert.match(cuerpo, /filter\(\(v\) => Number\(v\?\.hasta\) > ahora\)\.length/);
  assert.match(cuerpo, /e\.k NOT IN \(SELECT jsonb_array_elements_text\(\$\{JSON\.stringify\(fuera\)\}::jsonb\)\)/);
  const cuales = cuerpoDe(await leer("../lib/dm/base.js"), "cualesDelAgente");
  assert.match(cuales, /WHERE dueno = 'agente' AND id IN \(SELECT jsonb_array_elements_text/);
});

test("marcarRetomadas guarda la hora en que se marcó y, si la marca seguía vigente y sin usar, deja la de la primera vez", async () => {
  const cuerpo = cuerpoDe(await leer("../lib/dm/base.js"), "marcarRetomadas");
  assert.match(cuerpo, /ids\.map\(\(x\) => \[x, \{ hasta, marcada: ahora \}\]\)/);
  assert.match(cuerpo, /WHEN EXCLUDED\.valor -> e\.k IS NOT NULL AND dm_config\.valor -> e\.k -> 'usada' IS NULL/);
  assert.match(cuerpo, /AND dm_config\.valor -> e\.k -> 'marcada' IS NOT NULL/);
  assert.match(cuerpo, /AND \(dm_config\.valor -> e\.k ->> 'hasta'\)::bigint > \$\{ahora\}::bigint/);
  assert.match(cuerpo, /THEN e\.v \|\| jsonb_build_object\('marcada', dm_config\.valor -> e\.k -> 'marcada'\)/);
  assert.match(cuerpo, /ELSE e\.v END\), '\{\}'::jsonb\)/);
});

test("textosDeLaCuenta con desde: lo que la cuenta escribió o mandó después de esa hora, y los automáticos cargados", async () => {
  const cuerpo = cuerpoDe(await leer("../lib/dm/base.js"), "textosDeLaCuenta");
  assert.match(cuerpo, /quien IN \('agente', 'cande', 'automatico'\) AND creado > \$\{d\}::timestamptz/);
  assert.match(cuerpo, /AND accion <> 'control' AND COALESCE\(enviado, creado\) > \$\{d\}::timestamptz/);
  assert.match(cuerpo, /const automaticos = \(await leerConfig\("automaticos"\)\)\?\.textos \|\| \[\];/);
  // Sin desde, como siempre.
  assert.match(cuerpo, /: await sql`\s*SELECT texto FROM dm_mensajes WHERE contacto = \$\{id\} AND quien IN \('agente', 'cande', 'automatico'\)\s*UNION ALL/);
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
  // La prueba de la conexión dice si la charla tiene la marca; si la base no deja leerla, null (no corta la prueba).
  assert.match(await leer("../pages/api/dm/config.js"), /retomada: await leerConfig\(CLAVE_RETOMADAS\)\.then\(\(r\) => esRetomada\(r, id\), \(\) => null\)/);
});

/* ---------- revisión del 21/10 ---------- */

test("anotarCandeDesdeIg descarta en la misma sentencia lo pendiente que contestaba algo de antes de lo que escribió Cande", async () => {
  const cuerpo = cuerpoDe(await leer("../lib/dm/base.js"), "anotarCandeDesdeIg");
  assert.match(cuerpo, /UPDATE dm_salidas s SET estado = 'descartada'/);
  assert.match(cuerpo, /WHERE s\.contacto = \$\{id\} AND s\.estado = 'pendiente' AND EXISTS \(SELECT 1 FROM n\)/);
  // Lo que contesta algo que el lead escribió después del último mensaje de ella sí sale.
  assert.match(cuerpo, /AND NOT EXISTS \(\s*SELECT 1 FROM dm_mensajes l\s*WHERE l\.contacto = \$\{id\} AND l\.quien = 'lead' AND l\.creado > \(SELECT MAX\(creado\) FROM n\) AND l\.creado <= s\.creado\)/);
});

test("estadoRetomadas: una consulta con el dueño, lo último del lead, lo último de la cuenta sin los automáticos y lo que está por salir", async () => {
  const cuerpo = cuerpoDe(await leer("../lib/dm/base.js"), "estadoRetomadas");
  assert.match(cuerpo, /SELECT c\.id, c\.dueno, l\.en AS ultimo_del_lead, a\.en AS ultimo_de_la_cuenta/);
  assert.match(cuerpo, /m\.quien IN \('agente', 'cande'\)\) a/);
  assert.match(cuerpo, /s\.estado = 'pendiente' OR \(s\.estado = 'enviando' AND s\.creado > NOW\(\) - INTERVAL '10 minutes'\)/);
  assert.match(cuerpo, /WHERE c\.id IN \(SELECT jsonb_array_elements_text/);
  assert.doesNotMatch(cuerpo, /UPDATE|INSERT|DELETE/, "no cambia nada");
});

test("retomar_estado dice, en el momento, en cuáles todavía le toca pegar a Cande, y no cambia nada", async () => {
  const { default: handler } = await import("../pages/api/dm/config.js");
  const ahora = Date.now();
  const iso = (min) => new Date(ahora + min * 60000).toISOString();
  const pedidos = [];
  const filas = [
    { id: "1", dueno: "agente", ultimo_del_lead: iso(-3000), ultimo_de_la_cuenta: iso(-4000), por_salir: false },
    { id: "2", dueno: "agente", ultimo_del_lead: iso(-3000), ultimo_de_la_cuenta: iso(-5), por_salir: false },
    { id: "3", dueno: "cande", ultimo_del_lead: iso(-3000), ultimo_de_la_cuenta: null, por_salir: false },
    { id: "4", dueno: "agente", ultimo_del_lead: iso(-1), ultimo_de_la_cuenta: iso(-4000), por_salir: true },
    { id: "5", dueno: "agente", ultimo_del_lead: iso(-3000), ultimo_de_la_cuenta: null, por_salir: false },
  ];
  const marcas = Object.fromEntries(["1", "2", "3", "4", "6"].map((x) => [x, { hasta: ahora + 7 * DIA }]));
  pg.otras = (t, params) => {
    if (t.startsWith("SELECT c.id, c.dueno, l.en AS ultimo_del_lead")) {
      pedidos.push(JSON.parse(params.at(-1)));
      return { rows: filas };
    }
    if (t === "SELECT valor FROM dm_config WHERE clave = ?" && params[0] === CLAVE_RETOMADAS) return { rows: [{ valor: marcas }] };
    if (/^(CREATE|ALTER|UPDATE)/.test(t)) return { rows: [] };
    return undefined;
  };
  process.env.COLA_SECRET = "secreto-de-prueba";
  process.env.POSTGRES_URL = "postgres://de-prueba";
  const llamar = async (body) => {
    const res = respuesta();
    await handler({ method: "POST", headers: { authorization: "Bearer secreto-de-prueba" }, body: { accion: "retomar_estado", ...body } }, res);
    return res;
  };
  try {
    // Los pedidos malos primero (de paso, las tablas quedan listas y lo que sigue es solo la consulta).
    for (const mal of [{}, { contactos: [] }, { contactos: ["no vale!"] }, { contactos: Array.from({ length: 1001 }, (_, i) => String(i)) }]) {
      assert.equal((await llamar(mal)).codigo, 400, JSON.stringify(mal).slice(0, 60));
    }
    assert.equal(pedidos.length, 0, "con un pedido malo no se consulta nada");
    const desde = pg.consultas.length;
    const r = await llamar({ contactos: ["1", "2", " 3 ", "4", "5", "6", "1"] });
    assert.equal(r.codigo, 200);
    assert.deepEqual(pedidos, [["1", "2", "3", "4", "5", "6"]]);
    assert.deepEqual(r.cuerpo.charlas.map((x) => [x.contacto, x.pegar, x.motivo]), [
      ["1", true, null],
      ["2", false, "ya le escribió la cuenta"],
      ["3", false, "no es del agente"],
      ["4", false, "el agente está por contestar"],
      ["5", false, "no tiene la marca de retomada"],
      ["6", false, "no está en la base"],
    ]);
    assert.deepEqual({ recibidos: r.cuerpo.recibidos, para_pegar: r.cuerpo.para_pegar }, { recibidos: 6, para_pegar: 1 });
    assert.ok(pg.consultas.slice(desde).every((t) => t.startsWith("SELECT ")), "no cambia nada");
  } finally {
    pg.otras = null;
    delete process.env.COLA_SECRET;
    delete process.env.POSTGRES_URL;
  }
});

test("las piezas nuevas están conectadas: retomar_estado en la API y lo vencido descartado no cuenta como pasado a Cande", async () => {
  assert.equal(typeof (await import("../lib/dm/base.js")).estadoRetomadas, "function");
  assert.match(await leer("../pages/api/dm/config.js"), /charlas = ids\.map\(\(x\) => paraPegar\(x, filas\.get\(x\) \|\| null, retomadas\)\)/);
  assert.match(await leer("../pages/api/dm/toques.js"), /else if \(r !== "descartada"\) sinAtender\+\+/);
});

/* ---------- segunda revisión de las charlas retomadas (21/10) ---------- */

test("anotarCandeDesdeIg deja usada la marca de retomada en la misma sentencia: hasta lo último que anotó, solo si anotó algo y una sola vez", async () => {
  const cuerpo = cuerpoDe(await leer("../lib/dm/base.js"), "anotarCandeDesdeIg");
  assert.match(cuerpo, /UPDATE dm_config SET valor = jsonb_set\(valor, ARRAY\[\$\{String\(id\)\}::text, 'usada'\],/);
  assert.match(cuerpo, /to_jsonb\(\(SELECT \(EXTRACT\(EPOCH FROM MAX\(creado\)\) \* 1000\)::bigint FROM n\)\), true\)/);
  assert.match(cuerpo, new RegExp(`WHERE clave = '${CLAVE_RETOMADAS}' AND EXISTS \\(SELECT 1 FROM n\\)`));
  assert.match(cuerpo, /AND valor -> \$\{String\(id\)\}::text IS NOT NULL AND valor -> \$\{String\(id\)\}::text -> 'usada' IS NULL\)/);
  assert.doesNotMatch(cuerpo, /valor - /, "no la borra: una mirada que corre a la vez la sigue viendo");
});

test("estadoRetomadas trae el id de lo último de cada lado, por la hora y a la misma hora por el orden en la base", async () => {
  const cuerpo = cuerpoDe(await leer("../lib/dm/base.js"), "estadoRetomadas");
  assert.match(cuerpo, /l\.mid AS id_ultimo_del_lead, a\.mid AS id_ultimo_de_la_cuenta/);
  const lados = cuerpo.match(/\(ARRAY_AGG\(m\.id ORDER BY m\.creado DESC, m\.id DESC\)\)\[1\] AS mid/g) || [];
  assert.equal(lados.length, 2, "el del lead y el de la cuenta");
  assert.match(cuerpo, /CROSS JOIN LATERAL \(\s*SELECT MAX\(m\.creado\) AS en, /, "con agregados: la charla sin mensajes de un lado vuelve igual");
});

test("retomar_estado en las charlas sembradas (todo con la misma hora): le toca pegar si lo último en la base es del lead", async () => {
  const { default: handler } = await import("../pages/api/dm/config.js");
  const sembrada = new Date(Date.now() - 3600000).toISOString();
  const filas = [
    { id: "1", dueno: "agente", ultimo_del_lead: sembrada, ultimo_de_la_cuenta: sembrada, id_ultimo_del_lead: 14, id_ultimo_de_la_cuenta: 13, por_salir: false },
    { id: "2", dueno: "agente", ultimo_del_lead: sembrada, ultimo_de_la_cuenta: sembrada, id_ultimo_del_lead: 23, id_ultimo_de_la_cuenta: 24, por_salir: false },
  ];
  const marcas = { 1: { hasta: Date.now() + 7 * DIA }, 2: { hasta: Date.now() + 7 * DIA } };
  pg.otras = (t, params) => {
    if (t.startsWith("SELECT c.id, c.dueno, l.en AS ultimo_del_lead")) return { rows: filas };
    if (t === "SELECT valor FROM dm_config WHERE clave = ?" && params[0] === CLAVE_RETOMADAS) return { rows: [{ valor: marcas }] };
    if (/^(CREATE|ALTER|UPDATE)/.test(t)) return { rows: [] };
    return undefined;
  };
  process.env.COLA_SECRET = "secreto-de-prueba";
  process.env.POSTGRES_URL = "postgres://de-prueba";
  try {
    const res = respuesta();
    await handler({ method: "POST", headers: { authorization: "Bearer secreto-de-prueba" }, body: { accion: "retomar_estado", contactos: ["1", "2"] } }, res);
    assert.equal(res.codigo, 200);
    assert.deepEqual(res.cuerpo.charlas.map((x) => [x.contacto, x.pegar, x.motivo]), [["1", true, null], ["2", false, "ya le escribió la cuenta"]]);
  } finally {
    pg.otras = null;
    delete process.env.COLA_SECRET;
    delete process.env.POSTGRES_URL;
  }
});

test("el cron de Instagram le pasa a buscarCodigos dónde registrar una falla de la base, sin ids ni textos", async () => {
  const cron = await leer("../pages/api/dm/instagram.js");
  assert.match(cron, /registrar: \(e\) => console\.error\("dm: la base falló en una charla de la vuelta de Instagram", e\?\.code \?\? "", e\?\.name \?\? ""\)/);
});

/* ---------- tercera revisión de las charlas retomadas (21/10) ---------- */

test("sembrar guarda el id y el usuario de Instagram que vienen (el cron reconoce la charla desde la primera vuelta); sin ellos, como siempre", async () => {
  const { default: handler } = await import("../pages/api/dm/config.js");
  const sembradas = [];
  pg.otras = (t, params) => {
    if (t.startsWith("SELECT id, quien, texto, creado FROM dm_mensajes WHERE contacto = ?")) return { rows: [] };
    if (t.startsWith("WITH m AS ( INSERT INTO dm_mensajes (contacto, quien, texto)")) {
      sembradas.push({ t, params });
      return { rows: [] };
    }
    if (/^(CREATE|ALTER|UPDATE)/.test(t)) return { rows: [] };
    return undefined;
  };
  process.env.COLA_SECRET = "secreto-de-prueba";
  process.env.POSTGRES_URL = "postgres://de-prueba";
  const llamar = async (extra) => {
    const res = respuesta();
    await handler({ method: "POST", headers: { authorization: "Bearer secreto-de-prueba" }, body: {
      accion: "sembrar", contacto: "123", nombre: "Lead de prueba", mensajes: [{ quien: "lead", texto: "hola de prueba" }], ...extra,
    } }, res);
    return res;
  };
  try {
    assert.equal((await llamar({ ig_id: "17841400000000001", ig_usuario: "@Lead.Prueba" })).codigo, 200);
    assert.equal(sembradas.length, 1);
    assert.match(sembradas[0].t, /INSERT INTO dm_contactos \(id, nombre, dueno, contexto, respondido_hasta, foto_avisada_hasta, entregada, ig_id, ig_usuario\)/);
    assert.match(sembradas[0].t, /ig_id = COALESCE\(EXCLUDED\.ig_id, dm_contactos\.ig_id\), ig_usuario = COALESCE\(EXCLUDED\.ig_usuario, dm_contactos\.ig_usuario\)/);
    assert.deepEqual(sembradas[0].params.slice(-2), ["17841400000000001", "lead.prueba"], "el usuario como se guarda: sin @ y en minúscula");
    // El id puede venir como número.
    assert.equal((await llamar({ ig_id: 17841400000000002 })).codigo, 200);
    assert.deepEqual(sembradas[1].params.slice(-2), ["17841400000000002", null]);
    // Sin ellos, como siempre: quedan como estaban.
    assert.equal((await llamar({})).codigo, 200);
    assert.deepEqual(sembradas[2].params.slice(-2), [null, null]);
    // Lo que no es un id ni un usuario de Instagram no se guarda.
    for (const mal of [{ ig_id: "no es un id" }, { ig_id: "123abc" }, { ig_usuario: "con espacios no" }, { ig_usuario: "x".repeat(31) }]) {
      assert.equal((await llamar(mal)).codigo, 400, JSON.stringify(mal));
    }
    assert.equal(sembradas.length, 3, "con un pedido malo no se siembra nada");
  } finally {
    pg.otras = null;
    delete process.env.COLA_SECRET;
    delete process.env.POSTGRES_URL;
  }
});

test("--retomar en una charla retomada deja abierto lo que el lead escribió después de lo último de la cuenta por la hora; sin la marca (o sin poder leerla), por el id como en main", async () => {
  const { reabrirTurno } = await import("../lib/dm/base.js");
  const ahora = Date.now();
  const correr = async (marcas) => {
    const reabrir = [];
    pg.otras = (t, params) => {
      if (t === "SELECT valor FROM dm_config WHERE clave = ?" && params[0] === CLAVE_RETOMADAS) {
        if (marcas === "falla") throw new Error("base caída de prueba");
        return { rows: marcas ? [{ valor: marcas }] : [] };
      }
      if (t.startsWith("WITH ultimo AS (")) {
        reabrir.push(t);
        return { rows: [{ abiertos: 1 }] };
      }
      if (/^UPDATE dm_salidas/.test(t)) return { rows: [] };
      return undefined;
    };
    try {
      assert.equal(await reabrirTurno("77"), 1);
    } finally {
      pg.otras = null;
    }
    assert.equal(reabrir.length, 1);
    return reabrir[0];
  };
  const porHora = await correr({ 77: { hasta: ahora + 7 * DIA, usada: ahora - 60000 } });
  assert.match(porHora, /WHERE contacto = \? AND quien IN \('agente', 'cande', 'automatico'\) ORDER BY creado DESC, id DESC LIMIT 1\)/);
  assert.match(porHora, /m\.quien = 'lead' AND \(m\.creado < ultimo\.creado OR \(m\.creado = ultimo\.creado AND m\.id < ultimo\.id\)\)/);
  assert.doesNotMatch(porHora, /m\.id < ultimo\.cuenta/);
  for (const [caso, marcas] of [["sin la marca", null], ["con la marca de otra charla", { 78: { hasta: ahora + DIA } }],
    ["con la marca vencida sin usar", { 77: { hasta: ahora - DIA } }], ["sin poder leer la marca", "falla"]]) {
    const t = await correr(marcas);
    assert.match(t, /SELECT COALESCE\(MAX\(id\), 0\) AS cuenta FROM dm_mensajes WHERE contacto = \? AND quien IN \('agente', 'cande', 'automatico'\)\)/, caso);
    assert.match(t, /m\.quien = 'lead' AND m\.id < ultimo\.cuenta/, caso);
  }
});
