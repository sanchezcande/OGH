/**
 * Los devs del CRM con la charla de Instagram de la que vinieron (20/10/2026). Aparte de crm_sync.mjs para
 * poder probarlo sin base (tests/dmFormIg.test.mjs): recibe el `sql` de @vercel/postgres.
 *
 * Cande llamaba por WhatsApp a gente que ya hablaba con el agente de DM por Instagram. Ahora el link del
 * formulario que pasa el agente lleva el id de la charla (?ig=, lib/dm/linkFormulario.js) y queda en
 * red_devs.ig_contacto. Acá se cruza con dm_contactos: el usuario de Instagram (ig_usuario) y de quién es la
 * charla (ig_dueno: agente o cande).
 *
 * ig_compartido: el mismo id de charla está en la ficha de más de un mail. El id viaja en claro en el link, y un
 * lead lo puede reenviar a un amigo: esas fichas no son "ya habla con el agente" aunque ig_dueno diga agente (no
 * se sabe cuál de ellas es la persona de la charla), y a esa gente sí hay que escribirle. /api/devs-red tampoco le
 * deja la nota del formulario a la charla en ese caso.
 *
 * Dos cuidados, los mismos que con el WhatsApp de los founders en crm_sync.mjs:
 *   - ig_contacto se lee por to_jsonb: la columna la crea /api/devs-red recién con el primer formulario después
 *     del deploy, y pedirla de nombre antes de eso hacía fallar la consulta entera.
 *   - Si el cruce con dm_contactos falla (la tabla no está, otra base), los devs salen igual, y el usuario y el
 *     dueño de cada charla quedan como estaban en el último crm_devs.json bueno: no se pisan con vacío.
 *     Si falla la lectura de red_devs, tira: crm_sync no escribe nada y queda el archivo de antes.
 */

/** Los devs con ig_contacto, ig_usuario, ig_dueno e ig_compartido. `anterior`: los leads del último crm_devs.json. */
export async function leerDevs(sql, { anterior = [] } = {}) {
  try {
    const { rows } = await sql`
      SELECT r.id, r.nombre, r.email, r.pais, r.rol_principal, r.seniority, r.stack, r.tarifa,
             r.cuando_arrancas, r.dedicacion, r.ingles, r.whatsapp, r.telegram, r.origen,
             r.cv_url, r.estado, r.creado,
             to_jsonb(r) ->> 'ig_contacto' AS ig_contacto, c.ig_usuario, c.dueno AS ig_dueno
      FROM red_devs r LEFT JOIN dm_contactos c ON c.id = to_jsonb(r) ->> 'ig_contacto'
      ORDER BY r.creado DESC`;
    return { devs: marcarCompartidos(rows), cruce: true };
  } catch (e) {
    console.error("crm_sync: no pude cruzar los devs con las charlas de Instagram:", e.message);
  }
  const { rows } = await sql`
    SELECT id, nombre, email, pais, rol_principal, seniority, stack, tarifa,
           cuando_arrancas, dedicacion, ingles, whatsapp, telegram, origen,
           cv_url, estado, creado, to_jsonb(r) ->> 'ig_contacto' AS ig_contacto
    FROM red_devs r ORDER BY creado DESC`;
  return { devs: marcarCompartidos(conCharlaAnterior(rows, anterior)), cruce: false };
}

/** A cada dev, ig_compartido: si su ig_contacto está también en la ficha de otro (otro mail). */
export function marcarCompartidos(devs) {
  const cuantos = new Map();
  for (const d of devs) if (d.ig_contacto) cuantos.set(d.ig_contacto, (cuantos.get(d.ig_contacto) || 0) + 1);
  return devs.map((d) => ({ ...d, ig_compartido: Boolean(d.ig_contacto) && cuantos.get(d.ig_contacto) > 1 }));
}

/**
 * Sin el cruce: a cada dev le quedan el usuario y el dueño de su charla que había en el archivo anterior, si es
 * la misma persona (id) y la misma charla (ig_contacto). Si no, vacíos.
 */
export function conCharlaAnterior(devs, anterior = []) {
  const antes = new Map((Array.isArray(anterior) ? anterior : []).map((l) => [l?.id, l]));
  return devs.map((d) => {
    const a = antes.get(d.id);
    const misma = d.ig_contacto && a?.ig_contacto === d.ig_contacto;
    return { ...d, ig_usuario: misma ? a.ig_usuario ?? null : null, ig_dueno: misma ? a.ig_dueno ?? null : null };
  });
}
