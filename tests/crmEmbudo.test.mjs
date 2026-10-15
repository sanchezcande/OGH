// Las cuentas del embudo que el sync le pasa al CRM del dashboard (scripts/crm_embudo.mjs),
// con eventos de mentira. Desde la prueba A/B del video (12/10/2026) las fases de la página de
// gracias llegan como gracias_vista_a, click_gumroad_b...: si el CRM no las cuenta, el tablero
// queda en 0 vistas y 0 clicks y nadie figura como que tocó comprar, que es lo que pasó.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { contarEmbudo, marcarLeads, FASES_A_TRAER } = await import("../scripts/crm_embudo.mjs");
const { separarVersion, FASES_VIDEO } = await import("../lib/videoAB.js");
const { default: evento } = await import("../pages/api/evento.js");

const AHORA = Date.parse("2026-10-15T15:00:00Z");
/** Un evento de funnel_eventos tal como lo devuelve la base. */
const ev = (fase, sid, cuando) => ({ fase, sid, creado: new Date(cuando) });
/** Una persona que se anota: su fila en red_devs y el "enviado" que cae unos ms después. */
const anotada = (id, sid, cuando) => ({
  lead: { id, nombre: `Persona ${id}`, creado: new Date(cuando) },
  enviado: ev("enviado", sid, Date.parse(cuando) + 80),
});

test("una fase con versión se separa en la fase de siempre y la versión", () => {
  assert.deepEqual(separarVersion("click_gumroad_b"), { fase: "click_gumroad", version: "b" });
  assert.deepEqual(separarVersion("gracias_vista_a"), { fase: "gracias_vista", version: "a" });
  assert.deepEqual(separarVersion("click_gumroad"), { fase: "click_gumroad", version: null });
  // /hola manda el origen pegado (hola_vista_ig); un origen "a" no es una versión del video.
  assert.deepEqual(separarVersion("hola_vista_a"), { fase: "hola_vista_a", version: null });
  assert.deepEqual(separarVersion("form_visto_a"), { fase: "form_visto_a", version: null });
  assert.deepEqual(separarVersion("click_gumroad_c"), { fase: "click_gumroad_c", version: null });
});

test("el sync trae de la base todas las fases del video, con y sin versión", () => {
  for (const f of FASES_VIDEO) for (const x of [f, `${f}_a`, `${f}_b`]) assert.ok(FASES_A_TRAER.includes(x), x);
  for (const f of ["form_visto", "enviado"]) assert.ok(FASES_A_TRAER.includes(f), f);
});

test("/api/evento acepta las fases del video con versión, y nada más con ese sufijo", async () => {
  const mandar = async (fase) => {
    const res = respuesta();
    await evento({ method: "POST", body: { fase, sid: "sid-x" } }, res);
    return res.codigo;
  };
  for (const f of FASES_VIDEO) {
    assert.equal(await mandar(`${f}_a`), 200, `${f}_a`);
    assert.equal(await mandar(`${f}_b`), 200, `${f}_b`);
    assert.equal(await mandar(`${f}_c`), 400, `${f}_c`);
  }
  assert.equal(await mandar("enviado_a"), 400);
});

test("quien tocó comprar en la versión A o B figura como que tocó comprar, con su versión", () => {
  const conB = anotada(1, "sid-1", "2026-10-13T14:00:00Z");
  const conA = anotada(2, "sid-2", "2026-10-13T16:00:00Z");
  const soloMiro = anotada(3, "sid-3", "2026-10-13T18:00:00Z");
  const antes = anotada(4, "sid-4", "2026-10-05T18:00:00Z");
  const eventos = [
    conB.enviado, ev("gracias_vista_b", "sid-1", "2026-10-13T14:00:01Z"), ev("click_gumroad_b", "sid-1", "2026-10-13T14:04:00Z"),
    conA.enviado, ev("gracias_vista_a", "sid-2", "2026-10-13T16:00:01Z"), ev("click_gumroad_a", "sid-2", "2026-10-13T16:03:00Z"),
    soloMiro.enviado, ev("gracias_vista_a", "sid-3", "2026-10-13T18:00:01Z"), ev("video_play_a", "sid-3", "2026-10-13T18:00:09Z"),
    antes.enviado, ev("gracias_vista", "sid-4", "2026-10-05T18:00:01Z"), ev("click_gumroad", "sid-4", "2026-10-05T18:02:00Z"),
  ];
  const leads = marcarLeads([conB.lead, conA.lead, soloMiro.lead, antes.lead], eventos);
  assert.deepEqual(leads.map((l) => [l.id, l.clickeo_comprar, l.video_version]), [
    [1, true, "b"],
    [2, true, "a"],
    [3, false, "a"],
    [4, true, null],   // antes de la prueba: tocó comprar igual que siempre, sin versión
  ]);
});

