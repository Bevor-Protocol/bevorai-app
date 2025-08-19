import api, { idpApi } from "@/lib/api";
import {
  CreditSyncResponseI,
  MultiTimeseriesResponseI,
  StatsResponseI,
  TimeseriesResponseI,
  UserInfoResponseI,
  UserSchemaI,
  UserTimeseriesResponseI,
} from "@/utils/types";

class UserService {
  async createUser(privyId: string): Promise<UserSchemaI> {
    return idpApi.post("/user", { provider_id: privyId }).then((response) => {
      return response.data;
    });
  }

  async getUser(): Promise<UserSchemaI | null> {
    return api
      .get("/user")
      .then((response) => {
        return response.data;
      })
      .catch(() => null);
  }

  async syncCredits(): Promise<CreditSyncResponseI> {
    return api.post("/auth/sync/credits", {}).then((response) => {
      return response.data;
    });
  }

  async getCurrentGas(): Promise<number> {
    return api.post("/blockchain/gas", {}).then((response) => {
      return response.data;
    });
  }

  async getStats(): Promise<StatsResponseI> {
    return api.get("/platform/stats").then((response) => {
      return response.data;
    });
  }

  async getTimeseriesAudits(): Promise<TimeseriesResponseI> {
    return api.get("/summary/audits").then((response) => {
      return response.data;
    });
  }

  async getTimeseriesContracts(): Promise<TimeseriesResponseI> {
    return api.get("/summary/contracts").then((response) => {
      return response.data;
    });
  }

  async getTimeseriesUsers(): Promise<TimeseriesResponseI> {
    return api.get("/summary/users").then((response) => {
      return response.data;
    });
  }

  async getTimeseriesFindings(type: string): Promise<MultiTimeseriesResponseI> {
    return api.get(`/summary/findings/${type}`).then((response) => {
      return response.data;
    });
  }

  async getUserInfo(): Promise<UserInfoResponseI> {
    return api.get("/user/info/summary").then((response) => {
      return response.data;
    });
  }

  async getUserTimeSeries(): Promise<UserTimeseriesResponseI> {
    return api.get("/user/timeseries").then((response) => {
      return response.data;
    });
  }

  async generateApiKey(type: "user" | "app"): Promise<string> {
    return api.post(`/auth/${type}`, {}).then((response) => {
      return response.data.api_key;
    });
  }

  async generateApp(name: string): Promise<string> {
    return api.post("/app", { name }).then((response) => {
      return response.data;
    });
  }

  async updateApp(name: string): Promise<string> {
    return api.patch("/app", { name }).then((response) => {
      return response.data;
    });
  }
}

const userService = new UserService();
export default userService;
