import { sql } from "@vercel/postgres";

// Publica lo que Cande dejó programado, sin depender de que su Mac esté prendida.
//
// Cómo encaja todo:
//   1. En el dashboard ella toca "programar". El dashboard sube el archivo al Blob
//      público (ogh-publicar) y escribe una fila acá, en `cola_publicaciones`.
//   2. Un cron externo (GitHub Actions, cada 10 minutos) llama a este endpoint.
//   3. Este endpoint publica lo que ya venció y marca la fila.
//
// Los tokens viven en `tokens_redes` y los sube el dashboard: así se pueden renovar
// sin tocar variables de entorno. Nunca se devuelven en la respuesta.
//
// YouTube no pasa por acá: su propia API ya programa (se sube con publishAt).

const GRAPH = "https://graph.facebook.com/v23.0";
const LI_API = "https://api.linkedin.com";
const MAX_POR_CORRIDA = 5;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function tablas() {
  await sql`
    CREATE TABLE IF NOT EXISTS cola_publicaciones (
      id SERIAL PRIMARY KEY,
      red TEXT NOT NULL,              -- ig-car | ig-reel | ig-trial | li-post | li-car
      item TEXT NOT NULL,             -- c32, b7v4, o el índice del post de LinkedIn
      caption TEXT DEFAULT '',
      media JSONB DEFAULT '[]'::jsonb,-- URLs públicas (placas o video)
      portada TEXT,                   -- URL de la portada, solo reels
      cuando TIMESTAMPTZ NOT NULL,
      estado TEXT DEFAULT 'esperando',-- esperando | yendo | ok | error
      contenedor TEXT,                -- id del contenedor de Meta, mientras procesa el video
      resultado TEXT,
      creado TIMESTAMPTZ DEFAULT NOW()
    )`;
  await sql`ALTER TABLE cola_publicaciones ADD COLUMN IF NOT EXISTS contenedor TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS tokens_redes (
      red TEXT PRIMARY KEY,           -- ig | li
      data JSONB NOT NULL,
      actualizado TIMESTAMPTZ DEFAULT NOW()
    )`;
}

async function token(red) {
  const { rows } = await sql`SELECT data FROM tokens_redes WHERE red = ${red}`;
  if (!rows.length) throw new Error(`falta el token de ${red} (lo sube el dashboard)`);
  return rows[0].data;
}

/* ---------- Instagram ---------- */

async function igPost(path, params, tok) {
  const r = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    body: new URLSearchParams({ ...params, access_token: tok }),
  });
  const j = await r.json();
  if (j.error) throw new Error("Meta: " + (j.error.message || JSON.stringify(j.error)));
  return j;
}

async function igListo(contenedor, tok) {
  const r = await fetch(`${GRAPH}/${contenedor}?fields=status_code&access_token=${tok}`);
  const j = await r.json();
  if (j.status_code === "ERROR") throw new Error("Meta no pudo procesar el video");
  return j.status_code === "FINISHED";
}

async function publicarIG(fila) {
  const { id: igid, token: tok } = await token("ig");

  // segunda pasada: el contenedor ya existía, solo falta ver si Meta terminó
  if (fila.contenedor) {
    if (!(await igListo(fila.contenedor, tok))) return null;   // todavía procesando
    const pub = await igPost(`${igid}/media_publish`, { creation_id: fila.contenedor }, tok);
    const r = await fetch(`${GRAPH}/${pub.id}?fields=permalink&access_token=${tok}`);
    return (await r.json()).permalink || "https://www.instagram.com/candelaria.sanchezg/";
  }

  let contenedor;
  if (fila.red === "ig-car") {
    const hijos = [];
    for (const url of fila.media) {
      const h = await igPost(`${igid}/media`, { image_url: url, is_carousel_item: "true" }, tok);
      hijos.push(h.id);
    }
    contenedor = (await igPost(`${igid}/media`, {
      media_type: "CAROUSEL", children: hijos.join(","), caption: fila.caption || "",
    }, tok)).id;
  } else {
    const params = { media_type: "REELS", video_url: fila.media[0], caption: fila.caption || "" };
    if (fila.portada) params.cover_url = fila.portada;
    // reel de prueba: lo ven solo los que no la siguen, y ella lo pasa al feed después
    if (fila.red === "ig-trial") params.trial_params = JSON.stringify({ graduation_strategy: "MANUAL" });
    contenedor = (await igPost(`${igid}/media`, params, tok)).id;
    // los videos tardan: guardamos el contenedor y lo publica la corrida siguiente
    await sql`UPDATE cola_publicaciones SET contenedor = ${contenedor}, estado = 'esperando'
              WHERE id = ${fila.id}`;
    if (!(await igListo(contenedor, tok))) return null;
  }

  const pub = await igPost(`${igid}/media_publish`, { creation_id: contenedor }, tok);
  const r = await fetch(`${GRAPH}/${pub.id}?fields=permalink&access_token=${tok}`);
  const j = await r.json();
  return j.permalink || `https://www.instagram.com/candelaria.sanchezg/`;
}

