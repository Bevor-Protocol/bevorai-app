"use server";

import api from "@/lib/api";
import { AuthSchema, CreateKeyBody } from "@/utils/types";

export const listKeys = async (teamId: string): Promise<AuthSchema[]> => {
  return api.get("/auth", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.results;
  });
};

export const createKey = async (
  teamId: string,
  data: CreateKeyBody,
): Promise<{ api_key: string }> => {
  return api.post("/auth", data, { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data;
  });
};

export const refreshKey = async (teamId: string, keyId: string): Promise<{ api_key: string }> => {
  return api
    .patch(`/auth/${keyId}`, {}, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const revokeKey = async (teamId: string, keyId: string): Promise<boolean> => {
  return api.delete(`/auth/${keyId}`, { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.success;
  });
};
