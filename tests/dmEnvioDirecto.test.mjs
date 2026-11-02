// Por dónde sale lo que escribe el agente (lib/dm/envio.js).
//
// Lo que no puede fallar: que se use Instagram cuando se puede (ManyChat cobra por contacto y está
// contra el techo), que nadie se quede sin respuesta si Instagram no anda, y sobre todo que un
// mensaje no salga DOS veces porque Instagram mandó la mitad y después se reintentó por ManyChat.
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
const { crearEnvio } = await import("../lib/dm/envio.js");

const baseCon = (contacto) => ({ contacto: async () => contacto });
const igQue = (resultado, visto = []) => ({
  mandarTextos: async (igId, textos) => {
    visto.push({ igId, textos });
    return resultado;
  },
});
const mcQue = (resultado, visto = []) => ({
  hayManyChat: () => true,
  mandarTextos: async (id, textos) => {
    visto.push({ id, textos });
    return resultado;
  },
});

test("con ig_id manda por Instagram y ManyChat ni se entera", async () => {
  const porIg = [];
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: true, mando: 1 }, porIg),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(r.por, "instagram");
  assert.deepEqual(porIg, [{ igId: "17841400000000001", textos: ["hola"] }]);
  assert.deepEqual(porMc, [], "si sale por Instagram, ManyChat no tiene que sumar un contacto");
});

test("como lo arma el sitio (sin INSTAGRAM_TOKEN y sin decir hayIg), con ig_id sale por Instagram", async () => {
  // 01/11: el envío miraba INSTAGRAM_TOKEN, que en Vercel no está (el cliente manda con el permiso
  // del sitio), así que todo salía por ManyChat y a los contactos nuevos no les llegaba nada.
  const antes = process.env.INSTAGRAM_TOKEN;
  delete process.env.INSTAGRAM_TOKEN;
  try {
    const porIg = [];
    const porMc = [];
    const envio = crearEnvio({
      manychat: mcQue({ ok: true }, porMc),
      ig: igQue({ ok: true, mando: 1 }, porIg),
      base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    });
    const r = await envio.mandarTextos("77", ["hola"]);
    assert.equal(r.por, "instagram");
    assert.equal(porIg.length, 1);
    assert.deepEqual(porMc, []);
  } finally {
    if (antes !== undefined) process.env.INSTAGRAM_TOKEN = antes;
  }
});

test("sin ig_id sale por ManyChat: nadie se queda sin respuesta", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: true }),
    base: baseCon({ id: "77", ig_id: null }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(r.por, "manychat");
  assert.deepEqual(porMc, [{ id: "77", textos: ["hola"] }]);
});

test("sin token de Instagram no se intenta por ahí", async () => {
  const porIg = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: igQue({ ok: true }, porIg),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => false,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.por, "manychat");
  assert.deepEqual(porIg, []);
});

test("si Instagram falla sin mandar nada, lo reintenta ManyChat", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: false, error: "Instagram contestó 500", mando: 0 }),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(r.por, "manychat");
  assert.deepEqual(porMc, [{ id: "77", textos: ["hola"] }]);
});

test("si Instagram ya mandó alguno y falla el siguiente, NO se reintenta por ManyChat", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: false, error: "se cayó en el segundo", mando: 1 }),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["uno", "dos"]);

  assert.equal(r.ok, false);
  assert.equal(r.por, "instagram");
  assert.deepEqual(porMc, [], "reintentar por ManyChat le mandaría el primer mensaje dos veces");
});

test("un envío incierto por Instagram tampoco se reintenta", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: false, incierto: true, error: "tardó más de 12 segundos", mando: 0 }),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.incierto, true);
  assert.deepEqual(porMc, [], "pudo haber salido igual: reintentarlo lo manda dos veces");
});

test("si la base no contesta, sale por ManyChat en vez de romperse", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: true }),
    base: { contacto: async () => { throw new Error("base caída"); } },
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(r.por, "manychat");
});

