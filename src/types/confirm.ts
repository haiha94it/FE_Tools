export type ConfirmVariant = "danger" | "warning" | "primary";

export type ConfirmOptions = {
  title?: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
};

export type PromptOptions = {
  title?: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
};