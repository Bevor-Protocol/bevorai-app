"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSSE } from "@/hooks/useSSE";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, Globe, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

const ContractAddressStep: React.FC<{
  project: ProjectDetailedSchemaI;
}> = ({ project }) => {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const toastId = useRef<string | number>(undefined);
  const sseToastId = useRef<string | number | undefined>(undefined);

  const { connect } = useSSE({
    autoConnect: false,
    eventTypes: ["code_versions"],
    onMessage: (message) => {
      let parsed: string;
      try {
        parsed = JSON.parse(message.data);
      } catch {
        parsed = message.data;
      }

      if (parsed === "pending" || parsed === "embedding") {
        sseToastId.current = toast.loading("Post-processing code...");
      }

      if (parsed === "embedded") {
        toast.success("Post-processing successful", {
          id: sseToastId.current,
        });
        sseToastId.current = undefined;
      } else if (parsed === "failed") {
        toast.error("Post-processing failed", {
          id: sseToastId.current,
        });
        sseToastId.current = undefined;
      }
    },
  });

  const mutation = useMutation({
    mutationFn: async (address: string) =>
      codeActions.contractUploadScan(project.team.slug, project.id, address),
    onMutate: () => {
      setError("");
      toastId.current = toast.loading("Uploading and parsing code...");
    },
    onError: () => {
      toast.dismiss(toastId.current);
      setError("something went wrong");
    },
    onSuccess: ({ id, status, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Successfully uploaded code", {
        id: toastId.current,
      });

      if (status === "embedding" || status === "pending") {
        connect(`/code-versions/${id}`);
      }
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
    mutation.mutate(encodedAddress);
  };

  if (mutation.isSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="size-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold ">Version Created Successfully!</h2>
          <p className="text-muted-foreground">
            Your contract has been uploaded and is ready for analysis.
          </p>
          <Button asChild className="mt-4">
            <Link
              href={`/teams/${project.team.slug}/projects/${project.slug}/codes/${mutation.data.id}`}
            >
              View Version
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <XCircle className="size-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold ">Upload Failed</h2>
          <p className="text-muted-foreground">
            There was an error processing your contract. Please try again.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <Button variant="outline" onClick={() => mutation.reset()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-left space-y-2">
        <div className="flex flex-row gap-4 justify-start items-center">
          <Globe className="size-6 text-purple-400" />
          <h2 className="text-2xl font-bold ">Explorer Scan</h2>
        </div>
        <p className="text-muted-foreground">
          Enter a deployed, verified contract address to analyze
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="address" className="text-sm font-medium  hidden">
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
              disabled={mutation.isPending}
            />
            <Button
              type="submit"
              disabled={mutation.isPending || !address.trim()}
              className="min-w-40 grow"
            >
              <span>Submit</span>
              <ArrowRight className="size-4" />
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
