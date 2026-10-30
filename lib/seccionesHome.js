// Las secciones de la home, en un solo lado.
//
// Las usan los dos índices: la barra pegada abajo del menú (IndiceSecciones, en la home) y el menú
// hamburguesa (NavBar, en celular y tablet). Si cada uno tuviera su lista, en dos semanas una diría
// una cosa y la otra, otra.
//
// El `id` tiene que existir como id de una <Section> en pages/index.js, o el link no lleva a ningún
// lado. Los dos que ya estaban en la dirección (#como-evaluamos) no se renombran: hay links viejos
// dando vueltas, en el menú y fuera del sitio.

export const SECCIONES_HOME = {
  es: [
    { id: "que-incluye", label: "Qué incluye" },
    { id: "casos-de-uso", label: "Casos de uso" },
    { id: "como-evaluamos", label: "Nuestro filtro" },
    { id: "como-funciona", label: "Cómo funciona" },
    { id: "clientes", label: "Clientes" },
    { id: "testimonios", label: "Testimonios" },
    { id: "preguntas", label: "Preguntas" },
  ],
  en: [
    { id: "que-incluye", label: "What's included" },
    { id: "casos-de-uso", label: "Use cases" },
    { id: "como-evaluamos", label: "Our filter" },
    { id: "como-funciona", label: "How it works" },
    { id: "clientes", label: "Clients" },
    { id: "testimonios", label: "Testimonials" },
    { id: "preguntas", label: "FAQ" },
  ],
};

/** El título del bloque en el menú hamburguesa. */
export const TITULO_INDICE = { es: "En la página principal", en: "On the home page" };
