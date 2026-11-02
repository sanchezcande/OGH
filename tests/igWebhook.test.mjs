// El webhook de comentarios de Instagram (lib/dm/webhookIg.js, pages/api/ig/webhook.js).
//
// Lo que no puede fallar:
//   1. Que entre un aviso sin la firma de Meta. La URL está abierta a internet: sin esa traba
//      cualquiera que la conozca hace que la cuenta le mande un DM a quien quiera.
//   2. Que a nadie le llegue el mismo DM dos veces. Meta repite avisos (reintenta todo lo que no
//      contesta 200 enseguida) y el cron de respaldo sigue vivo: el comentario queda tomado en la
//      base ANTES de mandar y el que ya está tomado no se manda.
//   3. Que la palabra no se dispare adentro de una frase: es la misma de /api/dm/comentarios.
//   4. Que el cron de 15 minutos siga estando. El webhook puede perder un aviso; el cron no.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { avisos, respuesta } from "./dobles/preparar.mjs";

const {
  comentariosDelEvento, contestarDelWebhook, desafioDeVerificacion, firmaDeMeta, firmaValidaDeMeta, webhookConfigurado,
} = await import("../lib/dm/webhookIg.js");
const { RESPUESTAS_PUBLICAS, TEXTO_CV } = await import("../lib/dm/comentarios.js");

const SECRETO = "app-secret-de-prueba";
const TOKEN = "verify-token-de-prueba";

/** Un aviso de Meta como el de un comentario nuevo. */
const aviso = (valor, { cuenta = "17841401753799786", object = "instagram", field = "comments" } = {}) => ({
  object,
  entry: [{ id: cuenta, time: 1762000000, changes: [{ field, value: valor }] }],
});
const comentario = (extra = {}) => ({
  id: "18001", text: "CV", from: { id: "99001", username: "undev" }, media: { id: "media1" }, ...extra,
});

/* ---------- la firma ---------- */

test("la firma es el HMAC del cuerpo crudo con el App Secret, como la manda Meta", () => {
  const crudo = JSON.stringify(aviso(comentario()));
  const esperada = `sha256=${createHmac("sha256", SECRETO).update(crudo, "utf8").digest("hex")}`;
  assert.equal(firmaDeMeta(crudo, SECRETO), esperada);
  assert.equal(firmaValidaDeMeta(crudo, esperada, SECRETO), true);
  // El mismo cuerpo con un espacio de más ya es otro: por eso se firma el crudo y no lo que arma Next.
  assert.equal(firmaValidaDeMeta(`${crudo} `, esperada, SECRETO), false);
});

test("una firma que no vale no entra, y sin App Secret no entra ninguna", () => {
  const crudo = JSON.stringify(aviso(comentario()));
  const buena = firmaDeMeta(crudo, SECRETO);
  for (const mala of [undefined, null, "", "sha256=", "otra cosa", buena.slice(0, -2), `${buena}00`, buena.replace("sha256=", "sha1=")]) {
    assert.equal(firmaValidaDeMeta(crudo, mala, SECRETO), false, String(mala));
  }
  // Firmada con otra clave tampoco.
  assert.equal(firmaValidaDeMeta(crudo, firmaDeMeta(crudo, "otra-clave"), SECRETO), false);
  // Y sin clave configurada no pasa nada: el endpoint queda inerte hasta que esté en Vercel.
  assert.equal(firmaDeMeta(crudo, ""), null);
  assert.equal(firmaValidaDeMeta(crudo, buena, ""), false);
});

/* ---------- la verificación de la URL ---------- */

test("el GET de verificación devuelve el hub.challenge, y solo con el token que esperamos", () => {
  const q = { "hub.mode": "subscribe", "hub.verify_token": TOKEN, "hub.challenge": "1158201444" };
  assert.equal(desafioDeVerificacion(q, TOKEN), "1158201444");
  assert.equal(desafioDeVerificacion({ ...q, "hub.verify_token": "otro" }, TOKEN), null);
  assert.equal(desafioDeVerificacion({ ...q, "hub.mode": "unsubscribe" }, TOKEN), null);
  assert.equal(desafioDeVerificacion({ ...q, "hub.challenge": "" }, TOKEN), null);
  assert.equal(desafioDeVerificacion({}, TOKEN), null);
  // Sin token configurado no se verifica nada: así nadie da de alta esta URL en otra app de Meta.
  assert.equal(desafioDeVerificacion(q, ""), null);
});

/* ---------- qué trae el aviso ---------- */

test("del aviso salen los comentarios, con el medio y quién comentó", () => {
  assert.deepEqual(comentariosDelEvento(aviso(comentario())), [
    { id: "18001", texto: "CV", medio: "media1", usuario: "undev", de: "99001" },
  ]);
});

