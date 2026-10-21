// Los eventos del embudo (/api/evento y /api/ir) no escriben en la base en el momento (21/10): se juntan en el Blob
// privado del sitio y el cron de la cola los pasa a funnel_eventos en su vuelta. Una visita a los 8 minutos de una
// vuelta despertaba la base de Neon de nuevo y la dejaba prendida 5 minutos más. Ver lib/eventosPendientes.js.
//
// El Blob y la base son de mentira: ninguna prueba sale a la red. Todos los ids son inventados.
//
// Lo que NO cubren: que el Blob de verdad liste y borre lo privado con el token del sitio, y lo que hace Postgres con
// guardarEventosJuntados (la columna clave, su índice único y el ON CONFLICT). Se mira contra el Blob y una base de
// prueba antes de subir.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { base: pg } = await import("./dobles/postgres.mjs");
const { crearEventosPendientes, eventoDe, guardarOJuntar, CARPETA } = await import("../lib/eventosPendientes.js");
const { guardarEventosJuntados } = await import("../lib/db.js");

const AHORA = Date.parse("2026-10-21T06:07:00Z");

function blobDePrueba() {
  const guardados = new Map(); // pathname -> { url, pathname, uploadedAt }
  const llamadas = [];
  let n = 0;
  return {
    guardados, llamadas,
    put: async (pathname, cuerpo, opciones) => {
      llamadas.push(["put", pathname, cuerpo, opciones]);
      if (guardados.has(pathname) && !opciones.allowOverwrite) throw new Error("ya existe");
      guardados.set(pathname, { url: `https://blob.ejemplo/${++n}`, pathname, uploadedAt: new Date(AHORA) });
      return guardados.get(pathname);
    },
    list: async ({ prefix, limit, cursor }) => {
      llamadas.push(["list", prefix, limit, cursor ?? null]);
      const todos = [...guardados.values()].filter((b) => b.pathname.startsWith(prefix)).sort((a, b) => a.pathname.localeCompare(b.pathname));
      const desde = Number(cursor || 0);
      const pagina = todos.slice(desde, desde + limit);
      const hasMore = desde + limit < todos.length;
      return { blobs: pagina, hasMore, cursor: hasMore ? String(desde + limit) : undefined };
    },
    del: async (urls) => {
      llamadas.push(["del", urls.length]);
      for (const [p, b] of guardados) if (urls.includes(b.url)) guardados.delete(p);
    },
  };
}

test("cada evento queda como un archivo privado y vacío, con la fase, el id del navegador y la hora en el nombre", async () => {
  const blob = blobDePrueba();
  let azar = 0;
  const p = crearEventosPendientes({ blob, hay: () => true, ahora: () => AHORA, azar: () => `az${++azar}` });
  await p.juntar("form_visto_cv-dm", "k3j9x0abc");
  await p.juntar("mail_click_guia_d2", null);
  await p.juntar("video_50_b", "id raro/../con cosas");
  assert.deepEqual(blob.llamadas.map((l) => l[1]), [
    `${CARPETA}form_visto_cv-dm/k3j9x0abc.${AHORA}.az1`,
    `${CARPETA}mail_click_guia_d2/_.${AHORA}.az2`,
    `${CARPETA}video_50_b/_.${AHORA}.az3`,
  ], "un id que no es el del navegador va como sin id: nada raro en el nombre");
  for (const [, , cuerpo, opciones] of blob.llamadas) {
    assert.equal(cuerpo, "1");
    assert.equal(opciones.access, "private", "nadie lo lee desde afuera");
    assert.equal(opciones.addRandomSuffix, false);
  }
  await assert.rejects(p.juntar("Fase Con Espacios", "x"), /fase/);
  assert.deepEqual(eventoDe(`${CARPETA}form_visto/k3j9x0abc.${AHORA}.az1`), {
    fase: "form_visto", sid: "k3j9x0abc", creado: new Date(AHORA), clave: `${CARPETA}form_visto/k3j9x0abc.${AHORA}.az1`,
  });
  assert.equal(eventoDe(`${CARPETA}form_visto/_.${AHORA}.az1`).sid, null);
  for (const raro of ["otra-carpeta/form_visto/a.1.b", `${CARPETA}form_visto/a.b`, `${CARPETA}a/b/c.1.d`, `${CARPETA}form_visto/a.0.b`, `${CARPETA}FASE/a.1.b`]) {
    assert.equal(eventoDe(raro), null, raro);
  }
});

