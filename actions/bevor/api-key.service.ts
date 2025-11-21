"use server";

import api from "@/lib/api";
import { generateQueryKey } from "@/utils/constants";
import { AuthSchema, CreateKeyBody } from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const listKeys = async (teamSlug: string): Promise<AuthSchema[]> => {
  return api.get("/auth", { headers: { "bevor-team-slug": teamSlug } }).then((response) => {
    return response.data.results;
  });
};

export const createKey = async (
  teamSlug: string,
  data: CreateKeyBody,
): Promise<{ api_key: string; toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.apiKeys(teamSlug)];
  return api.post("/auth", data, { headers: { "bevor-team-slug": teamSlug } }).then((response) => {
    return {
      api_key: response.data.api_key,
      toInvalidate,
    };
  });
};

export const refreshKey = async (
  teamSlug: string,
  keyId: string,
): Promise<{ api_key: string; toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.apiKeys(teamSlug)];
  return api
    .post(`/auth/${keyId}`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        api_key: response.data.api_key,
        toInvalidate,
      };
    });
};

export const revokeKey = async (
  teamSlug: string,
  keyId: string,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.apiKeys(teamSlug)];
  return api.delete(`/auth/${keyId}`, { headers: { "bevor-team-slug": teamSlug } }).then(() => {
    return { toInvalidate };
  });
};
