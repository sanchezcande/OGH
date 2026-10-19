// El formulario de /devs con el id de la charla de Instagram (20/10/2026).
//
// Cande terminaba llamando por WhatsApp a gente que ya hablaba con el agente por Instagram: el formulario
// guardaba al lead sin saber de qué charla venía. Estas pruebas cubren cada paso:
//   1. el agente manda el link del formulario con el id de la charla (?ig=), y los frenos aceptan ese link
//      con ese id y nada más (lib/dm/linkFormulario.js, lib/dm/frenos.js, lib/dm/agente.js);
//   2. /devs lee ?ig= (también con un signo pegado), lo guarda en la pestaña y lo saca de la barra, y la API lo
//      guarda en red_devs.ig_contacto (pages/devs/index.jsx, pages/api/devs-red.js, lib/db.js), con la migración
//      que aguanta a dos funciones a la vez;
//   3. la charla queda con la nota del formulario (NOTA_FORMULARIO) solo si le salió el link con ese id y nadie más
//      lo usó, y el agente la ve (lib/dm/base.js);
//   4. el CRM cruza los devs con las charlas sin romperse si el cruce falla, y marca el link compartido
//      (scripts/crm_ig.mjs);
//   5. el id va firmado (&f=, lib/dm/firmaIg.js): un número cambiado a mano no se ata a la charla de otro, y sin
//      clave en el entorno todo sigue como antes. Las claves de estas pruebas son inventadas y viven solo acá.
//
// Todo con dobles: ninguna prueba toca una base ni sale a la red. Los textos son inventados para la prueba.
//
// Correr:  node --test tests/*.test.mjs
import { avisos, registros, respuesta } from "./dobles/preparar.mjs";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { base as pg } from "./dobles/postgres.mjs";

const {
  idDeCharla, idDeLink, firmaDeLink, idDeLaPestana, firmaDeLaPestana, sinIg, conIdDeCharla, esLinkConId, NOTA_FORMULARIO,
  esNotaDeFormulario,
} = await import("../lib/dm/linkFormulario.js");
const { firmarIg, firmaValida } = await import("../lib/dm/firmaIg.js");
const { revisar } = await import("../lib/dm/frenos.js");
const { crearAgente } = await import("../lib/dm/agente.js");
const { anotarFormularioLleno } = await import("../lib/dm/base.js");
const { default: devsRed } = await import("../pages/api/devs-red.js");
const { leerDevs, conCharlaAnterior, marcarCompartidos } = await import("../scripts/crm_ig.mjs");

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
    // Un emoji pegado (lo puede escribir Cande en una indicación) es del texto: el id va antes, no después.
    ["opengatehub.com/devs?de=dm🙌", `opengatehub.com/devs?de=dm&ig=${ID}🙌`],
    ["opengatehub.com/devs?🙌", `opengatehub.com/devs?ig=${ID}?🙌`],
    ["opengatehub.com/devs🙌 dale", `opengatehub.com/devs?ig=${ID}🙌 dale`],
  ];
  for (const [antes, despues] of casos) assert.equal(conIdDeCharla(antes, ID), despues, antes);
});

