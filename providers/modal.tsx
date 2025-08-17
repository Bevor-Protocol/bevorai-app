"use client";

import { createContext, useEffect, useRef, useState } from "react";

import * as Modal from "@/components/ui/modal";
import { ModalContextI } from "@/utils/types";

export const ModalContext = createContext<ModalContextI>({
  setOpen: () => {},
  setContent: () => {},
});

const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState<"modal" | "none">("none");
  const [content, setContent] = useState<React.ReactNode>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef<undefined | (() => void)>(undefined);

  useEffect(() => {
    handlerRef.current = open == "modal" ? (): void => setOpen("none") : undefined;

    if (open !== "none") {
      document.body.classList.add("modal-show");
    } else {
      document.body.classList.remove("modal-show");
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        if (handlerRef.current) handlerRef.current();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return (): void => document.removeEventListener("mousedown", handleClickOutside);
  }, [contentRef]);

  const modalState = {
    setOpen,
    setContent,
  };

  return (
    <ModalContext.Provider value={modalState}>
      {children}
      <Modal.Wrapper isOpen={open == "modal"}>
        <Modal.Content ref={contentRef}>{content}</Modal.Content>
      </Modal.Wrapper>
    </ModalContext.Provider>
  );
};

export default ModalProvider;