test("un ig_id que no es un id de Instagram no se usa", async () => {
  const porIg = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: igQue({ ok: true }, porIg),
    base: baseCon({ id: "77", ig_id: "sin_id" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.por, "manychat");
  assert.deepEqual(porIg, []);
});

test("el resto del cliente de ManyChat pasa tal cual: sin esto no se pausan sus automáticos", async () => {
  // El agente usa ponerCampo(id, "dm_dueno", "cande") para pausar los automáticos de ManyChat
  // cuando la charla pasa a Cande, y datosDe para el link del aviso. Si el envío los tapa, la
  // charla queda con los automáticos prendidos y nadie se entera hasta que el lead recibe dos cosas.
  const visto = [];
  const envio = crearEnvio({
    manychat: {
      ...mcQue({ ok: true }),
      ponerCampo: async (id, campo, valor) => { visto.push([id, campo, valor]); return { ok: true }; },
      datosDe: async (id) => ({ ok: true, ig_username: "alguien", ig_id: "1784140" }),
      ponerEtiqueta: async () => ({ ok: true }),
    },
    ig: igQue({ ok: true }),
    base: baseCon(null),
  });

  assert.equal((await envio.ponerCampo("77", "dm_dueno", "cande")).ok, true);
  assert.deepEqual(visto, [["77", "dm_dueno", "cande"]]);
  assert.equal((await envio.datosDe("77")).ig_username, "alguien");
  assert.equal(typeof envio.ponerEtiqueta, "function");
});

test("y pasa TODO lo que exporta lib/dm/manychat.js, no una lista a mano", async () => {
  // La lista a mano es la que se olvidó de ponerCampo. Esta prueba mira el cliente de verdad.
  const real = await import("../lib/dm/manychat.js");
  const envio = crearEnvio({ manychat: real, ig: null, base: baseCon(null) });
  for (const nombre of Object.keys(real)) {
    assert.equal(typeof envio[nombre], typeof real[nombre], `el envío se comió ${nombre}`);
  }
  assert.notEqual(envio.mandarTextos, real.mandarTextos, "lo único distinto tiene que ser el envío");
});

test("hayManyChat sigue estando: el agente lo mira antes de un toque", async () => {
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: igQue({ ok: true }),
    base: baseCon(null),
  });
  assert.equal(typeof envio.hayManyChat, "function");
  assert.equal(envio.hayManyChat(), true);
});

// ── El POST a Instagram (lib/dm/instagram.js, mandar / mandarTextos) ──
const { crearInstagram } = await import("../lib/dm/instagram.js");

const clienteIg = (respuestas, visto = []) => crearInstagram({
  pedir: async (url, init) => {
    visto.push({ url, init });
    const r = respuestas.shift() ?? { ok: true, json: { recipient_id: "1", message_id: "m1" } };
    return { ok: r.ok !== false, status: r.status ?? 200, json: async () => r.json ?? {} };
  },
  leerConfig: async () => null,
  guardarConfig: async () => {},
  tokenEnv: () => "TOKEN_DE_PRUEBA",
});

