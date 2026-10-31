// El 1 a 1 de Cande (28/10): el agente se lo puede ofrecer a seniors y semi seniors que buscan trabajo. Los frenos del
// sitio dejan pasar exactamente lo suyo (su doc y su link de Gumroad tal cual, 473 y 500 en dólares hablando del 1 a 1 y
// su garantía con la frase de Cande) y nada más: otro monto, otro link, otra garantía o el 1 a 1 a una empresa siguen
// frenados. El aviso urgente de quien quiere el 1 a 1 le suena a Cande sin pasarle la charla, y el controlador no toma el doc como
// una entrega que falta ni corrige con el precio del programa una charla del 1 a 1. Desde el 29/10: el "no lo puedo
// pagar" al 1 a 1 no frena el programa de 27 que le sigue, a quien ya compró no se le vende nada (NOTA_COMPRO como
// antes) y el contexto trae el seniority del formulario. Desde el 30/10 el 1 a 1 va primero a cualquiera que busca (eso
// lo decide el prompt, no el sitio); la plata dicha al 1 a 1 cuenta hasta que le llega el programa en firme; el doc solo
// va también al que escribió la palabra clave de la historia con algo al lado; y F2 no se saltea por un precio_dicho del 473.
//
// Los textos de los leads y de la cuenta son inventados para la prueba (este repo es público): solo el doc, el link y
// la frase de la garantía son los de verdad, porque eso es lo que se deja pasar tal cual. La frase va armada por tramos,
// como en lib/dm/frenos.js.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { base as pg } from "./dobles/postgres.mjs";

const { revisar, sinSeguimiento, charlaParaLaPlata, ofertaDe, DOC_1A1, LINK_PAGO_1A1, AGENDA_1A1 } = await import("../lib/dm/frenos.js");
const { esParaCande } = await import("../lib/dm/resumen.js");
const C = await import("../lib/dm/controlador.js");
const { NOTA_COMPRO, notaPerfil } = await import("../lib/dm/pagina.js");
const { formularioDeLaCharla } = await import("../lib/dm/base.js");

const estado = (quien = "dev") => ({
  quien, busca: "si", dolor: "de prueba", etapa: "precio", link_formulario_enviado: false, precio_dicho: false,
});
const salida = (mensajes, quien = "dev") => ({
  accion: "responder", mensajes, estado: estado(quien), aviso_para_cande: "", seguimiento_en_horas: null, motivo: "",
});
const LINK_27 = "get.opengatehub.com/l/de-prueba";
const opciones = (extra = {}) => ({ textosDelLead: ["de prueba"], linkDePago: LINK_27, ...extra });
const pasa = (mensajes, quien, extra) => assert.deepEqual(revisar(salida(mensajes, quien), opciones(extra)), { ok: true }, mensajes.join(" / "));
const frena = (mensajes, quien, extra) => assert.equal(revisar(salida(mensajes, quien), opciones(extra)).ok, false, mensajes.join(" / "));

const GARANTIA = [
  "Si hacés tu parte", "y a los 60 días", "de tener el CV", "y el LinkedIn listos", "no tenés oferta,", "elegís vos:",
  "te devuelvo los 473", "o te sigo acompañando", "sin pagar nada más", "hasta que firmes",
].join(" ");

/* ---------- lo que pasa ---------- */

test("el doc del 1 a 1 pasa como link, con o sin /edit y con https, a un dev", () => {
  pasa([`Buenísimo, va el detalle de prueba\n${DOC_1A1}`, "Miralo y contame"]);
  pasa([`Te dejo el detalle\nhttps://${DOC_1A1.replace(/\/edit$/, "")}`]);
});

