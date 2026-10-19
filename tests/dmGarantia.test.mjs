// La garantía de 30 días es real: el agente la puede decir, y solo esa (20/10).
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { revisar } = await import("../lib/dm/frenos.js");

const estadoDev = { quien: "dev", busca: "si", dolor: "de prueba", etapa: "precio", link_formulario_enviado: true, precio_dicho: true };
const salida = (mensajes) => ({ accion: "responder", mensajes, estado: estadoDev, aviso_para_cande: "", seguimiento_en_horas: null, motivo: "" });

test("la garantía real de 30 días pasa, escrita de varias formas", () => {
  for (const m of [
    "Además hay garantía de 30 días, si no te sirve te devuelvo la plata",
    "hay garantia de 30 dias. te devuelvo la plata si no te sirve",
    "Ojo que hay garantía de 30 días; te devuelvo la plata, tranqui",
  ]) assert.deepEqual(revisar(salida([m])), { ok: true }, m);
});

test("cualquier otra garantía o devolución sigue frenada", () => {
  for (const m of [
    "Te garantizo que conseguís trabajo",
    "Si no conseguís trabajo te devuelvo la plata",
    "Hay garantía de 60 días, si no te sirve te devuelvo la plata",
    "Trabajo garantizado",
    "Te hago un reembolso",
  ]) assert.equal(revisar(salida([m])).ok, false, m);
});
