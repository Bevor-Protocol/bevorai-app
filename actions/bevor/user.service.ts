"use server";

import api from "@/lib/api";
import {
  CreditSyncResponseI,
  MemberInviteSchema,
  MultiTimeseriesResponseI,
  StatsResponseI,
  TimeseriesResponseI,
  UserInfoResponseI,
  UserSchemaI,
  UserTimeseriesResponseI,
} from "@/utils/types";

export const getUser = async (): Promise<UserSchemaI | null> => {
  return api
    .get("/user", { headers: { "skip-team": true } })
    .then((response) => {
      return response.data;
    })
    .catch(() => null);
};

export const syncCredits = async (): Promise<CreditSyncResponseI> => {
  return api.post("/auth/sync/credits", { headers: { "skip-team": true } }).then((response) => {
    return response.data;
  });
};

export const getCurrentGas = async (): Promise<number> => {
  return api.post("/blockchain/gas", { headers: { "skip-team": true } }).then((response) => {
    return response.data;
  });
};

export const getStats = async (): Promise<StatsResponseI> => {
  return api.get("/platform/stats", { headers: { "skip-team": true } }).then((response) => {
    return response.data;
  });
};

export const getTimeseriesAudits = async (): Promise<TimeseriesResponseI> => {
  return api.get("/summary/audits").then((response) => {
    return response.data;
  });
};

export const getTimeseriesContracts = async (): Promise<TimeseriesResponseI> => {
  return api.get("/summary/contracts").then((response) => {
    return response.data;
  });
};

export const getTimeseriesUsers = async (): Promise<TimeseriesResponseI> => {
  return api.get("/summary/users").then((response) => {
    return response.data;
  });
};

export const getTimeseriesFindings = async (type: string): Promise<MultiTimeseriesResponseI> => {
  return api.get(`/summary/findings/${type}`).then((response) => {
    return response.data;
  });
};

export const getUserInfo = async (): Promise<UserInfoResponseI> => {
  return api.get("/user/info/summary").then((response) => {
    return response.data;
  });
};

export const getUserInvites = async (): Promise<MemberInviteSchema[]> => {
  return api.get("/user/invites").then((response) => {
    return response.data.results;
  });
};

export const getUserTimeSeries = async (): Promise<UserTimeseriesResponseI> => {
  return api.get("/user/timeseries").then((response) => {
    return response.data;
  });
};

export const generateApiKey = async (type: "user" | "app"): Promise<string> => {
  return api.post(`/auth/${type}`, {}).then((response) => {
    return response.data.api_key;
  });
};

export const generateApp = async (name: string): Promise<string> => {
  return api.post("/app", { name }).then((response) => {
    return response.data;
  });
};

export const updateApp = async (name: string): Promise<string> => {
  return api.patch("/app", { name }).then((response) => {
    return response.data;
  });
};
