// El cron que manda los recordatorios de llamada. Vercel lo llama cada 15 minutos.
//
// 23/11/2026: tres plantones en un día. La agenda de Google ya avisa por mail un día antes y no
// alcanza, así que una hora antes sale un mensaje por Instagram, que es donde esta gente contesta.
// El texto es fijo (lib/recordatorioLlamada.js): no pasa por el modelo, no inventa nada.
//
// Apagado de fábrica. Se prende con dm_config "recordatorios" = { "activo": true }, cuando Cande
// aprueba el texto: nada sale hacia una persona sin que ella lo diga.
//
// Si una charla no se puede contestar (la ventana de 24 horas de Instagram cerrada, el contacto sin
// encontrar), no se insiste ni se busca otro camino: queda anotado el motivo y le llega el aviso a
// Cande, que todavía puede escribirle ella.
import { avisarDm, envio } from "../../../lib/dm/armado";
import { leerConfig } from "../../../lib/dm/base";
import { leToca, textosDelRecordatorio } from "../../../lib/recordatorioLlamada";
import {
  borrarViejos, contactoPorUsuario, marcar, paraMandar, tomar, vencer,
} from "../../../lib/dm/recordatoriosBase";

const POR_CORRIDA = 10;

export default async function handler(req, res) {
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!process.env.POSTGRES_URL) return res.status(200).json({ ok: true, mandados: 0 });

  const ajuste = await leerConfig("recordatorios");
  if (ajuste?.activo !== true) return res.status(200).json({ ok: true, mandados: 0, motivo: "apagado" });

  await vencer();
  const filas = await paraMandar(POR_CORRIDA);
  let mandados = 0;
  const sinSalir = [];

  for (const f of filas) {
    if (!leToca(f)) continue;
    const usuario = String(f.usuario || "").trim();
    if (!usuario) {
      await marcar(f.uid, "sin_usuario", "la reserva no trae usuario de Instagram");
      sinSalir.push({ nombre: f.nombre, motivo: "sin usuario de Instagram" });
      continue;
    }
    let contacto = null;
    try {
      contacto = await contactoPorUsuario(usuario);
    } catch (e) {
      await marcar(f.uid, "error", `no se pudo buscar el contacto: ${e.message}`);
      continue;
    }
    if (!contacto) {
      // Puede aparecer más tarde (el agente lo da de alta cuando escribe): la fila queda viva.
      await marcar(f.uid, "sin_contacto", `no hay charla con @${usuario}`);
      sinSalir.push({ nombre: f.nombre, motivo: `no hay charla con @${usuario}` });
      continue;
    }
    if (!(await tomar(f.uid))) continue;
    try {
      const r = await envio.mandarTextos(contacto, textosDelRecordatorio(f.nombre, f.link));
      if (r.ok || r.incierto) {
        await marcar(f.uid, "mandado", r.por || null, contacto);
        mandados += 1;
      } else {
        await marcar(f.uid, "error", r.error || "no salió", contacto);
        sinSalir.push({ nombre: f.nombre, motivo: r.error || "no salió" });
      }
    } catch (e) {
      await marcar(f.uid, "error", String(e.message || e), contacto);
      sinSalir.push({ nombre: f.nombre, motivo: String(e.message || e).slice(0, 120) });
    }
  }

  // Lo que no salió se lo decimos a Cande UNA vez, con nombre y motivo: todavía está a tiempo de
  // escribirle ella antes de la llamada.
  if (sinSalir.length) {
    try {
      await avisarDm("Recordatorio de llamada sin salir", {
        Quien: sinSalir.map((x) => `${x.nombre || "?"} (${x.motivo})`).join(" · "),
      }, { contestable: false });
    } catch (e) {
      console.error("recordatorios: no se pudo avisar", e.message);
    }
  }
  try {
    await borrarViejos();
  } catch (e) {
    console.error("recordatorios: no se pudo borrar lo viejo", e.message);
  }
  return res.status(200).json({ ok: true, mandados, sin_salir: sinSalir.length });
}

export const config = { maxDuration: 120 };
