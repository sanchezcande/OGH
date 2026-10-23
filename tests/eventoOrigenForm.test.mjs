import { test } from "node:test";
import assert from "node:assert/strict";
import { ORIGENES, OTRO, normalizarOrigen, FASES_ORIGEN_FORM} from "../lib/origenForm.js";

test("acepta las puertas conocidas, tal cual", () => {
  for (const o of ORIGENES) {
    assert.equal(normalizarOrigen(o), o);
    assert.ok(FASES_ORIGEN_FORM.has("form_visto_" + o), o);
  }
});

test("normaliza mayusculas y espacios en vez de abrir una puerta nueva", () => {
  assert.equal(normalizarOrigen("CV-DM"), "cv-dm");
  assert.equal(normalizarOrigen("  Bienvenida  "), "bienvenida");
});

test("lo que no esta en la lista cae en otro, no se pierde", () => {
  for (const raro of ["cvdm", "cv_dm", "tiktok", "<script>", "'; DROP TABLE", "x".repeat(200)]) {
    assert.equal(normalizarOrigen(raro), OTRO, raro);
  }
  assert.ok(FASES_ORIGEN_FORM.has("form_visto_otro"));
});

test("vacio o ausente no manda nada", () => {
  for (const v of ["", "   ", null, undefined]) assert.equal(normalizarOrigen(v), null, String(v));
});

test("la API solo acepta las fases de la lista, ni una mas", () => {
  assert.equal(FASES_ORIGEN_FORM.size, ORIGENES.length + 1);
  for (const mala of ["form_visto_", "form_visto_cvdm", "form_visto_tiktok", "form_visto", "hola_vista_ig"]) {
    assert.ok(!FASES_ORIGEN_FORM.has(mala), mala);
  }
});

test("una puerta nueva mal escrita se ve como otro, no como silencio", () => {
  // El caso que justifica el fallback: alguien pone ?de=linkedin y nadie lo agrego a la lista.
  assert.equal(normalizarOrigen("linkedin"), OTRO);
});

test("la bifurcacion /hola manda la puerta, si no bio da 0 para siempre", async () => {
  const fs = await import("node:fs/promises");
  const src = await fs.readFile(new URL("../pages/hola.jsx", import.meta.url), "utf8");
  const m = /dev:\s*"([^"]+)"/.exec(src);
  assert.ok(m, "no encontre el destino dev en pages/hola.jsx");
  const de = new URL(m[1], "https://x.test").searchParams.get("de");
  assert.equal(normalizarOrigen(de), "bio");
});

// La puerta queda en la fila del lead (24/10/2026). Antes el ?de= solo vivía en funnel_eventos,
// donde nadie tiene nombre: no se podía cruzar un lead ni una compra con la puerta que lo trajo.
test("la puerta se guarda en la fila del lead y la primera no se pisa", async () => {
  const fs = await import("node:fs/promises");
  const db = await fs.readFile(new URL("../lib/db.js", import.meta.url), "utf8");
  assert.ok(/ADD COLUMN IF NOT EXISTS puerta TEXT/.test(db), "falta la columna puerta");
  assert.ok(/ig_contacto, puerta\)/.test(db), "el INSERT no manda puerta");
  assert.ok(/puerta = COALESCE\(red_devs\.puerta, EXCLUDED\.puerta\)/.test(db),
            "al volver a llenar el formulario se pisaría la puerta original");

  const api = await fs.readFile(new URL("../pages/api/devs-red.js", import.meta.url), "utf8");
  assert.ok(/d\.puerta = normalizarOrigen\(d\.puerta\)/.test(api),
            "la API tiene que normalizar la puerta y no guardar lo que venga crudo");

  const pag = await fs.readFile(new URL("../pages/devs/index.jsx", import.meta.url), "utf8");
  assert.ok(/puerta \? \{ puerta \} : \{\}/.test(pag), "la página no manda la puerta en el envío");
});

test("lo que la página manda como puerta es lo que la base puede agrupar", () => {
  // Si la página mandara algo que normalizarOrigen no conoce, red_devs.puerta se llenaría de
  // "otro" y no se podría contar nada por puerta.
  for (const p of ORIGENES) assert.equal(normalizarOrigen(p), p);
  assert.equal(normalizarOrigen("cv-comentario"), "cv-comentario");
});
