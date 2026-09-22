import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
} from "node:crypto";

function encKey(): Buffer {
  const secret =
    process.env.BETTER_AUTH_SECRET?.trim() ||
    process.env.GROK_AUTH_CLIENT_SECRET?.trim() ||
    "skyhook-preview-enc-key";
  return scryptSync(secret, "skyhook-s3-v1", 32);
}

export function newId(): string {
  return randomBytes(16).toString("hex");
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSecret(packed: string): string {
  const [ver, ivB, tagB, dataB] = packed.split(":");
  if (ver !== "v1" || !ivB || !tagB || !dataB) {
    throw new Error("Invalid secret payload");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encKey(),
    Buffer.from(ivB, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function mintMcpToken(): { token: string; prefix: string; hash: string } {
  const token = `sk_hk_${randomBytes(24).toString("hex")}`;
  return {
    token,
    prefix: `${token.slice(0, 12)}…`,
    hash: hashToken(token),
  };
}

export function toIso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const s = String(value);
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toISOString() : s;
}
