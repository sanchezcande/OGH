// El recordatorio de la llamada de 15 minutos (23/11/2026, tres plantones en un día).
//
// Lo que se cuida acá:
//   - que el usuario de Instagram salga de la reserva aunque la persona lo escriba como quiera;
//   - que el recordatorio salga una hora antes y NO salga si la llamada ya es inminente o pasó;
//   - que el texto sea el de ella: voseo, sin signos de apertura y sin guion largo.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const {
  MINUTOS_ANTES, MINUTOS_TARDE, cuandoSale, datosDeLaReserva, leToca, primerNombre,
  textosDelRecordatorio, usuarioIg,
} = await import("../lib/recordatorioLlamada.js");

test("el usuario de Instagram sale escrito como sea", () => {
  assert.equal(usuarioIg("@Juan.Perez"), "juan.perez");
  assert.equal(usuarioIg("  JuanPerez "), "juanperez");
  assert.equal(usuarioIg("https://www.instagram.com/dev.ric/"), "dev.ric");
  assert.equal(usuarioIg("instagram.com/dev_ric?hl=es"), "dev_ric");
  // Lo que no es un usuario no se adivina: antes mandarle a cualquiera.
  assert.equal(usuarioIg("no tengo"), "");
  assert.equal(usuarioIg(""), "");
  assert.equal(usuarioIg(null), "");
});

test("de la reserva salen nombre, mail, telefono y usuario", () => {
  const d = datosDeLaReserva({
    titulo: "15 minutos con Cande (Ricardo Aguirre)",
    descripcion: "<b>Programada por</b>\nRicardo Aguirre\ndev.ric.ag@gmail.com\n+524775663310\n"
      + "<b>Tu usuario de Instagram (te mando el recordatorio por ahi)</b>\n@dev.ric",
  });
  assert.equal(d.nombre, "Ricardo Aguirre");
  assert.equal(d.mail, "dev.ric.ag@gmail.com");
  assert.equal(d.telefono, "+524775663310");
  assert.equal(d.usuario, "dev.ric");
});

test("una reserva vieja, sin el campo de Instagram, no inventa usuario", () => {
  const d = datosDeLaReserva({
    titulo: "15 minutos con Cande (juan fernandez)",
    descripcion: "<b>Programada por</b>\njuan fernandez\npromptgen.ia@gmail.com\n3513188843",
  });
  assert.equal(d.nombre, "juan fernandez");
  assert.equal(d.usuario, "");
});

test("el recordatorio sale una hora antes", () => {
  const llamada = new Date("2026-11-24T21:00:00Z");
  assert.equal(cuandoSale(llamada).toISOString(), "2026-11-24T20:00:00.000Z");
  assert.equal(MINUTOS_ANTES, 60);
});

test("le toca cuando ya pasó su hora y la llamada todavía no es inminente", () => {
  const fila = { mandar_a: "2026-11-24T20:00:00Z", cuando: "2026-11-24T21:00:00Z" };
  assert.equal(leToca(fila, new Date("2026-11-24T19:59:00Z")), false, "antes de hora no sale");
  assert.equal(leToca(fila, new Date("2026-11-24T20:00:00Z")), true);
  assert.equal(leToca(fila, new Date("2026-11-24T20:30:00Z")), true, "una corrida tarde igual sale");
  // Faltando MINUTOS_TARDE o menos ya no sirve: llega cuando la llamada arrancó.
  assert.equal(leToca(fila, new Date("2026-11-24T20:51:00Z")), false);
  assert.equal(leToca(fila, new Date("2026-11-24T21:30:00Z")), false, "la llamada ya pasó");
  assert.equal(MINUTOS_TARDE, 10);
});

test("el texto es el de ella y le da la salida de avisar", () => {
  const t = textosDelRecordatorio("Ricardo Aguirre", "https://meet.google.com/qsd-gdjc-uqx");
  assert.equal(t.length, 2);
  assert.match(t[0], /^Buenas Ricardo! /, "arranca por su primer nombre");
  assert.match(t[1], /https:\/\/meet\.google\.com\/qsd-gdjc-uqx/);
  assert.match(t[1], /avisame/, "el que no llega tiene qué contestar");
  for (const x of t) {
    assert.ok(!/[¿¡—]/.test(x), `nunca signos de apertura ni guion largo: ${x}`);
    assert.ok(!/\btu\b (?:puedes|tienes)/.test(x), "voseo, nunca tuteo");
  }
});

test("sin nombre y sin link el texto sigue siendo mandable", () => {
  const t = textosDelRecordatorio("", "");
  assert.equal(t[0], "Buenas! En una hora tenemos la llamada de 15 minutos.");
  assert.ok(!t[1].includes("undefined") && !t[1].includes("null"));
  assert.equal(primerNombre("  "), "");
});
