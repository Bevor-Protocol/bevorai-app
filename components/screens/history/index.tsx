"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import * as Dropdown from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { LoaderFull } from "@/components/ui/loader";
import { MultiSelect } from "@/components/ui/multi-select";
import { cn, prettyDate } from "@/lib/utils";
import { constructSearchQuery, trimAddress } from "@/utils/helpers";
import { AuditTableReponseI, DropdownOption } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { FilterIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const auditTypeOptions: DropdownOption[] = [
  {
    name: "gas",
    value: "gas",
  },
  {
    name: "security",
    value: "security",
  },
];

const networkOptions: DropdownOption[] = [
  {
    name: "eth mainnet",
    value: "eth",
  },
  {
    name: "bsc",
    value: "bsc",
  },
  {
    name: "polygon",
    value: "polygon",
  },
  {
    name: "sepolia",
    value: "eth_sepolia",
  },
  {
    name: "bsc testnet",
    value: "bsc_test",
  },
  {
    name: "base",
    value: "base",
  },
  {
    name: "polygon testnet",
    value: "polygon_amoy",
  },
  {
    name: "base testnet",
    value: "base_sepolia",
  },
];

const getInitialState = (query: { [key: string]: string }, key: string): DropdownOption[] => {
  if (!(key in query)) {
    return [];
  }
  const options = query[key].split(",");
  switch (key) {
    case "network": {
      return networkOptions.filter((network) => options.includes(network.value));
    }
    case "audit_type": {
      return auditTypeOptions.filter((type) => options.includes(type.value));
    }
    default: {
      return [];
    }
  }
};

export const AuditsSearch = ({ query }: { query?: { [key: string]: string } }): JSX.Element => {
  const router = useRouter();

  // const [projectTypeSelected, setProjectTypeSelected] = useState<DropdownOption[]>(
  //   getInitialState(query || {}, "project_type"),
  // );
  const [networkTypesSelected, setNetworkTypesSelected] = useState<DropdownOption[]>(
    getInitialState(query || {}, "network"),
  );
  const [address, setAddress] = useState(query?.user_address ?? "");
  const [contract, setContract] = useState(query?.contract_address ?? "");

  const submitHandler = (): void => {
    const search = constructSearchQuery({
      networks: networkTypesSelected,
      address,
      contract,
      page: query?.page ?? "0",
    });
    router.push(`/analytics/history?${search.toString()}`);
  };

  const resetHandler = (): void => {
    setNetworkTypesSelected([]);
    setAddress("");
    setContract("");
    if (query) {
      router.push("/analytics/history");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        type="text"
        placeholder="User address..."
        className="bg-gray-900 rounded px-3 py-2 text-sm flex-1 !min-w-[80%] md:!min-w-0 md:w-fit"
        value={address}
        onChange={(e) => setAddress(e.currentTarget.value)}
      />
      <Button
        variant="bright"
        onClick={submitHandler}
        className="order-3 grow md:order-2 md:grow-0"
      >
        Search
      </Button>
      <Button variant="bright" onClick={resetHandler} className="order-4 grow md:order-3 md:grow-0">
        Reset
      </Button>
      <Dropdown.Main className="cursor-pointer order-2 md:order-4">
        <Dropdown.Trigger>
          <div className="relative">
            <FilterIcon size={20} />
            {(!!address || !!contract || networkTypesSelected.length > 0) && (
              <span className="absolute h-2 w-2 bg-green-400 rounded-full -top-2 -right-2" />
            )}
          </div>
        </Dropdown.Trigger>
        <Dropdown.Content className="top-[150%] right-0 w-72" hasCloseTrigger>
          <AuditSearchDropdown
            address={address}
            setAddress={setAddress}
            contract={contract}
            setContract={setContract}
            networkTypesSelected={networkTypesSelected}
            setNetworkTypesSelected={setNetworkTypesSelected}
            submitHandler={submitHandler}
          />
        </Dropdown.Content>
      </Dropdown.Main>
    </div>
  );
};

type DropdownProps = {
  address: string;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  close?: () => void;
  contract: string;
  setContract: React.Dispatch<React.SetStateAction<string>>;
  networkTypesSelected: DropdownOption[];
  setNetworkTypesSelected: React.Dispatch<React.SetStateAction<DropdownOption[]>>;
  submitHandler: () => void;
};

const AuditSearchDropdown: React.FC<DropdownProps> = ({
  address,
  setAddress,
  contract,
  setContract,
  networkTypesSelected,
  setNetworkTypesSelected,
  close,
  submitHandler,
}) => {
  return (
    <div className="flex flex-col gap-4 p-2 bg-black rounded-md">
      <Input
        type="text"
        placeholder="User address..."
        className="bg-gray-900 rounded px-3 py-2 text-sm flex-1"
        value={address}
        onChange={(e) => setAddress(e.currentTarget.value)}
      />
      <Input
        type="text"
        placeholder="Contract address..."
        className="bg-gray-900 rounded px-3 py-2 text-sm w-full"
        value={contract}
        onChange={(e) => setContract(e.currentTarget.value)}
      />
      <div className="w-full">
        <MultiSelect
          title="network"
          options={networkOptions}
          selectedOptions={networkTypesSelected}
          setSelectedOptions={setNetworkTypesSelected}
        />
      </div>
      <div className="flex gap-2 w-full">
        <Button
          variant="bright"
          onClick={() => {
            if (close) close();
            submitHandler();
          }}
          className="flex-1"
        >
          Apply Filters
        </Button>
        <Button variant="transparent" className="flex-1" onClick={close}>
          Close
        </Button>
      </div>
    </div>
  );
};

export const Content = ({ query }: { query?: { [key: string]: string } }): JSX.Element => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-data", query ?? {}],
    queryFn: () => bevorAction.getAudits(query || {}),
  });

  if (isError) {
    return (
      <div className="flex grow justify-center items-center">
        <p className="text-red-600">something went wrong...</p>
      </div>
    );
  }

  if (data?.results && !data.results.length) {
    return (
      <div className="flex grow justify-center items-center">
        <p className="">no audits matched this criteria...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col grow justify-between overflow-x-hidden">
      <div className="flex flex-col grow overflow-x-scroll w-full">
        <div
          className={cn(
            "grid grid-cols-8 border-gray-800 min-w-[600px]",
            " *:text-center *:pb-2 *:text-sm md:*:text-base",
          )}
        >
          <div className="col-span-1">#</div>
          <div className="col-span-2">User</div>
          <div className="col-span-1">Method</div>
          <div className="col-span-2">Address</div>
          <div className="col-span-1">Network</div>
          <div className="col-span-1">Created</div>
        </div>
        {isLoading && <LoaderFull className="h-12 w-12" />}
        {isError && <p className="text-red-600">something went wrong...</p>}
        <Table results={data?.results ?? []} />
      </div>
      <Pagination query={query} data={data} more={data?.more ?? false} isLoading={isLoading} />
    </div>
  );
};

