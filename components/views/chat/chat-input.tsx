"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import * as Chat from "@/components/ui/chat";
import { useChat } from "@/providers/chat";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { FindingSchemaI, NodeSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Send } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

interface ChatInputProps {
  teamSlug: string;
  codeId: string;
  findingContext?: FindingSchemaI[];
  availableFindings?: FindingSchemaI[];
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
  const [inputHtml, setInputHtml] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const atPositionRef = useRef<{ node: Text; offset: number } | null>(null);
  const { attributes: chatProviderAttributes, removeFinding } = useChat();

  const { data: chatAttributes } = useQuery({
    queryKey: generateQueryKey.codeNodes(codeId),
    queryFn: () =>
      codeActions.getNodes(teamSlug, codeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const getPlainText = useCallback((): string => {
    if (!contentEditableRef.current) return "";
    const clone = contentEditableRef.current.cloneNode(true) as HTMLElement;
    const pills = clone.querySelectorAll("[data-attribute-id]");
    pills.forEach((pill) => {
      const pillText = pill.textContent || "";
      const nextSibling = pill.nextSibling;
      const hasSpaceAfter =
        nextSibling?.nodeType === Node.TEXT_NODE &&
        (nextSibling as Text).textContent?.startsWith(" ");

      const replacementText = hasSpaceAfter ? pillText : pillText + " ";
      const textNode = document.createTextNode(replacementText);
      pill.parentNode?.replaceChild(textNode, pill);

      if (hasSpaceAfter) {
        const spaceNode = nextSibling as Text;
        const remainingText = spaceNode.textContent?.substring(1) || "";
        if (remainingText) {
          const remainingNode = document.createTextNode(remainingText);
          spaceNode.parentNode?.replaceChild(remainingNode, spaceNode);
        } else {
          spaceNode.parentNode?.removeChild(spaceNode);
        }
      }
    });
    return clone.textContent || "";
  }, []);

  const getAttributesFromContent = useCallback((): Array<{
    type: "node" | "finding";
    id: string;
  }> => {
    if (!contentEditableRef.current) return [];
    const attributeElements = contentEditableRef.current.querySelectorAll("[data-attribute-id]");
    const attributes: Array<{ type: "node" | "finding"; id: string }> = [];
    attributeElements.forEach((el) => {
      const id = el.getAttribute("data-attribute-id");
      const type = el.getAttribute("data-attribute-type") as "node" | "finding";
      if (id && type) {
        attributes.push({ type, id });
      }
    });
    return attributes;
  }, []);

  const adjustContentHeight = (): void => {
    const div = contentEditableRef.current;
    if (!div) return;
    div.style.height = "auto";
    const nextHeight = Math.min(div.scrollHeight, TEXTAREA_MAX_HEIGHT);
    div.style.height = `${nextHeight}px`;
    div.style.overflowY = div.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  };

  const checkScrollPosition = useCallback((): void => {
    if (!messagesContainerRef?.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isAtBottom);
  }, [messagesContainerRef]);

  useLayoutEffect(() => {
    adjustContentHeight();
  }, [inputHtml]);

  useEffect(() => {
    if (!messagesContainerRef?.current) return;
    const container = messagesContainerRef.current;
    container.addEventListener("scroll", checkScrollPosition);
    return (): void => container.removeEventListener("scroll", checkScrollPosition);
  }, [checkScrollPosition, messagesContainerRef]);

  useEffect(() => {
    if (!contentEditableRef.current || !chatProviderAttributes) return;
    const findingAttributes = chatProviderAttributes.filter((attr) => attr.type === "finding");
    const existingPills = contentEditableRef.current.querySelectorAll(
      "[data-attribute-type='finding']",
    );
    const existingIds = new Set(
      Array.from(existingPills).map((pill) => pill.getAttribute("data-attribute-id")),
    );
    const providerIds = new Set(findingAttributes.map((attr) => attr.id));

    providerIds.forEach((providerId) => {
      if (!existingIds.has(providerId)) {
        const attr = findingAttributes.find((a) => a.id === providerId);
        if (!attr) return;

        const pill = document.createElement("span");
        pill.setAttribute("data-attribute-id", attr.id);
        pill.setAttribute("data-attribute-type", "finding");
        pill.setAttribute("data-attribute-name", attr.name);
        pill.setAttribute("contenteditable", "false");
        pill.className =
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground text-sm font-medium cursor-pointer hover:bg-accent/80";
        pill.textContent = attr.name;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.collapse(false);
          range.insertNode(pill);
          const spaceText = document.createTextNode(" ");
          range.setStartAfter(pill);
          range.insertNode(spaceText);
          range.setStartAfter(spaceText);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else if (contentEditableRef.current) {
          contentEditableRef.current.appendChild(pill);
          const spaceText = document.createTextNode(" ");
          contentEditableRef.current.appendChild(spaceText);
        }

        if (contentEditableRef.current) {
          setInputHtml(contentEditableRef.current.innerHTML);
          adjustContentHeight();
        }
      }
    });

    existingIds.forEach((existingId) => {
      if (existingId && !providerIds.has(existingId)) {
        const pill = contentEditableRef.current?.querySelector(
          `[data-attribute-type='finding'][data-attribute-id='${existingId}']`,
        );
        if (pill && contentEditableRef.current) {
          const nextSibling = pill.nextSibling;
          if (
            nextSibling?.nodeType === Node.TEXT_NODE &&
            (nextSibling as Text).textContent === " "
          ) {
            nextSibling.remove();
          }
          pill.remove();
          setInputHtml(contentEditableRef.current.innerHTML);
          adjustContentHeight();
        }
      }
    });
  }, [chatProviderAttributes, removeFinding]);

  type SelectedAttribute = { type: "node" | "finding"; id: string; name: string };

  const selectedNodeAttributes = useMemo((): SelectedAttribute[] => {
    if (!contentEditableRef.current || !chatAttributes) return [];
    const attributeElements = contentEditableRef.current.querySelectorAll(
      "[data-attribute-type='node']",
    );
    const attributes: SelectedAttribute[] = [];
    attributeElements.forEach((el) => {
      const id = el.getAttribute("data-attribute-id");
      const name = el.getAttribute("data-attribute-name");
      if (id && name && !attributes.some((attr) => attr.id === id)) {
        attributes.push({ type: "node", id, name });
      }
    });
    return attributes;
  }, [chatAttributes]);

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
    const message = getPlainText().trim();
    const attributes = getAttributesFromContent();

    if (!message && attributes.length === 0) return;

    setInputHtml("");
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = "";
    }

    if (onRemoveFindingFromContext && findingContext) {
      findingContext.forEach((finding) => {
        onRemoveFindingFromContext(finding.id);
      });
    }

    await onSendMessage(message, attributes);
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
  const convertBackticksToAttributes = (): void => {
    if (!contentEditableRef.current || !chatAttributes) return;
    const plainText = getPlainText();
    const backtickMatches = Array.from(plainText.matchAll(/`([^`]+)`/g));

    if (backtickMatches.length === 0) return;

    let hasChanges = false;
    const walker = document.createTreeWalker(
      contentEditableRef.current,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let charCount = 0;
    const replacements: Array<{
      node: Text;
      start: number;
      end: number;
      name: string;
      id: string;
    }> = [];

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const textContent = node.textContent || "";
      const textLength = textContent.length;

      backtickMatches.forEach((match) => {
        const matchStart = match.index!;
        const matchEnd = matchStart + match[0].length;
        const name = match[1];

        if (charCount <= matchStart && charCount + textLength >= matchEnd) {
          const matchingAttr = chatAttributes.find((attr) => attr.name === name);
          if (matchingAttr) {
            const startInNode = matchStart - charCount;
            const endInNode = matchEnd - charCount;
            replacements.push({
              node,
              start: startInNode,
              end: endInNode,
              name,
              id: matchingAttr.id,
            });
          }
        }
      });

      charCount += textLength;
    }

    replacements.reverse().forEach(({ node, start, end, name, id }) => {
      const textContent = node.textContent || "";
      const before = textContent.substring(0, start);
      const after = textContent.substring(end);

      const pill = document.createElement("span");
      pill.setAttribute("data-attribute-id", id);
      pill.setAttribute("data-attribute-type", "node");
      pill.setAttribute("data-attribute-name", name);
      pill.setAttribute("contenteditable", "false");
      pill.className =
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground text-sm font-medium cursor-pointer hover:bg-accent/80";
      pill.textContent = name;

      if (node.parentNode) {
        const beforeNode = document.createTextNode(before);
        const afterNode = document.createTextNode(after);
        node.parentNode.insertBefore(beforeNode, node);
        node.parentNode.insertBefore(pill, node);
        node.parentNode.insertBefore(afterNode, node);
        node.parentNode.removeChild(node);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setInputHtml(contentEditableRef.current.innerHTML);
    }
  };

  const handleInput = (): void => {
    if (!contentEditableRef.current) return;
    const html = contentEditableRef.current.innerHTML;
    setInputHtml(html);
    adjustContentHeight();

    const existingFindingPills = contentEditableRef.current.querySelectorAll(
      "[data-attribute-type='finding']",
    );
    const existingFindingIds = new Set(
      Array.from(existingFindingPills).map((pill) => pill.getAttribute("data-attribute-id")),
    );
    const providerFindingIds = new Set(
      (chatProviderAttributes || [])
        .filter((attr) => attr.type === "finding")
        .map((attr) => attr.id),
    );

    providerFindingIds.forEach((findingId) => {
      if (!existingFindingIds.has(findingId)) {
        removeFinding(findingId);
      }
    });

    setTimeout(() => {
      convertBackticksToAttributes();
    }, 0);

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      atPositionRef.current = null;
      setShowAutocomplete(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const plainText = getPlainText();

    const walker = document.createTreeWalker(
      contentEditableRef.current,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let charCount = 0;
    let cursorAbsolutePos = 0;
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const textLength = node.textContent?.length || 0;

      if (node === startContainer && node.nodeType === Node.TEXT_NODE) {
        cursorAbsolutePos = charCount + startOffset;
        break;
      }
      charCount += textLength;
    }

    const textBeforeCursor = plainText.substring(0, cursorAbsolutePos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setAutocompleteQuery(textAfterAt);
        setShowAutocomplete(true);
        setSelectedAutocompleteIndex(0);

        charCount = 0;
        const walker2 = document.createTreeWalker(
          contentEditableRef.current,
          NodeFilter.SHOW_TEXT,
          null,
        );
        while (walker2.nextNode()) {
          const node = walker2.currentNode as Text;
          const textLength = node.textContent?.length || 0;
          if (charCount + textLength > lastAtIndex) {
            atPositionRef.current = {
              node,
              offset: lastAtIndex - charCount,
            };
            break;
          }
          charCount += textLength;
        }
      } else {
        atPositionRef.current = null;
        setShowAutocomplete(false);
      }
    } else {
      atPositionRef.current = null;
      setShowAutocomplete(false);
    }
  };

  const handleRemoveAttribute = (attr: SelectedAttribute): void => {
    if (!contentEditableRef.current) return;
    if (attr.type === "node") {
      const element = contentEditableRef.current.querySelector(`[data-attribute-id="${attr.id}"]`);
      if (element) {
        const textNode = document.createTextNode(`\`${attr.name}\``);
        element.parentNode?.replaceChild(textNode, element);
        setInputHtml(contentEditableRef.current.innerHTML);
      }
    } else if (attr.type === "finding" && onRemoveFindingFromContext) {
      onRemoveFindingFromContext(attr.id);
    }
  };

  const handlePillClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const target = e.target as HTMLElement;
    const pill = target.closest("[data-attribute-id]") as HTMLElement;
    if (pill) {
      e.preventDefault();
      e.stopPropagation();
      const id = pill.getAttribute("data-attribute-id");
      const type = pill.getAttribute("data-attribute-type") as "node" | "finding";
      const name = pill.getAttribute("data-attribute-name");
      if (id && type && name) {
        handleRemoveAttribute({ type, id, name });
      }
    }
  };

  const insertAutocompleteItem = (item: NodeSchemaI): void => {
    if (!contentEditableRef.current || !atPositionRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const cursorContainer = range.startContainer;
    const cursorOffset = range.startOffset;

    if (cursorContainer.nodeType !== Node.TEXT_NODE) return;

    const cursorTextNode = cursorContainer as Text;
    const { node: atNode, offset: atOffset } = atPositionRef.current;

    const atText = atNode.textContent || "";
    const cursorText = cursorTextNode.textContent || "";
    const queryLength = autocompleteQuery.length;

    const pill = document.createElement("span");
    pill.setAttribute("data-attribute-id", item.id);
    pill.setAttribute("data-attribute-type", "node");
    pill.setAttribute("data-attribute-name", item.name);
    pill.setAttribute("contenteditable", "false");
    pill.className =
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground text-sm font-medium cursor-pointer hover:bg-accent/80";
    pill.textContent = item.name;

    if (atNode === cursorTextNode) {
      const beforeAt = atText.substring(0, atOffset);
      const afterCursor = cursorText.substring(cursorOffset);
      const spaceText = document.createTextNode(" ");

      if (cursorTextNode.parentNode) {
        const beforeTextNode = document.createTextNode(beforeAt);
        const afterTextNode = document.createTextNode(afterCursor);

        cursorTextNode.parentNode.insertBefore(beforeTextNode, cursorTextNode);
        cursorTextNode.parentNode.insertBefore(pill, cursorTextNode);
        cursorTextNode.parentNode.insertBefore(spaceText, cursorTextNode);
        cursorTextNode.parentNode.insertBefore(afterTextNode, cursorTextNode);
        cursorTextNode.parentNode.removeChild(cursorTextNode);

        const newRange = document.createRange();
        newRange.setStartAfter(spaceText);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      const beforeAt = atText.substring(0, atOffset);
      const afterAt = atText.substring(atOffset + 1 + queryLength);
      const cursorTextAfter = cursorText.substring(cursorOffset);
      const spaceText = document.createTextNode(" ");

      if (atNode.parentNode && cursorTextNode.parentNode) {
        const beforeTextNode = document.createTextNode(beforeAt);
        const afterAtTextNode = document.createTextNode(afterAt);
        const afterCursorTextNode = document.createTextNode(cursorTextAfter);

        atNode.parentNode.insertBefore(beforeTextNode, atNode);
        atNode.parentNode.insertBefore(pill, atNode);
        atNode.parentNode.insertBefore(spaceText, atNode);
        atNode.parentNode.insertBefore(afterAtTextNode, atNode);

        const nodesToRemove: Node[] = [];
        let currentNode: Node | null = atNode.nextSibling;
        while (currentNode && currentNode !== cursorTextNode) {
          nodesToRemove.push(currentNode);
          currentNode = currentNode.nextSibling;
        }

        nodesToRemove.forEach((node) => node.parentNode?.removeChild(node));
        cursorTextNode.parentNode.insertBefore(afterCursorTextNode, cursorTextNode);
        cursorTextNode.parentNode.removeChild(cursorTextNode);
        atNode.parentNode.removeChild(atNode);

        const newRange = document.createRange();
        newRange.setStartAfter(spaceText);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }

    atPositionRef.current = null;
    setInputHtml(contentEditableRef.current.innerHTML);
    setShowAutocomplete(false);
    contentEditableRef.current.focus();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
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
      <div className="rounded-3xl border bg-card p-2 shadow-sm">
        <div
          ref={contentEditableRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onClick={handlePillClick}
          data-placeholder="Message Bevor..."
          className="flex-1 max-h-[264px] p-2 resize-none border-0 bg-transparent leading-6 text-foreground focus-visible:outline-none focus-visible:ring-0 scrollbar-thin disabled:opacity-50 disabled:cursor-not-allowed min-h-[24px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
          suppressContentEditableWarning
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!getPlainText().trim() && selectedAttributes.length === 0}
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
