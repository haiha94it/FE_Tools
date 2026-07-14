import type { ReactNode } from "react";

/** Layout riêng — không import CSS global (bootstrap/primereact) để tránh vỡ TailAdmin */
export default function PostVideoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}