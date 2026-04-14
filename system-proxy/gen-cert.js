#!/usr/bin/env node
/**
 * Gridge CA 인증서 생성
 *
 * 생성 파일:
 *   certs/gridge-ca.key  — CA 비밀키
 *   certs/gridge-ca.crt  — CA 인증서 (유저 PC에 설치)
 *
 * Node.js 내장 crypto 모듈만 사용 (외부 의존성 없음)
 * openssl이 설치되어 있으면 openssl 사용, 없으면 안내
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CERTS_DIR = path.join(__dirname, "certs");
const CA_KEY = path.join(CERTS_DIR, "gridge-ca.key");
const CA_CERT = path.join(CERTS_DIR, "gridge-ca.crt");

if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });

if (fs.existsSync(CA_KEY) && fs.existsSync(CA_CERT)) {
  console.log("[Gridge] CA 인증서가 이미 존재합니다:");
  console.log(`  키:     ${CA_KEY}`);
  console.log(`  인증서: ${CA_CERT}`);
  process.exit(0);
}

try {
  // openssl 사용 가능 확인
  execSync("openssl version", { stdio: "ignore" });

  console.log("[Gridge] CA 인증서 생성 중...");

  // CA 비밀키 생성
  execSync(`openssl genrsa -out "${CA_KEY}" 2048`, { stdio: "ignore" });

  // CA 인증서 생성 (10년)
  execSync(
    `openssl req -x509 -new -nodes -key "${CA_KEY}" -sha256 -days 3650 ` +
    `-out "${CA_CERT}" -subj "/C=KR/ST=Seoul/O=Gridge/CN=Gridge AI Proxy CA"`,
    { stdio: "ignore" }
  );

  console.log("[Gridge] CA 인증서 생성 완료:");
  console.log(`  키:     ${CA_KEY}`);
  console.log(`  인증서: ${CA_CERT}`);
  console.log("");
  console.log("다음 단계: node install-cert.js 로 시스템에 인증서를 설치하세요.");

} catch {
  console.error("[Gridge] openssl이 설치되어 있지 않습니다.");
  console.error("");
  console.error("설치 방법:");
  console.error("  macOS:   brew install openssl");
  console.error("  Ubuntu:  sudo apt install openssl");
  console.error("  Windows: choco install openssl 또는 https://slproweb.com/products/Win32OpenSSL.html");
  process.exit(1);
}
