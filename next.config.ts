import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "mevmmglleecgumhixjuf.supabase.co",
      // 아래는 생략 해도 되긴하지만 적어둠
      pathname: '/storage/v1/object/public/**'
    }]
  }
};

export default nextConfig;
