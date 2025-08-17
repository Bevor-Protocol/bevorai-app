// import abiJSON from "@/abis/APICredits.json";
// import { bevorAction } from "@/actions";
// import AdminTools from "@/components/admin-tools";
// import { Button } from "@/components/ui/button";
// import { useCertaiBalance } from "@/hooks/useBalances";
// import { useContractWrite } from "@/hooks/useContractWrite";
// import { useIsMobile } from "@/hooks/useIsMobile";
// import { cn } from "@/lib/utils";
// import { getNetworkImage } from "@/utils/helpers";
// import { QueryKey, useQueryClient } from "@tanstack/react-query";
// import { parseUnits } from "ethers/utils";
// import { useRouter } from "next/navigation";
// import { useEffect, useRef, useState } from "react";
// import { Abi, erc20Abi } from "viem";
// import { useAccount } from "wagmi";

// const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`;
// const contractAddress = process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS as `0x${string}`;

// const BuyBar = (): JSX.Element => {
//   const router = useRouter();
//   const isMobile = useIsMobile();

//   const [amount, setAmount] = useState(0);
//   const [method, setMethod] = useState<"purchase" | "refund" | "approve" | null>(null);
//   const [signState, setSignState] = useState<"sign" | "loading" | "error" | "success" | null>();
//   const inputRef = useRef<HTMLInputElement>(null);

//   const queryClient = useQueryClient();
//   const { address, chain } = useAccount();
//   const { supported } = getNetworkImage(chain);

//   const { token, credit, deposit, allowance, promotion } = useCertaiBalance();

//   const onMutate = (): void => {
//     setSignState("sign");
//   };

//   const onSuccess = ({ keys }: { keys: QueryKey[] }): void => {
//     setSignState("success");
//     setAmount(0);
//     // can't seem to invalidate in one call?.
//     keys.forEach((key) => {
//       queryClient.invalidateQueries({
//         queryKey: key,
//       });
//     });
//   };

//   const onTxn = (hash: string): void => {
//     console.log("TXN", hash);
//     // setTxn(hash);
//     setSignState("loading");
//   };

//   const onError = (error: Error): void => {
//     console.log("ERROR", error);
//     setSignState("error");
//     setAmount(0);
//   };

//   const { writeContractWithEvents: purchaseWrite } = useContractWrite({
//     address: contractAddress,
//     abi: abiJSON.abi as Abi,
//     functionName: "purchaseCredits",
//   });

//   const { writeContractWithEvents: refundWrite } = useContractWrite({
//     address: contractAddress,
//     abi: abiJSON.abi as Abi,
//     functionName: "refundDeposit",
//   });

//   const { writeContractWithEvents: approveWrite } = useContractWrite({
//     address: tokenAddress,
//     abi: erc20Abi,
//     functionName: "approve",
//   });

//   useEffect(() => {
//     const disabled = signState === "sign" || signState === "loading" || amount > token.data;
//     if (!disabled && inputRef.current && !isMobile) {
//       inputRef.current.focus();
//     }
//   }, [signState, amount, token.data, isMobile]);

//   const handleApprove = (): void => {
//     setMethod("approve");
//     approveWrite({
//       args: [
//         contractAddress,
//         BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
//       ],
//       onError,
//       onMutate,
//       onTxn,
//       onSuccess: () => onSuccess({ keys: [allowance.queryKey] }),
//     });
//   };

//   const handleBuy = (): void => {
//     setMethod("purchase");
//     if (!amount) return;
//     purchaseWrite({
//       args: [parseUnits(amount.toString(), 18)],
//       onError,
//       onMutate,
//       onTxn,
//       onSuccess: async () => {
//         onSuccess({ keys: [credit.queryKey, token.queryKey, deposit.queryKey] });
//         await bevorAction.syncCredits();
//         router.refresh();
//       },
//     });
//   };

//   const handleRefund = (): void => {
//     setMethod("refund");
//     if (!amount) return;
//     refundWrite({
//       args: [parseUnits(amount.toString(), 18)],
//       onError,
//       onMutate,
//       onTxn,
//       onSuccess: () => onSuccess({ keys: [credit.queryKey, token.queryKey, deposit.queryKey] }),
//     });
//   };