test("el id llega a /devs aunque Instagram meta adentro del link el signo que quedó pegado", () => {
  // Lo que puede llegar en ig= si el lector de links de Instagram se lleva la puntuación del texto.
  for (const v of [ID, `${ID}.`, `${ID}?`, `${ID})`, `${ID}),`, `${ID}🙌`, `${ID}?🙌`, ` ${ID} `]) {
    assert.equal(idDeLink(v), ID, JSON.stringify(v));
  }
  // Una letra, un número de más, un espacio con algo atrás o un id que no vale ya no son este id.
  for (const malo of [`${ID}abc`, `${ID}_`, `${ID} 5`, `${ID}' OR 1=1`, "12.", `${"1".repeat(21)}.`, "abc", "", "?", null, undefined, 1234567890]) {
    assert.equal(idDeLink(malo), null, JSON.stringify(malo));
  }
  // De punta a punta: cada mensaje que arma el sitio, leído como lo leería /devs, se lleve o no el signo de atrás.
  for (const texto of [
    "Pudiste llenar opengatehub.com/devs?", "Entrá a opengatehub.com/devs.", "(opengatehub.com/devs)", "opengatehub.com/devs?de=dm.",
    "opengatehub.com/devs?de=dm🙌", "opengatehub.com/devs?🙌", "Va: opengatehub.com/devs",
  ]) {
    const link = conIdDeCharla(texto, ID).match(/opengatehub\.com\/devs\S*/)[0];
    assert.equal(idDeLink(new URLSearchParams(link.slice(link.indexOf("?"))).get("ig")), ID, `${texto} → ${link}`);
  }
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

test("/devs lee ?ig= con el mismo validador, lo saca de la barra con el router listo y lo manda solo si vale", async () => {
  const src = await leer("../pages/devs/index.jsx");
  assert.match(src, /import \{ firmaDeLaPestana, idDeLaPestana, sinIg \} from "\.\.\/\.\.\/lib\/dm\/linkFormulario";/);
  const efecto = src.match(/React\.useEffect\(\(\) => \{\s*if \(!router\.isReady\) return;[\s\S]*?\}, \[router\.isReady\]\);/);
  assert.ok(efecto, "el id se lee recién con el router listo: antes Next vuelve a escribir la dirección");
  assert.match(efecto[0], /setIg\(idDeLaPestana\(window\.location\.search, \(\) => window\.sessionStorage\)\);/);
  // La firma del id (f=), igual que el id: de la dirección o de la pestaña.
  assert.match(efecto[0], /setFirma\(firmaDeLaPestana\(window\.location\.search, \(\) => window\.sessionStorage\)\);/);
  // Sin navegar (router.replace prende el cartel de cargando de _app.js) y con el estado de Next igual de limpio.
  assert.match(efecto[0], /window\.history\.replaceState\(st\?\.__N \? \{ \.\.\.st, url: sinIg\(st\.url\), as: sinIg\(st\.as\) \} : st, "", limpia\);/);
  assert.doesNotMatch(efecto[0], /router\.(replace|push)/);
  assert.match(efecto[0], /try \{[\s\S]*\} catch \(e\)/, "nunca rompe la página");
  assert.match(src, /body: JSON\.stringify\(ig \? \{ \.\.\.f, ig, firma \} : f\),/);
  // Medir por qué puerta entró (?de=) sigue igual, y sinIg no le saca el ?de= a la barra.
  assert.match(src, /const de = normalizarOrigen\(new URLSearchParams\(window\.location\.search\)\.get\("de"\)\);\s*if \(de\) evento\("form_visto_" \+ de\);/);
});

/** Un sessionStorage de mentira. `roto`: pedirlo tira, como en modo privado o con el almacenamiento bloqueado. */
function pestana({ guardado = null, roto = false } = {}) {
  const datos = new Map(guardado == null ? [] : [["ogh_charla_ig", guardado]]);
  const s = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)) };
  return { almacen: () => { if (roto) throw new Error("SecurityError"); return s; }, datos };
}

test("el id queda en la pestaña: si recarga sin el ?ig= en la barra, el formulario lo sigue mandando", () => {
  const p = pestana();
  assert.equal(idDeLaPestana(`?de=dm&ig=${ID}?`, p.almacen), ID);
  assert.equal(p.datos.get("ogh_charla_ig"), ID);
  assert.equal(idDeLaPestana("?de=dm", p.almacen), ID);
  assert.equal(idDeLaPestana("", p.almacen), ID);
  // Un link con otro id en la misma pestaña manda ese.
  assert.equal(idDeLaPestana(`?ig=${OTRO}`, p.almacen), OTRO);
  assert.equal(idDeLaPestana("", p.almacen), OTRO);
  // Sin nada guardado, o con algo que no es un id, no hay id.
  assert.equal(idDeLaPestana("", pestana().almacen), null);
  assert.equal(idDeLaPestana("?ig=abc", pestana().almacen), null);
  assert.equal(idDeLaPestana("", pestana({ guardado: "<b>x</b>" }).almacen), null);
  // Un ?ig= que no vale no tapa el que estaba guardado.
  assert.equal(idDeLaPestana("?ig=abc", pestana({ guardado: ID }).almacen), ID);
  // Sin almacenamiento, el de la barra igual sirve, y nada tira.
  assert.equal(idDeLaPestana(`?ig=${ID}`, pestana({ roto: true }).almacen), ID);
  assert.equal(idDeLaPestana("", pestana({ roto: true }).almacen), null);
  assert.equal(idDeLaPestana(undefined, () => null), null);
});

test("sinIg saca el ig= de la dirección y deja todo lo demás como estaba", () => {
  const casos = [
    [`/devs?ig=${ID}`, "/devs"],
    [`/devs?de=dm&ig=${ID}`, "/devs?de=dm"],
    [`/devs?ig=${ID}&de=dm`, "/devs?de=dm"],
    [`/devs?de=dm&ig=${ID}?#arriba`, "/devs?de=dm#arriba"],
    [`/en/devs?ig=${ID}&IG=${OTRO}&ig`, "/en/devs"],
    ["/devs?de=dm", "/devs?de=dm"],
    ["/devs?igual=1&de=dm", "/devs?igual=1&de=dm"],
    ["/devs", "/devs"],
    ["/devs#ig=1", "/devs#ig=1"],
    [undefined, ""],
  ];
  for (const [antes, despues] of casos) assert.equal(sinIg(antes), despues, String(antes));
});

