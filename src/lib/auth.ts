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

export async function getCurrentAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session || session.role !== "admin") return null;
  return prisma.adminUser.findUnique({ where: { id: session.sub } });
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function setAdminCookie(adminId: string) {
  const token = await signAdminSession(adminId);
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
