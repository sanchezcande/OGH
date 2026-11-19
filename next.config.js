/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,
  },
  compiler: {
    styledComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    minimumCacheTTL: 60,
  },
  compress: true,
  poweredByHeader: false,

  // Español en la raíz, inglés en /en. Cada idioma tiene su dirección para que Google
  // y las vistas previas de links vean el idioma correcto. Sin detección por navegador:
  // el idioma lo elige la persona.
  i18n: {
    locales: ["es", "en"],
    defaultLocale: "es",
    localeDetection: false,
  },

  async redirects() {
    return [
      // Los embudos existen en un solo idioma: no se duplican bajo /en.
      { source: "/en/devs/:path*", destination: "/devs/:path*", permanent: false, locale: false },
      { source: "/en/apply/:path*", destination: "/apply/:path*", permanent: false, locale: false },
      { source: "/en/hola", destination: "/hola", permanent: false, locale: false },
      { source: "/en/preguntas", destination: "/preguntas", permanent: false, locale: false },
      // Esta pagina esta escrita en ingles y vive solo bajo /en, que es donde el sitio sirve el
      // nav en ingles y <html lang="en">. Servirla tambien desde la raiz la dejaria con texto
      // ingles abajo de lang="es", que es la senal contraria a la que la pagina existe para dar.
      // OJO con el source: va con el prefijo "/es/" aunque esa URL no exista para nadie. Con
      // locale:false el match se hace contra la ruta YA normalizada por Next, y ahi el locale por
      // defecto si lleva prefijo. Con source "/hire-developers-latin-america" no matchea nada y
      // el redirect se ignora en silencio. Verificado el 20/11/2026.
      { source: "/es/hire-developers-latin-america", destination: "/en/hire-developers-latin-america", permanent: false, locale: false },
      // Y al reves: las dos paginas que estan escritas en castellano no tienen version /en, o
      // quedaria texto castellano abajo de un <html lang="en">, que es la senal contraria.
      { source: "/en/datos-developers-latam", destination: "/datos-developers-latam", permanent: false, locale: false },
      { source: "/en/como-conseguir-trabajo-de-developer", destination: "/como-conseguir-trabajo-de-developer", permanent: false, locale: false },
      { source: "/en/labsmail", destination: "/labsmail", permanent: false, locale: false },
      // Automatización y calculadora salieron del sitio (05/10/2026): solo staff augmentation.
      { source: "/services/workflow-automation", destination: "/", permanent: true },
      { source: "/services/software-factory", destination: "/", permanent: true },
      { source: "/calculator", destination: "/", permanent: true },
      {
        source: "/discoverycall",
        destination: "https://calendar.app.google/JnGP5JWka16VhZEP7",
        permanent: false,
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            prettier: false,
            svgo: true,
            svgoConfig: {
              plugins: [{ removeViewBox: false }],
            },
            titleProp: true,
          },
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig;
