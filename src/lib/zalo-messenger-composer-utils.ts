/** Thay phần `/query` hoặc `@query` ở cuối ô nhập */
export function replaceComposerTriggerQuery(
  text: string,
  trigger: "/" | "@",
  replacement: string,
): string {
  const pattern =
    trigger === "/"
      ? /(?:^|\s)\/(\S*)$/
      : /(?:^|\s)@(\S*)$/;
  const match = text.match(pattern);
  if (!match) return `${text}${replacement}`;

  const index = match.index ?? 0;
  const prefixLength = match[0].indexOf(trigger);
  const replaceStart = index + prefixLength;
  return `${text.slice(0, replaceStart)}${replacement}`;
}

export function insertTextAtCaret(
  currentText: string,
  insertValue: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const start = Math.max(0, Math.min(selectionStart, currentText.length));
  const end = Math.max(start, Math.min(selectionEnd, currentText.length));
  const nextText = `${currentText.slice(0, start)}${insertValue}${currentText.slice(end)}`;
  const nextCaret = start + insertValue.length;
  return { nextText, nextCaret };
}

export const COMPOSER_TEXTAREA_MAX_HEIGHT = 200;
export const COMPOSER_TEXTAREA_MIN_HEIGHT = 42;

export function adjustComposerTextareaHeight(
  textarea: HTMLTextAreaElement | null,
  maxHeight = COMPOSER_TEXTAREA_MAX_HEIGHT,
) {
  if (!textarea) return;
  textarea.style.height = "auto";
  const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = `${Math.max(nextHeight, COMPOSER_TEXTAREA_MIN_HEIGHT)}px`;
  textarea.style.overflowY =
    textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}