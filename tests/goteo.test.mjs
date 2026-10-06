// Los dos goteos (pages/api/drip.js y drip-preguntas.js), pedirCV y el aviso de
// /api/devs-red, corridos de punta a punta contra un Resend, una base y un Telegram de
// mentira (tests/dobles). Cargan el código real del sitio, no una copia.
// No miran el texto de los mails: esos se editan seguido y no tienen que romper nada acá.
//
// Correr:  node --test tests/*.test.mjs
import { avisos, registros, respuesta } from "./dobles/preparar.mjs";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { aceptado, rechazo, resendFalso } from "./dobles/resend.mjs";
import { base, hace } from "./dobles/postgres.mjs";

const { default: drip } = await import("../pages/api/drip.js");
const { default: dripPreguntas } = await import("../pages/api/drip-preguntas.js");
const { pedirCV } = await import("../lib/pedirCV.js");
const { default: devsRed } = await import("../pages/api/devs-red.js");

const CADENAS = [
  { cadena: "developers", handler: drip, tabla: "red_devs" },
  { cadena: "founders", handler: dripPreguntas, tabla: "leads_preguntas" },
];

/** Alguien que se anotó hace `dias` días y todavía no recibió ningún toque. */
const persona = (id, dias) => ({
  id, nombre: `Persona ${id}`, email: `persona${id}@example.com`, origen: "formulario",
  creado: hace(dias), drip_off: false,
});
const mail = (id) => `persona${id}@example.com`;

/** Llama al endpoint como lo llama el cron y devuelve el JSON que contestó. */
async function correr(handler) {
  const res = respuesta();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.codigo, 200);
  return res.cuerpo;
}

/** A quiénes les quedó anotado el toque en la base. */
const anotados = (tabla, col = "drip_d1") =>
  base.tablas[tabla].filter((f) => f[col]).map((f) => f.email).sort();

beforeEach(() => {
  base.reiniciar();
  resendFalso.reiniciar();
  avisos.length = 0;
  registros.length = 0;
});

