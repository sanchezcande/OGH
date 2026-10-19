// El formulario de /devs con el id de la charla de Instagram (20/10/2026).
//
// Cande terminaba llamando por WhatsApp a gente que ya hablaba con el agente por Instagram: el formulario
// guardaba al lead sin saber de qué charla venía. Estas pruebas cubren cada paso:
//   1. el agente manda el link del formulario con el id de la charla (?ig=), y los frenos aceptan ese link
//      con ese id y nada más (lib/dm/linkFormulario.js, lib/dm/frenos.js, lib/dm/agente.js);
//   2. /devs lee ?ig= y la API lo guarda en red_devs.ig_contacto (pages/devs/index.jsx, pages/api/devs-red.js,
//      lib/db.js), con la migración que aguanta a dos funciones a la vez;
//   3. la charla queda con la nota del formulario (NOTA_FORMULARIO), y el agente la ve (lib/dm/base.js);
//   4. el CRM cruza los devs con las charlas sin romperse si el cruce falla (scripts/crm_ig.mjs).
//
// Todo con dobles: ninguna prueba toca una base ni sale a la red. Los textos son inventados para la prueba.
//
// Correr:  node --test tests/*.test.mjs
import { avisos, registros, respuesta } from "./dobles/preparar.mjs";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { base as pg } from "./dobles/postgres.mjs";

const { idDeCharla, conIdDeCharla, esLinkConId, NOTA_FORMULARIO, esNotaDeFormulario } = await import("../lib/dm/linkFormulario.js");
const { revisar } = await import("../lib/dm/frenos.js");
const { crearAgente } = await import("../lib/dm/agente.js");
const { anotarFormularioLleno } = await import("../lib/dm/base.js");
const { default: devsRed } = await import("../pages/api/devs-red.js");
const { leerDevs, conCharlaAnterior } = await import("../scripts/crm_ig.mjs");

const ID = "1234567890";
const OTRO = "9876543210";
const leer = (p) => fs.readFile(new URL(p, import.meta.url), "utf8");

beforeEach(() => {
  pg.reiniciar();
  avisos.length = 0;
  registros.length = 0;
});

/* ---------- 1. el id de la charla y el link ---------- */

test("un id de charla vale solo si son de 3 a 20 dígitos en un texto", () => {
  assert.equal(idDeCharla(ID), ID);
  assert.equal(idDeCharla(` ${ID}\n`), ID);
  assert.equal(idDeCharla("123"), "123");
  assert.equal(idDeCharla("1".repeat(20)), "1".repeat(20));
  for (const malo of ["", "12", "1".repeat(21), "12a45", "-12345", "123 456", "1e10", "0x1234", "<script>", "123456789&de=dm", "١٢٣٤٥"]) {
    assert.equal(idDeCharla(malo), null, JSON.stringify(malo));
  }
  // Un número no: los ids viajan como texto, y uno largo como número ya perdió los últimos dígitos.
  for (const malo of [1234567890, null, undefined, {}, [ID], true]) assert.equal(idDeCharla(malo), null, String(malo));
});

test("el link del formulario sale con el id de la charla, como lo haya escrito el modelo", () => {
  const casos = [
    ["Va el formulario\nopengatehub.com/devs", `Va el formulario\nopengatehub.com/devs?ig=${ID}`],
    ["https://www.opengatehub.com/devs/", `https://www.opengatehub.com/devs?ig=${ID}`],
    ["Entrá a OpenGateHub.com/devs.", `Entrá a OpenGateHub.com/devs?ig=${ID}.`],
    ["(opengatehub.com/devs)", `(opengatehub.com/devs?ig=${ID})`],
    // Al final de una pregunta, el "?" es del texto, no del link.
    ["Pudiste llenar opengatehub.com/devs?", `Pudiste llenar opengatehub.com/devs?ig=${ID}?`],
    // Con el ?de= de lib/origenForm.js, el id va con &.
    ["opengatehub.com/devs?de=dm", `opengatehub.com/devs?de=dm&ig=${ID}`],
    ["opengatehub.com/devs?de=dm.", `opengatehub.com/devs?de=dm&ig=${ID}.`],
    // Dos veces el mismo link: los dos.
    ["opengatehub.com/devs y opengatehub.com/devs", `opengatehub.com/devs?ig=${ID} y opengatehub.com/devs?ig=${ID}`],
  ];
  for (const [antes, despues] of casos) assert.equal(conIdDeCharla(antes, ID), despues, antes);
});

