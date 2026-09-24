// Proxy de una sola cosa: dejar que TikTok baje una placa desde un dominio que
// SÍ podemos verificar (opengatehub.com), aunque el archivo en sí viva en el
// Blob público de Vercel (un dominio genérico que no se puede verificar).
//
// La API de fotos de TikTok solo acepta PULL_FROM_URL, nunca subida directa, y
// exige que la URL salga de un dominio/prefijo verificado ante ellos (ver
// "Manage URL properties" en el Developer Portal). Por eso este puente: la cola
// sube la placa al Blob como siempre, y acá adentro se re-sirve tal cual desde
// opengatehub.com/api/tt-photo, que es lo que se le pasa a TikTok.
//
// Solo re-sirve URLs que sean del Blob público de Vercel (nunca un proxy abierto
// a cualquier URL de internet).

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

export default async function handler(req, res) {
  const u = req.query.u;
  if (!u || typeof u !== "string") return res.status(400).send("falta u");
  let destino;
  try {
    destino = new URL(u);
  } catch {
    return res.status(400).send("url inválida");
  }
  if (destino.protocol !== "https:" || !BLOB_HOST.test(destino.hostname)) {
    return res.status(400).send("solo se re-sirve el Blob público de Vercel");
  }
  const r = await fetch(destino);
  if (!r.ok) return res.status(502).send("el Blob no contestó: " + r.status);
  res.setHeader("Content-Type", r.headers.get("content-type") || "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400, immutable");
  const bytes = Buffer.from(await r.arrayBuffer());
  res.status(200).send(bytes);
}
