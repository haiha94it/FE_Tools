import type { Metadata } from "next";
import { APP_NAME } from "@/constants/brand";

export const ADMIN_ROBOTS = {
  index: false,
  follow: false,
} as const;

export function createRootMetadata(): Metadata {
  return {
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: "Nền tảng công cụ tính toán & hỗ trợ đa ngành nghề",
  };
}

export function createPublicMetadata(opts: {
  title: string;
  description?: string;
  path?: string;
  absoluteTitle?: boolean;
  keywords?: string[];
}): Metadata {
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    keywords: opts.keywords,
  };
}