test("pasarlo dos veces da lo mismo, y un id que ya estaba se cambia por el de esta charla", () => {
  const una = conIdDeCharla("Va: opengatehub.com/devs?de=dm", ID);
  assert.equal(conIdDeCharla(una, ID), una);
  assert.equal(conIdDeCharla(`opengatehub.com/devs?ig=${OTRO}`, ID), `opengatehub.com/devs?ig=${ID}`);
  assert.equal(conIdDeCharla(`opengatehub.com/devs?ig=${OTRO}&de=dm`, ID), `opengatehub.com/devs?de=dm&ig=${ID}`);
});

test("no toca la página del video, otras páginas de /devs, otros dominios ni el texto sin un id válido", () => {
  for (const t of [
    "Mirá opengatehub.com/devs/gracias", "https://www.opengatehub.com/devs/gracias.", "opengatehub.com/devsx",
    "opengatehub.com/devs-viejo", "otroopengatehub.com/devs", "opengatehub.com.ar/devs", "opengatehub.com/devs/otra",
    "Sin link", "",
  ]) {
    assert.equal(conIdDeCharla(t, ID), t, t);
  }
  for (const malo of ["77", "abc", "", null, undefined, 1234567890]) {
    assert.equal(conIdDeCharla("opengatehub.com/devs", malo), "opengatehub.com/devs", String(malo));
  }
});

test("si con el id el mensaje se pasa de los 1.000 caracteres de Instagram, sale como estaba", () => {
  const largo = `${"x".repeat(975)} opengatehub.com/devs`;
  assert.equal(conIdDeCharla(largo, ID), largo);
  const justo = `${"x".repeat(965)} opengatehub.com/devs`;
  assert.equal(conIdDeCharla(justo, ID).length, 1000);
});

test("para los frenos, el link con id es el del formulario con un id y nada más, y con la charla, el de esa charla", () => {
  assert.equal(esLinkConId(`opengatehub.com/devs?ig=${ID}`), true);
  assert.equal(esLinkConId(`opengatehub.com/devs/?ig=${ID}`), true);
  assert.equal(esLinkConId(`opengatehub.com/devs?ig=${ID}`, ID), true);
  assert.equal(esLinkConId(`opengatehub.com/devs?ig=${OTRO}`, ID), false);
  // Con una charla que no tiene un id de verdad, ningún link con id es de ella.
  assert.equal(esLinkConId(`opengatehub.com/devs?ig=${ID}`, "77"), false);
  for (const malo of [
    "opengatehub.com/devs?ig=12", "opengatehub.com/devs?ig=abc", "opengatehub.com/devs?ig=", `opengatehub.com/devs?ig=${ID}&de=dm`,
    `opengatehub.com/devs?de=dm&ig=${ID}`, "opengatehub.com/devs?de=dm", `opengatehub.com/devs/gracias?ig=${ID}`,
    `otro.com/devs?ig=${ID}`, `opengatehub.com/devs?ig=${ID}#x`, `opengatehub.com/devs?ig=${ID}?ig=${OTRO}`,
  ]) {
    assert.equal(esLinkConId(malo), false, malo);
  }
});

/* ---------- 1. los frenos ---------- */

const estadoDev = { quien: "dev", busca: "si", dolor: "de prueba", etapa: "puente", link_formulario_enviado: true, precio_dicho: false };
const salida = (mensajes, extra = {}) => ({
  accion: "responder", mensajes, estado: estadoDev, aviso_para_cande: "", seguimiento_en_horas: null, motivo: "", ...extra,
});

