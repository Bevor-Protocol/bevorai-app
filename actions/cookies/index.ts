"use server";

import { cookies } from "next/headers";

const SESSION_COOKIE = "bevor-token";
const LAST_VISITED_TEAM_COOKIE = "last-visited-team";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const setLastVisitedTeam = async (teamSlug: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(LAST_VISITED_TEAM_COOKIE, teamSlug, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

export const getLastVisitedTeam = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(LAST_VISITED_TEAM_COOKIE)?.value || null;
};

export const clearLastVisitedTeam = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(LAST_VISITED_TEAM_COOKIE);
};

export const deleteSessionToken = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete("bevor-token");
  cookieStore.delete(LAST_VISITED_TEAM_COOKIE);
};

export const setSessionToken = async (token: string, expiry: number): Promise<void> => {
  const cookieStore = await cookies();
  const date = new Date(expiry * 1000);
  cookieStore.set(SESSION_COOKIE, token, {
    expires: date,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};
