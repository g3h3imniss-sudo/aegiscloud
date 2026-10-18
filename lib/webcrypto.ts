// Brauzerdə real kriptoqrafiya — Web Crypto API üzərində köməkçi funksiyalar.

export const enc = (s: string): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>;
export const dec = (b: BufferSource) => new TextDecoder().decode(b);

export function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const raw = atob(s.trim());
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// ── Hash (bütövlük) ────────────────────────────────────────────────
export async function hashHex(algo: "SHA-256" | "SHA-512", text: string) {
  const d = await crypto.subtle.digest(algo, enc(text));
  return toHex(d);
}

// ── HMAC (mesaj autentifikasiyası) ─────────────────────────────────
export async function hmacHex(key: string, message: string) {
  const k = await crypto.subtle.importKey(
    "raw",
    enc(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, enc(message));
  return toHex(sig);
}

// ── PBKDF2 (açar törəmə / KDF) ─────────────────────────────────────
export async function pbkdf2Hex(
  password: string,
  saltText: string,
  iterations: number,
) {
  const base = await crypto.subtle.importKey("raw", enc(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc(saltText),
      iterations,
      hash: "SHA-256",
    },
    base,
    256,
  );
  return toHex(bits);
}

// ── AES-256-GCM (simmetrik AEAD) ───────────────────────────────────
export type AesBundle = {
  saltB64: string;
  ivB64: string;
  cipherB64: string;
  plain: string;
  cipherBytes: number;
};

async function deriveAesKey(password: string, salt: Uint8Array<ArrayBuffer>) {
  const base = await crypto.subtle.importKey("raw", enc(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function aesEncrypt(
  password: string,
  plaintext: string,
): Promise<AesBundle> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc(plaintext));
  return {
    saltB64: toB64(salt),
    ivB64: toB64(iv),
    cipherB64: toB64(ct),
    plain: plaintext,
    cipherBytes: ct.byteLength,
  };
}

export async function aesDecrypt(
  password: string,
  saltB64: string,
  ivB64: string,
  cipherB64: string,
): Promise<string> {
  const key = await deriveAesKey(password, fromB64(saltB64));
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(ivB64) },
    key,
    fromB64(cipherB64),
  );
  return dec(pt);
}

// ── ECDSA P-256 (rəqəmsal imza) ────────────────────────────────────
export type SigKeys = { privateKey: CryptoKey; publicKey: CryptoKey; publicB64: string };

export async function genEcdsaKeys(): Promise<SigKeys> {
  const kp = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const raw = await crypto.subtle.exportKey("raw", kp.publicKey);
  return { privateKey: kp.privateKey, publicKey: kp.publicKey, publicB64: toB64(raw) };
}

export async function ecdsaSign(privateKey: CryptoKey, message: string) {
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    enc(message),
  );
  return toB64(sig);
}

export async function ecdsaVerify(
  publicB64: string,
  sigB64: string,
  message: string,
): Promise<boolean> {
  const pub = await crypto.subtle.importKey(
    "raw",
    fromB64(publicB64),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    pub,
    fromB64(sigB64),
    enc(message),
  );
}
