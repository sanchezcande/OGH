// El 1 a 1 de Cande (28/10): el agente se lo puede ofrecer a seniors y semi seniors que buscan trabajo. Los frenos del
// sitio dejan pasar exactamente lo suyo (su doc, su link de Gumroad, 473 y 500 hablando del 1 a 1 y su garantía con la
// frase de Cande) y nada más: otro monto, otro link, otra garantía o el 1 a 1 a una empresa siguen frenados. El aviso "YA:
// quiere el 1 a 1" le suena a Cande sin pasarle la charla, y el controlador no toma el doc como una entrega que falta.
//
// Los textos de los leads y de la cuenta son inventados para la prueba (este repo es público): solo el doc, el link y
// la frase de la garantía son los de verdad, porque eso es lo que se deja pasar tal cual. La frase va armada por tramos,
// como en lib/dm/frenos.js.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { revisar, DOC_1A1, LINK_PAGO_1A1 } = await import("../lib/dm/frenos.js");
const { esParaCande } = await import("../lib/dm/resumen.js");
const C = await import("../lib/dm/controlador.js");
const { NOTA_COMPRO } = await import("../lib/dm/pagina.js");

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

test("el link de Gumroad del 1 a 1 pasa a un dev, con o sin https", () => {
  pasa([`Genial, por acá reservás\n${LINK_PAGO_1A1}`]);
  pasa([`Va de nuevo\nhttps://${LINK_PAGO_1A1}`]);
});

test("473 y 500 pasan hablando del 1 a 1 (con su link, su doc, '1 a 1' o 'cuando firmás')", () => {
  pasa(["Arranca en 473 dólares y son 500 al final, cuando firmás", `Está todo acá\n${DOC_1A1}`]);
  pasa(["El 1 a 1 arranca con USD 473"]);
  pasa(["Y 500 dólares cuando firmás"]);
  pasa([`473 dólares de entrada\n${LINK_PAGO_1A1}`]);
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

test("a quien ya tiene el programa, el contexto le prohíbe vender el programa y su link, no el 1 a 1", () => {
  assert.match(NOTA_COMPRO, /Ya tiene el programa/);
  assert.match(NOTA_COMPRO, /No le vendas el programa ni le mandes su link de pago/);
  assert.doesNotMatch(NOTA_COMPRO, /No le vendas ni le mandes links de pago/);
});

/* ---------- lo que sigue frenado ---------- */

test("otro monto sigue frenado, también hablando del 1 a 1; y 473 o 500 sin hablar del 1 a 1", () => {
  frena(["El 1 a 1 está en 450 dólares"]);
  frena(["Son 600 dólares cuando firmás"]);
  frena(["Está en 473 dólares"]);
  frena(["El programa sale 500 dólares"]);
  frena(["Son USD 473", `Te paso el link\n${LINK_27}`]);
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
