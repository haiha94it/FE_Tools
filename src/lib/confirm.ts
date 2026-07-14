import { getConfirmHandler, getPromptHandler } from "@/lib/confirm-bridge";
import type { ConfirmOptions, PromptOptions } from "@/types/confirm";

export type { ConfirmOptions, PromptOptions, ConfirmVariant } from "@/types/confirm";

export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const handler = getConfirmHandler();
  if (!handler) {
    console.error("ConfirmProvider chưa được mount.");
    return false;
  }
  return handler(options);
}

export async function prompt(options: PromptOptions): Promise<string | null> {
  const handler = getPromptHandler();
  if (!handler) {
    console.error("ConfirmProvider chưa được mount.");
    return null;
  }
  return handler(options);
}