import test from "node:test";
import assert from "node:assert/strict";
import { botonChat } from "../lib/ofertaWhatsapp.js";

test("botonChat abre el chat sin mensaje escrito", () => {
  const b = botonChat({ whatsapp: "+54 9 11 2348 5638", pais: "Argentina" });
  assert.equal(b.url, "https://wa.me/5491123485638");
});

test("botonChat sin número confiable devuelve null", () => {
  assert.equal(botonChat({ whatsapp: "N/A", pais: "Argentina" }), null);
  assert.equal(botonChat({ whatsapp: null, pais: null }), null);
});
