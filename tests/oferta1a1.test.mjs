// La oferta del 1 a 1 por mail (lib/oferta1a1.js), corrida de punta a punta por el cron de la
// cadena de developers (pages/api/drip.js) contra el Resend y la base de mentira de tests/dobles.
//
// Lo que tiene que atajar es por qué existe: el 02/11 WhatsApp restringió la cuenta de Cande por
// mandarle la misma oferta a 530 números que nunca le habían escrito. Por mail el riesgo no es un
// bloqueo, es mandarle dos veces a la misma persona, mandársela a quien ya la compró, o quemar el
// cupo de la cadena de todos los días. Eso es lo que se mira acá.
import { avisos, registros } from "./dobles/preparar.mjs";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { aceptado, rechazo, resendFalso } from "./dobles/resend.mjs";
import { base, hace } from "./dobles/postgres.mjs";
import { respuesta } from "./dobles/preparar.mjs";

const { default: drip } = await import("../pages/api/drip.js");
const { AGENDA, POR_CORRIDA, TOQUE, primerNombre } = await import("../lib/oferta1a1.js");

/** Un dev de la lista. Por defecto con el inglés que entra a la campaña. */
const dev = (id, { ingles = "Fluido", dias = 30, nombre = `Dev ${id}`, ...resto } = {}) => ({
  id, nombre, email: `dev${id}@example.com`, origen: "formulario",
  creado: hace(dias), drip_off: false, ingles,
  // Ya recibió toda la cadena de developers: así la corrida solo tiene para mandarle esto.
  drip_d1: hace(dias - 1), drip_d2: hace(dias - 2), drip_d3: hace(dias - 3),
  drip_d7: hace(dias - 7), drip_d12: hace(dias - 12), drip_d17: hace(dias - 17),
  ...resto,
});
const mail = (id) => `dev${id}@example.com`;

/** A quiénes les quedó anotada la oferta. */
const anotados = () => (base.tablas.red_devs || []).filter((f) => f.mail_1a1).map((f) => f.email).sort();
/** Los mails que salieron de esta campaña (el asunto la distingue de la cadena). */
const salidos = () => resendFalso.pedidos.filter((m) => m.subject === TOQUE.asunto());

async function correr() {
  const res = respuesta();
  await drip({ method: "GET", headers: {} }, res);
  assert.equal(res.codigo, 200);
  return res.cuerpo;
}

beforeEach(() => {
  base.reiniciar();
  resendFalso.reiniciar();
  avisos.length = 0;
  registros.length = 0;
});

test("al de inglés fluido le llega, y una sola vez", async () => {
  base.reiniciar({ red_devs: [dev(1), dev(2)] });
  const r = await correr();

  assert.deepEqual(anotados(), [mail(1), mail(2)]);
  assert.equal(r.oferta1a1.enviados.mail_1a1, 2);
  assert.equal(avisos.length, 0);

  // Segunda corrida: ya lo recibieron, no sale nada.
  resendFalso.reiniciar();
  const r2 = await correr();
  assert.equal(salidos().length, 0);
  assert.equal(r2.oferta1a1.enviados.mail_1a1, 0);
});

test("al que no tiene inglés fluido no le llega", async () => {
  base.reiniciar({ red_devs: [dev(1, { ingles: "Conversacional" }), dev(2, { ingles: "Básico" }), dev(3, { ingles: null })] });
  await correr();
  assert.deepEqual(anotados(), [], "el 1 a 1 no les resuelve lo primero que los frena");
  assert.equal(salidos().length, 0);
});

test("al que ya compró el 1 a 1 no se le ofrece de nuevo", async () => {
  base.reiniciar({
    red_devs: [dev(1), dev(2)],
    compras: [{ email: "DEV1@Example.com", producto: "Conseguí trabajo de dev en 4 semanas" }],
  });
  await correr();
  assert.deepEqual(anotados(), [mail(2)], "el mail se compara sin distinguir mayúsculas");
});

test("el que compró el curso de 27 sí la recibe", async () => {
  base.reiniciar({
    red_devs: [dev(1)],
    compras: [{ email: mail(1), producto: "Acelerador de Carrera Tech" }],
  });
  await correr();
  assert.deepEqual(anotados(), [mail(1)], "haber comprado la guía es una razón para ofrecerle el 1 a 1, no para saltearlo");
});

