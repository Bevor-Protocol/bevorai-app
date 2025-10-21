"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle,
  Code,
  Copy,
  FolderOpen,
  GitBranch,
  Globe,
  Upload,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface VersionCreationStepProps {
  projectId: string;
  teamId: string;
}

type InputMethod = "upload" | "paste" | "address" | "folder" | "mcp" | "repository";

interface ContractAddressStepProps {
  projectId: string;
  onSuccess: (result: { projectId: string; versionId: string }) => void;
  onBack: () => void;
}

const ContractAddressStep: React.FC<ContractAddressStepProps> = ({
  projectId,
  onSuccess,
  onBack,
}) => {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const { mutate, isSuccess, isPending } = useMutation({
    mutationFn: async (address: string) => bevorAction.contractUploadScan(address, projectId),
    onError: (err) => {
      console.log(err.message);
      setError("something went wrong");
    },
    onSuccess: (result) => {
      setTimeout(() => {
        onSuccess({
          projectId: result.project_id,
          versionId: result.version_id,
        });
      }, 1500);
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
          <h2 className="text-2xl font-bold text-foreground mb-2">Version Created Successfully!</h2>
          <p className="text-muted-foreground">
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Contract Address</h2>
        <p className="text-muted-foreground">Enter a deployed contract address to analyze</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="address" className="text-sm font-medium text-foreground hidden">
            Contract Address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x1234..."
            className="w-full p-4 border border-neutral-700 rounded-lg text-foreground placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
            disabled={isPending}
          />
          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <XCircle className="size-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isPending}
            className="flex-1"
          >
            Back
          </Button>
          <Button type="submit" disabled={isPending || !address.trim()} className="flex-1">
            {isPending ? (
              <div className="flex items-center space-x-2">
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Create Version</span>
                <ArrowRight className="size-4" />
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

const VersionCreationStep: React.FC<VersionCreationStepProps> = ({ projectId, teamId }) => {
  const [selectedMethod, setSelectedMethod] = useState<InputMethod | null>(null);
  const router = useRouter();

  const handleMethodSelect = (method: InputMethod): void => {
    if (method === "folder" || method === "mcp" || method === "repository") {
      return; // These are disabled
    }
    setSelectedMethod(method);
  };

  const handleBack = (): void => {
    setSelectedMethod(null);
  };

  const handleVersionCreated = (result: { projectId: string; versionId: string }): void => {
    // Redirect to the version's sources page
    router.push(`/teams/${teamId}/projects/${projectId}/versions/${result.versionId}/sources`);
  };

  // Show specific step based on selection
  if (selectedMethod === "address") {
    return (
      <ContractAddressStep
        projectId={projectId}
        onSuccess={handleVersionCreated}
        onBack={handleBack}
      />
    );
  }

  // Show method selection
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Add New Version</h1>
        <p className="text-lg text-muted-foreground">
          Choose how you&apos;d like to provide your smart contract
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className="border border-border rounded-lg p-6 hover:border-neutral-700 transition-all cursor-pointer group"
          onClick={() => handleMethodSelect("upload")}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-blue-400 group-hover:bg-blue-400/10 transition-colors">
              <Upload className="size-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Upload Files</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop your .sol contract files for analysis
          </p>
          <Button className="w-full">Choose Files</Button>
        </div>

        <div
          className="border border-border rounded-lg p-6 hover:border-neutral-700 transition-all cursor-pointer group"
          onClick={() => handleMethodSelect("paste")}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-green-400 group-hover:bg-green-400/10 transition-colors">
              <Copy className="size-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Paste Code</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Copy and paste your smart contract code directly
          </p>
          <Button className="w-full">Paste Code</Button>
        </div>

        <div
          className="border border-border rounded-lg p-6 hover:border-neutral-700 transition-all cursor-pointer group"
          onClick={() => handleMethodSelect("address")}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-purple-400 group-hover:bg-purple-400/10 transition-colors">
              <Globe className="size-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Contract Address</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Enter a deployed contract address to analyze
          </p>
          <Button className="w-full">Enter Address</Button>
        </div>

        <div className="border border-border rounded-lg p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-orange-400">
              <FolderOpen className="size-6" />
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-foreground">Upload Folder</h3>
              <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/10 text-orange-400">
                Coming Soon
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload an entire folder of contract files at once
          </p>
          <Button variant="outline" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>

        <div className="border border-border rounded-lg p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-orange-400">
              <Code className="size-6" />
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-foreground">MCP / IDE Integration</h3>
              <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/10 text-orange-400">
                Coming Soon
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Integrate directly with your IDE for seamless development
          </p>
          <Button variant="outline" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>

        <div className="border border-border rounded-lg p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-orange-400">
              <GitBranch className="size-6" />
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-foreground">Repository Scanning</h3>
              <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/10 text-orange-400">
                Coming Soon
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Automatically scan and analyze your Git repositories
          </p>
          <Button variant="outline" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VersionCreationStep;