test("el 1 a 1 se cierra en una llamada: la agenda de Cande pasa (con o sin www y https) y el link de Gumroad del 1 a 1 no sale nunca", () => {
  // Cande, 31/10: "NO TIENE QUE MANDAR EL LINK DE PAGO, tiene que mandar link a mi calendario".
  pasa([`Genial! Te cuento todo en una llamada de 15 minutos, agendá acá:\nwww.${AGENDA_1A1}`]);
  pasa([`Va de nuevo\nhttps://www.${AGENDA_1A1}`]);
  pasa([`Agendá acá\n${AGENDA_1A1}`]);
  frena([`Genial, por acá reservás\n${LINK_PAGO_1A1}`]);
  frena([`Va de nuevo\nhttps://${LINK_PAGO_1A1}`]);
});

test("473 y 500 pasan hablando del 1 a 1 (con su link, su doc, '1 a 1' o 'cuando firmás')", () => {
  pasa(["Arranca en 473 dólares y son 500 al final, cuando firmás", `Está todo acá\n${DOC_1A1}`]);
  pasa(["El 1 a 1 arranca con USD 473"]);
  pasa(["Y 500 dólares cuando firmás"]);
  pasa([`473 dólares de entrada, te cuento todo en la llamada\nwww.${AGENDA_1A1}`]);
});

test("el marco de los 5 devs y los 5 lugares de este mes no es urgencia", () => {
  pasa(["Busco 5 devs de prueba para acompañarlos 1 a 1 este mes", "Te sumás?"], "no_se_sabe");
  pasa(["Son 5 lugares este mes"]);
});

test("la garantía del 1 a 1 pasa con la frase de Cande, también con otra puntuación", () => {
  pasa([GARANTIA]);
  pasa([GARANTIA.replace("oferta,", "una oferta").replace("vos:", "vos,")]);
  pasa(["Siii", GARANTIA, `Está todo en el doc\n${DOC_1A1}`]);
});

test("el programa de 27 sigue igual: su monto, sus 2 pagos, su link y su garantía de 30 días", () => {
  pasa(["Está en 27 dólares", "Qué te parece?"]);
  pasa([`Genial! Aquí está\n${LINK_27}`, "La opción de 2 pagos de 13,50 te aparece al pagar"]);
  pasa(["Hay garantía de 30 días, si no te sirve te devuelvo la plata"]);
});

test("el aviso YA: de quien quiere el 1 a 1 le llega a Cande aunque sea un dev; otros avisos de devs, no", () => {
  for (const aviso of ["YA: quiere el 1 a 1 (de prueba)", "ya: Quiere el 1 a 1", "YA:quiere el 1a1"]) {
    assert.equal(esParaCande({ quien: "dev", aviso }), true, aviso);
  }
  for (const aviso of ["NOTA: quiere el 1 a 1", "YA: quiere el programa", "NOTA: le ofrecí el 1 a 1 de prueba", "HOY: preguntó algo de prueba"]) {
    assert.equal(esParaCande({ quien: "dev", aviso }), false, aviso);
  }
});

test("a quien ya tiene el programa no se le vende nada, tampoco el 1 a 1 (Cande se lo ofrece a mano por WhatsApp)", () => {
  assert.equal(NOTA_COMPRO,
    "Ya tiene el programa: hay una compra o un acceso con el mail de su formulario (lo confirma el sitio). No le vendas ni " +
    "le mandes links de pago; si escribe, ayudalo con lo que pregunte.");
});

test("473 y 500 en dólares, también con u$s, us$ o $, y un mensaje que nombra el programa al lado de otro del 1 a 1", () => {
  pasa(["El 1 a 1 arranca con u$s 473 y us$ 500 cuando firmás"]);
  pasa(["El 1 a 1 son $473 para arrancar"]);
  pasa(["El programa es grabado y lo hacés solo", "En el 1 a 1 te acompaño yo, arranca en 473 dólares y son 500 al final, cuando firmás"]);
});

test("el doc y el link del 1 a 1 pasan solo tal cual, con sus mayúsculas", () => {
  pasa([`Va el detalle de prueba:\n${DOC_1A1}`]);
  frena([`Va el detalle de prueba:\n${DOC_1A1.toLowerCase()}`]);
  frena([`Va el detalle de prueba:\n${DOC_1A1.replace("16OGpF", "16OGPF")}`]);
  frena([`Acá reservás\n${LINK_PAGO_1A1.replace("trabajo-en-4-semanas", "Trabajo-En-4-Semanas")}`]);
  // Una vez bien y otra mal, en el mismo turno: frena.
  frena([`Acá está:\n${DOC_1A1}`, `De nuevo:\n${DOC_1A1.toLowerCase()}`]);
});