test("el cron los pasa a la base de una vez, con la hora de la visita, y los borra; si la base falla no borra nada", async () => {
  const blob = blobDePrueba();
  const guardadas = [];
  let falla = false;
  let azar = 0;
  let ahora = AHORA;
  const p = crearEventosPendientes({
    blob, hay: () => true, ahora: () => ahora, azar: () => String(++azar).padStart(4, "0"),
    guardar: async (eventos) => { if (falla) throw new Error("la base no contesta"); guardadas.push(...eventos); return eventos.length; },
  });
  for (let i = 0; i < 7; i++) {
    ahora = AHORA + i * 60000;
    await p.juntar(i % 2 ? "paso_2" : "form_visto", `sid${i}`);
  }
  await blob.put(`${CARPETA}algo-que-no-es-de-aca`, "1", { access: "private" });
  falla = true;
  await assert.rejects(p.pasar(), /la base no contesta/);
  assert.equal(blob.guardados.size, 8, "no se borró nada: se pasa en la vuelta siguiente");
  falla = false;
  const r = await p.pasar();
  assert.deepEqual(r, { leidos: 7, guardados: 7 });
  assert.equal(blob.guardados.size, 0, "lo leído se borra, y lo que no es de acá también");
  assert.deepEqual(guardadas.map((e) => [e.fase, e.sid, e.creado.getTime() - AHORA]).sort((a, b) => a[2] - b[2]), [
    ["form_visto", "sid0", 0], ["paso_2", "sid1", 60000], ["form_visto", "sid2", 120000], ["paso_2", "sid3", 180000],
    ["form_visto", "sid4", 240000], ["paso_2", "sid5", 300000], ["form_visto", "sid6", 360000],
  ]);
  assert.ok(guardadas.every((e) => e.clave.startsWith(CARPETA)), "cada uno con su clave: si se pasa dos veces no queda repetido");
  // Sin nada juntado, una sola pregunta al Blob y nada a la base.
  const vacia = crearEventosPendientes({ blob, hay: () => true, guardar: async () => { throw new Error("no toca la base"); } });
  assert.deepEqual(await vacia.pasar(), { leidos: 0, guardados: 0 });
});

test("si hay más de una página, sigue hasta pasar todo o hasta su hora, y no se saltea nada al borrar lo de adelante", async () => {
  const blob = blobDePrueba();
  let azar = 0;
  const p = crearEventosPendientes({ blob, hay: () => true, ahora: () => AHORA, azar: () => String(++azar).padStart(5, "0"), guardar: async (e) => e.length });
  for (let i = 0; i < 1200; i++) await p.juntar("form_visto", `s${i}`);
  assert.deepEqual(await p.pasar(), { leidos: 1200, guardados: 1200 });
  assert.equal(blob.llamadas.filter((l) => l[0] === "list").length, 3);
  // Cada página se pide desde el principio (lo de antes ya se borró): con el cursor de la lista vieja se salteaban 500.
  assert.ok(blob.llamadas.filter((l) => l[0] === "list").every((l) => l[3] === null));
  for (let i = 0; i < 1200; i++) await p.juntar("form_visto", `t${i}`);
  const r = await crearEventosPendientes({ blob, hay: () => true, ahora: () => AHORA, guardar: async (e) => e.length }).pasar({ hasta: AHORA });
  assert.equal(r.leidos, 500, "pasada su hora no pide otra página: lo demás, en la vuelta siguiente");
});

