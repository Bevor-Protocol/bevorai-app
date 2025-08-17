import axios from "axios";
import { cookies } from "next/headers";

const adminApi = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    Authorization: `Bearer ${process.env.CERTAIK_API_KEY}`,
  },
});

const api = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    Authorization: `Bearer ${process.env.CERTAIK_API_KEY}`,
  },
});

// Add request interceptor to inject session token
api.interceptors.request.use(async (config) => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bevor-token")?.value;
  if (!sessionToken) {
    throw new Error("no session token");
  }
  config.headers["Authorization"] = `Bearer ${sessionToken}`;
  return config;
});

const streaming_api = axios.create({
  baseURL: process.env.API_URL,
  responseType: "stream",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CERTAIK_API_KEY}`,
  },
  timeout: 0, // Disable timeout for streaming
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

export default api;
export { adminApi, streaming_api };