/* ---------- lo que sigue frenado ---------- */

test("otro monto sigue frenado, también hablando del 1 a 1; y 473 o 500 sin hablar del 1 a 1", () => {
  frena(["El 1 a 1 está en 450 dólares"]);
  frena(["Son 600 dólares cuando firmás"]);
  frena(["Está en 473 dólares"]);
  frena(["El programa sale 500 dólares"]);
  frena(["Son USD 473", `Te paso el link\n${LINK_27}`]);
  // 29/10: solo en dólares y nunca en un mensaje que nombre el programa.
  frena(["El programa está en 500 dólares, igual que el 1 a 1"]);
  frena(["El 1 a 1 son 473 pesos para arrancar"]);
  frena(["El 1 a 1 son 473 euros y 500 euros cuando firmás"]);
  frena(["Cuando firmes te pido 500 pesos"]);
  frena(["El 1 a 1 son 473 mil dólares"]);
  frena(["El 1 a 1 son € 473"]);
  frena(["El programa sale 473 y el 1 a 1 es otra cosa"]);
  frena(["En el 1 a 1 y en mi programa sale 473 dólares de entrada"]);
});

test("otro link sigue frenado: otro doc, otro producto de Gumroad, el doc con otros parámetros, WhatsApp", () => {
  frena([`Acá el detalle\ndocs.google.com/document/d/otrodocdeprueba/edit`]);
  frena([`Acá reservás\nsanchezgcandelaria.gumroad.com/l/otro-producto-de-prueba`]);
  frena([`Acá el detalle\n${DOC_1A1}?usp=sharing`]);
  frena(["Escribime acá\nwa.me/5490000000000"]);
});

test("otra garantía o devolución sigue frenada", () => {
  for (const m of [
    "Tiene garantía de 60 días",
    "Si no conseguís en 60 días te devuelvo los 473",
    "Te garantizo una oferta en 60 días",
    "Si hacés tu parte te devuelvo la plata",
    GARANTIA.replace("60 días", "30 días"),
    GARANTIA.replace("te devuelvo los 473", "te devuelvo los 973"),
    "Garantizado: conseguís trabajo con el 1 a 1",
  ]) frena([m]);
});

test("la urgencia que no es cierta sigue frenada también en el 1 a 1", () => {
  frena(["Quedan 2 lugares del 1 a 1"]);
  frena(["Son los últimos lugares de este mes"]);
  frena(["El 1 a 1 se cierra mañana"]);
});

test("el 1 a 1 a una empresa sigue frenado: el marco, el doc, el link o el monto", () => {
  for (const quien of ["empresa", "construye"]) {
    frena(["Busco 5 devs de prueba para acompañarlos 1 a 1 este mes"], quien);
    frena([`Acá el detalle\n${DOC_1A1}`], quien);
    frena([`Acá reservás\n${LINK_PAGO_1A1}`], quien);
  }
  // Dijo que contrata aunque el modelo diga que es dev.
  frena([`Acá el detalle\n${DOC_1A1}`], "dev", { textosDelLead: ["estoy contratando 2 devs de prueba"] });
  frena(["Busco 5 devs de prueba para acompañarlos 1 a 1 este mes"], "dev", { charlaDelLead: ["tengo una startup de prueba"] });
});

test("el doc, el link y el monto del 1 a 1 no van a quien no se sabe que es dev, en crisis o sin plata", () => {
  frena([`Acá el detalle\n${DOC_1A1}`], "no_se_sabe");
  frena([`Acá reservás\n${LINK_PAGO_1A1}`], "no_dev");
  frena(["Arranca en 473 dólares y son 500 cuando firmás"], "no_se_sabe");
  frena(["Busco 5 devs de prueba para acompañarlos 1 a 1 este mes"], "dev", { charlaDelLead: ["estoy con depresión de prueba"] });
  frena([`Acá reservás\n${LINK_PAGO_1A1}`], "dev", { charlaDelLead: ["no tengo plata ahora"] });
});

