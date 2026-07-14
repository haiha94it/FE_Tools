import type { ConfirmOptions, PromptOptions } from "@/types/confirm";

type ConfirmHandler = (options: ConfirmOptions) => Promise<boolean>;
type PromptHandler = (options: PromptOptions) => Promise<string | null>;

let confirmHandler: ConfirmHandler | null = null;
let promptHandler: PromptHandler | null = null;

export function registerConfirmBridge(
  confirm: ConfirmHandler,
  prompt: PromptHandler,
) {
  confirmHandler = confirm;
  promptHandler = prompt;
}

export function unregisterConfirmBridge() {
  confirmHandler = null;
  promptHandler = null;
}

export function getConfirmHandler() {
  return confirmHandler;
}

export function getPromptHandler() {
  return promptHandler;
}