import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  PARTICIPANT_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  PARTICIPANT_COOKIE_MAX_AGE,
  signAdminSession,
  signParticipantSession,
  verifySession,
} from "@/lib/session";

// Admin auth has no per-user account: everyone who knows ADMIN_ACCESS_CODE
// gets the same admin session. isAdmin() just checks that session is valid.
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = await verifySession(token);
  return !!session && session.role === "admin";
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function setAdminCookie() {
  const token = await signAdminSession();
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function getCurrentParticipant() {
  const token = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session || session.role !== "participant") return null;
  return prisma.participant.findUnique({ where: { id: session.sub } });
}

export async function requireParticipant() {
  const participant = await getCurrentParticipant();
  if (!participant) redirect("/register");
  return participant;
}

export async function setParticipantCookie(participantId: string) {
  const token = await signParticipantSession(participantId);
  (await cookies()).set(PARTICIPANT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PARTICIPANT_COOKIE_MAX_AGE,
  });
}

export async function clearParticipantCookie() {
  (await cookies()).delete(PARTICIPANT_COOKIE);
}