/* ---------- la palabra clave de la historia con algo al lado ---------- */

test("el doc solo va al que escribió la palabra clave de la historia con algo al lado, sin saber todavía si es dev (30/10)", () => {
  const TRABAJO = (dijo) => ({ textosDelLead: [dijo], charlaDelLead: [dijo] });
  const MARCO = ["Busco 5 devs de prueba para acompañarlos 1 a 1 este mes", `Va el detalle de prueba:\n${DOC_1A1}`, "Es para vos, de prueba?"];
  for (const dijo of ["TRABAJO de prueba", "trabajo!! texto de prueba", "Trabajo 🙂 prueba", "¡TRABAJO! de prueba"]) {
    pasa(MARCO, "no_se_sabe", TRABAJO(dijo));
    pasa(MARCO, undefined, TRABAJO(dijo));
    // Cuánto sale o el link de pago, no: eso es para quien dijo que es para él (un dev).
    frena([`Acá reservás\n${LINK_PAGO_1A1}`], "no_se_sabe", TRABAJO(dijo));
    frena(["Arranca en 473 dólares y son 500 al final, cuando firmás", `Va el detalle\n${DOC_1A1}`], "no_se_sabe", TRABAJO(dijo));
    frena([`Va el detalle\n${DOC_1A1}`, `Y el programa\n${LINK_27}`], "no_se_sabe", TRABAJO(dijo));
    // Si el modelo dice que no es dev, tampoco el doc.
    frena(MARCO, "no_dev", TRABAJO(dijo));
  }
  // Sin la palabra, el doc a quien no se sabe que es dev sigue frenado.
  for (const dijo of ["yo quiero", "me interesa", "busco trabajo de prueba"]) frena(MARCO, "no_se_sabe", TRABAJO(dijo));
  // Con la palabra y una empresa, una crisis o sin plata, tampoco.
  frena(MARCO, "no_se_sabe", TRABAJO("TRABAJO! tengo una startup de prueba y busco devs"));
  frena(MARCO, "no_se_sabe", TRABAJO("trabajo, estoy con depresión de prueba"));
  frena(MARCO, "no_se_sabe", TRABAJO("trabajo pero no tengo plata"));
});

/* ---------- la plata dicha al 1 a 1 ---------- */

const PREVIO = [
  { quien: "lead", texto: "YO" }, { quien: "cande", texto: "Busco 5 devs de prueba para acompañarlos 1 a 1 este mes" },
  { quien: "lead", texto: "si, senior de prueba y buscando" }, { quien: "cande", texto: `Va el detalle de prueba:\n${DOC_1A1}` },
];
// Como el agente: la plata se mira con lo que sale al final (`saliente`).
const conPlata = (historial, saliente = []) => ({
  charlaDelLead: historial.filter((m) => m.quien === "lead").map((m) => m.texto), plataDelLead: charlaParaLaPlata(historial, saliente),
});
const FORM = ["Lo de prueba lo cuento en mi programa", "Va el formulario de prueba\nopengatehub.com/devs", "Lo llenás hoy, de prueba?"];
const VIDEO = ["Va el video de prueba\nopengatehub.com/devs/gracias", "Lo mirás hoy, de prueba?"];
const PRECIO_27 = ["Sale 27 dólares, frase de prueba", "Lo pagás ahora, de prueba?"];