test("los frenos dejan salir el link del formulario con el id de esta charla, y con ningún otro parámetro", () => {
  for (const m of [`Va: opengatehub.com/devs?ig=${ID}`, `https://www.opengatehub.com/devs?ig=${ID}.`, `opengatehub.com/devs/?ig=${ID}`]) {
    assert.deepEqual(revisar(salida([m]), { contacto: ID }), { ok: true }, m);
    assert.deepEqual(revisar(salida([m])), { ok: true }, `${m} (sin charla: cualquier id válido)`);
  }
  for (const m of [
    `opengatehub.com/devs?ig=${OTRO}`, "opengatehub.com/devs?ig=12", "opengatehub.com/devs?ig=abc", `opengatehub.com/devs?ig=${ID}&de=dm`,
    "opengatehub.com/devs?de=dm", "opengatehub.com/devs?utm_source=x", `opengatehub.com/devs/gracias?ig=${ID}`,
  ]) {
    assert.equal(revisar(salida([m]), { contacto: ID }).motivo, "link que no está en la lista permitida", m);
  }
  // Los links de siempre siguen pasando.
  for (const m of ["opengatehub.com/devs", "https://www.opengatehub.com/devs/", "opengatehub.com/devs/gracias"]) {
    assert.deepEqual(revisar(salida([m]), { contacto: ID }), { ok: true }, m);
  }
});

test("con el id, el link sigue siendo la lista: a quien construye o contrata no le sale", () => {
  const conId = `Va la lista: opengatehub.com/devs?ig=${ID}`;
  for (const quien of ["construye", "empresa"]) {
    assert.equal(revisar(salida([conId], { estado: { ...estadoDev, quien } }), { contacto: ID }).ok, false, quien);
  }
});

/* ---------- 1 y 3. el agente, con una base, un modelo y un ManyChat de mentira ---------- */

const HORA = 3600000;
const AHORA = new Date("2026-10-20T15:00:00Z");
const AVISO = "Va un mensaje automático de prueba";
const tick = async () => { for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r)); };

/** Un agente con todo de mentira, como armar() en tests/dm.test.mjs, para una charla con un id de verdad. */
function armar({ id = ID, modo = "auto", envio = "api", toques = false, responde, codigo = "", mensajes = null, ultimoLeadHace = 1 } = {}) {
  const m = {
    ajustes: { modo, envio, espera_ms: 0, tope_por_dia: 12, toques, link_de_pago: "", codigo_mercadopago: codigo },
    contacto: {
      id, nombre: "Lead de prueba", dueno: "agente", toques: 0, proximo_toque: null, respondido_hasta: 0, contexto: null,
      estado: {}, ultimo_lead: new Date(AHORA - ultimoLeadHace * HORA),
    },
    mensajes: mensajes || [{ id: 1, quien: "agente", texto: AVISO }, { id: 2, quien: "lead", texto: "mensaje de prueba" }],
    tomado: null, salidas: [], enviados: [], avisos: [], pedidos: [],
  };
  m.disparo = m.mensajes.filter((x) => x.quien === "lead").at(-1)?.id ?? null;
  const base = {
    tablas: async () => {},
    ajustes: async () => m.ajustes,
    prompt: async () => "PROMPT",
    contacto: async () => ({ ...m.contacto }),
    ultimoIdLead: async () => m.mensajes.filter((x) => x.quien === "lead").at(-1)?.id ?? null,
    historial: async (_, tope = 80) => m.mensajes.slice(-tope),
    corridasEnUnDia: async () => m.salidas.length,
    tomar: async (_, marca, { cualquierDueno = false } = {}) => {
      if (m.tomado || (m.contacto.dueno !== "agente" && !cualquierDueno)) return null;
      m.tomado = marca;
      return { ...m.contacto };
    },
    soltar: async (_, marca) => { if (m.tomado === marca) m.tomado = null; },
    descartarPendientes: async () => {},
    ponerDueno: async (_, d) => { m.contacto.dueno = d; },
    guardarSalida: async (s) => { m.salidas.push({ ...s }); return m.salidas.length; },
    marcarSalida: async (i, estado, detalle) => { Object.assign(m.salidas[i - 1], { estado, detalle }); },
    anotar: async (_, quien, texto) => { m.mensajes.push({ id: m.mensajes.length + 1, quien, texto }); },
    guardarEstado: async (_, e) => { m.contacto.estado = e; },
    sumarToque: async () => { m.contacto.toques++; },
    cerrarTurno: async (_, cual) => { m.contacto.respondido_hasta = Math.max(m.contacto.respondido_hasta, cual); },
    reclamarAvisoFoto: async () => null,
    soltarAvisoFoto: async () => {},
  };
  const pedir = async (p) => {
    m.pedidos.push(p);
    return responde(p, m);
  };
  const manychat = {
    hayManyChat: () => true,
    mandarTextos: async (_, textos) => { m.enviados.push(...textos); return { ok: true }; },
    ponerCampo: async () => ({ ok: true }),
  };
  const avisar = async (titulo, campos) => { m.avisos.push({ titulo, campos }); return true; };
  const agente = crearAgente({ base, pedir, manychat, avisar, esperar: tick, reloj: () => AHORA });
  return { agente, m };
}
const conLink = `Va el formulario\nopengatehub.com/devs?ig=${ID}`;

