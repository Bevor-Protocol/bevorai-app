import axios, { AxiosError } from "axios";
import { cookies, headers } from "next/headers";

const api = axios.create({
  baseURL: process.env.API_URL,
});

// Add request interceptor to inject session token
api.interceptors.request.use(async (config) => {
  if (config.headers.has("skip-auth")) {
    return config;
  }
  const cookieStore = await cookies();
  const headerStore = await headers();
  const sessionToken = cookieStore.get("bevor-token")?.value;
  const teamId = headerStore.get("bevor-team-id");
  if (!sessionToken) {
    // just mock an actual api response, so we can handle this, and api responses that are errors, the same.
    throw new AxiosError("no session token", "ERR_BAD_REQUEST", undefined, null, {
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: config, // your axios config if needed
      data: {
        code: "session_token_expired", // 👈 what you want to catch later
        message: "Session token is missing or expired",
      },
    });
  }
  config.headers["Authorization"] = `Bearer ${sessionToken}`;
  if (teamId && !config.headers.has("skip-team")) {
    config.headers["Bevor-Team-Id"] = teamId;
  }

  return config;
});

const idpApi = axios.create({
  baseURL: process.env.API_URL,
});

const streaming_api = axios.create({
  baseURL: process.env.API_URL,
  responseType: "stream",
  timeout: 0, // Disable timeout for streaming
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

export default api;
export { idpApi, streaming_api };
