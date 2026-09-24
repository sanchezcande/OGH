/**
 * Sube los 19 CVs de los candidatos buscados a mano a Blob y deja la URL en la
 * base, en lugar del nombre de archivo suelto que hay ahora.
 *
 * Privado a propósito: un CV es dato personal y no puede quedar legible para
 * cualquiera que consiga el link. Es el mismo criterio que usa /api/cv-upload
 * con los que se postulan solos por el formulario.
 *
 *   cd OGH && npx vercel env pull .env.local     # trae BLOB_READ_WRITE_TOKEN y POSTGRES_URL
 *   node "../Personal Brand/candidatos/subir-cvs.mjs"
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CVS = join(AQUI, "..", "..", "Personal Brand", "candidatos", "devs", "cvs");

async function main() {
  const archivos = (await readdir(CVS)).filter((f) => f.toLowerCase().endsWith(".pdf"));
  console.log(`${archivos.length} CVs para subir\n`);

  let subidos = 0, sinFila = [];
  for (const archivo of archivos) {
    const datos = await readFile(join(CVS, archivo));
    const { url } = await put(`cvs-red/${archivo}`, datos, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: true,
      // Explícito: el SDK, si no, agarra el VERCEL_OIDC_TOKEN del link y falla
      // porque OIDC no está habilitado para el entorno "development".
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Se busca por el nombre de archivo porque es lo que quedó guardado en la
    // importación. Si no matchea ninguna fila lo aviso en vez de seguir callado.
    const { rowCount } = await sql`
      UPDATE red_devs SET cv_archivo = ${url} WHERE cv_archivo = ${archivo}
    `;
    if (rowCount === 0) sinFila.push(archivo);
    else { subidos++; console.log(`  ok  ${basename(archivo)}`); }
  }

  console.log(`\n${subidos} CVs con la URL guardada en red_devs`);
  if (sinFila.length) console.log(`sin fila que actualizar: ${sinFila.join(", ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
