import { createHmac, randomBytes, timingSafeEqual, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SESSION_COOKIE_NAME = "meetread_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const HEADER_ENCODED = Buffer.from(
  JSON.stringify({ alg: "HS256", typ: "JWT" }),
).toString("base64url");

type SessionPayload = {
  userId: number;
  name: string;
  email: string;
  iat: number;
  exp: number;
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
};

const getAuthSecret = () => process.env.AUTH_SECRET ?? "dev-super-secret-change-me";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) {
    return false;
  }

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const keyBuffer = Buffer.from(key, "hex");

  if (keyBuffer.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(keyBuffer, derived);
};

const signPayload = (payload: SessionPayload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const message = `${HEADER_ENCODED}.${body}`;
  const signature = createHmac("sha256", getAuthSecret()).update(message).digest("base64url");
  return `${message}.${signature}`;
};

const decodePayload = (token: string): SessionPayload | null => {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature || header !== HEADER_ENCODED) {
    return null;
  }

  const expected = createHmac("sha256", getAuthSecret())
    .update(`${header}.${body}`)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (
      typeof payload.userId !== "number" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

export const createSessionCookie = (user: SessionUser) => {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    iat: now,
    exp: now + SESSION_DURATION_SECONDS,
  };

  const token = signPayload(payload);
  return {
    token,
    expires: new Date(payload.exp * 1000),
  };
};

export const parseSessionCookie = (token: string | undefined | null): SessionUser | null => {
  if (!token) {
    return null;
  }

  const payload = decodePayload(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.userId,
    name: payload.name,
    email: payload.email,
  };
};

export const clearSessionCookie = () => ({
  value: "",
  expires: new Date(0),
});

export { SESSION_COOKIE_NAME };
