import { sql } from "@vercel/postgres";

// Lo que el dashboard de Cande manda a la nube:
//   { accion: "programar", red, item, caption, media[], portada, cuando }  → una fila en la cola
//   { accion: "tokens", red: "ig"|"li", data }                             → guarda/renueva el token
//   { accion: "estado" }                                                   → qué hay en la cola
//
// Protegido con el mismo secreto que el cron (COLA_SECRET). Los tokens se guardan
// pero nunca se devuelven.

export default async function handler(req, res) {
  const secreto = process.env.COLA_SECRET;
  const dado = req.headers.authorization || "";
  if (!secreto || (dado !== `Bearer ${secreto}` && dado !== secreto)) {
    return res.status(401).json({ error: "no" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const b = req.body || {};
  await sql`
    CREATE TABLE IF NOT EXISTS cola_publicaciones (
      id SERIAL PRIMARY KEY, red TEXT NOT NULL, item TEXT NOT NULL,
      caption TEXT DEFAULT '', media JSONB DEFAULT '[]'::jsonb, portada TEXT,
      cuando TIMESTAMPTZ NOT NULL, estado TEXT DEFAULT 'esperando', resultado TEXT,
      creado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`
    CREATE TABLE IF NOT EXISTS tokens_redes (
      red TEXT PRIMARY KEY, data JSONB NOT NULL, actualizado TIMESTAMPTZ DEFAULT NOW())`;

  if (b.accion === "tokens") {
    if (!b.red || !b.data) return res.status(400).json({ error: "falta red o data" });
    await sql`
      INSERT INTO tokens_redes (red, data) VALUES (${b.red}, ${JSON.stringify(b.data)}::jsonb)
      ON CONFLICT (red) DO UPDATE SET data = EXCLUDED.data, actualizado = NOW()`;
    return res.status(200).json({ ok: true });
  }

  if (b.accion === "programar") {
    const { red, item, caption = "", media = [], portada = null, cuando } = b;
    if (!red || !item || !cuando) return res.status(400).json({ error: "faltan datos" });
    // una sola programación por cosa: si ya estaba, se pisa con la nueva hora
    await sql`
      DELETE FROM cola_publicaciones
      WHERE red = ${red} AND item = ${item} AND estado = 'esperando'`;
    const { rows } = await sql`
      INSERT INTO cola_publicaciones (red, item, caption, media, portada, cuando)
      VALUES (${red}, ${item}, ${caption}, ${JSON.stringify(media)}::jsonb, ${portada},
              to_timestamp(${Number(cuando)}))
      RETURNING id, cuando`;
    return res.status(200).json({ ok: true, ...rows[0] });
  }

  if (b.accion === "cancelar") {
    await sql`
      DELETE FROM cola_publicaciones
      WHERE red = ${b.red} AND item = ${b.item} AND estado = 'esperando'`;
    return res.status(200).json({ ok: true });
  }

  if (b.accion === "estado") {
    const { rows } = await sql`
      SELECT id, red, item, cuando, estado, resultado FROM cola_publicaciones
      WHERE creado > NOW() - INTERVAL '7 days' ORDER BY cuando ASC`;
    return res.status(200).json({ ok: true, cola: rows });
  }

  return res.status(400).json({ error: "acción desconocida" });
}