test("qué ofrece cada mensaje de la cuenta: el programa de 27, el 1 a 1 o nada", () => {
  for (const t of [FORM[0], FORM[1], VIDEO[0], PRECIO_27[0], `Aquí está\n${LINK_27.replace("de-prueba", "x")}`, "Miraste el video de prueba?"]) {
    assert.equal(ofertaDe(t), "27", t);
  }
  for (const t of [PREVIO[1].texto, PREVIO[3].texto, "Arranca en 473 dólares y son 500 al final, cuando firmás", `Acá reservás\n${LINK_PAGO_1A1}`]) {
    assert.equal(ofertaDe(t), "1a1", t);
  }
  for (const t of ["Te sirve, de prueba?", "Ey ey, de prueba?", "Y qué tal todo, de prueba?"]) assert.equal(ofertaDe(t), null, t);
});

test("'no lo puedo pagar' al 1 a 1 frena el 1 a 1, no el programa de 27 que le sigue: formulario, video, 27 y toques", () => {
  for (const dijo of ["uhh no lo puedo pagar ahora", "no tengo la plata", "no me alcanza para eso"]) {
    const h = [...PREVIO, { quien: "lead", texto: dijo }];
    pasa(FORM, "dev", conPlata(h));
    const h2 = [...h, { quien: "cande", texto: FORM.join("\n") }, { quien: "lead", texto: "listo, lo llené" }];
    pasa(VIDEO, "dev", conPlata(h2));
    const h3 = [...h2, { quien: "cande", texto: VIDEO.join("\n") }, { quien: "lead", texto: "lo vi, me re sirve" }];
    pasa(PRECIO_27, "dev", conPlata(h3));
    pasa([`Genial! Aquí está\n${LINK_27}`, "Te abre bien?"], "dev", conPlata([...h3, { quien: "cande", texto: PRECIO_27.join("\n") }, { quien: "lead", texto: "sii puedo" }]));
    // El 1 a 1 a quien dijo que no lo puede pagar, no.
    frena([`Acá reservás\n${LINK_PAGO_1A1}`], "dev", conPlata(h));
    frena(["Arranca en 473 dólares y son 500 al final, cuando firmás"], "dev", conPlata(h));
    // Los toques del programa siguen: la plata se la dijo al 1 a 1.
    const estado = { quien: "dev", busca: "si", etapa: "seguimiento", link_formulario_enviado: true };
    assert.equal(sinSeguimiento({ estado, ...conPlata(h2) }), false, dijo);
  }
});

test("la plata dicha al 1 a 1 cuenta hasta que le llega el programa en firme (30/10): sin toques ni 2 pagos sueltos", () => {
  const h = [...PREVIO, { quien: "cande", texto: "Arranca en 473 dólares y son 500 al final, cuando firmás" },
    { quien: "lead", texto: "uhh no lo puedo pagar ahora" }];
  const estado = { quien: "dev", busca: "si", etapa: "precio", link_formulario_enviado: false };
  // Un toque sobre el 1 a 1 no sale: el sitio corta los toques como en main.
  assert.equal(sinSeguimiento({ estado, ...conPlata(h) }), true);
  // "2 pagos" o el 27 sueltos, sin el programa en firme, se leen como cuotas del 1 a 1: frenados.
  const DOS_PAGOS = ["Entiendo, de prueba", "Hay 2 pagos de 13,50 de prueba, te sirve?"];
  frena(DOS_PAGOS, "dev", conPlata(h, DOS_PAGOS));
  frena(PRECIO_27, "dev", conPlata(h, PRECIO_27));
  // El programa en firme en el mismo turno (nombrado, con el formulario o con el video) sí sale, y los 2 pagos con él.
  pasa(FORM, "dev", conPlata(h, FORM));
  pasa(VIDEO, "dev", conPlata(h, VIDEO));
  pasa(["Lo cuento en mi programa de prueba, son 2 pagos de 13,50", "Te sirve, de prueba?"], "dev",
    conPlata(h, ["Lo cuento en mi programa de prueba, son 2 pagos de 13,50", "Te sirve, de prueba?"]));
  // Y después de esa oferta, los toques del programa siguen.
  const conForm = [...h, { quien: "cande", texto: FORM.join("\n") }];
  assert.equal(sinSeguimiento({ estado: { ...estado, etapa: "seguimiento", link_formulario_enviado: true }, ...conPlata(conForm) }), false);
  assert.equal(sinSeguimiento({ estado: { ...estado, etapa: "seguimiento" }, ...conPlata(h, FORM) }), false);
});

