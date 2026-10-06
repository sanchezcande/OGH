// Ganchos de carga de módulos para las pruebas (los registra preparar.mjs).
// El sitio lo compila Next. Node solo no puede cargar pages/api/*.js tal cual porque:
//   1. los import relativos van sin extensión ("../../lib/notificar"),
//   2. el package.json no dice "type": "module" y los archivos usan import/export,
//   3. "resend" y "@vercel/postgres" hablan con servicios reales.
// Acá se resuelven las tres cosas. Por la tercera, ninguna prueba puede mandar un mail
// ni tocar la base aunque quiera: esos dos paquetes siempre son los dobles de esta carpeta.
const DOBLES = {
  resend: new URL("./resend.mjs", import.meta.url).href,
  "@vercel/postgres": new URL("./postgres.mjs", import.meta.url).href,
};
const RAIZ = new URL("../../", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (Object.hasOwn(DOBLES, specifier)) return { url: DOBLES[specifier], shortCircuit: true };
  if (/^\.{1,2}\//.test(specifier) && !/\.[cm]?js$/.test(specifier)) {
    return nextResolve(specifier + ".js", context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const delRepo = url.startsWith(RAIZ) && url.endsWith(".js") && !url.includes("/node_modules/");
  return nextLoad(url, delRepo ? { ...context, format: "module" } : context);
}
