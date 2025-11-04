"use server";

import api from "@/lib/api";
import { CreditSyncResponseI } from "@/utils/types";

export const syncCredits = async (teamId: string): Promise<CreditSyncResponseI> => {
  return api
    .post("/auth/sync/credits", {}, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};
