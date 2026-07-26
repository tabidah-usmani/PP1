import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(businessId: string) {
  return jwt.sign({ businessId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): { businessId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { businessId: string };
  } catch {
    return null;
  }
}

// Call from a Server Component, API route, or Server Action
export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

// Use inside API routes / server components to get the logged-in business
export function getCurrentBusinessId(): string | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload?.businessId ?? null;
}
