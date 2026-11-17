// La política de avisos del agente de DM (lib/dm/avisos.js): qué le suena a Cande en Telegram al momento y qué espera
// el resumen de las notas. 17/11, Cande: "el chat de mensajes debería ser únicamente para gente que tiene empresas y
// que puede llegar a ser mi clienta", "me estás mandando cosas muy raras que no sabes cómo contestar", "este chat se
// llena y al final no leo nada porque tengo 8.000 mensajes innecesarios".
//
// Todos los textos de este archivo son inventados para la prueba. Este repo es público: acá no va ninguna frase de una
// charla real ni del prompt del agente.
//
// Lo que estas pruebas NO cubren: las consultas de lib/dm/base.js (perfilDeLaRed y avisosDeLaCharla). Antes de subir un
// cambio se prueban a mano contra un Postgres de verdad: que perfilDeLaRed traiga el seniority de quien llenó el
// formulario con el link de su charla y null si ese link lo usaron dos mails, y que avisosDeLaCharla traiga los avisos
// de las últimas 12 horas sin las frenadas ni lo descartado.
// Cómo pega la política en cada aviso del agente (el pase, la foto, el del modelo, el del pago) está en
// tests/dm.test.mjs y tests/dmComprobante.test.mjs, con el agente entero.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const {
  ACCION_AVISO, ESTADO_CALLADO, HORAS_REPETIDO, POR_EL_AGENTE, POR_EL_LEAD,
  avisoAlMomento, claveDeAviso, esBienPosicionado, esInevitable, notaDeLoCallado, puedeSerCliente,
} = await import("../lib/dm/avisos.js");
const { crearResumen } = await import("../lib/dm/resumen.js");
const { MOTIVO_SENAL_EMPRESA } = await import("../lib/dm/frenos.js");

const dev = { quien: "dev", busca: "si" };
const sale = (datos, que) => assert.deepEqual(avisoAlMomento(datos), { sale: true, porque: "" }, `tenía que sonar: ${que}`);
const calla = (datos, que) => {
  const r = avisoAlMomento(datos);
  assert.equal(r.sale, false, `no tenía que sonar: ${que}`);
  assert.ok(r.porque, "lo callado siempre dice por qué");
  return r.porque;
};

test("puede ser clienta: quien contrata, quien ya movió plata, quien ya recibió una oferta y el dev que busca", () => {
  assert.equal(puedeSerCliente({ estado: { quien: "empresa" } }), true);
  assert.equal(puedeSerCliente({ estado: { quien: "construye" } }), true);
  assert.equal(puedeSerCliente({ estado: dev }), true);
  assert.equal(puedeSerCliente({ estado: { quien: "dev", busca: "abierto" } }), true);
  assert.equal(puedeSerCliente({ estado: { quien: "estudia", busca: "si" } }), true);
  // Una señal de empresa en lo que escribió, aunque el modelo todavía no sepa quién es.
  assert.equal(puedeSerCliente({ charlaDelLead: ["hola, soy la founder de una consultora"] }), true);
  assert.equal(puedeSerCliente({ charlaDelLead: ["busco 2 devs para mi equipo"] }), true);
  // Plata que ya se movió: es clienta.
  assert.equal(puedeSerCliente({ estado: { quien: "no_se_sabe" }, charlaDelLead: ["ya pague, te mando el comprobante"] }), true);
  // La cuenta ya le ofreció el programa o el 1 a 1: el agente la trató como lead.
  assert.equal(puedeSerCliente({ estado: { quien: "no_se_sabe" }, oferta: true }), true);
});

test("no puede ser clienta: un saludo suelto, una reacción, quien no es dev y el dev que no dijo que busca", () => {
  assert.equal(puedeSerCliente({ estado: { quien: "no_se_sabe" }, charlaDelLead: ["hola!"] }), false);
  assert.equal(puedeSerCliente({ estado: { quien: "no_dev", busca: "no" }, charlaDelLead: ["que linda foto 😍"] }), false);
  assert.equal(puedeSerCliente({ estado: { quien: "dev", busca: "no" }, charlaDelLead: ["jaja buenisimo el reel"] }), false);
  assert.equal(puedeSerCliente({ estado: { quien: "dev", busca: "todavia_no" } }), false);
  assert.equal(puedeSerCliente({}), false, "sin nada de nada, no");
});

