/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },

  async redirects() {
    return [
      { source: "/register", destination: "/signup", permanent: false },
      { source: "/quenmatkhau", destination: "/forgot-password", permanent: false },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "testcare.chotnhanh.vn",
      },
      {
        protocol: "https",
        hostname: "care.chotnhanh.vn",
      },
      {
        protocol: "https",
        hostname: "zalo-api.zadn.vn",
      },
      {
        protocol: "https",
        hostname: "**.zdn.vn",
      },
      {
        protocol: "https",
        hostname: "**.zadn.vn",
      },
    ],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgoConfig: {
              plugins: [
                { name: "removeViewBox", active: false },
                { name: "removeDimensions", active: true },
              ],
            },
          },
        },
      ],
    });
    return config;
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              svgoConfig: {
                plugins: [
                  { name: "removeViewBox", active: false },
                  { name: "removeDimensions", active: true },
                ],
              },
            },
          },
        ],
        as: "*.js",
      },
    },
  },
  
};

export default nextConfig;
