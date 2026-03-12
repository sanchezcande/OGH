const fs = require("fs");
const path = require("path");

const DOMAIN = "https://opengatehub.com";

// Rutas estáticas
const staticPaths = [
  "/",
  "/about-us",
  "/contact-us",
  "/calculator",
  "/faqs",
  "/privacy-policy",
  "/blog",
  "/services/AI",
  "/services/back-end",
  "/services/front-end",
  "/services/graphic-design",
  "/services/n8n-automation",
  "/services/software-factory",
  "/services/staff-augmentation",
  "/services/ux-ui",
  "/services/workflow-automation",
  "/real-estate-bot"
];

const generateSitemap = () => {
  let allPaths = [...staticPaths];

  // Intentar leer los slugs de los artículos para incluirlos en el sitemap
  try {
    const translationPath = path.join(__dirname, "src", "locales", "en", "translation.json");
    if (fs.existsSync(translationPath)) {
      const translations = JSON.parse(fs.readFileSync(translationPath, "utf8"));
      if (translations.articles && Array.isArray(translations.articles)) {
        const articlePaths = translations.articles.map(article => `/blog/${article.slug}`);
        allPaths = [...allPaths, ...articlePaths];
      }
    }
  } catch (error) {
    console.error("Error reading articles for sitemap:", error);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPaths
      .map((p) => {
        const priority = p === "/" ? "1.0" : (p.startsWith("/services") ? "0.9" : "0.7");
        return `  <url>
    <loc>${DOMAIN}${p}</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
      })
      .join("\n")}
</urlset>`;

  fs.writeFileSync(
    path.join(__dirname, "public", "sitemap.xml"),
    sitemap,
    "utf8"
  );
  console.log(`Sitemap generated with ${allPaths.length} URLs.`);
};

generateSitemap();
