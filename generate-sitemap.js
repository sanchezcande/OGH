const fs = require("fs");
const path = require("path");

const DOMAIN = "https://opengatehub.com"; // Cambia por tu dominio.

const paths = [
  "/", 
  "/about", 
  "/contact", 
];

const generateSitemap = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${paths
        .map((path) => {
          return `
            <url>
              <loc>${DOMAIN}${path}</loc>
              <changefreq>monthly</changefreq>
              <priority>0.8</priority>
            </url>
          `;
        })
        .join("\n")}
    </urlset>`;

  fs.writeFileSync(path.join(__dirname, "public", "sitemap.xml"), sitemap, "utf8");
};

generateSitemap();
