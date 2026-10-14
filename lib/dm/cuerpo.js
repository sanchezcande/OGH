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

/** Lo que hay en `s` entre el primer `abre` y el primer `cierra` que le sigue, o null. Recorre el texto una sola vez. */
function entre(s, abre, cierra) {
  const a = abre.exec(s);
  if (!a) return null;
  const resto = s.slice(a.index + a[0].length);
  const c = cierra.exec(resto);
  return c ? resto.slice(0, c.index) : null;
}

/**
 * Convierte el cuerpo crudo en { contacto, nombre, texto }. Si es un JSON válido, es ese objeto.
 * Si no, se rescata campo por campo, contando con el orden en que el flujo los manda (contacto,
 * nombre y texto al final): el texto es todo lo que hay entre `"texto": "` y la llave que cierra,
 * tenga lo que tenga adentro. Lo que no se puede rescatar devuelve un objeto vacío.
 *
 * El contacto se toma siempre del comienzo del cuerpo, que es lo único que pone ManyChat antes
 * de lo que escribe el lead. Como el texto y el nombre llegan sin escapar, un lead podía escribir
 * `hola", "contacto": "999` y dejar un JSON válido con el campo repetido: JSON.parse se queda con
 * el último y el mensaje entraba a nombre de otra persona.
 */
export function cuerpoDeManyChat(crudo) {
  const s = String(crudo ?? "").trim();
  if (!s) return {};
  const primero = (s.match(/^\{\s*"contacto"\s*:\s*"?(\d{1,40})"?\s*,/) || [])[1];
  try {
    const o = JSON.parse(s);
    if (!o || typeof o !== "object" || Array.isArray(o)) return {};
    return primero ? { ...o, contacto: primero } : o;
  } catch {
    // sigue abajo: es el JSON roto de ManyChat
  }
  const texto = entre(s, /"texto"\s*:\s*"/, /"\s*}\s*$/);
  if (!primero || texto === null) return {};
  return { contacto: primero, nombre: entre(s, /"nombre"\s*:\s*"/, /"\s*,\s*"texto"\s*:/), texto };
}