test("el agente manda el link con el id de la charla, y lo mismo queda en la salida y en la charla", async () => {
  const { agente, m } = armar({ responde: () => salida(["Te paso el formulario", "Va el formulario\nopengatehub.com/devs"]) });
  const r = await agente.procesar(ID, m.disparo);
  assert.equal(r.hecho, "enviada");
  assert.deepEqual(m.enviados, ["Te paso el formulario", conLink]);
  assert.deepEqual(r.enviado, m.enviados);
  assert.deepEqual(m.salidas.at(-1).mensajes, m.enviados);
  assert.deepEqual(m.mensajes.filter((x) => x.quien === "agente").slice(1).map((x) => x.texto), m.enviados);
  // Al modelo no se le dice nada: el prompt es el mismo y el turno no habla del id.
  assert.equal(m.pedidos[0].prompt, "PROMPT");
  assert.doesNotMatch(JSON.stringify(m.pedidos[0].turno), /ig=/);
});

test("envío por campo: lo que retira ManyChat ya lleva el id", async () => {
  const { agente, m } = armar({ envio: "campo", responde: () => salida(["Va el formulario\nopengatehub.com/devs"]) });
  assert.equal((await agente.procesar(ID, m.disparo)).hecho, "lista para retirar");
  assert.equal(m.salidas.at(-1).estado, "pendiente");
  assert.deepEqual(m.salidas.at(-1).mensajes, [conLink]);
});

test("sombra: el borrador ya lleva el id, y el aviso a Cande muestra lo que mandaría tal cual", async () => {
  const { agente, m } = armar({ modo: "sombra", responde: () => salida(["Va el formulario\nopengatehub.com/devs"]) });
  assert.equal((await agente.procesar(ID, m.disparo)).hecho, "borrador");
  assert.deepEqual(m.salidas.at(-1).mensajes, [conLink]);
  assert.equal(m.avisos.at(-1).campos["Mandaría"], conLink);
});

test("si el modelo copia del historial el link con el id de esta charla, sale una vez y sin repetir el id", async () => {
  const { agente, m } = armar({ responde: () => salida([`Acá de nuevo: opengatehub.com/devs?ig=${ID}`]) });
  assert.equal((await agente.procesar(ID, m.disparo)).hecho, "enviada");
  assert.deepEqual(m.enviados, [`Acá de nuevo: opengatehub.com/devs?ig=${ID}`]);
});

test("el link con el id de otra charla no sale: se frena y la charla pasa a Cande", async () => {
  const { agente, m } = armar({ responde: () => salida([`Va: opengatehub.com/devs?ig=${OTRO}`]) });
  const r = await agente.procesar(ID, m.disparo);
  assert.equal(r.hecho, "frenada");
  assert.equal(r.motivo, "link que no está en la lista permitida");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "cande");
});

test("la página del video y los mensajes sin link salen como los escribió el modelo", async () => {
  const mensajes = ["Mirá esto: opengatehub.com/devs/gracias", "Pregunta de prueba?"];
  const { agente, m } = armar({ responde: () => salida(mensajes) });
  assert.equal((await agente.procesar(ID, m.disparo)).hecho, "enviada");
  assert.deepEqual(m.enviados, mensajes);
});

