const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    config.module.rules.push({
      test: /\.ts$/,
      include: /node_modules\/hyperliquid/,
      use: [
        {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      ],
    });

    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        hyperliquid: 'hyperliquid/dist'
      }
    }

    return config
  },
};

module.exports = withPWA(nextConfig);