export const Table = ({ results }: { results: AuditTableReponseI["results"] }): JSX.Element => {
  return (
    <div className="flex flex-col grow justify-between min-w-[600px]">
      <div className="grow">
        {results.map((audit) => (
          <Link
            key={audit.id}
            href={`/audits/${audit.id}`}
            className={cn(
              "border-t border-gray-800 hover:bg-gray-900 cursor-pointer block outline-hidden",
              "appearance-none focus:bg-gray-900 focus-within:bg-gray-900",
            )}
          >
            <div
              className={cn(
                "w-full grid grid-cols-8 text-xs",
                " *:p-2 *:text-center *:whitespace-nowrap",
              )}
            >
              <div className="col-span-1">{audit.n + 1}</div>
              <div className="col-span-2">{trimAddress(audit.user.address)}</div>
              <div className="col-span-1">{audit.contract.source_type}</div>
              <div className="col-span-2">
                {audit.contract.target ? trimAddress(audit.contract.target) : "N/A"}
              </div>
              <div className="col-span-1">{audit.contract.network || "N/A"}</div>
              <div className="col-span-1">{prettyDate(audit.created_at)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const Pagination = ({
  query,
  data,
  more,
  isLoading,
}: {
  query?: { [key: string]: string };
  data?: AuditTableReponseI;
  more: boolean;
  isLoading: boolean;
}): JSX.Element => {
  const page = Number(query?.page || "0");

  const router = useRouter();
  const [totalPages, setTotalPages] = useState(1);

  const handlePaginate = (type: "prev" | "next"): void => {
    const curQuery = constructSearchQuery({
      networks: getInitialState(query || {}, "network"),
      address: query?.address ?? "",
      contract: query?.contract_address ?? "",
    });

    curQuery.set("page", (type === "prev" ? page - 1 : page + 1).toString());
    router.push(`/analytics/history?${curQuery.toString()}`);
  };

  useEffect(() => {
    if (!data) return;
    setTotalPages(data.total_pages);
  }, [data]);
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-4">
        <Button
          disabled={page === 0 || isLoading}
          variant="transparent"
          onClick={() => handlePaginate("prev")}
        >
          ←
        </Button>
        <span className="text-sm text-gray-400">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          disabled={!more || isLoading}
          variant="transparent"
          onClick={() => handlePaginate("next")}
        >
          →
        </Button>
      </div>
    </div>
  );
};