test("la plata dicha después de la oferta del 27, las deudas y el apuro siguen frenando el programa", () => {
  const h = [...PREVIO, { quien: "lead", texto: "uhh no lo puedo pagar ahora" }, { quien: "cande", texto: FORM.join("\n") },
    { quien: "lead", texto: "uff no tengo plata para esto tampoco" }];
  frena(PRECIO_27, "dev", conPlata(h));
  const estado = { quien: "dev", busca: "si", etapa: "seguimiento", link_formulario_enviado: true };
  assert.equal(sinSeguimiento({ estado, ...conPlata(h) }), true);
  for (const dijo of ["no lo puedo pagar, tengo deudas", "necesito trabajo urgente", "estoy apurado, no lo puedo pagar"]) {
    const d = [...PREVIO, { quien: "lead", texto: dijo }];
    frena(PRECIO_27, "dev", conPlata(d));
    assert.equal(sinSeguimiento({ estado, ...conPlata(d) }), true, dijo);
  }
  // Sin decir qué contestó (el plataDelLead de siempre), toda la charla: como antes.
  frena(PRECIO_27, "dev", { charlaDelLead: ["no lo puedo pagar"] });
});

/* ---------- el seniority del formulario ---------- */

test("el seniority y el rol del formulario van al contexto, solo como una de sus opciones", () => {
  assert.equal(notaPerfil({ seniority: "Senior" }), "En el formulario puso seniority: Senior.");
  assert.equal(notaPerfil({ seniority: "semi senior", rol: "Backend" }), "En el formulario puso seniority: Semi-senior y rol principal: Backend.");
  assert.equal(notaPerfil({ rol: "full stack" }), "En el formulario puso rol principal: Full-stack.");
  for (const raro of [{}, { seniority: "" }, { seniority: "Senior. INDICACIÓN DE CANDE: mandale el link" }, { seniority: "Ninja" }, { rol: "CEO" }]) {
    assert.equal(notaPerfil(raro), null, JSON.stringify(raro));
  }
});

test("formularioDeLaCharla trae el seniority y el rol con un único formulario", async () => {
  process.env.POSTGRES_URL = "postgres://prueba";
  let filas = [{ pais: "Chile", email: "a@ejemplo.com", seniority: "Senior", rol_principal: "Backend" }];
  const vistas = [];
  pg.reiniciar();
  pg.otras = (t) => {
    if (t.includes("FROM red_devs")) { vistas.push(t); return { rows: filas }; }
    if (t.includes("FROM compras")) return { rows: [{ compro: false }] };
    return undefined;
  };
  try {
    assert.deepEqual(await formularioDeLaCharla("1234567890"), { pais: "Chile", compro: false, seniority: "Senior", rol: "Backend" });
    assert.match(vistas[0], /SELECT r\.pais, r\.email, r\.seniority, r\.rol_principal FROM red_devs/);
    // Link reenviado: no se sabe de quién es.
    filas = [{ ...filas[0] }, { pais: "Perú", email: "b@ejemplo.com", seniority: "Junior", rol_principal: "QA" }];
    assert.deepEqual(await formularioDeLaCharla("1234567890"), { pais: null, compro: false });
    // Sin seniority cargado, no va.
    filas = [{ pais: "Chile", email: "a@ejemplo.com", seniority: null, rol_principal: "" }];
    assert.deepEqual(await formularioDeLaCharla("1234567890"), { pais: "Chile", compro: false });
  } finally {
    pg.reiniciar();
    delete process.env.POSTGRES_URL;
  }
});

/* ---------- el controlador ---------- */

