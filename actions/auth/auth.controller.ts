import api from "@/lib/api";
import sessionOptions from "@/lib/config/session";
import { SessionData } from "@/utils/types";
import { getIronSession, IronSession } from "iron-session";
import { cookies, headers } from "next/headers";
import { generateNonce, SiweMessage } from "siwe";

class AuthController {
  constructor() {}

  async getSession(): Promise<IronSession<SessionData>> {
    const cookieStore = await cookies();
    return await getIronSession<SessionData>(cookieStore, sessionOptions);
  }

  async nonce(): Promise<string> {
    const session = await this.getSession();
    session.nonce = generateNonce();
    await session.save();

    return session.nonce;
  }

  async currentUser(): Promise<{ address: string; user_id: string } | null> {
    const session = await this.getSession();
    if (!session?.siwe || !session.user_id) {
      return null;
    }
    const { siwe, user_id } = session;
    const { address } = siwe;

    return { address, user_id };
  }

  async verify(message: string, signature: string): Promise<void> {
    const headerList = await headers();
    const session = await this.getSession();
    const domain = headerList.get("x-forwarded-host") ?? "";

    const siweMessage = new SiweMessage(message);

    const { data, success, error } = await siweMessage.verify({
      signature,
      nonce: session.nonce,
      domain,
    });
    if (!success) {
      session.destroy();
      throw error;
    }
    session.siwe = data;

    const response = await api.post("/user", {
      address: data.address,
    });
    if (!response.data) {
      console.log("something went wrong");
      session.destroy();
    }
    session.user_id = response.data.id;

    await session.save();
  }

  async logout(): Promise<boolean> {
    const session = await this.getSession();
    session.destroy();
    return true;
  }
}

const authController = new AuthController();
export default authController;