test("manda a /me/messages con el id de la persona en Instagram", async () => {
  const visto = [];
  const ig = clienteIg([], visto);

  const r = await ig.mandarTextos("17841400000000001", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(visto.length, 1);
  assert.match(visto[0].url, /graph\.instagram\.com\/v\d+\.\d+\/me\/messages/);
  assert.equal(visto[0].init.method, "POST");
  assert.deepEqual(JSON.parse(visto[0].init.body), {
    recipient: { id: "17841400000000001" },
    message: { text: "hola" },
  });
});

test("los textos salen de a uno y en orden", async () => {
  const visto = [];
  const ig = clienteIg([], visto);

  await ig.mandarTextos("17841400000000001", ["uno", "dos", "tres"]);

  assert.deepEqual(visto.map((v) => JSON.parse(v.init.body).message.text), ["uno", "dos", "tres"]);
});

test("si Instagram rechaza, dice cuántos alcanzaron a salir", async () => {
  const ig = clienteIg([
    { ok: true },
    { ok: false, status: 400, json: { error: { message: "fuera de las 24 horas", code: 10 } } },
  ]);

  const r = await ig.mandarTextos("17841400000000001", ["uno", "dos"]);

  assert.equal(r.ok, false);
  assert.equal(r.mando, 1, "sin esto, quien llama no sabe que el primero ya salió y lo repite");
  assert.match(r.error, /24 horas/);
});

test("el token no viaja en el mensaje de error", async () => {
  const ig = clienteIg([
    { ok: false, status: 400, json: { error: { message: "mal access_token=TOKEN_DE_PRUEBA acá", code: 190 } } },
  ]);

  const r = await ig.mandarTextos("17841400000000001", ["hola"]);

  assert.equal(r.ok, false);
  assert.ok(!r.error.includes("TOKEN_DE_PRUEBA"), "el token no se registra nunca");
});

// ── Cuando el contacto no tiene ig_id guardado ──
//
// Al 01/11 hay 620 contactos así, de los que ManyChat trajo antes de que la red de la bandeja
// existiera. Mientras ManyChat vive salen por ahí; cuando se borre, el único camino es Instagram, y
// para eso hace falta el id. Se lo busca por su usuario en las primeras páginas de la bandeja, UNA
// vez por contacto: probado contra la bandeja real, de 542 sin id solo uno aparecía en 1250 hilos.

const bandejaCon = (hilos, visto = []) => ({
  mandarTextos: async () => ({ ok: true, mando: 1 }),
  pagina: async ({ despues = null } = {}) => {
    visto.push(despues);
    return { lista: hilos, despues: null };
  },
});
const hilo = (usuario, id) => ({ otro: { usuario, id } });

test("sin ig_id lo busca en la bandeja por su usuario, lo guarda y manda por Instagram", async () => {
  const guardado = [];
  const marcado = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: bandejaCon([hilo("otro", "999999999"), hilo("ezequiel", "17841400000000009")]),
    base: {
      contacto: async () => ({ id: "77", ig_id: null, ig_usuario: "Ezequiel", ig_buscado: null }),
      guardarIg: async (id, datos) => guardado.push([id, datos]),
      marcarIgBuscado: async (id) => marcado.push(id),
    },
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.por, "instagram");
  assert.deepEqual(guardado, [["77", { igId: "17841400000000009" }]], "el id se guarda: no se busca dos veces");
  assert.deepEqual(marcado, ["77"]);
});

test("si no aparece, queda marcado y sale por ManyChat", async () => {
  const marcado = [];
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: bandejaCon([hilo("otro", "999999999")]),
    base: {
      contacto: async () => ({ id: "77", ig_id: null, ig_usuario: "ezequiel", ig_buscado: null }),
      guardarIg: async () => { throw new Error("no se guarda lo que no se encontró"); },
      marcarIgBuscado: async (id) => marcado.push(id),
    },
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.por, "manychat");
  assert.deepEqual(porMc, [{ id: "77", textos: ["hola"] }]);
  assert.deepEqual(marcado, ["77"], "queda marcado aunque no aparezca: no se vuelve a barrer por él");
});

test("al que ya se buscó no se lo busca de nuevo", async () => {
  const visto = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: bandejaCon([hilo("ezequiel", "17841400000000009")], visto),
    base: {
      contacto: async () => ({ id: "77", ig_id: null, ig_usuario: "ezequiel", ig_buscado: new Date() }),
      marcarIgBuscado: async () => { throw new Error("no tendría que marcar de nuevo"); },
    },
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.por, "manychat");
  assert.deepEqual(visto, [], "ni abre la bandeja");
});

