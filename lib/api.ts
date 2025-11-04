import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";

const api = axios.create({
  baseURL: process.env.API_URL,
});

// Add request interceptor to inject session token
api.interceptors.request.use(async (config) => {
  if (config.headers.has("skip_token")) {
    return config;
  }
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bevor-token")?.value;
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