test("dos que se anotan con segundos de diferencia no se pisan: cada uno con su evento", () => {
  const compra = anotada(1, "sid-1", "2026-10-13T14:00:00Z");
  const noCompra = anotada(2, "sid-2", "2026-10-13T14:00:02Z");
  const eventos = [
    compra.enviado, noCompra.enviado,
    ev("gracias_vista_b", "sid-1", "2026-10-13T14:00:01Z"), ev("click_gumroad_b", "sid-1", "2026-10-13T14:05:00Z"),
    ev("gracias_vista_a", "sid-2", "2026-10-13T14:00:03Z"),
  ];
  const [uno, dos] = marcarLeads([compra.lead, noCompra.lead], eventos);
  assert.deepEqual([uno.clickeo_comprar, uno.video_version], [true, "b"]);
  assert.deepEqual([dos.clickeo_comprar, dos.video_version], [false, "a"]);
});

test("un lead sin evento enviado cerca no toca comprar ni tiene versión", () => {
  const [solo] = marcarLeads([{ id: 9, creado: new Date("2026-10-13T10:00:00Z") }],
    [ev("enviado", "sid-1", "2026-10-13T10:00:06Z"), ev("click_gumroad_a", "sid-1", "2026-10-13T10:02:00Z")]);
  assert.equal(solo.clickeo_comprar, false);
  assert.equal(solo.video_version, null);
});

test("el embudo del día cuenta las versiones como la fase de siempre, y además por versión", () => {
  const eventos = [
    ev("form_visto", "sid-1", "2026-10-13T14:00:00Z"), ev("enviado", "sid-1", "2026-10-13T14:01:00Z"),
    ev("gracias_vista_a", "sid-1", "2026-10-13T14:01:01Z"), ev("video_play_a", "sid-1", "2026-10-13T14:01:05Z"),
    ev("video_50_a", "sid-1", "2026-10-13T14:02:00Z"), ev("click_gumroad_a", "sid-1", "2026-10-13T14:02:30Z"),
    ev("form_visto", "sid-2", "2026-10-13T15:00:00Z"), ev("enviado", "sid-2", "2026-10-13T15:01:00Z"),
    ev("gracias_vista_b", "sid-2", "2026-10-13T15:01:01Z"), ev("video_play_b", "sid-2", "2026-10-13T15:01:05Z"),
    ev("video_fin_b", "sid-2", "2026-10-13T15:07:00Z"), ev("click_gumroad_b", "sid-2", "2026-10-13T15:07:10Z"),
    // Con la página vieja en caché: manda sin versión y después con versión. Es una sola persona.
    ev("gracias_vista", "sid-3", "2026-10-13T16:00:00Z"), ev("gracias_vista_b", "sid-3", "2026-10-13T16:05:00Z"),
  ];
  const { dias: [dia] } = contarEmbudo(eventos, { ahora: AHORA });
  assert.equal(dia.dia, "2026-10-13");
  assert.deepEqual(
    { vieron: dia.vieron, enviaron: dia.enviaron, video_pagina: dia.video_pagina, play: dia.play, terminaron: dia.terminaron, clicks: dia.clicks },
    { vieron: 2, enviaron: 2, video_pagina: 3, play: 2, terminaron: 1, clicks: 2 });
  assert.deepEqual(dia.version.a, { video_pagina: 1, play: 1, vio_25: 0, vio_50: 1, vio_75: 0, terminaron: 0, clicks: 1 });
  assert.deepEqual(dia.version.b, { video_pagina: 2, play: 1, vio_25: 0, vio_50: 0, vio_75: 0, terminaron: 1, clicks: 1 });
});

test("el día es el de Argentina, el más nuevo va primero, y el total incluye lo de hace más de 21 días", () => {
  const eventos = [
    ev("click_gumroad_b", "sid-1", "2026-10-13T02:00:00Z"),   // 12/10 23:00 en Argentina
    ev("click_gumroad_a", "sid-2", "2026-10-14T12:00:00Z"),
    ev("click_gumroad", "sid-3", "2026-09-01T12:00:00Z"),     // fuera de los 21 días
  ];
  const { dias, total } = contarEmbudo(eventos, { ahora: AHORA });
  assert.deepEqual(dias.map((d) => [d.dia, d.clicks]), [["2026-10-14", 1], ["2026-10-12", 1]]);
  assert.equal(total.clicks, 3);
  assert.equal(total.version.a.clicks, 1);
  assert.equal(total.version.b.clicks, 1);
});