test("la búsqueda mira pocas páginas: la cuota de Instagram no se gasta acá", async () => {
  const visto = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: {
      mandarTextos: async () => ({ ok: true }),
      pagina: async ({ despues = null } = {}) => {
        visto.push(despues);
        return { lista: [hilo("otro", "999999999")], despues: `pag${visto.length}` };
      },
    },
    base: {
      contacto: async () => ({ id: "77", ig_id: null, ig_usuario: "ezequiel", ig_buscado: null }),
      marcarIgBuscado: async () => {},
    },
    paginas: 2,
  });

  await envio.mandarTextos("77", ["hola"]);

  assert.equal(visto.length, 2, "dos páginas y basta");
});

test("si Instagram se cae buscando, no queda marcado: se intenta de nuevo la próxima", async () => {
  const marcado = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: { mandarTextos: async () => ({ ok: true }), pagina: async () => { throw new Error("se cayó"); } },
    base: {
      contacto: async () => ({ id: "77", ig_id: null, ig_usuario: "ezequiel", ig_buscado: null }),
      marcarIgBuscado: async (id) => marcado.push(id),
    },
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.por, "manychat");
  assert.deepEqual(marcado, [], "no se marca lo que no se llegó a mirar");
});

test("sin ig_id, sin bandeja y sin ManyChat, el envío dice que no hay por dónde", async () => {
  // El día que ManyChat no exista: el toque se cancela, no se inventa que salió.
  const envio = crearEnvio({
    manychat: {
      hayManyChat: () => false,
      mandarTextos: async () => ({ ok: false, error: "falta MANYCHAT_API_KEY" }),
    },
    ig: bandejaCon([hilo("otro", "999999999")]),
    base: {
      contacto: async () => ({ id: "77", ig_id: null, ig_usuario: "ezequiel", ig_buscado: null }),
      marcarIgBuscado: async () => {},
    },
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.ok, false);
  assert.equal(r.por, "ninguno");
  assert.match(r.error, /no hay por dónde/);
});

test("después de mandar, el campo dm_accion de ManyChat queda puesto una vez, y si falla no frena el envío (02/11)", async () => {
  // La automatización de ManyChat "Seguimiento lista CV" sale si dm_accion está vacío: con el envío por la API el
  // agente contestaba y al lead le llegaba igual un seguimiento de más.
  const campos = [];
  const manychat = { ...mcQue({ ok: true }), ponerCampo: async (id, campo, valor) => { campos.push([id, campo, valor]); return { ok: true }; } };
  const envio = crearEnvio({ manychat, ig: igQue({ ok: true, mando: 1 }), base: baseCon({ id: "77", ig_id: "17841400000000001" }) });
  assert.equal((await envio.mandarTextos("77", ["hola"])).ok, true);
  await envio.mandarTextos("77", ["otro"]);
  assert.deepEqual(campos, [["77", "dm_accion", "agente"]]);

  const roto = { ...mcQue({ ok: true }), ponerCampo: async () => { throw new Error("ManyChat caído"); } };
  const r = await crearEnvio({ manychat: roto, ig: igQue({ ok: true, mando: 1 }), base: baseCon({ id: "78", ig_id: "17841400000000002" }) }).mandarTextos("78", ["hola"]);
  assert.equal(r.ok, true);
  assert.equal(r.por, "instagram");

  const sinMandar = [];
  const nada = { ...mcQue({ ok: false, error: "no" }), ponerCampo: async (...a) => { sinMandar.push(a); return { ok: true }; } };
  await crearEnvio({ manychat: nada, ig: igQue({ ok: false, mando: 0 }), base: baseCon({ id: "79", ig_id: "17841400000000003" }) }).mandarTextos("79", ["hola"]);
  assert.deepEqual(sinMandar, [], "si no salió nada, no se marca");
});

// ── Contactos solo de Instagram (02/11): la gente nueva que ManyChat ya no tiene. Su id es su IGSID. ──
const SOLO_IG = "1000000000000611";

test("a un contacto solo de Instagram se le manda por Instagram con su propio id, sin ir a la base ni a ManyChat", async () => {
  const porIg = [];
  const porMc = [];
  const campos = [];
  const envio = crearEnvio({
    manychat: { ...mcQue({ ok: true }, porMc), ponerCampo: async (...a) => { campos.push(a); return { ok: true }; } },
    ig: igQue({ ok: true, mando: 1 }, porIg),
    base: { contacto: async () => { throw new Error("no hace falta la base: el id ya es el de Instagram"); } },
  });
  const r = await envio.mandarTextos(SOLO_IG, ["hola"]);
  assert.equal(r.ok, true);
  assert.equal(r.por, "instagram");
  assert.deepEqual(porIg, [{ igId: SOLO_IG, textos: ["hola"] }]);
  assert.deepEqual(porMc, []);
  assert.deepEqual(campos, [], "no tiene automatizaciones de ManyChat que frenar (dm_accion)");
});

test("si Instagram no le deja mandar a un contacto solo de Instagram, no se reintenta por ManyChat: queda el error", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: false, error: "Instagram contestó 500", code: 2, mando: 0 }),
    base: baseCon({ id: SOLO_IG, ig_id: SOLO_IG }),
  });
  const r = await envio.mandarTextos(SOLO_IG, ["hola"]);
  assert.equal(r.ok, false);
  assert.equal(r.por, "ninguno");
  assert.match(r.error, /solo de Instagram.*no hay respaldo por ManyChat.*Instagram contestó 500/);
  assert.deepEqual(porMc, [], "ManyChat no lo conoce");

  // Sin Instagram tampoco: el mismo error, y ManyChat ni se entera.
  const sinIg = await crearEnvio({ manychat: mcQue({ ok: true }, porMc), ig: igQue({ ok: true }), base: baseCon(null), hayIg: () => false }).mandarTextos(SOLO_IG, ["hola"]);
  assert.equal(sinIg.ok, false);
  assert.equal(sinIg.por, "ninguno");
  assert.deepEqual(porMc, []);

  // Un envío incierto sigue siendo incierto (pudo haber salido): no se lo da por fallado.
  const incierto = await crearEnvio({ manychat: mcQue({ ok: true }, porMc), ig: igQue({ ok: false, incierto: true, error: "tardó", mando: 0 }), base: baseCon(null) })
    .mandarTextos(SOLO_IG, ["hola"]);
  assert.equal(incierto.incierto, true);
  assert.equal(incierto.por, "instagram");
  assert.deepEqual(porMc, []);
});

