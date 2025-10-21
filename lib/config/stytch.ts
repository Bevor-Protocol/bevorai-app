import { createStytchHeadlessClient } from "@stytch/nextjs/headless";

export const stytchClient = createStytchHeadlessClient(process.env.NEXT_PUBLIC_STYTCH_TOKEN!);