test("con una indicación de Cande y en un toque, el link también sale con el id", async () => {
  const conIndicacion = armar({ responde: () => salida(["Va de nuevo: opengatehub.com/devs"]) });
  const r = await conIndicacion.agente.procesar(ID, null, { evento: "indicacion", indicacion: "pasale el formulario" });
  assert.equal(r.hecho, "enviada");
  assert.deepEqual(conIndicacion.m.enviados, [`Va de nuevo: opengatehub.com/devs?ig=${ID}`]);

  const enToque = armar({ toques: true, ultimoLeadHace: 6, responde: () => salida(["Lo pudiste ver? opengatehub.com/devs"]) });
  enToque.m.contacto.estado = estadoDev;
  enToque.m.contacto.respondido_hasta = enToque.m.disparo;
  assert.equal((await enToque.agente.procesar(ID, null, { evento: "seguimiento" })).hecho, "enviada");
  assert.deepEqual(enToque.m.enviados, [`Lo pudiste ver? opengatehub.com/devs?ig=${ID}`]);
});

test("una charla sin un id de verdad manda el link como siempre", async () => {
  const { agente, m } = armar({ id: "77", responde: () => salida(["Va el formulario\nopengatehub.com/devs"]) });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada");
  assert.deepEqual(m.enviados, ["Va el formulario\nopengatehub.com/devs"]);
});

test("si el id llevara el código de acceso, el link sale sin el id: el código no sale nunca", async () => {
  const { agente, m } = armar({ codigo: ID, responde: () => salida(["Va el formulario\nopengatehub.com/devs"]) });
  assert.equal((await agente.procesar(ID, m.disparo)).hecho, "enviada");
  assert.deepEqual(m.enviados, ["Va el formulario\nopengatehub.com/devs"]);
});

test("la nota del formulario le llega al modelo en el historial, como sistema", async () => {
  const mensajes = [
    { id: 1, quien: "agente", texto: AVISO }, { id: 2, quien: "agente", texto: conLink },
    { id: 3, quien: "sistema", texto: NOTA_FORMULARIO }, { id: 4, quien: "lead", texto: "listo" },
  ];
  const { agente, m } = armar({ mensajes, responde: () => salida(["Pregunta de prueba?"]) });
  assert.equal((await agente.procesar(ID, m.disparo)).hecho, "enviada");
  const { turno } = m.pedidos[0];
  assert.deepEqual(turno.historial.at(-1), { quien: "sistema", texto: NOTA_FORMULARIO });
  // Ya está en el historial: no se repite en el contexto.
  assert.equal(turno.contexto, null);
});

test("en una charla larga, si la nota quedó más atrás de los 80 mensajes, va en el contexto del turno", async () => {
  const mensajes = [
    { id: 1, quien: "agente", texto: AVISO }, { id: 2, quien: "sistema", texto: NOTA_FORMULARIO },
    ...Array.from({ length: 88 }, (_, i) => ({ id: i + 3, quien: i % 2 ? "agente" : "lead", texto: `mensaje viejo ${i}` })),
    { id: 91, quien: "lead", texto: "dale" },
  ];
  const { agente, m } = armar({ mensajes, responde: () => salida(["Pregunta de prueba?"]) });
  m.contacto.respondido_hasta = 89;
  assert.equal((await agente.procesar(ID, 91)).hecho, "enviada");
  const { turno } = m.pedidos[0];
  assert.ok(!turno.historial.some((x) => x.quien === "sistema"));
  assert.match(turno.contexto, new RegExp(NOTA_FORMULARIO));
});

test("la nota es de sistema y es una sola frase fija: ningún mensaje del lead o del agente cuenta como ella", () => {
  assert.equal(esNotaDeFormulario({ quien: "sistema", texto: NOTA_FORMULARIO }), true);
  assert.equal(esNotaDeFormulario({ quien: "lead", texto: NOTA_FORMULARIO }), false);
  assert.equal(esNotaDeFormulario({ quien: "agente", texto: NOTA_FORMULARIO }), false);
  assert.equal(esNotaDeFormulario({ quien: "sistema", texto: "otra nota" }), false);
  assert.doesNotMatch(NOTA_FORMULARIO, /[¿¡—–]/);
});

/* ---------- 2 y 3. el formulario: /devs y la API ---------- */

