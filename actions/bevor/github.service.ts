"use server";

import api from "@/lib/api";
import {
  GithubInstallationsSchemaI,
  GithubRepoBranchesSchemaI,
  GithubRepositoriesSchemaI,
} from "@/utils/types";

export const handleCallback = async (data: {
  code: string;
  state: string;
  installation_id: string | null;
  setup_action: string | null;
}): Promise<void> => {
  return api.post("/github/callback", data).then(() => {
    return;
  });
};

export const getInstallationUrl = async (data: { redirect_uri: string }): Promise<string> => {
  return api.post("github/urls/installation", data).then((response) => {
    return response.data.url;
  });
};

export const getOauthUrl = async (data: { redirect_uri: string }): Promise<string> => {
  // user access tokens can expire, and these are the only way to recover them.
  return api.post("github/urls/oauth", data).then((response) => {
    return response.data.url;
  });
};

export const getInstallations = async (): Promise<GithubInstallationsSchemaI> => {
  return api.get("github/installations").then((response) => {
    return response.data;
  });
};

export const getRepositories = async (
  installationId: number,
  teamSlug?: string,
): Promise<GithubRepositoriesSchemaI> => {
  let url = `github/repositories/${installationId}`;
  if (teamSlug) {
    url += `?team_slug=${teamSlug}`;
  }
  return api.get(url).then((response) => {
    return response.data;
  });
};

export const getBranches = async (repoId: number): Promise<GithubRepoBranchesSchemaI> => {
  return api.get(`github/branches/${repoId}`).then((response) => {
    return response.data;
  });
};
