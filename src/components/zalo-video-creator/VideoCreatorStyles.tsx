"use client";

import { useEffect } from "react";

const STYLE_IDS = [
  "zalo-video-primereact-theme",
  "zalo-video-primereact-core",
  "zalo-video-primeicons",
] as const;

const STYLES: { id: (typeof STYLE_IDS)[number]; href: string }[] = [
  {
    id: "zalo-video-primereact-theme",
    href: "https://unpkg.com/primereact@10/resources/themes/lara-light-blue/theme.css",
  },
  {
    id: "zalo-video-primereact-core",
    href: "https://unpkg.com/primereact@10/resources/primereact.min.css",
  },
  {
    id: "zalo-video-primeicons",
    href: "https://unpkg.com/primeicons@7/primeicons.css",
  },
];

/** Load PrimeReact CSS chỉ khi vào trang video — gỡ khi rời trang để không vỡ TailAdmin */
export default function VideoCreatorStyles() {
  useEffect(() => {
    STYLES.forEach(({ id, href }) => {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });

    return () => {
      STYLE_IDS.forEach((id) => {
        document.getElementById(id)?.remove();
      });
    };
  }, []);

  return null;
}