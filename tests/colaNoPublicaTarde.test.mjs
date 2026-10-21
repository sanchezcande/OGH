import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

// 21/10/2026. La base (Neon) se pasó de cuota y estuvo horas rechazando toda conexión, así que
// /api/cola-publicar no corrió y lo programado lo fue publicando la Mac. Lo peligroso es la VUELTA:
// esas filas quedan en "esperando" con su hora vieja y el cron las publicaba todas juntas, encima
// de lo que ya salió. Es exactamente el incidente de b8v4 (salió tres veces).
// Estas pruebas fallan si alguien saca el corte por atraso o lo deja DESPUÉS de leer la cola.

const leer = () => fs.readFile(new URL("../pages/api/cola-publicar.js", import.meta.url), "utf8");

test("las filas muy atrasadas se marcan vencidas y no se publican", async () => {
  const src = await leer();
  const corte = /UPDATE cola_publicaciones SET estado = 'error',\s*resultado = '[^']*'\s*WHERE estado = 'esperando' AND cuando < NOW\(\) - INTERVAL '(\d+) hours'/.exec(src);
  assert.ok(corte, "no está el corte por atraso en /api/cola-publicar");
  const horas = Number(corte[1]);
  assert.ok(horas >= 1 && horas <= 24, `el corte quedó en ${horas} horas: con tan poco se comen piezas sanas, con tanto vuelven a salir repetidas`);
});

test("el corte corre ANTES de leer la cola, no después", async () => {
  const src = await leer();
  const iCorte = src.indexOf("AND cuando < NOW() - INTERVAL");
  const iLee = src.indexOf("WHERE estado = 'esperando' AND cuando <= NOW()");
  assert.ok(iCorte > -1 && iLee > -1);
  assert.ok(iCorte < iLee, "el corte quedó después del SELECT: esa misma corrida publica igual las atrasadas");
});

test("el corte no toca las filas que todavía no llegaron a su hora", async () => {
  const src = await leer();
  // Tiene que mirar "cuando", no "creado" ni "tomado_en": una fila programada para mañana
  // no puede marcarse vencida hoy.
  const iCorte = src.indexOf("AND cuando < NOW() - INTERVAL");
  const bloque = src.slice(src.lastIndexOf("UPDATE cola_publicaciones", iCorte),
                           src.indexOf("WHERE estado = 'esperando' AND cuando <= NOW()"));
  assert.match(bloque, /WHERE estado = 'esperando'/);
  assert.match(bloque, /cuando < NOW\(\)/);
  assert.ok(!/estado = 'yendo'/.test(bloque), "no tiene que tocar las que se están publicando ahora mismo");
});
