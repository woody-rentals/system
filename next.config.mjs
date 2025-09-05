/** @type {import('next').NextConfig} */
const nextConfig = {
     images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'images.microcms-assets.io',
            port: '',
            pathname: '/assets/**',
          },
          {
            protocol: 'https',
            hostname: 'storage.googleapis.com',
            port: '',
            pathname: '/skiday-livecam-prod.appspot.com/camera_images/**',
          },
        ],
      },
};

export default nextConfig;