test("/api/evento y /api/ir juntan el evento; si no se puede, lo guardan en la base como antes, y sin base no hacen nada", async () => {
  const hechos = [];
  const pendientes = (hay, falla = false) => ({ hay: () => hay, juntar: async (f, s) => { if (falla) throw new Error("el Blob no contesta"); hechos.push(["juntar", f, s]); } });
  const guardar = async (f, s) => { hechos.push(["guardar", f, s]); };
  assert.equal(await guardarOJuntar("form_visto", "abc", { pendientes: pendientes(true), guardar, base: () => true }), "juntado");
  assert.equal(await guardarOJuntar("form_visto", "abc", { pendientes: pendientes(true, true), guardar, base: () => true }), "guardado");
  assert.equal(await guardarOJuntar("form_visto", "", { pendientes: pendientes(false), guardar, base: () => true }), "guardado");
  assert.equal(await guardarOJuntar("form_visto", "abc", { pendientes: pendientes(false), guardar, base: () => false }), "nada");
  assert.deepEqual(hechos, [["juntar", "form_visto", "abc"], ["guardar", "form_visto", "abc"], ["guardar", "form_visto", null]]);
  const evento = await readFile(new URL("../pages/api/evento.js", import.meta.url), "utf8");
  const ir = await readFile(new URL("../pages/api/ir.js", import.meta.url), "utf8");
  assert.doesNotMatch(evento + ir, /guardarEvento\(/, "ninguno de los dos escribe en la base en el momento");
  assert.match(evento, /await guardarOJuntar\(fase, s\)/);
  assert.match(ir, /await guardarOJuntar\(`mail_click_\$\{a\}_\$\{m\}`, null\)/);
  const cola = await readFile(new URL("../pages/api/cola-publicar.js", import.meta.url), "utf8");
  assert.match(cola, /if \(eventosPendientes\.hay\(\)\) eventos = await eventosPendientes\.pasar\(/, "el cron de la cola los pasa en cada vuelta");
});

test("guardarEventosJuntados: una sola consulta para la tanda, con la clave única para no repetir", async () => {
  const consultas = [];
  pg.otras = (t, params) => {
    consultas.push({ t, params });
    if (/^(CREATE|ALTER)/.test(t)) return { rows: [] };
    if (t.startsWith("INSERT INTO funnel_eventos (fase, sid, creado, clave)")) return { rows: [{ id: 1 }] };
    return undefined;
  };
  process.env.POSTGRES_URL = "postgres://de-prueba";
  try {
    assert.equal(await guardarEventosJuntados([]), 0, "sin eventos no toca la base");
    assert.equal(consultas.length, 0);
    const n = await guardarEventosJuntados([
      { fase: "form_visto", sid: "abc", creado: new Date(AHORA), clave: `${CARPETA}form_visto/abc.${AHORA}.az` },
      { fase: "mail_click_guia_d2", sid: null, creado: new Date(AHORA + 1), clave: `${CARPETA}mail_click_guia_d2/_.${AHORA + 1}.az` },
    ]);
    assert.equal(n, 1, "las que ya estaban no cuentan");
  } finally {
    pg.otras = null;
    delete process.env.POSTGRES_URL;
  }
  assert.ok(consultas.some((c) => c.t === "CREATE UNIQUE INDEX IF NOT EXISTS funnel_eventos_clave ON funnel_eventos (clave)"));
  const insert = consultas.find((c) => c.t.startsWith("INSERT INTO funnel_eventos"));
  assert.match(insert.t, /ON CONFLICT \(clave\) DO NOTHING RETURNING id$/);
  assert.deepEqual(JSON.parse(insert.params[0]), [
    { fase: "form_visto", sid: "abc", creado: new Date(AHORA).toISOString(), clave: `${CARPETA}form_visto/abc.${AHORA}.az` },
    { fase: "mail_click_guia_d2", sid: "", creado: new Date(AHORA + 1).toISOString(), clave: `${CARPETA}mail_click_guia_d2/_.${AHORA + 1}.az` },
  ]);
});
