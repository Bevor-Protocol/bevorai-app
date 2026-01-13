"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import * as Chat from "@/components/ui/chat";
import { Pill } from "@/components/ui/pill";
import { Textarea } from "@/components/ui/textarea";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { FindingSchemaI, NodeSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Send, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

interface ChatInputProps {
  teamSlug: string;
  codeId: string;
  findingContext?: FindingSchemaI[];
  onRemoveFindingFromContext?: (findingId: string) => void;
  onSendMessage: (
    message: string,
    attributes: Array<{ type: "node" | "finding"; id: string }>,
  ) => Promise<void>;
  messagesContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const TEXTAREA_MAX_HEIGHT = 264;

export const ChatInput: React.FC<ChatInputProps> = ({
  teamSlug,
  codeId,
  findingContext,
  onRemoveFindingFromContext,
  onSendMessage,
  messagesContainerRef,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: chatAttributes } = useQuery({
    queryKey: generateQueryKey.codeNodes(codeId),
    queryFn: () =>
      codeActions.getNodes(teamSlug, codeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const adjustTextareaHeight = (): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  };

  const checkScrollPosition = useCallback((): void => {
    if (!messagesContainerRef?.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isAtBottom);
  }, [messagesContainerRef]);

  useLayoutEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    if (!messagesContainerRef?.current) return;
    const container = messagesContainerRef.current;
    container.addEventListener("scroll", checkScrollPosition);
    return (): void => container.removeEventListener("scroll", checkScrollPosition);
  }, [checkScrollPosition, messagesContainerRef]);

  type SelectedAttribute = { type: "node" | "finding"; id: string; name: string };

  const selectedNodeAttributes = useMemo((): SelectedAttribute[] => {
    if (!chatAttributes) return [];
    const backtickMatches = inputValue.match(/`([^`]+)`/g);
    if (!backtickMatches) return [];

    const attributes: SelectedAttribute[] = [];
    backtickMatches.forEach((match) => {
      const name = match.slice(1, -1);
      const matchingAttr = chatAttributes.find((attr) => attr.name === name);
      if (
        matchingAttr &&
        !attributes.some((attr) => attr.type === "node" && attr.id === matchingAttr.id)
      ) {
        attributes.push({ type: "node", id: matchingAttr.id, name: matchingAttr.name });
      }
    });
    return attributes;
  }, [inputValue, chatAttributes]);

  const selectedFindingAttributes = useMemo((): SelectedAttribute[] => {
    if (!findingContext || findingContext.length === 0) return [];
    return findingContext.map((finding) => ({
      type: "finding" as const,
      id: finding.id,
      name: `finding ${truncateId(finding.id)}`,
    }));
  }, [findingContext]);

  const selectedAttributes = useMemo(
    () => [...selectedNodeAttributes, ...selectedFindingAttributes],
    [selectedNodeAttributes, selectedFindingAttributes],
  );

  const scrollToBottom = (): void => {
    if (!messagesContainerRef?.current) return;
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputValue.trim() && selectedAttributes.length === 0) return;

    const message = inputValue.trim();
    const attributes = selectedAttributes.map((attr) => ({ type: attr.type, id: attr.id }));
    setInputValue("");

    if (onRemoveFindingFromContext && findingContext) {
      findingContext.forEach((finding) => {
        onRemoveFindingFromContext(finding.id);
      });
    }

    await onSendMessage(message, attributes);
  };

  const handleRemoveAttribute = (attr: SelectedAttribute): void => {
    if (attr.type === "node") {
      const pattern = new RegExp(
        `\\\`${attr.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\\`\\s*`,
        "g",
      );
      setInputValue((prev) => prev.replace(pattern, ""));
    } else if (attr.type === "finding" && onRemoveFindingFromContext) {
      onRemoveFindingFromContext(attr.id);
    }
  };

  const calculateSimilarityScore = (name: string, query: string): number => {
    const lowerName = name.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerName === lowerQuery) {
      return 1000;
    }

    if (lowerName.startsWith(lowerQuery)) {
      return 500 + (lowerQuery.length / lowerName.length) * 100;
    }

    const index = lowerName.indexOf(lowerQuery);
    if (index !== -1) {
      return 200 + (lowerQuery.length / lowerName.length) * 100 - index;
    }

    let matchingChars = 0;
    let queryIndex = 0;
    for (let i = 0; i < lowerName.length && queryIndex < lowerQuery.length; i++) {
      if (lowerName[i] === lowerQuery[queryIndex]) {
        matchingChars++;
        queryIndex++;
      }
    }

    if (matchingChars === 0) {
      return 0;
    }

    return (matchingChars / lowerQuery.length) * 100;
  };

  const filteredAttributes =
    chatAttributes
      ?.map((attr) => ({
        attr,
        score: calculateSimilarityScore(attr.name, autocompleteQuery),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.attr) || [];
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value;
    setInputValue(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setAutocompleteQuery(textAfterAt);
        setShowAutocomplete(true);
        setSelectedAutocompleteIndex(0);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }

    adjustTextareaHeight();
  };

  const insertAutocompleteItem = (item: NodeSchemaI): void => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = inputValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const beforeAt = inputValue.substring(0, lastAtIndex);
      const afterCursor = inputValue.substring(cursorPosition);
      const newValue = beforeAt + `\`${item.name}\`` + " " + afterCursor;

      setInputValue(newValue);
      setShowAutocomplete(false);

      setTimeout(() => {
        const newCursorPos = beforeAt.length + `\`${item.name}\``.length + 1;
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const scrollToSelectedItem = (index: number): void => {
    const dropdown = document.querySelector("[data-autocomplete-dropdown]");
    if (!dropdown) return;

    const items = dropdown.querySelectorAll("[data-autocomplete-item]");
    const selectedItem = items[index] as HTMLElement;
    if (!selectedItem) return;

    const dropdownRect = dropdown.getBoundingClientRect();
    const itemRect = selectedItem.getBoundingClientRect();

    if (itemRect.top < dropdownRect.top) {
      selectedItem.scrollIntoView({ block: "start", behavior: "smooth" });
    } else if (itemRect.bottom > dropdownRect.bottom) {
      selectedItem.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (showAutocomplete && filteredAttributes.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const newIndex =
          selectedAutocompleteIndex < filteredAttributes.length - 1
            ? selectedAutocompleteIndex + 1
            : 0;
        setSelectedAutocompleteIndex(newIndex);
        scrollToSelectedItem(newIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const newIndex =
          selectedAutocompleteIndex > 0
            ? selectedAutocompleteIndex - 1
            : filteredAttributes.length - 1;
        setSelectedAutocompleteIndex(newIndex);
        scrollToSelectedItem(newIndex);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertAutocompleteItem(filteredAttributes[selectedAutocompleteIndex]);
      } else if (e.key === "Escape") {
        setShowAutocomplete(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative mt-auto">
      {selectedAttributes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAttributes.map((attr) => (
            <Pill
              key={`${attr.type}-${attr.id}`}
              className="flex items-center gap-1.5 cursor-pointer"
              onClick={() => handleRemoveAttribute(attr)}
            >
              <span>{attr.name}</span>
              <X className="size-3" />
            </Pill>
          ))}
        </div>
      )}
      <div className="rounded-3xl border bg-card p-2 shadow-sm">
        <Textarea
          ref={textareaRef}
          rows={1}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Bevor..."
          className="flex-1 max-h-[264px] p-2 resize-none border-0 bg-transparent! leading-6 text-foreground focus-visible:outline-none focus-visible:ring-0 scrollbar-thin disabled:opacity-50 disabled:cursor-not-allowed"
          autoFocus
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!inputValue.trim() && selectedAttributes.length === 0}
            size="icon"
            className="size-8 rounded-full"
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>

      {showAutocomplete && filteredAttributes.length > 0 && (
        <Chat.AutoComplete
          attributes={filteredAttributes}
          selectedAutocompleteIndex={selectedAutocompleteIndex}
          insertAutocompleteItem={insertAutocompleteItem}
        />
      )}

      {showScrollToBottom && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
          <Button onClick={scrollToBottom} size="sm" className="rounded-full shadow-lg">
            <ChevronDown className="size-3" />
          </Button>
        </div>
      )}
    </form>
  );
};
