"use server";

import api from "@/lib/api";
import { AuthSchema, CreateKeyBody } from "@/utils/types";

export const listKeys = async (): Promise<AuthSchema[]> => {
  return api.get("/auth").then((response) => {
    return response.data.results;
  });
};

export const createKey = async (data: CreateKeyBody): Promise<{ api_key: string }> => {
  const scopes = Object.entries(data.permissions).map(([k, v]) => {
    return `${k}.${v}`;
  });
  return api
    .post("/auth", {
      name: data.name,
      scopes,
    })
    .then((response) => {
      return response.data;
    });
};

export const refreshKey = async (keyId: string): Promise<{ api_key: string }> => {
  return api.patch(`/auth/${keyId}`, {}).then((response) => {
    return response.data;
  });
};

export const revokeKey = async (keyId: string): Promise<boolean> => {
  return api.delete(`/auth/${keyId}`).then((response) => {
    return response.data.success;
  });
};
