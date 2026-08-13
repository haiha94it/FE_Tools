import { permanentRedirect } from "next/navigation";

/** Giữ URL admin cũ hoạt động nhưng không hiển thị trên public UI. */
export default function LegacySignInPage() {
  permanentRedirect("/login");
}
