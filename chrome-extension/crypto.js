/**
 * Gridge 로그 암호화 (Chrome Extension / 브라우저 환경)
 * Web Crypto API 사용 — AES-256-GCM + RSA-OAEP
 */

let _serverPublicKey = null;

/**
 * 서버 RSA 공개키 로드
 */
async function getServerPublicKey(serverUrl) {
  if (_serverPublicKey) return _serverPublicKey;

  // storage에서 캐시 확인
  const cached = await chrome.storage.local.get(["serverPublicKey"]);
  if (cached.serverPublicKey) {
    _serverPublicKey = cached.serverPublicKey;
    return _serverPublicKey;
  }

  // 서버에서 조회
  if (!serverUrl) return null;
  try {
    const res = await fetch(`${serverUrl}/api/crypto/public-key`);
    if (!res.ok) return null;
    const data = await res.json();
    const key = data.publicKey;
    if (key) {
      _serverPublicKey = key;
      await chrome.storage.local.set({ serverPublicKey: key });
    }
    return key;
  } catch {
    return null;
  }
}

/**
 * PEM 공개키 → CryptoKey 변환
 */
async function importPublicKey(pem) {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");
  const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "spki", binary,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false, ["encrypt"]
  );
}

/**
 * 로그 페이로드 암호화
 */
async function encryptPayload(payload, serverUrl) {
  const publicKeyPem = await getServerPublicKey(serverUrl);
  if (!publicKeyPem) {
    return { encrypted: false, payload };
  }

  try {
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));

    // 1. 랜덤 AES-256 키 + IV
    const aesKey = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 2. AES-GCM 암호화
    const cryptoKey = await crypto.subtle.importKey(
      "raw", aesKey, { name: "AES-GCM" }, false, ["encrypt"]
    );
    const encryptedBuf = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, tagLength: 128 }, cryptoKey, plaintext
    );

    // AES-GCM은 ciphertext + authTag를 합쳐서 반환
    const encryptedArr = new Uint8Array(encryptedBuf);
    const ciphertext = encryptedArr.slice(0, -16);
    const authTag = encryptedArr.slice(-16);

    // 3. AES 키를 RSA 공개키로 암호화
    const rsaKey = await importPublicKey(publicKeyPem);
    const encryptedKey = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" }, rsaKey, aesKey
    );

    return {
      encrypted: true,
      payload: {
        encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedKey))),
        iv: btoa(String.fromCharCode(...iv)),
        authTag: btoa(String.fromCharCode(...authTag)),
        ciphertext: btoa(String.fromCharCode(...ciphertext)),
        algorithm: "aes-256-gcm",
        keyAlgorithm: "rsa-oaep-sha256",
      },
    };
  } catch (err) {
    console.error("[Gridge Crypto] 암호화 실패:", err);
    return { encrypted: false, payload };
  }
}

// background.js에서 사용
if (typeof globalThis !== "undefined") {
  globalThis.gridgeCrypto = { encryptPayload, getServerPublicKey };
}
