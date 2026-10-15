import { test } from "node:test";
import assert from "node:assert/strict";

// Mismo patron que acepta pages/api/evento.js para el origen del formulario.
const CON_ORIGEN_FORM = /^form_visto_[a-z0-9-]{1,24}$/;
const CON_ORIGEN = /^hola_(vista|contrata|dev)_[a-z0-9]{1,16}$/;

// Lo que hace la pagina con ?de= antes de mandarlo.
const limpiar = (de) => (de || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);

test("acepta los origenes que vamos a usar", () => {
  for (const de of ["cv-dm", "cv-comentario", "bienvenida", "bio", "li"]) {
    assert.ok(CON_ORIGEN_FORM.test("form_visto_" + de), de);
  }
});

test("no deja escribir basura en funnel_eventos", () => {
  for (const mala of [
    "form_visto_",                       // sin origen
    "form_visto_" + "a".repeat(25),      // pasado de largo
    "form_visto_CV",                     // mayusculas
    "form_visto_cv dm",                  // espacio
    "form_visto_cv_dm",                  // guion bajo, solo se acepta el del medio
    "form_visto_<script>",               // inyeccion
    "otra_fase_cv",                      // otra fase
  ]) {
    assert.ok(!CON_ORIGEN_FORM.test(mala), mala);
  }
});

test("no se pisa con el patron de /hola", () => {
  assert.ok(!CON_ORIGEN_FORM.test("hola_vista_ig"));
  assert.ok(!CON_ORIGEN.test("form_visto_cv-dm"));
});

test("la limpieza de ?de= deja algo valido o nada", () => {
  assert.equal(limpiar("CV-DM"), "cv-dm");
  assert.equal(limpiar("cv dm!"), "cvdm");
  assert.equal(limpiar("<script>"), "script");
  assert.equal(limpiar("x".repeat(40)).length, 24);
  assert.equal(limpiar("!!!"), "");
  assert.equal(limpiar(null), "");
  for (const v of ["CV-DM", "cv dm!", "x".repeat(40)]) {
    const l = limpiar(v);
    if (l) assert.ok(CON_ORIGEN_FORM.test("form_visto_" + l), v);
  }
});