test("lo que no es un comentario de Instagram no entra", () => {
  assert.deepEqual(comentariosDelEvento(aviso(comentario(), { object: "page" })), []);
  assert.deepEqual(comentariosDelEvento(aviso(comentario(), { field: "live_comments" })), []);
  assert.deepEqual(comentariosDelEvento({ object: "instagram", entry: [{ id: "1", messaging: [{}] }] }), []);
  for (const nada of [null, undefined, {}, { object: "instagram" }, { object: "instagram", entry: [] }]) {
    assert.deepEqual(comentariosDelEvento(nada), []);
  }
});

test("lo que comenta la cuenta misma no se contesta: Cande contestando sus propios posts", () => {
  const suyo = comentario({ from: { id: "17841401753799786", username: "candelariasanchez" } });
  assert.deepEqual(comentariosDelEvento(aviso(suyo)), []);
});

test("el mismo comentario repetido en el aviso se cuenta una vez", () => {
  const cuerpo = aviso(comentario());
  cuerpo.entry[0].changes.push({ field: "comments", value: comentario() });
  cuerpo.entry.push({ id: "17841401753799786", changes: [{ field: "comments", value: comentario() }] });
  assert.equal(comentariosDelEvento(cuerpo).length, 1);
});

/* ---------- contestar ---------- */

/** Dobles de Instagram y de la base. `fallas` es el error que tira el envío de ese comentario. */
function armar({ fallas = {}, fallasPublicas = {}, conDm = [] } = {}) {
  const publicas = [];
  const tomados = [];
  const anotados = [];
  const sueltos = [];
  const pedidos = [];
  return {
    tomados, anotados, sueltos, pedidos, publicas,
    ig: {
      async responderComentario(id, texto) {
        pedidos.push({ id, texto });
        if (fallas[id]) throw fallas[id];
        return { recipient_id: `ig-${id}` };
      },
      async responderPublico(id, texto) {
        publicas.push({ id, texto });
        if (fallasPublicas[id]) throw fallasPublicas[id];
        return { id: `r-${id}` };
      },
    },
    base: {
      async tomarComentario(id, datos) {
        if (tomados.some((t) => t.id === id)) return false;
        tomados.push({ id, ...datos });
        return true;
      },
      async anotarComentario(id, estado, datos = {}) { anotados.push({ id, estado, ...datos }); },
      async soltarComentario(id) { sueltos.push(id); },
      async tomarPublica(id) {
        if (!anotados.some((a) => a.id === id && a.estado === "enviada") || publicas.some((p) => p.id === id)) return false;
        return true;
      },
      async tieneDmDeCV(u) { return conDm.includes(String(u).toLowerCase()); },
    },
    avisar: async (titulo, campos) => { avisos.push(`${titulo} ${JSON.stringify(campos)}`); },
  };
}

test("un comentario que pide la lista recibe su DM", async () => {
  const d = armar();
  const r = await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios: comentariosDelEvento(aviso(comentario())), avisar: d.avisar });
  assert.deepEqual(d.pedidos, [{ id: "18001", texto: TEXTO_CV }], "el DM sale con el texto de CV");
  // Tomado en la base ANTES de mandar, y con quién es, para que no salga dos veces.
  assert.deepEqual(d.tomados, [{ id: "18001", medio: "media1", usuario: "undev" }]);
  assert.deepEqual(d.anotados, [{ id: "18001", estado: "enviada", igId: "ig-18001" }]);
  assert.equal(r.enviadas, 1);
  assert.equal(r.piden, 1);
});

test("después del DM, el webhook contesta también en público, una sola vez, y si falla no frena nada", async () => {
  const d = armar();
  const eventos = comentariosDelEvento(aviso(comentario()));
  const r = await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios: eventos, avisar: d.avisar });
  assert.deepEqual(d.publicas.map((p) => p.id), ["18001"]);
  assert.ok(RESPUESTAS_PUBLICAS.includes(d.publicas[0].texto));
  assert.equal(r.publicas, 1);
  // El aviso repetido de Meta no la repite: el comentario ya estaba tomado.
  await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios: eventos, avisar: d.avisar });
  assert.equal(d.publicas.length, 1);
  // Si la respuesta pública falla, el DM ya salió y queda anotado como enviado.
  const f = armar({ fallasPublicas: { 18001: new Error("sin permiso") } });
  const r2 = await contestarDelWebhook({ ig: f.ig, base: f.base, comentarios: eventos, avisar: f.avisar });
  assert.equal(r2.enviadas, 1);
  assert.equal(r2.publicas, 0);
  assert.equal(r2.errores, 0);
  assert.deepEqual(f.anotados, [{ id: "18001", estado: "enviada", igId: "ig-18001" }]);
});

