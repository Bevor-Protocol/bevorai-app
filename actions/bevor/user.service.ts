"use server";

import api from "@/lib/api";
import { CreditSyncResponseI } from "@/utils/types";

export const syncCredits = async (teamSlug: string): Promise<CreditSyncResponseI> => {
  return api
    .post("/auth/sync/credits", {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};
