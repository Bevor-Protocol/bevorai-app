"use server";

import api from "@/lib/api";
import {
  AppSearchResponseI,
  AuditWithChildrenResponseI,
  PromptResponseI,
  UserSearchResponseI,
} from "@/utils/types";

export const isAdmin = async (): Promise<boolean> => {
  return api
    .get("/admin/status")
    .then((response) => {
      return response.data.success;
    })
    .catch((error) => {
      console.log(error);
      return false;
    });
};

export const searchUsers = async (identifier: string): Promise<UserSearchResponseI[]> => {
  return api.get(`/admin/search/user?identifier=${identifier}`).then((response) => {
    return response.data.results;
  });
};

export const searchApps = async (identifier: string): Promise<AppSearchResponseI[]> => {
  return api.get(`/admin/search/app?identifier=${identifier}`).then((response) => {
    return response.data.results;
  });
};

export const getAuditWithChildren = async (id: string): Promise<AuditWithChildrenResponseI> => {
  return api.get(`/admin/audit/${id}`).then((response) => {
    return response.data;
  });
};

export const updateUserPermissions = async ({
  toUpdateId,
  canCreateApp,
  canCreateApiKey,
}: {
  toUpdateId: string;
  canCreateApp: boolean;
  canCreateApiKey: boolean;
}): Promise<boolean> => {
  return api
    .post(`/admin/permissions/user/${toUpdateId}`, {
      can_create_app: canCreateApp,
      can_create_api_key: canCreateApiKey,
    })
    .then((response) => {
      return response.data.status;
    });
};

export const updateAppPermissions = async ({
  toUpdateId,
  canCreateApp,
  canCreateApiKey,
}: {
  toUpdateId: string;
  canCreateApp: boolean;
  canCreateApiKey: boolean;
}): Promise<boolean> => {
  return api
    .post(`/admin/permissions/app/${toUpdateId}`, {
      can_create_app: canCreateApp,
      can_create_api_key: canCreateApiKey,
    })
    .then((response) => {
      return response.data.status;
    });
};

export const getPrompts = async (): Promise<PromptResponseI[]> => {
  return api.get("/admin/prompts").then((response) => {
    return response.data.results;
  });
};

export const updatePrompt = async (data: {
  promptId: string;
  tag?: string;
  content?: string;
  version?: string;
  is_active?: boolean;
}): Promise<boolean> => {
  const { promptId, ...rest } = data;

  return api
    .patch(`/admin/prompt/${promptId}`, {
      ...rest,
    })
    .then((response) => {
      return response.data.success;
    });
};

export const addPrompt = async (data: {
  audit_type: string;
  tag: string;
  content: string;
  version: string;
  is_active?: boolean;
}): Promise<string> => {
  return api
    .post("/admin/prompt", {
      ...data,
    })
    .then((response) => {
      return response.data.id;
    });
};