/* ---------- LinkedIn ---------- */

function liHeaders(t) {
  return {
    Authorization: "Bearer " + t.access_token,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": "202605",
    "Content-Type": "application/json",
  };
}

async function liSubirImagen(t, url) {
  const ini = await fetch(`${LI_API}/rest/images?action=initializeUpload`, {
    method: "POST", headers: liHeaders(t),
    body: JSON.stringify({ initializeUploadRequest: { owner: t.urn } }),
  }).then((r) => r.json());
  const val = ini.value;
  const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
  const put = await fetch(val.uploadUrl, {
    method: "PUT",
    headers: { Authorization: "Bearer " + t.access_token, "Content-Type": "image/png" },
    body: bytes,
  });
  if (!put.ok) throw new Error("LinkedIn rechazó la imagen: " + put.status);
  return val.image;
}

async function publicarLI(fila) {
  const t = await token("li");
  if (t.vence && t.vence * 1000 < Date.now()) throw new Error("el token de LinkedIn venció");

  const cuerpo = {
    author: t.urn, commentary: fila.caption || "", visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false,
  };
  if (fila.red === "li-car" && fila.media.length) {
    const ids = [];
    for (const url of fila.media) ids.push(await liSubirImagen(t, url));
    cuerpo.content = ids.length === 1
      ? { media: { id: ids[0] } }
      : { multiImage: { images: ids.map((id) => ({ id })) } };
  }
  const r = await fetch(`${LI_API}/rest/posts`, {
    method: "POST", headers: liHeaders(t), body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error("LinkedIn: " + r.status + " " + (await r.text()).slice(0, 200));
  const urn = r.headers.get("x-restli-id") || "";
  return urn ? `https://www.linkedin.com/feed/update/${urn}/` : "publicado";
}

/* ---------- el cron ---------- */

export default async function handler(req, res) {
  const secreto = process.env.COLA_SECRET;
  const dado = req.headers.authorization || req.query.k || "";
  if (!secreto || dado !== `Bearer ${secreto}` && dado !== secreto) {
    return res.status(401).json({ error: "no" });
  }
  await tablas();

  const { rows } = await sql`
    SELECT * FROM cola_publicaciones
    WHERE estado = 'esperando' AND cuando <= NOW()
    ORDER BY cuando ASC LIMIT ${MAX_POR_CORRIDA}`;

  const hechas = [];
  for (const fila of rows) {
    // marcamos "yendo" antes de empezar: si el cron se superpone, nadie publica dos veces
    const tomada = await sql`
      UPDATE cola_publicaciones SET estado = 'yendo'
      WHERE id = ${fila.id} AND estado = 'esperando' RETURNING id`;
    if (!tomada.rows.length) continue;

    try {
      const url = fila.red.startsWith("ig") ? await publicarIG(fila) : await publicarLI(fila);
      if (url === null) {          // el video sigue procesando: lo retomamos en 10 minutos
        await sql`UPDATE cola_publicaciones SET estado = 'esperando' WHERE id = ${fila.id}`;
        hechas.push({ id: fila.id, red: fila.red, item: fila.item, estado: "procesando" });
        continue;
      }
      await sql`UPDATE cola_publicaciones SET estado = 'ok', resultado = ${url} WHERE id = ${fila.id}`;
      hechas.push({ id: fila.id, red: fila.red, item: fila.item, url });
    } catch (e) {
      const msg = String(e.message || e).slice(0, 400);
      await sql`UPDATE cola_publicaciones SET estado = 'error', resultado = ${msg} WHERE id = ${fila.id}`;
      hechas.push({ id: fila.id, red: fila.red, item: fila.item, error: msg });
    }
  }

  return res.status(200).json({ ok: true, procesadas: hechas.length, hechas });
}

// El plan Hobby de Vercel corta las funciones a 60 segundos, así que nunca esperamos
// a que Meta procese un video dentro del request: se guarda el contenedor y la corrida
// siguiente del cron (10 minutos después) lo publica cuando ya está listo.
export const config = { maxDuration: 60 };