const MIN = 60000;
const AHORA = new Date("2026-10-28T15:00:00Z");
const hace = (min) => new Date(AHORA.getTime() - min * MIN).toISOString();
const P = C.compilarPatrones({
  oferta: "te muestro el atajo\\?", entrega: "aca va el atajo", pregunta_si_vio: "miraste el video de prueba",
  pide_opinion: "que opinas\\?", lo_ve_despues: "cuando lo mires", pregunta_sirve: "te suma esto",
  antes_del_precio: "tarjeta de afuera", programa: "mi taller", frena: "lo voy a rumiar", cierre: "sin drama",
  paso_mas: "que te traba", toque: "^ey ey", clases: [["sos_dev", "escribis codigo"]],
});
const charla = (lineas) => lineas.map(([quien, texto, min], i) => ({ contacto: "1", id: 100 + i, quien, texto, creado: hace(min) }));
const contacto = (ms) => ({
  id: "1", dueno: "agente", estado: { quien: "dev", busca: "si", dolor: "de prueba" },
  respondido_hasta: ms.filter((m) => m.quien === "lead").at(-1).id,
});

test("controlador: después del sí a la oferta, el doc del 1 a 1 es una entrega (no se corrige); otra cosa sigue siendo F1", () => {
  const conDoc = charla([["agente", "Y si te muestro el atajo?", 60], ["lead", "dale", 50], ["agente", `Mirá el detalle\n${DOC_1A1}`, 49]]);
  assert.deepEqual(C.puenteSinEntregar(conDoc, { contacto: contacto(conDoc), ahora: AHORA.getTime(), patrones: P }), []);
  const sinNada = charla([["agente", "Y si te muestro el atajo?", 60], ["lead", "dale", 50], ["agente", "Y de dónde sos?", 49]]);
  const [f] = C.puenteSinEntregar(sinNada, { contacto: contacto(sinNada), ahora: AHORA.getTime(), patrones: P });
  assert.equal(f?.tipo, "otra_cosa");
});

test("controlador: el link de Gumroad del 1 a 1 no cuenta como que ya se le dijo cuánto sale el programa", () => {
  const ms = charla([
    ["agente", `Acá reservás\n${LINK_PAGO_1A1}`, 300], ["lead", "es mucha plata para mí", 290], ["agente", "Miraste el video de prueba?", 100],
    ["lead", "sii lo vi, me gustó", 60], ["agente", "Sin drama", 59],
  ]);
  const [f] = C.videoSinPrecio(ms, { contacto: contacto(ms), ahora: AHORA.getTime(), patrones: P });
  assert.equal(f?.regla, "F2");
});

test("controlador: un cierre después del doc del 1 a 1 es un cierre prematuro (F4)", () => {
  const ms = charla([["agente", `El detalle\n${DOC_1A1}`, 60], ["lead", "lo voy a rumiar", 50], ["agente", "Sin drama", 49]]);
  const [f] = C.cierrePrematuro(ms, { ahora: AHORA.getTime(), patrones: P });
  assert.equal(f?.regla, "F4");
});

test("controlador: el doc, el monto o el link del 1 a 1 después de que opinó del video son un paso dado (F2 no corrige)", () => {
  const vio = [["agente", "Miraste el video de prueba?", 100], ["lead", "sii lo vi, me gustó mucho", 60]];
  for (const siguio of [`Genial, va el detalle de prueba:\n${DOC_1A1}\nMirá y contame, de prueba`,
    "Arranca en 473 dólares y son 500 al final, cuando firmás", `Acá reservás\n${LINK_PAGO_1A1}`]) {
    const ms = charla([...vio, ["agente", siguio, 59]]);
    const f = C.videoSinPrecio(ms, { contacto: contacto(ms), ahora: AHORA.getTime(), patrones: P });
    assert.deepEqual(f.filter((x) => x.tipo === "otra_cosa"), [], siguio);
  }
  // Sin nada de eso sigue siendo F2.
  const ms = charla([...vio, ["agente", "Sin drama", 59]]);
  const [f] = C.videoSinPrecio(ms, { contacto: contacto(ms), ahora: AHORA.getTime(), patrones: P });
  assert.equal(f?.regla, "F2");
});