//   return (
//     <>
//       {!address ? (
//         <p className="text-white mt-2 font-mono">Connect wallet to purchase credits...</p>
//       ) : !supported ? (
//         <p className="text-white mt-2 font-mono">Change network to purchase credits...</p>
//       ) : (
//         <>
//           {allowance.data === 0 || allowance.isLoading ? (
//             <Button
//               variant="bright"
//               onClick={handleApprove}
//               disabled={allowance.isLoading || signState === "sign" || signState === "loading"}
//               className={cn(
//                 "transition-transform duration-500",
//                 allowance.isLoading && "animate-pulse",
//               )}
//             >
//               {allowance.isLoading
//                 ? "Loading..."
//                 : signState === "sign"
//                   ? "Signing..."
//                   : signState === "loading"
//                     ? "Approving..."
//                     : "Approve to purchase credits"}
//             </Button>
//           ) : (
//             <>
//               <p className="text-white mt-2 font-mono text-xs md:text-sm lg:text-base">
//                 <span className="text-blue-400 font-bold">
//                   {promotion.data ? amount * promotion.data : amount}
//                 </span>{" "}
//                 credits [includes{" "}
//                 <span className="text-green-400 font-bold">
//                   {promotion.data ? amount * promotion.data - amount : 0}
//                 </span>{" "}
//                 bonus credits!]
//                 {signState === "success" && method === "purchase" && (
//                   <span className="text-green-400 text-bold">
//                     &nbsp;Credit Purchase Successful!
//                   </span>
//                 )}
//                 {signState === "success" && method === "refund" && (
//                   <span className="text-green-400 text-bold">&nbsp;Credit Refund Successful!</span>
//                 )}
//               </p>
//               <div
//                 className="flex w-full items-center justify-between font-mono flex-wrap"
//                 style={{ gap: "2rem" }}
//               >
//                 <div className="flex max-w-full">
//                   <span className="text-green-400 mr-2">{">"}</span>
//                   <input
//                     ref={inputRef}
//                     id="quantity"
//                     type="number"
//                     value={amount === 0 ? "" : amount}
//                     onChange={(e) => setAmount(Number(e.target.value))}
//                     disabled={signState === "loading" || signState === "sign"}
//                     className={cn(
//                       "flex-1 bg-transparent border-none outline-hidden w-[270px] max-w-[70%]",
//                       "text-white font-mono",
//                       "placeholder:text-gray-500",
//                       "caret-green-400 appearance-none",
//                       (signState === "loading" || signState === "sign") &&
//                         "cursor-not-allowed opacity-50",
//                     )}
//                     placeholder={token.isLoading ? "Loading $CERTAI balance..." : "Input amount"}
//                   />
//                   <label htmlFor="quantity" className="text-white">
//                     $CERTAI
//                   </label>
//                 </div>
//                 <div className="flex justify-between w-full">
//                   <Button
//                     variant="bright"
//                     disabled={
//                       signState === "loading" ||
//                       signState === "sign" ||
//                       amount === 0 ||
//                       amount > token.data
//                     }
//                     onClick={handleBuy}
//                   >
//                     <span
//                       className={cn(
//                         "transition-transform duration-500",
//                         method === "purchase" &&
//                           (signState === "loading" || signState === "sign") &&
//                           "animate-pulse",
//                       )}
//                     >
//                       {method === "purchase" && signState === "sign"
//                         ? "Signing..."
//                         : method === "purchase" && signState === "loading"
//                           ? "Buying..."
//                           : "Buy"}
//                     </span>
//                   </Button>
//                   <Button
//                     variant="bright"
//                     disabled={
//                       signState === "loading" ||
//                       signState === "sign" ||
//                       amount === 0 ||
//                       amount > deposit.data
//                     }
//                     onClick={handleRefund}
//                   >
//                     <span
//                       className={cn(
//                         "transition-transform duration-500",
//                         method === "refund" &&
//                           (signState === "loading" || signState === "sign") &&
//                           "animate-pulse",
//                       )}
//                     >
//                       {method === "refund" && signState === "sign"
//                         ? "Signing..."
//                         : method === "refund" && signState === "loading"
//                           ? "Refunding..."
//                           : "Refund"}
//                     </span>
//                   </Button>
//                   <AdminTools />
//                 </div>
//               </div>
//             </>
//           )}
//         </>
//       )}
//     </>
//   );
// };

// export default BuyBar;
