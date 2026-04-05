/** Persisted chat panel layout (expanded rail + maximized). */

export const CHAT_PANEL_COOKIE_NAME = "bevor_chat_panel";

export interface ChatPanelCookieState {
  isExpanded: boolean;
  isMaximized: boolean;
}

const normalize = (raw: unknown): ChatPanelCookieState | null => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "boolean") {
    return { isExpanded: raw, isMaximized: false };
  }
  if (typeof raw === "object" && raw !== null && "isExpanded" in raw) {
    const o = raw as Record<string, unknown>;
    return {
      isExpanded: Boolean(o.isExpanded),
      isMaximized: Boolean(o.isMaximized),
    };
  }
  return null;
};

/** Parse the raw cookie value (already decoded by `cookies().get()`). */
export const parseChatPanelCookie = (value: string | undefined): ChatPanelCookieState | null => {
  if (value == null || value === "") return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    return normalize(parsed);
  } catch {
    try {
      return normalize(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }
};

export const getChatPanelStateFromCookie = (
  raw: string | undefined,
  whenMissing: Pick<ChatPanelCookieState, "isExpanded"> = { isExpanded: true },
): ChatPanelCookieState => {
  const parsed = parseChatPanelCookie(raw);
  if (!parsed) {
    return { isExpanded: whenMissing.isExpanded, isMaximized: false };
  }
  return parsed;
};

/** Client: write HttpOnly-incompatible panel prefs (non-sensitive UI state). */
export const persistChatPanelCookie = (state: ChatPanelCookieState): void => {
  if (typeof document === "undefined") return;
  const payload = encodeURIComponent(JSON.stringify(state));
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${CHAT_PANEL_COOKIE_NAME}=${payload};path=/;max-age=${maxAge};samesite=lax`;
};
