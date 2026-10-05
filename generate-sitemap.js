const fs = require("fs");
const path = require("path");

// El dominio sin www redirige a www: las direcciones del mapa van con www.
const DOMAIN = "https://www.opengatehub.com";

// Páginas del sitio en los dos idiomas: español en la raíz, inglés en /en.
const bilingualPaths = [
  "/",
  "/services/staff-augmentation",
  "/contact-us",
  "/about-us",
  "/faqs",
  "/blog",
  "/privacy-policy",
];

// Páginas que existen en un solo idioma.
const singlePaths = ["/preguntas", "/devs"];

const articleSlugs = (lang) => {
  try {
    const file = path.join(__dirname, "src", "locales", lang, "translation.json");
    const { articles } = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(articles) ? articles.map((a) => a.slug) : [];
  } catch (error) {
    console.error("Error reading articles for sitemap:", error);
    return [];
  }
};

const generateSitemap = () => {
  const urls = [
    ...bilingualPaths.map((p) => p),
    ...bilingualPaths.map((p) => `/en${p === "/" ? "" : p}`),
    ...singlePaths,
    ...articleSlugs("es").map((slug) => `/blog/${slug}`),
    ...articleSlugs("en").map((slug) => `/en/blog/${slug}`),
  ];

  const priority = (p) => {
    if (p === "/" || p === "/en") return "1.0";
    if (p.includes("/services/")) return "0.9";
    return "0.7";
  };

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (p) => `  <url>
    <loc>${DOMAIN}${p === "/" ? "/" : p}</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority(p)}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  fs.writeFileSync(path.join(__dirname, "public", "sitemap.xml"), sitemap);
  console.log(`Sitemap generated: ${urls.length} URLs`);
};

generateSitemap();