const FORM = {
  nombre: "Ana Prueba", email: "ana@example.com", pais: "Argentina", roles: ["Backend"], seniority: "Senior",
  experiencia: "5 a 8", stack: ["Node"], cuandoArrancas: "Ya", dedicacion: "Full-time", tarifa: "30",
  situacion: "Buscando activamente", ingles: "Fluido", clientesExt: "Sí, alguna vez", comoLlegaste: "Instagram", whatsapp: "000",
};

/**
 * La base de mentira para la API: anota lo que guarda y contesta lo que pide el formulario. `charla`: lo que devuelve
 * la nota en la charla (null: no hay charla con ese id; un Error: la consulta falla). `alterFalla`: el error del ALTER.
 * `compartido`: guardarDev dice que el id ya está en la ficha de otro mail.
 */
function baseDelFormulario({
  charla = { ig_usuario: "usuario.prueba", dueno: "agente", link_enviado: true, anotada: 1 }, alterFalla = null, compartido = false,
} = {}) {
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
      return { rows: [{ id: 1, creado: new Date(), ig_compartido: compartido }] };
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
  assert.ok(h.notas[0].params.includes(true), "guardado y sin compartir: deja la nota");
  // La nota es de sistema, una sola vez, solo si la charla existe y si le salió el link con ese id.
  assert.match(h.notas[0].t, /INSERT INTO dm_mensajes \(contacto, quien, texto\) SELECT c\.id, 'sistema', \?::text FROM c, l WHERE \?::boolean AND l\.enviado AND NOT EXISTS/);
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

test("un id que viene con el signo pegado se guarda limpio", async () => {
  const h = baseDelFormulario();
  await mandarFormulario({ ig: `${ID}?` });
  assert.equal(h.insert.ig_contacto, ID);
  assert.ok(h.notas[0].params.includes(ID));
});

test("link compartido: si el id ya está en la ficha de otro mail, la charla no recibe la nota y el aviso no dice que ya habla con el agente", async () => {
  const h = baseDelFormulario({ compartido: true, charla: { ig_usuario: "usuario.prueba", dueno: "agente", link_enviado: true, anotada: 0 } });
  const res = await mandarFormulario({ ig: ID });
  assert.deepEqual(res.cuerpo, { ok: true, guardado: true });
  assert.equal(h.insert.ig_contacto, ID, "el id igual queda en su ficha: el CRM lo marca como compartido");
  assert.equal(h.notas.length, 1);
  assert.ok(h.notas[0].params.includes(false), "mira la charla para el aviso pero no deja la nota");
  assert.ok(!h.notas[0].params.includes(true));
  assert.match(avisos.at(-1), /<b>Instagram:<\/b> https:\/\/ig\.me\/m\/usuario\.prueba · link compartido: ese link ya lo usó otro mail/);
  assert.doesNotMatch(avisos.at(-1), /ya habla con el agente/);
});

test("si a esa charla nunca le salió el link con ese id, el aviso lo dice en vez de que ya habla con el agente", async () => {
  baseDelFormulario({ charla: { ig_usuario: "usuario.prueba", dueno: "agente", link_enviado: false, anotada: 0 } });
  await mandarFormulario({ ig: ID });
  assert.match(avisos.at(-1), /<b>Instagram:<\/b> https:\/\/ig\.me\/m\/usuario\.prueba · a esa charla no le salió el link con este id/);
  assert.doesNotMatch(avisos.at(-1), /ya habla con el agente/);
});

test("si el lead no se pudo guardar, la charla no recibe la nota", async () => {
  const h = baseDelFormulario({ alterFalla: Object.assign(new Error("otra cosa"), { code: "42501" }) });
  const res = await mandarFormulario({ ig: ID });
  assert.deepEqual(res.cuerpo, { ok: true, guardado: false });
  assert.equal(h.notas.length, 1);
  assert.ok(h.notas[0].params.includes(false));
  assert.ok(!h.notas[0].params.includes(true));
});

test("una charla de Cande o sin usuario guardado también se nombra en el aviso", async () => {
  baseDelFormulario({ charla: { ig_usuario: null, dueno: "cande", link_enviado: true, anotada: 0 } });
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
  // Dice si ese id ya está en la ficha de otro mail (otra fila): la misma persona que vuelve no cuenta.
  assert.match(consulta, /RETURNING id, creado, .*EXISTS \(SELECT 1 FROM red_devs o WHERE o\.ig_contacto = red_devs\.ig_contacto AND o\.id <> red_devs\.id\) AS ig_compartido$/);
});

test("anotarFormularioLleno devuelve la charla, o null si no hay charla con ese id", async () => {
  const charla = { ig_usuario: "usuario.prueba", dueno: "agente", link_enviado: true, anotada: 1 };
  baseDelFormulario({ charla });
  assert.deepEqual(await anotarFormularioLleno(ID), charla);
  baseDelFormulario({ charla: null });
  assert.equal(await anotarFormularioLleno(ID), null);
});

test("la nota queda solo si a esa charla le salió el link con ese id, de la cuenta y no del lead", async () => {
  const h = baseDelFormulario();
  await anotarFormularioLleno(ID);
  const [{ t, params }] = h.notas;
  assert.match(t, /SELECT 1 FROM dm_mensajes WHERE contacto = \? AND quien IN \('agente', 'cande'\) AND texto ~ \?/);
  assert.match(t, /SELECT c\.ig_usuario, c\.dueno, l\.enviado AS link_enviado, \(SELECT COUNT\(\*\)::int FROM n\) AS anotada FROM c, l$/);
  // El patrón es el link con este id y no con uno que empieza igual (Postgres y JavaScript lo leen igual).
  const patron = new RegExp(params.find((p) => typeof p === "string" && p.includes("ig=")));
  for (const si of [`opengatehub.com/devs?ig=${ID}`, `Va: opengatehub.com/devs?de=dm&ig=${ID}.`, `devs?ig=${ID}?`, `devs?ig=${ID}🙌`]) {
    assert.equal(patron.test(si), true, si);
  }
  for (const no of [`opengatehub.com/devs?ig=${ID}5`, `opengatehub.com/devs?ig=5${ID}`, `opengatehub.com/devs?big=${ID}`, `ig=${ID}`, "opengatehub.com/devs"]) {
    assert.equal(patron.test(no), false, no);
  }
});

test("anotar: false mira la charla sin dejar la nota, y un id que no vale no llega a la base", async () => {
  let h = baseDelFormulario();
  await anotarFormularioLleno(ID, { anotar: false });
  assert.ok(h.notas[0].params.includes(false));
  assert.ok(!h.notas[0].params.includes(true));
  // Cualquier cosa que no sea true no anota.
  h = baseDelFormulario();
  await anotarFormularioLleno(ID, { anotar: "si" });
  assert.ok(!h.notas[0].params.includes(true));
  h = baseDelFormulario();
  for (const malo of ["abc", "12", `${ID}' OR 1=1`, null, 1234567890]) assert.equal(await anotarFormularioLleno(malo), null, String(malo));
  assert.equal(h.notas.length, 0);
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
  assert.deepEqual(r.devs, filas.map((d) => ({ ...d, ig_compartido: false })));
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
  assert.deepEqual(r.devs.map((d) => [d.id, d.ig_contacto, d.ig_usuario, d.ig_dueno, d.ig_compartido]), [
    [1, ID, "usuario.prueba", "agente", false],
    [2, "5555555555", null, null, false],
    [3, null, null, null, false],
  ]);
  assert.ok(registros.some((x) => /no pude cruzar los devs con las charlas de Instagram/.test(x)));
});

test("link compartido: el mismo id en la ficha de dos mails queda marcado en las dos, con o sin el cruce", async () => {
  const filas = [
    dev(1, { ig_contacto: ID, ig_usuario: "usuario.prueba", ig_dueno: "agente" }),
    dev(2, { ig_contacto: ID, ig_usuario: "usuario.prueba", ig_dueno: "agente" }),
    dev(3, { ig_contacto: OTRO, ig_usuario: "otro.usuario", ig_dueno: "agente" }),
    dev(4, { ig_contacto: null, ig_usuario: null, ig_dueno: null }),
    dev(5, { ig_contacto: null, ig_usuario: null, ig_dueno: null }),
  ];
  const conCruce = await leerDevs(sqlDe(() => ({ rows: filas })).sql);
  assert.deepEqual(conCruce.devs.map((d) => [d.id, d.ig_compartido]), [[1, true], [2, true], [3, false], [4, false], [5, false]]);
  const sinCruce = await leerDevs(sqlDe((t) => {
    if (/LEFT JOIN/.test(t)) throw new Error("sin dm_contactos");
    return { rows: filas.map(({ ig_usuario, ig_dueno, ...d }) => d) };
  }).sql);
  assert.deepEqual(sinCruce.devs.map((d) => [d.id, d.ig_compartido]), [[1, true], [2, true], [3, false], [4, false], [5, false]]);
  assert.deepEqual(marcarCompartidos([]), []);
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

/* ---------- 5. la firma del id ---------- */

// Claves inventadas para estas pruebas. preparar.mjs borra IG_LINK_SECRET y CRON_SECRET al arrancar: sin clave es
// lo de siempre, y cada prueba de acá pone la suya y la saca al terminar.
const CLAVE = "clave-de-prueba-para-firmar";
const BASE64URL_10 = /^[A-Za-z0-9_-]{10}$/;

/** Corre `fn` con estas claves en el entorno y después deja el entorno como estaba. */
async function conClaves(claves, fn) {
  const antes = { IG_LINK_SECRET: process.env.IG_LINK_SECRET, CRON_SECRET: process.env.CRON_SECRET };
  for (const [k, v] of Object.entries(claves)) {
    if (v == null) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(antes)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}
const conClave = (fn) => conClaves({ IG_LINK_SECRET: CLAVE }, fn);

/** Cambia un caracter de la firma por otro que también es base64url: misma forma, otra firma. */
const otraFirma = (f) => (f[0] === "A" ? "B" : "A") + f.slice(1);

test("la firma: 10 caracteres base64url, la misma para el mismo id y distinta para otro id o con otra clave", () =>
  conClave(async () => {
    const f = firmarIg(ID);
    assert.match(f, BASE64URL_10);
    assert.equal(firmarIg(ID), f);
    assert.equal(firmarIg(` ${ID} `), f, "el id se limpia como en idDeCharla");
    assert.notEqual(firmarIg(OTRO), f);
    assert.notEqual(firmarIg(`${ID}0`), f);
    await conClaves({ IG_LINK_SECRET: "otra-clave-de-prueba" }, () => assert.notEqual(firmarIg(ID), f));
    // Un id que no vale no se firma.
    for (const malo of ["12", "abc", "", null, undefined, 1234567890]) assert.equal(firmarIg(malo), null, String(malo));
  }));

test("la clave es IG_LINK_SECRET y, si no está, CRON_SECRET; sin ninguna no hay firma", async () => {
  const conPropia = await conClaves({ IG_LINK_SECRET: CLAVE, CRON_SECRET: "clave-de-cron-de-prueba" }, () => firmarIg(ID));
  const soloPropia = await conClaves({ IG_LINK_SECRET: CLAVE, CRON_SECRET: null }, () => firmarIg(ID));
  const soloCron = await conClaves({ IG_LINK_SECRET: null, CRON_SECRET: "clave-de-cron-de-prueba" }, () => firmarIg(ID));
  assert.equal(conPropia, soloPropia, "con las dos, firma IG_LINK_SECRET");
  assert.match(soloCron, BASE64URL_10);
  assert.notEqual(soloCron, soloPropia);
  assert.equal(await conClaves({ IG_LINK_SECRET: null, CRON_SECRET: null }, () => firmarIg(ID)), null);
  assert.equal(await conClaves({ IG_LINK_SECRET: "", CRON_SECRET: "" }, () => firmarIg(ID)), null);
});

test("firmaValida: la firma de ese id vale; una cambiada, la de otro id, otro largo o ninguna no", () =>
  conClave(() => {
    const f = firmarIg(ID);
    assert.equal(firmaValida(ID, f), true);
    assert.equal(firmaValida(ID, otraFirma(f)), false);
    assert.equal(firmaValida(OTRO, f), false, "un id cambiado no coincide con la firma del otro");
    assert.equal(firmaValida(ID, firmarIg(OTRO)), false);
    for (const mala of [f.slice(0, 9), `${f}A`, "", "é".repeat(5), null, undefined, 123, [f], { f }]) {
      assert.equal(firmaValida(ID, mala), false, JSON.stringify(mala));
    }
    assert.equal(firmaValida("abc", f), false);
  }));

test("sin clave, firmaValida deja pasar todo (es lo de hoy: el link salió sin firma) y firmarIg no firma", () => {
  assert.equal(firmarIg(ID), null);
  for (const cualquiera of [undefined, null, "", "AAAAAAAAAA", "lo-que-sea"]) assert.equal(firmaValida(ID, cualquiera), true);
});

test("firmaIg.js es solo de servidor: ni la página ni lo que ella carga lo importan", async () => {
  for (const p of ["../pages/devs/index.jsx", "../lib/dm/linkFormulario.js"]) {
    // Sin los comentarios: nombrar el archivo en una explicación no es importarlo.
    const src = (await leer(p)).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(src, /from ["'][^"']*firmaIg["']|import\(["'][^"']*firmaIg/, p);
    assert.doesNotMatch(src, /node:crypto|from ["']crypto["']/, p);
  }
  const firma = await leer("../lib/dm/firmaIg.js");
  assert.match(firma, /^import \{ createHmac, timingSafeEqual \} from "node:crypto";$/m);
  assert.match(firma, /process\.env\.IG_LINK_SECRET \|\| process\.env\.CRON_SECRET/);
});

test("el link lleva la firma atrás del id, y un f= que ya estaba se cambia por esta o se saca", () => {
  const F = "AbC-_d3F9z";
  const casos = [
    ["Va el formulario\nopengatehub.com/devs", `Va el formulario\nopengatehub.com/devs?ig=${ID}&f=${F}`],
    ["opengatehub.com/devs?de=dm", `opengatehub.com/devs?de=dm&ig=${ID}&f=${F}`],
    ["Pudiste llenar opengatehub.com/devs?", `Pudiste llenar opengatehub.com/devs?ig=${ID}&f=${F}?`],
    ["(opengatehub.com/devs)", `(opengatehub.com/devs?ig=${ID}&f=${F})`],
    ["opengatehub.com/devs?de=dm🙌", `opengatehub.com/devs?de=dm&ig=${ID}&f=${F}🙌`],
    // Lo copió del historial con otra firma, o con el id y la firma de otra charla: quedan los de esta.
    [`opengatehub.com/devs?ig=${ID}&f=ZZZZZZZZZZ`, `opengatehub.com/devs?ig=${ID}&f=${F}`],
    [`opengatehub.com/devs?f=ZZZZZZZZZZ&ig=${OTRO}&de=dm`, `opengatehub.com/devs?de=dm&ig=${ID}&f=${F}`],
  ];
  for (const [antes, despues] of casos) assert.equal(conIdDeCharla(antes, ID, { firma: F }), despues, antes);
  // Dos veces da lo mismo.
  const una = conIdDeCharla("Va: opengatehub.com/devs?de=dm", ID, { firma: F });
  assert.equal(conIdDeCharla(una, ID, { firma: F }), una);
  // Sin firma (sin clave), el f= viejo se saca: un f= nunca queda pegado a un id que no es el suyo.
  assert.equal(conIdDeCharla(`opengatehub.com/devs?ig=${OTRO}&f=${F}`, ID), `opengatehub.com/devs?ig=${ID}`);
  // Una firma sin la forma de una no se pone.
  for (const mala of ["corta", `${F}x`, "AbC+/d3F9=", "", 1234567890, {}]) {
    assert.equal(conIdDeCharla("opengatehub.com/devs", ID, { firma: mala }), `opengatehub.com/devs?ig=${ID}`, String(mala));
  }
  // El tope de Instagram cuenta también la firma.
  const justo = `${"x".repeat(965)} opengatehub.com/devs`;
  assert.equal(conIdDeCharla(justo, ID, { firma: F }), justo);
});

test("los frenos aceptan ?ig=<id>&f=<10 base64url> y nada más", () => {
  const F = "AbC-_d3F9z";
  for (const m of [
    `Va: opengatehub.com/devs?ig=${ID}&f=${F}`, `https://www.opengatehub.com/devs?ig=${ID}&f=${F}.`, `opengatehub.com/devs/?ig=${ID}&f=${F}`,
    `Pudiste? opengatehub.com/devs?ig=${ID}&f=${F}?`,
  ]) {
    assert.deepEqual(revisar(salida([m]), { contacto: ID }), { ok: true }, m);
  }
  assert.equal(esLinkConId(`opengatehub.com/devs?ig=${ID}&f=${F.toLowerCase()}`, ID), true, "en plano la firma llega en minúsculas");
  for (const m of [
    `opengatehub.com/devs?ig=${ID}&f=${F.slice(0, 9)}`, `opengatehub.com/devs?ig=${ID}&f=${F}x`, `opengatehub.com/devs?ig=${ID}&f=`,
    `opengatehub.com/devs?ig=${ID}&f=abc+/d3f9=`, `opengatehub.com/devs?ig=${ID}&f=abc%20d3f9z`, `opengatehub.com/devs?ig=${ID}&f=abcde.fghi`,
    `opengatehub.com/devs?ig=${ID}&f=${F}&f=${F}`, `opengatehub.com/devs?ig=${ID}&f=${F}&de=dm`, `opengatehub.com/devs?f=${F}&ig=${ID}`,
    `opengatehub.com/devs?ig=${ID}&g=${F}`, `opengatehub.com/devs?ig=${OTRO}&f=${F}`,
  ]) {
    assert.equal(revisar(salida([m]), { contacto: ID }).motivo, "link que no está en la lista permitida", m);
  }
});

test("/devs: la firma viaja con su id, de la barra o de la pestaña, y nunca con otro id", () => {
  const F = "AbC-_d3F9z";
  const p = pestana();
  assert.equal(idDeLaPestana(`?de=dm&ig=${ID}&f=${F}?`, p.almacen), ID);
  assert.equal(firmaDeLaPestana(`?de=dm&ig=${ID}&f=${F}?`, p.almacen), F, "el signo pegado queda en el f=, el último");
  // Recarga sin nada en la barra: los dos de la pestaña.
  assert.equal(idDeLaPestana("", p.almacen), ID);
  assert.equal(firmaDeLaPestana("", p.almacen), F);
  // Otro link en la misma pestaña, sin firma: la firma vieja no se le pega al id nuevo.
  assert.equal(firmaDeLaPestana(`?ig=${OTRO}`, p.almacen), null);
  assert.equal(idDeLaPestana("", p.almacen), OTRO);
  assert.equal(firmaDeLaPestana("", p.almacen), null);
  // Un f= sin ig=, o con un ig= que no vale, no cuenta ni pisa lo guardado.
  const q = pestana();
  assert.equal(firmaDeLaPestana(`?f=${F}`, q.almacen), null);
  firmaDeLaPestana(`?ig=${ID}&f=${F}`, q.almacen);
  assert.equal(firmaDeLaPestana(`?ig=abc&f=ZZZZZZZZZZ`, q.almacen), F);
  // Algo que no tiene la forma de una firma no se usa.
  for (const mala of ["corta", `${F}x`, `${F}_`, "AbC+/d3F9=", ""]) {
    assert.equal(firmaDeLaPestana(`?ig=${ID}&f=${encodeURIComponent(mala)}`, pestana().almacen), null, mala);
  }
  // Sin almacenamiento, la de la barra igual sirve, y nada tira.
  assert.equal(firmaDeLaPestana(`?ig=${ID}&f=${F}`, pestana({ roto: true }).almacen), F);
  assert.equal(firmaDeLaPestana(undefined, () => null), null);
  // firmaDeLink: como idDeLink, aguanta el signo pegado y nada más.
  for (const v of [F, `${F}.`, `${F}?`, `${F})`, `${F}🙌`, ` ${F} `]) assert.equal(firmaDeLink(v), F, v);
  for (const malo of [`${F}a`, `${F}_`, `${F} 5`, F.slice(1), "", null, undefined, 1234567890]) assert.equal(firmaDeLink(malo), null, String(malo));
});

test("sinIg también saca el f= de la barra y deja todo lo demás", () => {
  const casos = [
    [`/devs?ig=${ID}&f=AbC-_d3F9z`, "/devs"],
    [`/devs?de=dm&ig=${ID}&f=AbC-_d3F9z?#arriba`, "/devs?de=dm#arriba"],
    ["/devs?de=dm&F=x&f", "/devs?de=dm"],
    ["/devs?fx=1&de=dm", "/devs?fx=1&de=dm"],
  ];
  for (const [antes, despues] of casos) assert.equal(sinIg(antes), despues, antes);
});

test("con clave, el agente manda el link firmado, y lo mismo queda en la salida y en la charla", () =>
  conClave(async () => {
    const firmado = `Va el formulario\nopengatehub.com/devs?ig=${ID}&f=${firmarIg(ID)}`;
    const { agente, m } = armar({ responde: () => salida(["Te paso el formulario", "Va el formulario\nopengatehub.com/devs"]) });
    assert.equal((await agente.procesar(ID, m.disparo)).hecho, "enviada");
    assert.deepEqual(m.enviados, ["Te paso el formulario", firmado]);
    assert.deepEqual(m.salidas.at(-1).mensajes, m.enviados);
    assert.deepEqual(m.mensajes.filter((x) => x.quien === "agente").slice(1).map((x) => x.texto), m.enviados);
    // La nota de la charla la sigue encontrando: el patrón de anotarFormularioLleno ve el ig= con el f= atrás.
    const h = baseDelFormulario();
    await anotarFormularioLleno(ID);
    assert.equal(new RegExp(h.notas[0].params.find((p) => typeof p === "string" && p.includes("ig="))).test(firmado), true);
  }));

test("con clave, si el modelo copia el link firmado del historial sale igual, y con una firma inventada sale con la de verdad", () =>
  conClave(async () => {
    const firmado = `Acá de nuevo: opengatehub.com/devs?ig=${ID}&f=${firmarIg(ID)}`;
    let a = armar({ responde: () => salida([firmado]) });
    assert.equal((await a.agente.procesar(ID, a.m.disparo)).hecho, "enviada");
    assert.deepEqual(a.m.enviados, [firmado]);
    a = armar({ responde: () => salida([`Acá de nuevo: opengatehub.com/devs?ig=${ID}&f=${otraFirma(firmarIg(ID))}`]) });
    assert.equal((await a.agente.procesar(ID, a.m.disparo)).hecho, "enviada");
    assert.deepEqual(a.m.enviados, [firmado]);
    // Con un f= de otro largo, el freno lo para.
    a = armar({ responde: () => salida([`Va: opengatehub.com/devs?ig=${ID}&f=${firmarIg(ID)}x`]) });
    assert.equal((await a.agente.procesar(ID, a.m.disparo)).hecho, "frenada");
    assert.equal(a.m.enviados.length, 0);
  }));

test("con clave, la API guarda ig_contacto y anota la charla solo con la firma de ese id", () =>
  conClave(async () => {
    const f = firmarIg(ID);
    let h = baseDelFormulario();
    let res = await mandarFormulario({ ig: ID, firma: f });
    assert.deepEqual(res.cuerpo, { ok: true, guardado: true });
    assert.equal(h.insert.ig_contacto, ID);
    assert.equal(h.notas.length, 1);
    assert.match(avisos.at(-1), /<b>Instagram:<\/b> https:\/\/ig\.me\/m\/usuario\.prueba · ya habla con el agente/);

    // Firma cambiada, id cambiado a mano (con la firma del original), firma de otro largo o sin firma: el formulario
    // se guarda igual, sin ig_contacto, sin tocar ninguna charla, y el aviso lo dice.
    for (const cuerpo of [
      { ig: ID, firma: otraFirma(f) }, { ig: OTRO, firma: f }, { ig: ID, firma: `${f}A` }, { ig: ID, firma: f.slice(1) },
      { ig: ID }, { ig: ID, firma: null }, { ig: ID, firma: [f] },
    ]) {
      h = baseDelFormulario();
      res = await mandarFormulario(cuerpo);
      assert.deepEqual(res.cuerpo, { ok: true, guardado: true }, JSON.stringify(cuerpo));
      assert.equal(h.insert.ig_contacto, null, JSON.stringify(cuerpo));
      assert.equal(h.notas.length, 0, JSON.stringify(cuerpo));
      assert.match(avisos.at(-1), /<b>Instagram:<\/b> vino con un id de charla que no coincide con su firma/, JSON.stringify(cuerpo));
      assert.match(avisos.at(-1), /<b>Guardado:<\/b> sí/);
    }
  }));

test("con clave, la firma con el signo pegado que se llevó Instagram igual vale", () =>
  conClave(async () => {
    const h = baseDelFormulario();
    await mandarFormulario({ ig: ID, firma: `${firmarIg(ID)}?` });
    assert.equal(h.insert.ig_contacto, ID);
    assert.equal(h.notas.length, 1);
  }));

test("sin clave, la API se comporta como hoy: el id se guarda con o sin firma, y la firma no importa", async () => {
  for (const firma of [undefined, null, "AAAAAAAAAA", "cualquier-cosa"]) {
    const h = baseDelFormulario();
    await mandarFormulario(firma === undefined ? { ig: ID } : { ig: ID, firma });
    assert.equal(h.insert.ig_contacto, ID, String(firma));
    assert.equal(h.notas.length, 1, String(firma));
    assert.doesNotMatch(avisos.at(-1), /no coincide con su firma/);
  }
});

test("de punta a punta, con clave: el link que arma el agente, leído como /devs, pasa la API; con un número cambiado, no", () =>
  conClave(async () => {
    for (const texto of ["Va: opengatehub.com/devs", "Pudiste llenar opengatehub.com/devs?", "opengatehub.com/devs?de=dm.", "(opengatehub.com/devs)"]) {
      const link = conIdDeCharla(texto, ID, { firma: firmarIg(ID) }).match(/opengatehub\.com\/devs\S*/)[0];
      const busqueda = link.slice(link.indexOf("?"));
      const p = pestana();
      const cuerpo = { ig: idDeLaPestana(busqueda, p.almacen), firma: firmaDeLaPestana(busqueda, p.almacen) };
      let h = baseDelFormulario();
      await mandarFormulario(cuerpo);
      assert.equal(h.insert.ig_contacto, ID, `${texto} → ${link}`);

      // El mismo link con el número cambiado a mano.
      const tocado = busqueda.replace(`ig=${ID}`, `ig=${OTRO}`);
      const q = pestana();
      h = baseDelFormulario();
      await mandarFormulario({ ig: idDeLaPestana(tocado, q.almacen), firma: firmaDeLaPestana(tocado, q.almacen) });
      assert.equal(h.insert.ig_contacto, null, `${texto} → ${tocado}`);
      assert.equal(h.notas.length, 0);
    }
  }));