test("el cliente de ManyChat no sale a la red por un contacto solo de Instagram (02/11)", async () => {
  const real = await import("../lib/dm/manychat.js");
  const antesClave = process.env.MANYCHAT_API_KEY;
  const antesFetch = globalThis.fetch;
  const pedidos = [];
  process.env.MANYCHAT_API_KEY = "clave-de-prueba";
  globalThis.fetch = async (url) => {
    pedidos.push(String(url));
    return { ok: true, status: 200, json: async () => ({ status: "success", data: { ig_username: "alguien" } }) };
  };
  try {
    // Pausar sus automáticos o ponerle la etiqueta: no hay nada que hacer, se da por hecho.
    assert.equal((await real.ponerCampo(SOLO_IG, "dm_dueno", "cande")).ok, true);
    assert.equal((await real.ponerEtiqueta(SOLO_IG, "agente_dm")).ok, true);
    // Mandarle o pedir sus datos: no se puede, vuelve como falla.
    const m = await real.mandarTextos(SOLO_IG, ["hola"]);
    assert.equal(m.ok, false);
    assert.equal(m.soloInstagram, true);
    assert.equal((await real.datosDe(SOLO_IG)).ok, false);
    assert.deepEqual(pedidos, []);
    // Uno de ManyChat sigue saliendo como siempre.
    assert.equal((await real.ponerCampo("5001", "dm_dueno", "cande")).ok, true);
    assert.equal(pedidos.length, 1);
  } finally {
    globalThis.fetch = antesFetch;
    if (antesClave === undefined) delete process.env.MANYCHAT_API_KEY;
    else process.env.MANYCHAT_API_KEY = antesClave;
  }
});
