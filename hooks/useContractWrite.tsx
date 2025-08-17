// "use client";

// import { Abi, Address } from "viem";
// import { simulateContract, waitForTransactionReceipt, writeContract } from "viem/actions";
// import { useAccount, useConfig, useConnectorClient, useWalletClient } from "wagmi";

// export const useContractWrite = ({
//   address,
//   abi,
//   functionName,
// }: {
//   address: Address;
//   abi: Abi;
//   functionName: string;
// }): {
//   writeContractWithEvents: ({
//     args,
//     onMutate,
//     onSuccess,
//     onTxn,
//     onError,
//   }: {
//     args: readonly any[];
//     onMutate?: () => void;
//     onSuccess?: (receipt: any) => void;
//     onTxn?: (hash: string) => void;
//     onError?: (error: Error) => void;
//   }) => Promise<void>;
// } => {
//   // const publicClient = useClient();
//   const { connector } = useAccount();
//   const config = useConfig();
//   const { data: publicClient } = useWalletClient();
//   const { data: client } = useConnectorClient({
//     config,
//     connector,
//   });

//   const writeContractWithEvents = ({
//     args,
//     onMutate,
//     onSuccess,
//     onTxn,
//     onError,
//   }: {
//     args: readonly any[];
//     onMutate?: () => void;
//     onSuccess?: (receipt: any) => void;
//     onTxn?: (hash: string) => void;
//     onError?: (error: Error) => void;
//   }): Promise<void> => {
//     if (!client || !publicClient) return Promise.reject();
//     const params = {
//       address,
//       abi,
//       functionName,
//       args,
//     };
//     onMutate?.();
//     return (
//       simulateContract(publicClient, { ...params, account: client.account })
//         .then(({ request }) => {
//           return writeContract(client, request);
//         })
//         // return writeContract(client, request)
//         .then((hash) => {
//           onTxn?.(hash);
//           return waitForTransactionReceipt(publicClient, { hash });
//         })
//         .then((receipt) => {
//           console.log("RECEIPT", receipt);
//           if (receipt.status === "success") {
//             onSuccess?.(receipt);
//           } else {
//             onError?.(new Error("Bad receipt"));
//           }
//         })
//         .catch((error) => {
//           onError?.(error);
//         })
//     );
//   };

//   return {
//     writeContractWithEvents,
//   };
// };