test("si el DM no sale, tampoco la respuesta pública", async () => {
  const d = armar({ fallas: { 18001: Object.assign(new Error("el comentario es demasiado antiguo"), { subcode: 2534024 }) } });
  await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios: comentariosDelEvento(aviso(comentario())), avisar: d.avisar });
  assert.equal(d.publicas.length, 0);
});

test("un comentario que no pide la lista no dispara nada", async () => {
  // Los dos son reales, del 29/10: por eso la palabra es más estricta que el \"contiene CV\" de ManyChat.
  const comentarios = comentariosDelEvento(aviso(comentario({ id: "18002", text: "Si... tiene buen cvlo" })))
    .concat(comentariosDelEvento(aviso(comentario({ id: "18003", text: "CV rico 😋" }))))
    .concat(comentariosDelEvento(aviso(comentario({ id: "18004", text: "Mas videitos en la playa, 🙏" }))));
  const d = armar();
  const r = await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios, avisar: d.avisar });
  assert.deepEqual(d.pedidos, []);
  assert.deepEqual(d.tomados, [], "ni se toca la base");
  assert.equal(r.piden, 0);
  assert.equal(r.enviadas, 0);
});

test("el aviso repetido de Meta no manda dos veces", async () => {
  const d = armar();
  const comentarios = comentariosDelEvento(aviso(comentario()));
  const uno = { ig: d.ig, base: d.base, comentarios, avisar: d.avisar };
  assert.equal((await contestarDelWebhook(uno)).enviadas, 1);
  // El mismo aviso otra vez (Meta reintenta): tomarComentario no lo devuelve y no sale nada.
  const otra = await contestarDelWebhook(uno);
  assert.equal(otra.enviadas, 0);
  assert.equal(otra.piden, 1);
  assert.equal(d.pedidos.length, 1, "un solo DM");
});

test("el que ya tiene la lista de otro comentario no la recibe de nuevo", async () => {
  const d = armar({ conDm: ["undev"] });
  const r = await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios: comentariosDelEvento(aviso(comentario())), avisar: d.avisar });
  assert.deepEqual(d.pedidos, []);
  assert.deepEqual(d.tomados, []);
  assert.equal(r.ya_tenia, 1);
});

test("si Instagram pide despacio el comentario se suelta y lo levanta el cron", async () => {
  const d = armar({ fallas: { 18001: Object.assign(new Error("límite de pedidos"), { code: 4 }) } });
  const r = await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios: comentariosDelEvento(aviso(comentario())), avisar: d.avisar });
  assert.deepEqual(d.sueltos, ["18001"]);
  assert.deepEqual(d.anotados, []);
  assert.equal(r.errores, 1);
});

test("un envío que se cortó por tiempo queda tomado: pudo haber salido igual", async () => {
  const d = armar({ fallas: { 18001: Object.assign(new Error("Instagram tardó demasiado"), { demora: true }) } });
  await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios: comentariosDelEvento(aviso(comentario())), avisar: d.avisar });
  assert.deepEqual(d.sueltos, [], "no se suelta: mandarlo de nuevo sería el mismo DM dos veces");
  assert.deepEqual(d.anotados, [{ id: "18001", estado: "enviando", detalle: "incierta: se cortó por tiempo" }]);
});

test("si el DM queda en una solicitud sin aceptar, a Cande le llega el aviso", async () => {
  const falla = Object.assign(new Error("La cuenta no es propietaria del hilo"), { code: 100, subcode: 2534037 });
  const d = armar({ fallas: { 18001: falla } });
  const antes = avisos.length;
  const r = await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios: comentariosDelEvento(aviso(comentario())), avisar: d.avisar });
  assert.equal(r.sin_aceptar, 1);
  assert.equal(d.anotados[0].estado, "sin_aceptar");
  assert.match(avisos.slice(antes).join("\n"), /@undev/);
});

test("un comentario que Instagram dice que ya tenía su respuesta no se insiste", async () => {
  const falla = Object.assign(new Error("invalid for a private reply"), { code: 100, subcode: 2534025 });
  const d = armar({ fallas: { 18001: falla } });
  const r = await contestarDelWebhook({ ig: d.ig, base: d.base, comentarios: comentariosDelEvento(aviso(comentario())), avisar: d.avisar });
  assert.equal(r.ya_contestado, 1);
  assert.deepEqual(d.sueltos, []);
  assert.equal(d.anotados[0].estado, "ya_contestado");
});

/* ---------- el endpoint ---------- */

