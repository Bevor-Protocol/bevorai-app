// import abiJSON from "@/abis/APICredits.json";
// import { QueryKey } from "@tanstack/react-query";
// import { erc20Abi } from "viem";
// import { useAccount, useReadContract } from "wagmi";

// const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`;
// const contractAddress = process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS as `0x${string}`;

// export const useCertaiBalance = (): {
//   token: {
//     data: number;
//     isLoading: boolean;
//     queryKey: QueryKey;
//   };
//   allowance: {
//     data: number;
//     isLoading: boolean;
//     queryKey: QueryKey;
//   };
//   credit: {
//     data: number;
//     isLoading: boolean;
//     queryKey: QueryKey;
//   };
//   deposit: {
//     data: number;
//     isLoading: boolean;
//     queryKey: QueryKey;
//   };
//   promotion: {
//     data: number;
//     isLoading: boolean;
//     queryKey: QueryKey;
//   };
// } => {
//   const { address } = useAccount();

//   const {
//     data: tokenData,
//     isLoading: isTokenDataLoading,
//     queryKey: tokenQueryKey,
//   } = useReadContract({
//     address: tokenAddress,
//     abi: erc20Abi,
//     functionName: "balanceOf",
//     args: [address!],
//     query: {
//       enabled: !!address,
//     },
//   });

//   const {
//     data: allowanceData,
//     isLoading: isAllowanceLoading,
//     queryKey: allowanceQueryKey,
//   } = useReadContract({
//     address: tokenAddress,
//     abi: erc20Abi,
//     functionName: "allowance",
//     args: [
//       address!, // owner
//       contractAddress, // spender
//     ],
//     query: {
//       enabled: !!address,
//     },
//   });

//   const {
//     data: creditData,
//     isLoading: isCreditDataLoading,
//     queryKey: creditQueryKey,
//   } = useReadContract({
//     address: contractAddress,
//     abi: abiJSON.abi,
//     functionName: "apiCredits",
//     args: [address!],
//     query: {
//       enabled: !!address,
//     },
//   });

//   const {
//     data: depositData,
//     isLoading: isDepositDataLoading,
//     queryKey: depositQueryKey,
//   } = useReadContract({
//     address: contractAddress,
//     abi: abiJSON.abi,
//     functionName: "depositAmount",
//     args: [address!],
//     query: {
//       enabled: !!address,
//     },
//   });

//   const {
//     data: promotionData,
//     isLoading: isPromotionDataLoading,
//     queryKey: promotionQueryKey,
//   } = useReadContract({
//     address: contractAddress,
//     abi: abiJSON.abi,
//     functionName: "promotionalCreditScalar",
//     args: [],
//   });

//   // console.log("TOKEN", tokenData, isTokenDataLoading, isFetching, isRefetching);
//   // console.log("ALLOWANCE", allowanceData, isAllowanceLoading);
//   // console.log("CREDIT", creditData, isCreditDataLoading);
//   // console.log("DEPOSIT", depositData, isDepositDataLoading);
//   // console.log("PROMOTION", promotionData, isPromotionDataLoading);

//   return {
//     token: {
//       data: typeof tokenData === "bigint" ? Number(tokenData) / 10 ** 18 : 0,
//       isLoading: isTokenDataLoading,
//       queryKey: tokenQueryKey,
//     },
//     allowance: {
//       data: typeof allowanceData === "bigint" ? Number(allowanceData) / 10 ** 18 : 0,
//       isLoading: isAllowanceLoading,
//       queryKey: allowanceQueryKey,
//     },
//     credit: {
//       data: typeof creditData === "bigint" ? Number(creditData) / 10 ** 18 : 0,
//       isLoading: isCreditDataLoading,
//       queryKey: creditQueryKey,
//     },
//     deposit: {
//       data: typeof depositData === "bigint" ? Number(depositData) / 10 ** 18 : 0,
//       isLoading: isDepositDataLoading,
//       queryKey: depositQueryKey,
//     },
//     promotion: {
//       data: Number(promotionData || 0n) / 100,
//       isLoading: isPromotionDataLoading,
//       queryKey: promotionQueryKey,
//     },
//   };
// };
