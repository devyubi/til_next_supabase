// next.config.mjs
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    // Sass가 상대/절대 경로로 불러올 수 있는 루트 경로 지정
    includePaths: [path.join(process.cwd(), 'src/styles')],
    // Source map 활성화 (경로 계산용)
    sourceMap: true,
  },
};

export default nextConfig;
