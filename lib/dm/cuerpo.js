// El cuerpo de los pedidos que manda ManyChat.
//
// ManyChat arma el JSON de una Solicitud externa pegando el valor de cada campo tal cual, sin
// escaparlo. Si el lead escribe con un salto de línea o con comillas, el JSON llega roto. Next lo
// rechazaba con un 400 antes de entrar al endpoint y el mensaje se perdía sin aviso: el agente no
// lo veía y el lead quedaba sin respuesta.

const TOPE_BYTES = 64 * 1024;

/** Lee el cuerpo crudo de un pedido (el endpoint tiene que tener bodyParser en false). */
export async function leerCrudo(req) {
  const partes = [];
  let bytes = 0;
  for await (const parte of req) {
    bytes += parte.length;
    if (bytes > TOPE_BYTES) throw new Error("cuerpo demasiado grande");
    partes.push(Buffer.from(parte));
  }
  return Buffer.concat(partes).toString("utf8");
}

/**
 * Convierte el cuerpo crudo en { contacto, nombre, texto }. Si es un JSON válido, es ese objeto.
 * Si no, se rescata campo por campo, contando con el orden en que el flujo los manda (contacto,
 * nombre y texto al final): el texto es todo lo que hay entre `"texto": "` y la llave que cierra,
 * tenga lo que tenga adentro. Lo que no se puede rescatar devuelve un objeto vacío.
 */
export function cuerpoDeManyChat(crudo) {
  const s = String(crudo ?? "").trim();
  if (!s) return {};
  try {
    const o = JSON.parse(s);
    return o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch {
    // sigue abajo: es el JSON roto de ManyChat
  }
  const contacto = (s.match(/"contacto"\s*:\s*"?(\d{1,40})"?\s*[,}]/) || [])[1];
  const texto = s.match(/"texto"\s*:\s*"([\s\S]*)"\s*}\s*$/);
  if (!contacto || !texto) return {};
  const nombre = s.match(/"nombre"\s*:\s*"([\s\S]*?)"\s*,\s*"texto"\s*:/);
  return { contacto, nombre: nombre ? nombre[1] : null, texto: texto[1] };
}
