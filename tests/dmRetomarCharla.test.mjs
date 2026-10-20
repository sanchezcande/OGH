// Retomar una charla que se le pasó a Cande y nadie contestó (19/10): el traspaso al agente con
// retomar deja abiertos los mensajes del lead posteriores al último mensaje enviado, y la espera los
// contesta tarde. Sin retomar, el traspaso sigue cerrando el turno como siempre.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const leer = (r) => readFile(new URL(r, import.meta.url), "utf8");

test("el traspaso al agente solo reabre con retomar explícito; si no, cierra el turno como antes", async () => {
  const src = await leer("../pages/api/dm/config.js");
  assert.match(src, /b\.dueno === "agente" && b\.retomar === true\) abiertos = await reabrirTurno\(id\)/);
  assert.match(src, /else if \(b\.dueno === "agente" && previo\?\.dueno === "cande"\) await cerrarTurno\(id/);
});

test("reabrirTurno deja atendido todo lo anterior al último mensaje enviado por la cuenta", async () => {
  const src = await leer("../lib/dm/base.js");
  const i = src.indexOf("export async function reabrirTurno");
  assert.ok(i > -1, "falta reabrirTurno");
  const cuerpo = src.slice(i, i + 900);
  assert.match(cuerpo, /quien IN \('agente', 'cande', 'automatico'\)/);
  assert.match(cuerpo, /m\.quien = 'lead' AND m\.id < ultimo\.cuenta/);
});

test("retomar descarta el pase a Cande que vino después de lo último del lead (su mensaje no llegó a salir)", async () => {
  const src = await leer("../lib/dm/base.js");
  const i = src.indexOf("export async function reabrirTurno");
  const cuerpo = src.slice(i, i + 2200);
  assert.match(cuerpo, /if \(abiertos > 0\)/, "solo si quedó algo abierto");
  assert.match(cuerpo, /SET estado = 'descartada'/);
  assert.match(cuerpo, /s\.accion = 'pasar_a_cande'/, "solo el pase, nunca una respuesta");
  assert.match(cuerpo, /s\.creado >= c\.ultimo_lead/);
});