test("al que se dio de baja de los mails no le llega", async () => {
  base.reiniciar({ red_devs: [dev(1, { drip_off: true }), dev(2)] });
  await correr();
  assert.deepEqual(anotados(), [mail(2)]);
});

test("el que se anotó hoy espera un día, para no pisar el mail de bienvenida", async () => {
  base.reiniciar({ red_devs: [dev(1, { dias: 0.5 }), dev(2, { dias: 2 })] });
  await correr();
  assert.deepEqual(anotados(), [mail(2)]);
});

test("el mail manda a la agenda, nunca al pago, y no dice el precio", async () => {
  base.reiniciar({ red_devs: [dev(1)] });
  await correr();
  const m = salidos()[0];

  assert.match(m.text, new RegExp(AGENDA.replace(/\./g, "\\.")));
  // Cande, 31/10: "NO TIENE QUE MANDAR EL LINK DE PAGO, tiene que mandar link a mi calendario".
  assert.doesNotMatch(m.text, /gumroad|pagar-pesos/i);
  // El precio pegado arriba espanta antes de que entienda qué es: se dice en la llamada.
  assert.doesNotMatch(m.text, /473|500|d[óo]lares|USD/i);
  // Y nunca se promete trabajo: es publicidad engañosa y además no es verdad.
  assert.doesNotMatch(m.text, /te consigo|garantiz|asegur/i);
  for (const campo of ["from", "to", "replyTo", "subject", "text", "html"]) {
    assert.equal(typeof m[campo], "string", campo);
  }
});

test("el texto respeta cómo escribe ella", async () => {
  base.reiniciar({ red_devs: [dev(1)] });
  await correr();
  const m = salidos()[0];
  const todo = m.subject + " " + m.text;

  assert.doesNotMatch(todo, /—/, "nunca guion largo");
  assert.doesNotMatch(todo, /[¿¡]/, "nunca signos de apertura");
  assert.doesNotMatch(todo, /\blaburo\b/i, "a los devs de LATAM se les dice trabajo");
});

test("usa el primer nombre, y sin nombre la frase sigue entrando", async () => {
  assert.equal(primerNombre("Juan Pérez García"), "Juan");
  assert.equal(primerNombre(null), "");
  assert.match(TOQUE.cuerpo("Juan"), /^Juan, pregunta corta/);
  assert.match(TOQUE.cuerpo(""), /^Pregunta corta/);
});

test("si se acaba el cupo, lo que no salió no queda anotado y sale en la corrida siguiente", async () => {
  base.reiniciar({ red_devs: [dev(1), dev(2), dev(3)] });
  resendFalso.responder = (m, n) => (n <= 1 ? aceptado(n) : rechazo("daily_quota_exceeded"));
  const r = await correr();

  assert.deepEqual(anotados(), [...resendFalso.aceptados].sort());
  assert.equal(r.oferta1a1.cortado, "cupo");
  assert.equal(avisos.length, 1, "un solo aviso, no uno por mail rechazado");

  // Al día siguiente, con cupo, salen los que faltaban.
  resendFalso.reiniciar();
  await correr();
  assert.deepEqual(anotados(), [mail(1), mail(2), mail(3)]);
});

test("la cadena de todos los días se manda primero: el cupo es de ella", async () => {
  // Uno nuevo, que tiene pendiente el primer toque de la cadena, y uno viejo esperando la oferta.
  const nuevo = { id: 9, nombre: "Nuevo", email: mail(9), origen: "formulario", creado: hace(2), drip_off: false, ingles: "Fluido" };
  base.reiniciar({ red_devs: [nuevo, dev(1)] });
  await correr();

  assert.equal(resendFalso.pedidos[0].to, mail(9));
  assert.notEqual(resendFalso.pedidos[0].subject, TOQUE.asunto(), "el primero es el de la cadena");
  // Y nadie recibe dos mails en la misma corrida.
  assert.equal(resendFalso.pedidos.filter((m) => m.to === mail(9)).length, 1);
});

test("entran de a 120 por corrida", () => {
  assert.equal(POR_CORRIDA, 120);
});