test("lo que carga /devs no usa (?<! ni (?<= en el código: un navegador viejo no lo entiende y deja la página en blanco", async () => {
  const src = (await leer("../lib/dm/linkFormulario.js")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(src, /\(\?<[!=]/);
  assert.doesNotMatch(src, /^import /m, "la página carga este archivo: no puede traer nada del servidor");
});

test("/devs lee ?ig= con el mismo validador y lo manda solo si vale: sin ?ig= el pedido es el de siempre", async () => {
  const src = await leer("../pages/devs/index.jsx");
  assert.match(src, /import \{ idDeCharla \} from "\.\.\/\.\.\/lib\/dm\/linkFormulario";/);
  assert.match(src, /setIg\(idDeCharla\(params\.get\("ig"\)\)\);/);
  assert.match(src, /body: JSON\.stringify\(ig \? \{ \.\.\.f, ig \} : f\),/);
  // Medir por qué puerta entró (?de=) sigue igual.
  assert.match(src, /const de = normalizarOrigen\(params\.get\("de"\)\);\s*if \(de\) evento\("form_visto_" \+ de\);/);
});

const FORM = {
  nombre: "Ana Prueba", email: "ana@example.com", pais: "Argentina", roles: ["Backend"], seniority: "Senior",
  experiencia: "5 a 8", stack: ["Node"], cuandoArrancas: "Ya", dedicacion: "Full-time", tarifa: "30",
  situacion: "Buscando activamente", ingles: "Fluido", clientesExt: "Sí, alguna vez", comoLlegaste: "Instagram", whatsapp: "000",
};

/**
 * La base de mentira para la API: anota lo que guarda y contesta lo que pide el formulario. `charla`: lo que devuelve
 * la nota en la charla (null: no hay charla con ese id; un Error: la consulta falla). `alterFalla`: el error del ALTER.
 */
function baseDelFormulario({ charla = { ig_usuario: "usuario.prueba", dueno: "agente", anotada: 1 }, alterFalla = null } = {}) {
  const h = { insert: null, notas: [] };
  pg.otras = async (t, params) => {
    if (/^CREATE (TABLE|UNIQUE INDEX) IF NOT EXISTS/.test(t) || /^ALTER TABLE red_devs ALTER COLUMN/.test(t)) return { rows: [] };
    if (/^ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS ig_contacto TEXT$/.test(t)) {
      if (alterFalla) throw alterFalla;
      return { rows: [] };
    }
    if (/^INSERT INTO red_devs \(/.test(t)) {
      const cols = t.match(/^INSERT INTO red_devs \(([^)]*)\)/)[1].split(",").map((c) => c.trim());
      h.insert = Object.fromEntries(cols.map((c, i) => [c, params[i]]));
      return { rows: [{ id: 1, creado: new Date() }] };
    }
    if (/^WITH c AS \(SELECT id, ig_usuario, dueno FROM dm_contactos WHERE id = \?\)/.test(t)) {
      h.notas.push({ t, params });
      if (charla instanceof Error) throw charla;
      return { rows: charla ? [charla] : [] };
    }
    return undefined;
  };
  return h;
}
async function mandarFormulario(cuerpo) {
  const res = respuesta();
  process.env.POSTGRES_URL = "postgres://prueba";
  try {
    await devsRed({ method: "POST", body: { ...FORM, ...cuerpo } }, res);
  } finally {
    delete process.env.POSTGRES_URL;
  }
  return res;
}

test("la API guarda el id en red_devs.ig_contacto, anota el formulario en la charla y el aviso dice de qué charla viene", async () => {
  const h = baseDelFormulario();
  const res = await mandarFormulario({ ig: ID });
  assert.equal(res.codigo, 200);
  assert.deepEqual(res.cuerpo, { ok: true, guardado: true });
  assert.equal(h.insert.ig_contacto, ID);
  assert.equal(h.notas.length, 1);
  assert.ok(h.notas[0].params.includes(ID));
  assert.ok(h.notas[0].params.includes(NOTA_FORMULARIO));
  // La nota es de sistema, una sola vez, y solo si la charla existe.
  assert.match(h.notas[0].t, /INSERT INTO dm_mensajes \(contacto, quien, texto\) SELECT c\.id, 'sistema', \?::text FROM c WHERE NOT EXISTS/);
  assert.match(avisos[0], /<b>Instagram:<\/b> https:\/\/ig\.me\/m\/usuario\.prueba · ya habla con el agente/);
  assert.match(avisos[0], /<b>Guardado:<\/b> sí/);
});

test("la migración de ig_contacto aguanta a dos funciones a la vez: si la otra ya la creó, el lead se guarda igual", async () => {
  for (const code of ["42701", "23505"]) {
    const h = baseDelFormulario({ alterFalla: Object.assign(new Error("ya existe"), { code }) });
    const res = await mandarFormulario({ ig: ID });
    assert.deepEqual(res.cuerpo, { ok: true, guardado: true }, code);
    assert.equal(h.insert.ig_contacto, ID, code);
  }
  // Cualquier otro error no se tapa: el lead no se guarda y el aviso lo dice, como siempre.
  baseDelFormulario({ alterFalla: Object.assign(new Error("otra cosa"), { code: "42501" }) });
  const res = await mandarFormulario({ ig: ID });
  assert.deepEqual(res.cuerpo, { ok: true, guardado: false });
  assert.match(avisos.at(-1), /<b>Guardado:<\/b> NO/);
});

test("sin ?ig=, o con algo que no es un id, todo como siempre: sin columna llena, sin nota y sin renglón en el aviso", async () => {
  for (const ig of [undefined, "", "abc", "12", "1234567890' OR 1=1", 1234567890, ["1234567890"]]) {
    avisos.length = 0;
    const h = baseDelFormulario();
    const res = await mandarFormulario(ig === undefined ? {} : { ig });
    assert.deepEqual(res.cuerpo, { ok: true, guardado: true }, String(ig));
    assert.equal(h.insert.ig_contacto, null, String(ig));
    assert.equal(h.notas.length, 0, String(ig));
    assert.doesNotMatch(avisos[0], /Instagram:/, String(ig));
  }
});

test("si la charla no está o la nota falla, el formulario anda igual y el aviso lo dice", async () => {
  baseDelFormulario({ charla: null });
  let res = await mandarFormulario({ ig: ID });
  assert.deepEqual(res.cuerpo, { ok: true, guardado: true });
  assert.match(avisos.at(-1), /<b>Instagram:<\/b> vino del link de una charla que no encuentro en la base del agente/);

  const h = baseDelFormulario({ charla: new Error("relation dm_contactos does not exist") });
  res = await mandarFormulario({ ig: ID });
  assert.deepEqual(res.cuerpo, { ok: true, guardado: true });
  assert.equal(h.insert.ig_contacto, ID);
  assert.match(avisos.at(-1), /<b>Instagram:<\/b> vino del link de una charla del agente, pero no la pude mirar en la base/);
  assert.ok(registros.some((r) => /no pude anotar el formulario en la charla/.test(r)));
});

test("una charla de Cande o sin usuario guardado también se nombra en el aviso", async () => {
  baseDelFormulario({ charla: { ig_usuario: null, dueno: "cande", anotada: 0 } });
  await mandarFormulario({ ig: ID });
  assert.match(avisos.at(-1), /<b>Instagram:<\/b> sin usuario guardado · la charla es tuya/);
});

test("guardarDev: un id que no vale no llega a la base aunque la API no lo hubiera limpiado, y no pisa el que ya estaba", async () => {
  const { guardarDev } = await import("../lib/db.js");
  const h = baseDelFormulario();
  await guardarDev({ ...FORM, ig: "no-es-un-id" });
  assert.equal(h.insert.ig_contacto, null);
  const consulta = pg.consultas.find((t) => t.startsWith("INSERT INTO red_devs"));
  assert.match(consulta, /ig_contacto = COALESCE\(EXCLUDED\.ig_contacto, red_devs\.ig_contacto\)/);
});

test("anotarFormularioLleno devuelve la charla, o null si no hay charla con ese id", async () => {
  baseDelFormulario({ charla: { ig_usuario: "usuario.prueba", dueno: "agente", anotada: 1 } });
  assert.deepEqual(await anotarFormularioLleno(ID), { ig_usuario: "usuario.prueba", dueno: "agente", anotada: 1 });
  baseDelFormulario({ charla: null });
  assert.equal(await anotarFormularioLleno(ID), null);
});

/* ---------- 4. el CRM ---------- */

/** Un `sql` de mentira para crm_ig.mjs: contesta con `responder(texto)` y anota cada consulta. */
const sqlDe = (responder) => {
  const consultas = [];
  const sql = async (partes, ...valores) => {
    const t = partes.join("?").replace(/\s+/g, " ").trim();
    consultas.push(t);
    return responder(t, valores);
  };
  return { sql, consultas };
};
const dev = (id, extra = {}) => ({ id, nombre: `Dev ${id}`, creado: new Date("2026-10-20T12:00:00Z"), ...extra });

test("el CRM trae ig_contacto por to_jsonb (no falla sin la columna) y cruza con la charla por LEFT JOIN", async () => {
  const filas = [dev(1, { ig_contacto: ID, ig_usuario: "usuario.prueba", ig_dueno: "agente" }), dev(2, { ig_contacto: null, ig_usuario: null, ig_dueno: null })];
  const { sql, consultas } = sqlDe(() => ({ rows: filas }));
  const r = await leerDevs(sql);
  assert.equal(r.cruce, true);
  assert.deepEqual(r.devs, filas);
  assert.equal(consultas.length, 1);
  assert.match(consultas[0], /to_jsonb\(r\) ->> 'ig_contacto' AS ig_contacto, c\.ig_usuario, c\.dueno AS ig_dueno/);
  assert.match(consultas[0], /FROM red_devs r LEFT JOIN dm_contactos c ON c\.id = to_jsonb\(r\) ->> 'ig_contacto'/);
  // Las columnas de siempre siguen viniendo (las usa el CRM).
  for (const col of ["whatsapp", "telegram", "origen", "estado", "creado", "cv_url"]) assert.match(consultas[0], new RegExp(`r\\.${col}\\b`), col);
});

test("si el cruce con las charlas falla, los devs salen igual y la charla de cada uno queda como en el archivo anterior", async () => {
  const anterior = [
    dev(1, { ig_contacto: ID, ig_usuario: "usuario.prueba", ig_dueno: "agente" }),
    dev(2, { ig_contacto: OTRO, ig_usuario: "otro.usuario", ig_dueno: "cande" }),
  ];
  const { sql, consultas } = sqlDe((t) => {
    if (/LEFT JOIN dm_contactos/.test(t)) throw new Error('relation "dm_contactos" does not exist');
    // El 2 llenó de nuevo con otra charla: lo de antes no es de esa.
    return { rows: [dev(1, { ig_contacto: ID }), dev(2, { ig_contacto: "5555555555" }), dev(3, { ig_contacto: null })] };
  });
  const r = await leerDevs(sql, { anterior });
  assert.equal(r.cruce, false);
  assert.equal(consultas.length, 2);
  assert.match(consultas[1], /to_jsonb\(r\) ->> 'ig_contacto' AS ig_contacto FROM red_devs r ORDER BY creado DESC/);
  assert.deepEqual(r.devs.map((d) => [d.id, d.ig_contacto, d.ig_usuario, d.ig_dueno]), [
    [1, ID, "usuario.prueba", "agente"],
    [2, "5555555555", null, null],
    [3, null, null, null],
  ]);
  assert.ok(registros.some((x) => /no pude cruzar los devs con las charlas de Instagram/.test(x)));
});

test("si tampoco se pueden leer los devs, tira: crm_sync no escribe nada y queda el archivo de antes", async () => {
  const { sql } = sqlDe(() => { throw new Error("sin base"); });
  await assert.rejects(leerDevs(sql, { anterior: [dev(1)] }), /sin base/);
});

test("sin archivo anterior, o con uno roto, la charla queda vacía y no rompe", () => {
  for (const anterior of [undefined, null, [], "basura", [null, 3]]) {
    assert.deepEqual(conCharlaAnterior([dev(1, { ig_contacto: ID })], anterior).map((d) => [d.ig_usuario, d.ig_dueno]), [[null, null]]);
  }
});

test("crm_sync usa ese cruce y le pasa el archivo anterior", async () => {
  const src = await leer("../scripts/crm_sync.mjs");
  assert.match(src, /import \{ leerDevs \} from "\.\/crm_ig\.mjs";/);
  assert.match(src, /readFile\(join\(TRACKER, "crm_devs\.json"\), "utf8"\)/);
  assert.match(src, /const \{ devs \} = await leerDevs\(sql, \{ anterior \}\);/);
  // Lo de los founders no cambió.
  assert.match(src, /to_jsonb\(l\) ->> 'whatsapp' AS whatsapp/);
});
