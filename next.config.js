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
