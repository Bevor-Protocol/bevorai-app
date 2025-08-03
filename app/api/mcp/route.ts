import axios from "axios";
import { createMcpHandler } from "mcp-handler";
import { z, ZodType } from "zod";

const BEVORAI_API_KEY = process.env.BEVORAI_API_KEY;
const BEVORAI_API_URL = process.env.BEVORAI_API_URL;

async function scanContract(solidityCode: string): Promise<string> {
  const response = await axios.post(`${BEVORAI_API_URL}/contract`, {
    code: solidityCode,
    network: "eth",
  }, {
    headers: {
      Authorization: `Bearer ${BEVORAI_API_KEY}`,
    },
  });
  const data = response.data;

  if ("id" in data) {
    return data.id;
  }

  if (data.exists && data.contract?.id) {
    return data.contract.id;
  }

  throw new Error("Could not find contract ID in response");
}

async function auditEval(solidityCode: string): Promise<any> {
  const contractId = await scanContract(solidityCode);

  const response = await axios.post(`${BEVORAI_API_URL}/audit`, {
    contract_id: contractId,
    audit_type: "security",
  }, {
    headers: {
      Authorization: `Bearer ${BEVORAI_API_KEY}`,
    },
  });

  return response.data;
}

async function getAudit(auditId: string): Promise<any> {
  const response = await axios.get(`${BEVORAI_API_URL}/audit/${auditId}`, {
    headers: {
      Authorization: `Bearer ${BEVORAI_API_KEY}`,
    },
  });

  return response.data;
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "audit_smart_contract",
      "Audits the smart contract code with BevorAI",
      { solidityCode: z.string() as ZodType<any, any, any> },
      async ({ solidityCode }) => {
        try {
          const auditResult: any = await auditEval(solidityCode);
          const auditId = auditResult.id;

          // Polling for audit status
          let statusData: any;
          do {
            const statusResponse = await axios.get(`${BEVORAI_API_URL}/audit/${auditId}/status`, {
              headers: {
                Authorization: `Bearer ${BEVORAI_API_KEY}`,
              },
            });
            statusData = statusResponse.data;

            if (statusData.status === "success") {
              const auditDetails: any = await getAudit(auditId);
              return {
                content: [
                  { type: "text", text: "BevorAI Audit Report: " },
                  ...Object.entries(auditDetails).map(([key, value]) => ({
                    type: "text",
                    text: `${key}: ${value}`,
                  })),
                ],
              };
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
          } while (statusData.status !== "success");
        } catch (error: unknown) {
          return {
            content: [
              { type: "text", text: "Error during audit: " },
              { type: "text", text: (error as Error).message },
            ],
          };
        }
      }
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as DELETE, handler as GET, handler as POST };
