const AVATAR_COLOR_CLASSES = [
  "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300",
] as const;

/** Lấy 1–2 chữ nhận diện từ tên (họ + tên hoặc 2 ký tự đầu) */
export function getAvatarInitials(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned) return "?";

  const words = cleaned.split(" ").filter(Boolean);
  if (words.length === 1) {
    const word = words[0];
    const letters = [...word].filter((char) => /\p{L}/u.test(char));
    if (letters.length >= 2) {
      return `${letters[0]}${letters[1]}`.toUpperCase();
    }
    return (letters[0] ?? word[0] ?? "?").toUpperCase();
  }

  const first = [...words[0]].find((char) => /\p{L}/u.test(char)) ?? words[0][0];
  const last = [...words[words.length - 1]].find((char) => /\p{L}/u.test(char)) ??
    words[words.length - 1][0];
  return `${first ?? ""}${last ?? ""}`.toUpperCase() || "?";
}

/** Màu nền avatar ổn định theo tên */
export function getAvatarColorClass(name: string): string {
  const index = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLOR_CLASSES[index % AVATAR_COLOR_CLASSES.length];
}