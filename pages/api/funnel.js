import { contarFunnel, hayBase } from "../../lib/db";

// Mini reporte del embudo de devs: www.opengatehub.com/api/funnel
// Solo números agregados (personas únicas por fase), nada personal.
const ORDEN = [
  ["form_visto", "Vieron el formulario"],
  ["paso_2", "Pasaron al paso 2"],
  ["paso_3", "Pasaron al paso 3"],
  ["enviado", "Enviaron la aplicación"],
  ["gracias_vista", "Vieron la página del video"],
  ["video_play", "Le dieron play"],
  ["video_25", "Vieron 25%"],
  ["video_50", "Vieron 50%"],
  ["video_75", "Vieron 75%"],
  ["video_fin", "Terminaron el video"],
  ["click_gumroad", "Clickearon comprar (Gumroad)"],
];

export default async function handler(req, res) {
  const dias = Math.min(parseInt(req.query.dias || "30", 10) || 30, 365);
  let filas = [];
  if (hayBase()) {
    try { filas = await contarFunnel(dias); } catch (e) { console.error("funnel:", e.message); }
  }
  const n = Object.fromEntries(filas.map((f) => [f.fase, Number(f.n)]));
  const top = n.form_visto || 0;
  const barras = ORDEN.map(([fase, label]) => {
    const v = n[fase] || 0;
    const pct = top ? Math.round((v / top) * 100) : 0;
    return `<tr><td>${label}</td><td class="n">${v}</td>
      <td class="b"><div style="width:${pct}%"></div></td><td class="p">${pct}%</td></tr>`;
  }).join("");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(200).send(`<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Embudo devs · últimos ${dias} días</title>
<style>
 body{font-family:'Space Grotesk',-apple-system,sans-serif;background:#131013;color:#f5f0f2;
   max-width:680px;margin:40px auto;padding:0 18px}
 h1{font-size:22px} .sub{color:#9d8e95;font-size:13px;margin-bottom:26px}
 table{width:100%;border-collapse:collapse;font-size:14px}
 td{padding:9px 8px;border-bottom:1px solid #2a2226}
 .n{text-align:right;font-weight:700;width:50px}
 .b{width:40%}.b div{height:10px;background:#cc5a50;border-radius:99px;min-width:2px}
 .p{color:#9d8e95;width:44px;text-align:right}
</style>
<h1>Embudo de devs</h1>
<div class="sub">Personas únicas por fase · últimos ${dias} días · % sobre los que vieron el form.
 Cambiá el período con ?dias=7</div>
<table>${barras}</table>`);
}
