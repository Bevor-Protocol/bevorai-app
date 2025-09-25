"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { navigation } from "@/utils/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, Globe, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface ContractAddressStepProps {
  projectId: string;
  params: { teamSlug: string; projectSlug: string };
}

const ContractAddressStep: React.FC<ContractAddressStepProps> = ({ projectId, params }) => {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const { mutate, isSuccess, isPending } = useMutation({
    mutationFn: async (address: string) => bevorAction.contractUploadScan(address, projectId),
    onError: (err) => {
      console.log(err.message);
      setError("something went wrong");
    },
    onSuccess: (result) => {
      setTimeout(() => {
        router.push(
          navigation.project.versions.overview({ ...params, versionId: result.version_id }),
        );
      }, 1000);
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!address.trim()) {
      setError("Please enter a contract address");
      return;
    }

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Please enter a valid address");
      return;
    }
    setError("");

    const encodedAddress = encodeURIComponent(address);
    mutate(encodedAddress);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="size-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-100 mb-2">
            Version Created Successfully!
          </h2>
          <p className="text-neutral-400">
            Your contract has been uploaded and is ready for audit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
          <Globe className="size-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Contract Address</h2>
        <p className="text-neutral-400">Enter a deployed contract address to analyze</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="address" className="text-sm font-medium text-neutral-300 hidden">
            Contract Address
          </label>
          <div className="flex flex-row gap-4 flex-wrap">
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x1234..."
              className="font-mono grow basis-1/2"
              disabled={isPending}
            />
            <Button type="submit" disabled={isPending || !address.trim()} className="min-w-40 grow">
              {isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Submit</span>
                  <ArrowRight className="size-4" />
                </div>
              )}
            </Button>
          </div>
          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <XCircle className="size-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ContractAddressStep;