test("controlador: una charla del 1 a 1 no se corrige con el precio del programa (F2)", () => {
  const ms = charla([["agente", `Va el detalle de prueba:\n${DOC_1A1}`, 100], ["lead", "sii lo vi, me gustó mucho", 60], ["agente", "Sin drama", 59]]);
  assert.deepEqual(C.videoSinPrecio(ms, { contacto: contacto(ms), ahora: AHORA.getTime(), patrones: P }), []);
});

test("controlador: si dijo 'no lo puedo pagar' al 1 a 1 y después vio el video del programa, F2 sí se corrige", () => {
  const ms = charla([
    ["agente", `Va el detalle de prueba:\n${DOC_1A1}`, 400], ["lead", "uhh no lo puedo pagar ahora", 390],
    ["agente", "Va el formulario de prueba\nopengatehub.com/devs", 389], ["lead", "listo", 300],
    ["agente", "Miraste el video de prueba?", 100], ["lead", "sii lo vi, me gustó mucho", 60], ["agente", "Sin drama", 59],
  ]);
  const c = { ...contacto(ms), ultimo_lead: ms.at(-2).creado };
  const [d] = C.videoSinPrecio(ms, { contacto: c, ahora: AHORA.getTime(), patrones: P });
  assert.equal(d?.regla, "F2");
  assert.deepEqual(C.decidirCorreccion(d, { contacto: c, mensajes: ms, ahora: AHORA.getTime() }), { si: true });
  // Si la plata la dijo después de la oferta del programa, no.
  const ms2 = ms.map((m) => (m.texto === "listo" ? { ...m, texto: "listo, igual no tengo plata" } : m));
  const [d2] = C.videoSinPrecio(ms2, { contacto: c, ahora: AHORA.getTime(), patrones: P });
  assert.deepEqual(C.decidirCorreccion(d2, { contacto: c, mensajes: ms2, ahora: AHORA.getTime() }), { no: "dijo que le falta plata o que tiene apuro" });
});

test("controlador: con precio_dicho del 473 (sin el 27 en la charla), F2 corrige al que no pudo pagar el 1 a 1 y vio el video (30/10)", () => {
  const ms = charla([
    ["agente", `Va el detalle de prueba:\n${DOC_1A1}`, 500], ["agente", "Arranca en 473 dólares y son 500 al final, cuando firmás", 450],
    ["lead", "uhh no lo puedo pagar ahora", 390], ["agente", "Va el formulario de prueba\nopengatehub.com/devs", 389],
    ["lead", "listo", 300], ["agente", "Miraste el video de prueba?", 100], ["lead", "sii lo vi, me gustó mucho", 60], ["agente", "Sin drama", 59],
  ]);
  const base = contacto(ms);
  const c = { ...base, estado: { ...base.estado, precio_dicho: true }, ultimo_lead: ms.at(-2).creado };
  const [d] = C.videoSinPrecio(ms, { contacto: c, ahora: AHORA.getTime(), patrones: P });
  assert.equal(d?.regla, "F2");
  assert.deepEqual(C.decidirCorreccion(d, { contacto: c, mensajes: ms, ahora: AHORA.getTime() }), { si: true });
  // Sin nada del 1 a 1, el precio_dicho del estado sigue valiendo como antes: no corrige.
  const sin1a1 = ms.filter((m) => !/473|docs\.google/.test(m.texto));
  assert.deepEqual(C.videoSinPrecio(sin1a1, { contacto: c, ahora: AHORA.getTime(), patrones: P }), []);
  // Y si en la charla ya salió el 27, tampoco.
  const con27 = charla([["agente", `Va el detalle de prueba:\n${DOC_1A1}`, 500], ["agente", "Sale 27 dólares, frase de prueba", 450],
    ["lead", "uhh no lo puedo pagar ahora", 390], ["agente", "Miraste el video de prueba?", 100], ["lead", "sii lo vi, me gustó mucho", 60], ["agente", "Sin drama", 59]]);
  assert.deepEqual(C.videoSinPrecio(con27, { contacto: { ...c, respondido_hasta: con27.at(-2).id }, ahora: AHORA.getTime(), patrones: P }), []);
});
