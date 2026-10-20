// La compra tiene que quedar en la base, no solo en el aviso de Telegram: hasta el 20/10 para
// saber quién compró había que abrir Gumroad a mano.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../pages/api/gumroad-ping.js", import.meta.url), "utf8");

test("la venta queda anotada en la base", () => {
  assert.match(src, /INSERT INTO compras/, "sin esto la compra solo existe en Gumroad");
  assert.match(src, /await anotarCompra\(/);
});

test("el aviso a Telegram va primero: si la base falla, ella se entera igual", () => {
  const aviso = src.indexOf("const ok = await avisar(");
  const anota = src.indexOf("await anotarCompra(");
  assert.ok(aviso > 0 && anota > aviso, "anotar antes del aviso arriesga el aviso");
});

test("anotar nunca rompe la respuesta: Gumroad reintenta y avisaria dos veces", () => {
  assert.match(src, /catch \(e\) \{\s*console\.error\("gumroad-ping: no pude anotar/);
  assert.equal(/res\.status\(500\)/.test(src), false);
});

test("una compra de prueba no entra a la base", () => {
  assert.match(src, /if \(!prueba\) \{/);
});

test("el mismo ping dos veces no duplica la venta", () => {
  const db = readFileSync(new URL("../lib/compras.js", import.meta.url), "utf8");
  assert.match(db, /compras_venta_idx/, "el indice unico vive con la tabla, en lib/compras.js");
  assert.match(src, /ON CONFLICT \(venta_id\) WHERE venta_id IS NOT NULL DO NOTHING/);
});

test("la tabla se define en un solo lugar", () => {
  assert.equal(/CREATE TABLE IF NOT EXISTS compras/.test(src), false,
    "la DDL va en lib/compras.js (asegurarTablaCompras), no repetida en el endpoint");
  assert.match(src, /await asegurarTablaCompras\(\)/);
});