for (const { cadena, handler, tabla } of CADENAS) {
  test(`${cadena}: un mail que Resend acepta queda anotado`, async () => {
    base.reiniciar({ [tabla]: [persona(1, 1.5), persona(2, 1.4)] });
    const r = await correr(handler);

    assert.deepEqual(anotados(tabla), [mail(1), mail(2)]);
    assert.equal(r.enviados.drip_d1, 2);
    assert.equal(avisos.length, 0);
    // El mail sale armado como siempre: remitente, destinatario, asunto, texto y HTML.
    const m = resendFalso.pedidos[0];
    for (const campo of ["from", "to", "replyTo", "subject", "text", "html"]) {
      assert.equal(typeof m[campo], "string", campo);
    }
    assert.match(m.text, /Persona/);
  });

  test(`${cadena}: un rechazo por cupo no se anota, corta la corrida y avisa una sola vez`, async () => {
    // Guardadas desordenadas a propósito. De más vieja a más nueva: 3, 2, 1, 4, 5.
    base.reiniciar({ [tabla]: [persona(2, 1.8), persona(5, 1.5), persona(3, 1.9), persona(1, 1.7), persona(4, 1.6)] });
    // Queda cupo para 2. Del tercero en adelante Resend rechaza, y lo hace SIN tirar excepción.
    resendFalso.responder = (m, n) => (n <= 2 ? aceptado(n) : rechazo("daily_quota_exceeded"));
    const r = await correr(handler);

    // Anotado como mandado es exactamente lo que Resend aceptó. Ni uno más.
    assert.deepEqual(anotados(tabla), [...resendFalso.aceptados].sort());
    assert.equal(anotados(tabla).length, 2);
    // Después del rechazo no se intentó ningún otro.
    assert.equal(resendFalso.pedidos.length, 3);
    // La respuesta del cron dice cuántos salieron, que se cortó por cupo y cuántos faltan.
    assert.equal(r.salieron, 2);
    assert.equal(r.cortado, "cupo");
    assert.equal(r.sinIntentar, 2);
    assert.deepEqual(r.fallaron, { daily_quota_exceeded: 1 });
    // Un solo aviso por Telegram, sin guion largo ni signos de apertura.
    assert.equal(avisos.length, 1);
    assert.match(avisos[0], new RegExp(`mails a ${cadena}`));
    assert.match(avisos[0], /cupo de mails del día/);
    assert.match(avisos[0], /Salieron:<\/b> 2/);
    assert.match(avisos[0], /Quedaron sin salir:<\/b> 3/);
    assert.doesNotMatch(avisos[0], /[—¿¡]/);
  });

  test(`${cadena}: lo que quedó pendiente sale en la corrida siguiente y a nadie le llega dos veces`, async () => {
    base.reiniciar({ [tabla]: [persona(2, 1.8), persona(5, 1.5), persona(3, 1.9), persona(1, 1.7), persona(4, 1.6)] });
    resendFalso.responder = (m, n) => (n <= 2 ? aceptado(n) : rechazo("daily_quota_exceeded"));
    await correr(handler);
    const primera = [...resendFalso.aceptados];

    resendFalso.reiniciar();   // al otro día hay cupo de nuevo
    const r = await correr(handler);

    assert.deepEqual(primera, [mail(3), mail(2)]);
    assert.deepEqual(resendFalso.aceptados, [mail(1), mail(4), mail(5)]);
    assert.equal(anotados(tabla).length, 5);
    assert.equal(r.cortado, null);
    assert.equal(r.sinIntentar, 0);
  });

  test(`${cadena}: un rechazo por velocidad se reintenta y recién entonces se anota`, async () => {
    base.reiniciar({ [tabla]: [persona(1, 1.5)] });
    resendFalso.responder = (m, n) => (n === 1 ? rechazo("rate_limit_exceeded") : aceptado(n));
    const r = await correr(handler);

    assert.equal(resendFalso.pedidos.length, 2);
    assert.deepEqual(anotados(tabla), [mail(1)]);
    assert.equal(r.enviados.drip_d1, 1);
    assert.equal(avisos.length, 0);
  });

  test(`${cadena}: cualquier otro error de Resend no se anota y la corrida sigue`, async () => {
    base.reiniciar({ [tabla]: [persona(1, 1.9), persona(2, 1.8), persona(3, 1.7)] });
    resendFalso.responder = (m, n) => (m.to === mail(2) ? rechazo("validation_error", 422) : aceptado(n));
    const r = await correr(handler);

    assert.deepEqual(anotados(tabla), [mail(1), mail(3)]);
    assert.equal(resendFalso.pedidos.length, 3);
    assert.equal(r.cortado, null);
    assert.deepEqual(r.fallaron, { validation_error: 1 });
    assert.equal(avisos.length, 0);
    // Queda registrado con el nombre del error y el id de la fila, sin el mail de nadie.
    assert.ok(registros.some((l) => l.includes("validation_error")), registros.join(" | "));
    assert.ok(!registros.some((l) => l.includes("@")), registros.join(" | "));
  });

  test(`${cadena}: salen primero los que más esperan`, async () => {
    // 3 y 4 se anotaron en el mismo momento: desempata el id.
    base.reiniciar({ [tabla]: [persona(2, 1.2), persona(4, 1.9), persona(1, 1.5), persona(3, 1.9)] });
    await correr(handler);

    assert.deepEqual(resendFalso.pedidos.map((m) => m.to), [mail(3), mail(4), mail(1), mail(2)]);
  });

  test(`${cadena}: sigue siendo un solo mail por persona por corrida`, async () => {
    // Hace 5 días y sin ningún toque: le corresponden el 1, el 2 y el 3. Hoy recibe solo el 1.
    base.reiniciar({ [tabla]: [persona(1, 5)] });
    const r = await correr(handler);

    assert.equal(resendFalso.pedidos.length, 1);
    assert.deepEqual(anotados(tabla, "drip_d1"), [mail(1)]);
    assert.deepEqual(anotados(tabla, "drip_d2"), []);
    assert.deepEqual(r.enviados, { drip_d1: 1, drip_d2: 0, drip_d3: 0, drip_d7: 0, drip_d12: 0, drip_d17: 0 });
  });
}

test("pedirCV: devuelve false cuando Resend rechaza el mail", async () => {
  resendFalso.responder = () => rechazo("daily_quota_exceeded");

  assert.equal(await pedirCV("Ana Prueba", "ana@example.com"), false);
  assert.equal(resendFalso.pedidos.length, 1);
});

test("pedirCV: devuelve true cuando Resend lo acepta", async () => {
  assert.equal(await pedirCV("Ana Prueba", "ana@example.com"), true);
  assert.equal(resendFalso.pedidos[0].to, "ana@example.com");
});

test("devs-red: si Resend rechaza el mail del CV, el aviso de Telegram dice que NO salió", async () => {
  resendFalso.responder = () => rechazo("daily_quota_exceeded");
  const res = respuesta();
  await devsRed({
    method: "POST",
    body: {
      nombre: "Ana Prueba", email: "ana@example.com", pais: "Argentina", roles: ["Backend"],
      seniority: "Senior", experiencia: "6 años", stack: ["Node"], cuandoArrancas: "Ya",
      dedicacion: "Full time", tarifa: "30", situacion: "Freelance", ingles: "B2",
      clientesExt: "Sí", comoLlegaste: "Instagram", whatsapp: "000",
    },
  }, res);

  assert.equal(res.codigo, 200);
  assert.equal(avisos.length, 1);
  assert.match(avisos[0], /Mail CV:<\/b> NO salió/);
});
