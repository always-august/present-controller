import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// 개발 중 같은 네트워크의 휴대폰/태블릿에서 접속할 수 있도록 이 컴퓨터의 LAN IP를 허용한다.
// (Next 15+는 localhost가 아닌 출처에서 오는 dev 리소스 요청을 기본 차단함)
const lanIps = Object.values(networkInterfaces())
  .flat()
  .filter((i): i is NonNullable<typeof i> => Boolean(i && i.family === "IPv4" && !i.internal))
  .map((i) => i.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: [...lanIps, "*.local"],
};

export default nextConfig;
