"use client";

import ConfirmDialog from "@/components/ui/confirm/ConfirmDialog";
import PromptDialog from "@/components/ui/confirm/PromptDialog";
import {
  registerConfirmBridge,
  unregisterConfirmBridge,
} from "@/lib/confirm-bridge";
import type { ConfirmOptions, PromptOptions } from "@/types/confirm";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type DialogState =
  | {
      type: "confirm";
      options: ConfirmOptions;
      resolve: (value: boolean) => void;
    }
  | {
      type: "prompt";
      options: PromptOptions;
      resolve: (value: string | null) => void;
    }
  | null;

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm phải dùng trong ConfirmProvider.");
  }
  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ type: "confirm", options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setState({ type: "prompt", options, resolve });
    });
  }, []);

  useEffect(() => {
    registerConfirmBridge(confirm, prompt);
    return unregisterConfirmBridge;
  }, [confirm, prompt]);

  const closeConfirm = (result: boolean) => {
    if (state?.type === "confirm") {
      state.resolve(result);
      setState(null);
    }
  };

  const closePrompt = (result: string | null) => {
    if (state?.type === "prompt") {
      state.resolve(result);
      setState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      {state?.type === "confirm" ? (
        <ConfirmDialog
          isOpen
          {...state.options}
          onClose={() => closeConfirm(false)}
          onConfirm={() => closeConfirm(true)}
        />
      ) : null}
      {state?.type === "prompt" ? (
        <PromptDialog
          isOpen
          {...state.options}
          onClose={() => closePrompt(null)}
          onConfirm={(value) => closePrompt(value)}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}