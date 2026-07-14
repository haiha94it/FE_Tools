export function clampContextMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number,
  viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0,
  viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0,
): { x: number; y: number } {
  const padding = 8;
  const maxX = Math.max(padding, viewportWidth - menuWidth - padding);
  const maxY = Math.max(padding, viewportHeight - menuHeight - padding);
  return {
    x: Math.min(Math.max(x, padding), maxX),
    y: Math.min(Math.max(y, padding), maxY),
  };
}

export function resolveSubmenuPlacement(
  anchorRect: DOMRect,
  submenuWidth: number,
  submenuHeight: number,
): { side: "left" | "right"; align: "top" | "bottom" } {
  const padding = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const spaceRight = viewportWidth - anchorRect.right - padding;
  const spaceLeft = anchorRect.left - padding;
  const side =
    spaceRight >= submenuWidth || spaceRight >= spaceLeft ? "right" : "left";

  const spaceBelow = viewportHeight - anchorRect.top - padding;
  const align = spaceBelow >= submenuHeight ? "top" : "bottom";

  return { side, align };
}