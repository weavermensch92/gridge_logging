#!/usr/bin/env node
/**
 * Gridge CA 인증서를 시스템 신뢰 저장소에 설치
 *
 * macOS:  Keychain Access에 추가
 * Linux:  /usr/local/share/ca-certificates/ 에 복사
 * Windows: certutil로 Trusted Root에 추가
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CA_CERT = path.join(__dirname, "certs", "gridge-ca.crt");

if (!fs.existsSync(CA_CERT)) {
  console.error("[Gridge] CA 인증서가 없습니다. 먼저 node gen-cert.js 를 실행하세요.");
  process.exit(1);
}

const platform = process.platform;

try {
  if (platform === "darwin") {
    // macOS: Keychain에 추가
    console.log("[Gridge] macOS Keychain에 CA 인증서 설치 중...");
    console.log("  관리자 비밀번호가 필요할 수 있습니다.");
    execSync(
      `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${CA_CERT}"`,
      { stdio: "inherit" }
    );
    console.log("  ✓ Keychain에 설치 완료");

  } else if (platform === "linux") {
    // Linux: ca-certificates에 추가
    console.log("[Gridge] Linux 시스템 CA 저장소에 설치 중...");
    const destDir = "/usr/local/share/ca-certificates/gridge";
    execSync(`sudo mkdir -p ${destDir}`, { stdio: "inherit" });
    execSync(`sudo cp "${CA_CERT}" ${destDir}/gridge-ca.crt`, { stdio: "inherit" });
    execSync("sudo update-ca-certificates", { stdio: "inherit" });
    console.log("  ✓ 시스템 CA 저장소에 설치 완료");

  } else if (platform === "win32") {
    // Windows: certutil로 추가
    console.log("[Gridge] Windows 신뢰 저장소에 CA 인증서 설치 중...");
    console.log("  관리자 권한이 필요합니다.");
    execSync(`certutil -addstore -f "ROOT" "${CA_CERT}"`, { stdio: "inherit" });
    console.log("  ✓ 신뢰 저장소에 설치 완료");

  } else {
    console.error(`[Gridge] 지원하지 않는 플랫폼: ${platform}`);
    process.exit(1);
  }

  console.log("");
  console.log("⚠ Chrome을 완전히 종료 후 다시 시작해야 인증서가 적용됩니다.");
  console.log("");
  console.log("다음 단계: node proxy.js 로 프록시를 시작하세요.");

} catch (err) {
  console.error("[Gridge] 인증서 설치 실패:", err.message);
  console.error("");
  console.error("수동 설치 방법:");
  console.error(`  인증서 파일: ${CA_CERT}`);
  if (platform === "darwin") {
    console.error("  → Keychain Access 열기 → System → 인증서 가져오기");
  } else if (platform === "win32") {
    console.error("  → 인증서 파일 더블클릭 → 인증서 설치 → 로컬 머신 → 신뢰할 수 있는 루트");
  }
  process.exit(1);
}
