// Shared auth and crypto utilities for Cloudflare Pages Functions

export const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
};

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: COMMON_HEADERS,
  });
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: COMMON_HEADERS,
  });
}

export function getKV(env) {
  return env.STATS_KV || env.STATS || null;
}

// Convert string / ArrayBuffer helpers
function str2ab(str) {
  return new TextEncoder().encode(str);
}

function ab2hex(buf) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hex2ab(hex) {
  const typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
  return typedArray.buffer;
}

// Generate random salt or ID
export function generateId(prefix = 'usr') {
  const rand = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}_${ab2hex(rand.buffer)}`;
}

export function generateSalt() {
  const rand = crypto.getRandomValues(new Uint8Array(16));
  return ab2hex(rand.buffer);
}

// Hash password / 4-digit PIN with PBKDF2
export async function hashPin(pin, saltHex) {
  const pinBuffer = str2ab(String(pin));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBuffer = hex2ab(saltHex);
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 50000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );

  const exported = await crypto.subtle.exportKey('raw', derivedKey);
  return ab2hex(exported);
}

// Secret key for JWT-like token signing
async function getSigningKey(secretStr) {
  const keyData = str2ab(secretStr || 'math-galaxy-explorer-secret-key-salt-2026');
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Base64URL helpers
function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return atob(base64);
}

// Create Signed Token
export async function createAuthToken(payload, envSecret) {
  const secret = envSecret || 'math-galaxy-explorer-secret-key-salt-2026';
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
  const fullPayload = { ...payload, exp };

  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encHeader}.${encPayload}`;

  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, str2ab(dataToSign));
  const encSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${dataToSign}.${encSignature}`;
}

// Verify Signed Token
export async function verifyAuthToken(token, envSecret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encHeader, encPayload, encSignature] = parts;
  const secret = envSecret || 'math-galaxy-explorer-secret-key-salt-2026';

  try {
    const dataToSign = `${encHeader}.${encPayload}`;
    const key = await getSigningKey(secret);

    // Decode signature
    const sigStr = base64UrlDecode(encSignature);
    const sigBytes = new Uint8Array(sigStr.split('').map(c => c.charCodeAt(0)));

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, str2ab(dataToSign));
    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(encPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// Extract Authenticated User from Request
export async function getAuthenticatedUser(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = await verifyAuthToken(token, env.AUTH_SECRET);
    if (payload && payload.userId) {
      return payload;
    }
  }

  // Check fallback X-User-Id header for local/guest or simple client dev
  const customUserId = request.headers.get('X-User-Id');
  if (customUserId) {
    return { userId: customUserId, username: customUserId, displayName: customUserId };
  }

  return null;
}