const pedido = (extra = {}) => ({ method: "POST", headers: {}, query: {}, ...extra });

test("el endpoint: GET verifica, POST sin firma no entra, método raro 405", async () => {
  const { default: handler, config } = await import("../pages/api/ig/webhook.js");
  const llamar = async (req) => { const res = respuesta(); await handler(req, res); return res; };
  assert.equal(config.api.bodyParser, false, "la firma es del cuerpo crudo: el lector de Next lo rearma");
  assert.equal(webhookConfigurado(), false, "sin las claves en el entorno el endpoint está inerte");

  process.env.IG_APP_SECRET = SECRETO;
  process.env.IG_WEBHOOK_VERIFY_TOKEN = TOKEN;
  try {
    assert.equal(webhookConfigurado(), true);
    // La verificación de Meta: el challenge sale en texto pelado, no en JSON.
    const ok = await llamar(pedido({ method: "GET", query: { "hub.mode": "subscribe", "hub.verify_token": TOKEN, "hub.challenge": "1158201444" } }));
    assert.equal(ok.codigo, 200);
    assert.equal(ok.texto, "1158201444");
    assert.match(ok.cabeceras["content-type"], /^text\/plain/);
    const mal = await llamar(pedido({ method: "GET", query: { "hub.mode": "subscribe", "hub.verify_token": "otro", "hub.challenge": "1" } }));
    assert.equal(mal.codigo, 403);

    assert.equal((await llamar(pedido({ method: "PUT" }))).codigo, 405);

    // Un POST con el cuerpo bien pero sin firma: 401 y no se lee nada.
    const crudo = JSON.stringify(aviso(comentario()));
    const sinFirma = await llamar(pedido({ body: crudo }));
    assert.equal(sinFirma.codigo, 401);
    const conFirmaMala = await llamar(pedido({ body: crudo, headers: { "x-hub-signature-256": firmaDeMeta(crudo, "otra-clave") } }));
    assert.equal(conFirmaMala.codigo, 401);

    // Con la firma de Meta pasa (sin POSTGRES_URL no manda nada: el envío va después del 200).
    const bien = await llamar(pedido({ body: crudo, headers: { "x-hub-signature-256": firmaDeMeta(crudo, SECRETO) } }));
    assert.equal(bien.codigo, 200);
    assert.deepEqual(bien.cuerpo, { ok: true, comentarios: 1 });

    // Un aviso que no trae comentarios contesta 200 y no toca la base.
    const vacio = JSON.stringify({ object: "instagram", entry: [{ id: "1", messaging: [{}] }] });
    const r = await llamar(pedido({ body: vacio, headers: { "x-hub-signature-256": firmaDeMeta(vacio, SECRETO) } }));
    assert.deepEqual(r.cuerpo, { ok: true, comentarios: 0 });

    // Un cuerpo que no es JSON no se arregla reintentando: 200 y lo levanta el cron.
    const roto = await llamar(pedido({ body: "no soy json", headers: { "x-hub-signature-256": firmaDeMeta("no soy json", SECRETO) } }));
    assert.equal(roto.codigo, 200);
    assert.deepEqual(roto.cuerpo, { ok: false, motivo: "no es JSON" });
  } finally {
    delete process.env.IG_APP_SECRET;
    delete process.env.IG_WEBHOOK_VERIFY_TOKEN;
  }
});

test("el endpoint lee el cuerpo del stream, que es lo que firma Meta", async () => {
  const { default: handler } = await import("../pages/api/ig/webhook.js");
  process.env.IG_APP_SECRET = SECRETO;
  try {
    const crudo = JSON.stringify(aviso(comentario()));
    async function* trozos() { yield Buffer.from(crudo.slice(0, 20)); yield Buffer.from(crudo.slice(20)); }
    const req = Object.assign(trozos(), { method: "POST", headers: { "x-hub-signature-256": firmaDeMeta(crudo, SECRETO) }, query: {} });
    const res = respuesta();
    await handler(req, res);
    assert.equal(res.codigo, 200);
    assert.deepEqual(res.cuerpo, { ok: true, comentarios: 1 });
  } finally {
    delete process.env.IG_APP_SECRET;
  }
});

test("el cron de 15 minutos sigue estando: es la red si el webhook pierde un aviso", async () => {
  const crons = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8")).crons;
  assert.deepEqual(crons.find((c) => c.path === "/api/dm/comentarios"), { path: "/api/dm/comentarios", schedule: "*/15 * * * *" });
  // Y el webhook no es un cron: no despierta la base en otros minutos (ver tests/crons.test.mjs).
  assert.equal(crons.some((c) => c.path.startsWith("/api/ig/")), false);
});
