/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

  /*async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.opengatehub.com' }],
        destination: 'https://opengatehub.com/:path*',
        permanent: true,
      },
    ];
  },*/
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
