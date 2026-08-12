import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "admin_session";
export const PARTICIPANT_COOKIE = "participant_session";

const ADMIN_MAX_AGE_SEC = 60 * 60 * 8; // 8h admin session
const PARTICIPANT_MAX_AGE_SEC = 60 * 60 * 6; // 6h — enough to finish one sitting

export type SessionPayload = { sub: string; role: "admin" | "participant" };

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is not set (or too short). Add a long random value to your .env file."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Edge-safe: usable from proxy.ts and from Node server code alike. */
export async function signSession(payload: SessionPayload, maxAgeSec: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSec)
    .sign(secretKey());
}

/** Edge-safe: returns null instead of throwing on any invalid/expired/missing token. */
export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.role !== "admin" && payload.role !== "participant") return null;
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export function signAdminSession(adminId: string) {
  return signSession({ sub: adminId, role: "admin" }, ADMIN_MAX_AGE_SEC);
}

export function signParticipantSession(participantId: string) {
  return signSession({ sub: participantId, role: "participant" }, PARTICIPANT_MAX_AGE_SEC);
}

export const ADMIN_COOKIE_MAX_AGE = ADMIN_MAX_AGE_SEC;
export const PARTICIPANT_COOKIE_MAX_AGE = PARTICIPANT_MAX_AGE_SEC;
