/**
 * Gridge 로그 암호화 모듈 (Node.js 환경 — local-proxy, system-proxy용)
 *
 * 방식: AES-256-GCM (본문) + RSA-OAEP (키 교환)
 *
 * 흐름:
 *   1. 매 전송마다 랜덤 AES-256 키 생성
 *   2. 로그 JSON → AES-256-GCM으로 암호화
 *   3. AES 키 → 서버 RSA 공개키로 암호화
 *   4. { encryptedKey, iv, authTag, ciphertext } 전송
 *   5. 서버: RSA 개인키로 AES 키 복호 → AES로 본문 복호
 *
 * 서버 공개키: config.json의 serverPublicKey 또는 /api/crypto/public-key에서 조회
 */

const crypto = require("crypto");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

let _serverPublicKey = null;

/**
 * 서버 RSA 공개키 로드
 * 1순위: config.json의 serverPublicKey
 * 2순위: GET /api/crypto/public-key 에서 조회
 * 3순위: 로컬 캐시 (~/.gridge/server-public-key.pem)
 */
async function getServerPublicKey(serverUrl) {
  if (_serverPublicKey) return _serverPublicKey;

  // 1. config에서 로드
  const configPath = path.join(__dirname, "config.json");
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (config.serverPublicKey) {
        _serverPublicKey = config.serverPublicKey;
        return _serverPublicKey;
      }
    } catch { /* ignore */ }
  }

  // 2. 로컬 캐시에서 로드
  const cachePath = path.join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".gridge", "server-public-key.pem");
  if (fs.existsSync(cachePath)) {
    _serverPublicKey = fs.readFileSync(cachePath, "utf-8");
    return _serverPublicKey;
  }

  // 3. 서버에서 조회
  if (serverUrl) {
    try {
      const key = await fetchPublicKey(serverUrl);
      if (key) {
        _serverPublicKey = key;
        // 캐시 저장
        const cacheDir = path.dirname(cachePath);
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(cachePath, key);
        return _serverPublicKey;
      }
    } catch { /* fallback to unencrypted */ }
  }

  return null;
}

function fetchPublicKey(serverUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL("/api/crypto/public-key", serverUrl);
    const proto = url.protocol === "https:" ? https : http;
    const req = proto.get(url, (res) => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.publicKey || null);
        } catch {
          resolve(data.trim() || null);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

/**
 * 로그 데이터를 암호화
 * @param {object} payload - { logs: [...], api_key: "..." }
 * @param {string} serverUrl - 서버 URL (공개키 조회용)
 * @returns {object} 암호화된 페이로드 또는 원본 (키 없으면)
 */
async function encryptPayload(payload, serverUrl) {
  const publicKey = await getServerPublicKey(serverUrl);

  if (!publicKey) {
    // 공개키 없으면 암호화 없이 전송 (fallback)
    return { encrypted: false, payload };
  }

  try {
    const plaintext = JSON.stringify(payload);

    // 1. 랜덤 AES-256 키 + IV 생성
    const aesKey = crypto.randomBytes(32);  // 256bit
    const iv = crypto.randomBytes(12);       // GCM 권장 96bit

    // 2. AES-256-GCM으로 본문 암호화
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // 3. AES 키를 RSA 공개키로 암호화
    const encryptedKey = crypto.publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      aesKey
    );

    return {
      encrypted: true,
      payload: {
        encryptedKey: encryptedKey.toString("base64"),
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        ciphertext: encrypted.toString("base64"),
        algorithm: "aes-256-gcm",
        keyAlgorithm: "rsa-oaep-sha256",
      },
    };
  } catch (err) {
    console.error("[Gridge Crypto] 암호화 실패:", err.message);
    return { encrypted: false, payload };
  }
}

/**
 * 서버 측 복호화 (백엔드 참조용 — Node.js)
 * @param {object} encryptedPayload - { encryptedKey, iv, authTag, ciphertext }
 * @param {string} privateKeyPem - RSA 개인키 PEM
 * @returns {object} 복호화된 원본 payload
 */
function decryptPayload(encryptedPayload, privateKeyPem) {
  const { encryptedKey, iv, authTag, ciphertext } = encryptedPayload;

  // 1. RSA 개인키로 AES 키 복호화
  const aesKey = crypto.privateDecrypt(
    { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(encryptedKey, "base64")
  );

  // 2. AES-256-GCM으로 본문 복호화
  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

module.exports = { encryptPayload, decryptPayload, getServerPublicKey };