test("el formulario de la red: semi senior o más es el target del 16/11, y un junior entra solo por decir que busca", () => {
  for (const s of ["Semi-senior", "senior", "Lead", "Architect"]) assert.equal(esBienPosicionado({ seniority: s }), true, s);
  for (const s of ["Junior", "", null, undefined]) assert.equal(esBienPosicionado({ seniority: s }), false, String(s));
  const senior = { seniority: "Senior", situacion: "Empleado pero escucho" };
  assert.equal(puedeSerCliente({ estado: { quien: "dev", busca: "no_se_sabe" }, perfil: senior }), true);
  assert.equal(puedeSerCliente({ estado: { quien: "no_dev" }, perfil: senior }), false, "el formulario no lo vuelve dev");
  assert.equal(puedeSerCliente({ estado: { quien: "dev", busca: "no_se_sabe" }, perfil: { seniority: "Junior" } }), false);
});

test("lo inevitable suena aunque no sea una posible clienta: plata, una crisis, una baja, un freno de ella y quien contrata", () => {
  const nadie = { estado: { quien: "no_se_sabe" } };
  assert.equal(esInevitable({ ...nadie, charlaDelLead: ["no me llego el acceso"] }), true);
  assert.equal(esInevitable({ ...nadie, charlaDelLead: ["estoy con una depresion de prueba"] }), true);
  assert.equal(esInevitable({ ...nadie, charlaDelLead: ["no me escribas mas"] }), true);
  assert.equal(esInevitable({ ...nadie, motivo: MOTIVO_SENAL_EMPRESA }), true);
  assert.equal(esInevitable({ estado: { quien: "empresa" } }), true);
  assert.equal(esInevitable({ ...nadie, avisos: ["YA: quiere el 1 a 1, le pase tu agenda"] }), true);
  assert.equal(esInevitable({ ...nadie, avisos: ["HOY: pregunta si le contesta un bot"], dijo: "sos un bot?" }), true);
  assert.equal(esInevitable({ ...nadie, charlaDelLead: ["hola!"] }), false);
  assert.equal(esInevitable({ estado: dev, avisos: ["HOY: no supe que contestarle"] }), false, "un HOY: solo no es inevitable");
});

test("un aviso sale solo si la persona puede ser clienta; el resto queda con su nota para el resumen", () => {
  sale({ estado: dev, origen: POR_EL_LEAD }, "un dev que busca");
  sale({ estado: { quien: "empresa" }, origen: POR_EL_LEAD }, "una empresa");
  assert.match(calla({ estado: { quien: "no_dev" }, origen: POR_EL_LEAD }, "no es dev"), /no es dev/);
  assert.match(calla({ estado: { quien: "dev", busca: "no" }, origen: POR_EL_LEAD, charlaDelLead: ["jaja"] }, "dev que no busca"), /no dijo que busque/);
  assert.match(calla({ origen: POR_EL_LEAD, charlaDelLead: ["hola!"] }, "un saludo"), /no se sabe quién es/);
  assert.match(calla({ origen: POR_EL_LEAD, charlaDelLead: [] }, "no escribió nada"), /no escribió nada/);
});

test("lo que el agente no supo contestar no suena por sí solo, aunque sea una posible clienta", () => {
  const porque = calla({ estado: dev, origen: POR_EL_AGENTE, avisos: ["Frené lo que iba a mandar (de prueba)"] }, "un freno");
  assert.match(porque, /no supe seguir la charla/);
  assert.match(porque, /es una posible clienta/, "la nota le dice que vale la pena mirarla");
  // Con el lead esperando (HOY: o YA:) y una posible clienta, sí: ya no es el freno por sí solo.
  sale({ estado: dev, origen: POR_EL_AGENTE, avisos: ["HOY: Frené lo que iba a mandar y quedó esperando"] }, "el lead espera");
  calla({ estado: { quien: "no_dev" }, origen: POR_EL_AGENTE, avisos: ["HOY: quedó esperando"] }, "no es clienta");
  // Y lo de ella sigue saliendo al toque, venga de donde venga.
  sale({ estado: { quien: "no_se_sabe" }, origen: POR_EL_AGENTE, motivo: MOTIVO_SENAL_EMPRESA }, "un freno de los suyos");
});

test("el mismo aviso de la misma charla no suena dos veces, ni siendo urgente; con siempre suena igual", () => {
  const uno = { estado: dev, origen: POR_EL_LEAD, avisos: ["YA: quiere el 1 a 1, le pase tu agenda"] };
  sale(uno, "la primera vez");
  assert.match(calla({ ...uno, repetido: true }, "el mismo otra vez"), /ya te pasé este mismo aviso/);
  sale({ ...uno, repetido: true, siempre: true }, "los de plata no pasan por la regla");
  sale({ estado: { quien: "no_dev" }, siempre: true }, "el tope de altas no es de una persona");
});

