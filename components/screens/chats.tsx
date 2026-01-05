"use client";

import { chatActions } from "@/actions/bevor";
import { ChatElement } from "@/components/chat/element";
import { ChatFilters } from "@/components/filters/chats";
import { Pagination } from "@/components/pagination";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { generateQueryKey } from "@/utils/constants";
import { DefaultChatsQuery } from "@/utils/query-params";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";

export const ChatsView: React.FC<{
  teamSlug: string;
  projectSlug: string;
  initialQuery: typeof DefaultChatsQuery;
  defaultQuery: typeof DefaultChatsQuery;
}> = ({ teamSlug, projectSlug, initialQuery, defaultQuery }) => {
  const [filters, setFilters] = useState(initialQuery);
  const { debouncedState, timerRef, isWaiting } = useDebouncedState(filters);

  const chatsQuery = useQuery({
    queryKey: generateQueryKey.chats(teamSlug, debouncedState),
    queryFn: () =>
      chatActions.getChats(teamSlug, debouncedState).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    placeholderData: keepPreviousData,
  });

  const isAnySearched = useMemo(() => {
    return Object.entries(filters)
      .filter(([k]) => !["page_size", "page", "order"].includes(k))
      .some(
        ([k, v]) =>
          !!v &&
          defaultQuery[k as keyof typeof DefaultChatsQuery] !=
            filters[k as keyof typeof DefaultChatsQuery],
      );
  }, [filters, defaultQuery]);

  const handlePage = (page: number): void => {
    setFilters((prev) => ({ ...prev, page: String(page) }));
  };

  const handleClear = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setFilters(defaultQuery);
  };

  const hasResults = chatsQuery.data && chatsQuery.data.results.length > 0;
  const isEmpty = chatsQuery.data && chatsQuery.data.results.length === 0;

  return (
    <div className="flex flex-col space-y-6">
      <ChatFilters
        filters={filters}
        setFilters={setFilters}
        isAnySearched={isAnySearched}
        handleClear={handleClear}
      />

      {hasResults && (
        <>
          <div className="grid grid-cols-1 gap-3">
            {chatsQuery.data?.results.map((chat, ind) => (
              <ChatElement
                key={chat.id + String(ind)}
                chat={chat}
                teamSlug={teamSlug}
                projectSlug={projectSlug}
                isDisabled={isWaiting}
              />
            ))}
          </div>
          <Pagination handlePage={handlePage} results={chatsQuery.data} />
        </>
      )}

      {isEmpty && isAnySearched && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No chats found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
        </div>
      )}

      {isEmpty && !isAnySearched && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No chats yet</h3>
          <p className="text-sm text-muted-foreground">Create your first chat to get started</p>
        </div>
      )}
    </div>
  );
};
