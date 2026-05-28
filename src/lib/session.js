const SECRET = process.env.JWT_SECRET || 'gossip-secret-key-123456-super-secure';

// Pure JavaScript SHA-256 implementation to guarantee identical signature matching
// across Edge Runtime (Next.js Middleware) and Node.js Runtime (API Route Handlers)
function sha256(str) {
  const ch = (x, y, z) => (x & y) ^ (~x & z);
  const maj = (x, y, z) => (x & y) ^ (x & z) ^ (y & z);
  
  const sigma0 = (x) => ((x >>> 2) | (x << 30)) ^ ((x >>> 13) | (x << 19)) ^ ((x >>> 22) | (x << 10));
  const sigma1 = (x) => ((x >>> 6) | (x << 26)) ^ ((x >>> 11) | (x << 21)) ^ ((x >>> 25) | (x << 7));
  
  const gamma0 = (x) => ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
  const gamma1 = (x) => ((x >>> 17) | (x << 15)) ^ ((x >>> 19) | (x << 13)) ^ (x >>> 10);

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const bytes = new TextEncoder().encode(str);
  const bitLength = bytes.length * 8;
  
  // Pad bytes to multiple of 64
  const paddedBytes = new Uint8Array(((bytes.length + 8 + 64) >> 6) << 6);
  paddedBytes.set(bytes);
  paddedBytes[bytes.length] = 0x80;
  
  const view = new DataView(paddedBytes.buffer);
  view.setUint32(paddedBytes.length - 4, bitLength);

  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a,
      H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  for (let chunk = 0; chunk < paddedBytes.length; chunk += 64) {
    const W = new Uint32Array(64);
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(chunk + i * 4);
    }
    for (let i = 16; i < 64; i++) {
      W[i] = (gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16]) | 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;

    for (let i = 0; i < 64; i++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[i] + W[i]) | 0;
      const T2 = (sigma0(a) + maj(a, b, c)) | 0;
      h = g; g = f; f = e; e = (d + T1) | 0; d = c; c = b; b = a; a = (T1 + T2) | 0;
    }

    H0 = (H0 + a) | 0; H1 = (H1 + b) | 0; H2 = (H2 + c) | 0; H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0; H5 = (H5 + f) | 0; H6 = (H6 + g) | 0; H7 = (H7 + h) | 0;
  }

  const hex = (num) => (num >>> 0).toString(16).padStart(8, '0');
  return hex(H0) + hex(H1) + hex(H2) + hex(H3) + hex(H4) + hex(H5) + hex(H6) + hex(H7);
}

export function createSessionToken(payload, expiresInMs = 7 * 24 * 60 * 60 * 1000) {
  const expiresAt = Date.now() + expiresInMs;
  const sessionPayload = {
    ...payload,
    expiresAt
  };
  const payloadStr = JSON.stringify(sessionPayload);
  
  let payloadBase64;
  if (typeof btoa !== 'undefined') {
    payloadBase64 = btoa(encodeURIComponent(payloadStr));
  } else {
    payloadBase64 = Buffer.from(encodeURIComponent(payloadStr)).toString('base64');
  }
  
  const signature = sha256(payloadBase64 + SECRET);
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadBase64, signature] = parts;
    
    const expectedSignature = sha256(payloadBase64 + SECRET);
    if (signature !== expectedSignature) return null;
    
    let payloadStr;
    if (typeof atob !== 'undefined') {
      payloadStr = decodeURIComponent(atob(payloadBase64));
    } else {
      payloadStr = decodeURIComponent(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
    }
    const payload = JSON.parse(payloadStr);
    
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch (e) {
    console.error('Session verification error:', e);
    return null;
  }
}