test("la clave de un aviso junta el mismo aviso dicho de dos maneras y separa los que dicen otra cosa", () => {
  const clave = (t) => claveDeAviso(t);
  assert.equal(clave("YA: quiere el 1 a 1, le pasé tu agenda"), clave("ya: quiere el 1 a 1, le pase tu agenda de nuevo (no le aparecía el link)"));
  assert.notEqual(clave("YA: quiere el 1 a 1, le pasé tu agenda"), clave("YA: dice que ya pagó en pesos"));
  assert.equal(clave(""), null);
  assert.equal(clave("   "), null);
  assert.equal(HORAS_REPETIDO, 12, "medio día: lo que tiene que hacer con eso es lo mismo");
});

test("la nota de lo callado arranca con NOTA (así no suena nunca) y dice qué pasaba, por qué y qué faltó hacer", () => {
  const nota = notaDeLoCallado("DM URGENTE: te paso una charla", {
    Quién: "Lead de prueba (77)", Aviso: "Frené lo que iba a mandar (de prueba)", "Aviso del agente": "NOTA: algo de prueba",
    Motivo: "motivo de prueba", Ojo: "no pude pausar los automáticos en ManyChat", "Lo último que dijo": "dijo algo de prueba",
  }, "no supe seguir la charla");
  assert.match(nota, /^NOTA: no te lo pasé al momento \(no supe seguir la charla\): te paso una charla · /);
  for (const x of ["Frené lo que iba a mandar", "motivo de prueba", "no pude pausar los automáticos", "dijo algo de prueba"]) {
    assert.match(nota, new RegExp(x), x);
  }
  assert.doesNotMatch(nota, /Lead de prueba \(77\)/, "el nombre lo pone el resumen");
  assert.doesNotMatch(nota, /[—¿¡]/);
  assert.ok(nota.length <= 600, "entra entera en el renglón del resumen");
  assert.match(notaDeLoCallado("DM: mandó una foto", {}), /no parecía una posible clienta/);
});

/* ---------- lo callado no queda callado: sale en el resumen de las notas ---------- */

/** Una base de mentira para el resumen, con las notas que le llegan de la base. */
function baseDeResumen(notas) {
  const b = {
    guardado: null, listas: {},
    reclamarResumen: async () => ({ desde: null, franja_previa: null }),
    soltarResumen: async () => {},
    cerrarResumen: async (franja, hasta, lista) => { b.guardado = { franja, hasta, lista }; },
    notasParaResumen: async () => notas,
    guardarIg: async () => {},
  };
  return b;
}

test("lo callado entra al resumen sin pasar por el filtro de esParaCande: si no, quedaría callado del todo", async () => {
  const notas = [
    // Lo callado por la política: no es de una empresa y tiene que salir igual.
    {
      id: 1, contacto: "77", accion: ACCION_AVISO, quien: "dev", nombre: "Lead uno",
      aviso: "NOTA: no te lo pasé al momento (no supe seguir la charla): te paso una charla · algo de prueba",
      ultimo_lead: new Date("2026-11-17T09:00:00Z"), creado: "2026-11-17T09:30:00Z",
    },
    // Una nota del modelo de un dev: como desde el 23/10, esa no va al resumen.
    {
      id: 2, contacto: "88", accion: "responder", quien: "dev", nombre: "Lead dos",
      aviso: "NOTA: otra cosa de prueba", ultimo_lead: new Date("2026-11-17T09:00:00Z"), creado: "2026-11-17T09:40:00Z",
    },
  ];
  const base = baseDeResumen(notas);
  const mandados = [];
  const mandar = crearResumen({
    base, avisar: async (titulo, campos, opciones) => { mandados.push({ titulo, campos, opciones }); return true; },
    reloj: () => new Date("2026-11-17T10:05:00Z"),
  });
  assert.deepEqual(await mandar(), { hecho: "enviado", charlas: 1 });
  assert.equal(mandados.length, 1);
  assert.equal(mandados[0].opciones.silencioso, true, "el resumen no suena");
  assert.match(mandados[0].campos.Notas, /1\. Lead uno: no te lo pasé al momento/);
  assert.doesNotMatch(mandados[0].campos.Notas, /Lead dos/);
  assert.equal(base.guardado.lista.mapa["1"], "77", "se le puede contestar por número");
});

test("si la nota de lo callado no se pudo guardar, el aviso sale igual: nada queda callado sin dejar rastro", () => {
  // La constancia la deja agente.anotarLoCallado con base.guardarSalida; si eso falla, avisarACande manda el aviso
  // como antes del 17/11 (lo que se llena es el chat, no la base). Acá solo se fija el contrato de los nombres: la
  // accion y el estado con los que el resumen la encuentra (base.notasParaResumen no deja afuera ninguno de los dos).
  assert.equal(ACCION_AVISO, "aviso");
  assert.equal(ESTADO_CALLADO, "callado");
});
