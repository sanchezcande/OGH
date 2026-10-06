// Doble de "@vercel/postgres": tablas en memoria que entienden las consultas del goteo
// (ALTER, el SELECT de pendientes de un toque y el UPDATE que lo anota).
// Cualquier otra consulta revienta, así una prueba no pasa por casualidad.
export const base = {
  tablas: {},
  consultas: [],
  reiniciar(tablas = {}) {
    this.tablas = tablas;
    this.consultas = [];
  },
};

const AHORA = Date.now();
/** Fecha de alguien que se anotó hace `dias` días. */
export const hace = (dias) => new Date(AHORA - dias * 86400000);

async function query(texto, params = []) {
  const t = texto.replace(/\s+/g, " ").trim();
  base.consultas.push(t);
  if (/^ALTER TABLE \w+ ADD COLUMN IF NOT EXISTS /.test(t) || /^SELECT 1 FROM \w+ LIMIT 1$/.test(t)) {
    return { rows: [] };
  }

  let m = t.match(/^SELECT id, nombre, email FROM (\w+) WHERE email IS NOT NULL AND NOT drip_off AND (drip_d\d+) IS NULL (.*)$/);
  if (m) {
    const [, tabla, col, resto] = m;
    let filas = (base.tablas[tabla] || []).filter((f) =>
      f.email != null && !f.drip_off && f[col] == null &&
      (!resto.includes("origen = 'formulario'") || f.origen === "formulario") &&
      f.creado < hace(params[0]));
    // Como en Postgres: sin ORDER BY no hay orden garantizado. Este doble devuelve las
    // filas como están guardadas, y las pruebas las guardan desordenadas a propósito.
    if (resto.includes("ORDER BY creado ASC, id ASC")) {
      filas = [...filas].sort((a, b) => a.creado - b.creado || a.id - b.id);
    }
    const tope = resto.match(/LIMIT (\d+)$/);
    if (tope) filas = filas.slice(0, Number(tope[1]));
    return { rows: filas.map(({ id, nombre, email }) => ({ id, nombre, email })) };
  }

  m = t.match(/^UPDATE (\w+) SET (drip_d\d+) = NOW\(\) WHERE id = \$1$/);
  if (m) {
    const fila = (base.tablas[m[1]] || []).find((f) => f.id === params[0]);
    if (!fila) throw new Error(`el doble no tiene la fila ${params[0]} en ${m[1]}`);
    fila[m[2]] = new Date();
    return { rows: [], rowCount: 1 };
  }

  throw new Error(`consulta que el doble de postgres no conoce: ${t.slice(0, 90)}`);
}

export function sql(partes, ...valores) {
  return query(partes.join("?"), valores);
}
sql.query = query;
