/**
 * Avatar bubble bot CSKH.
 * Biến thể trong /public/images/support-chatbot/:
 * - avatar-robot.jpg   (mặc định) — robot 1 mắt + headset, brand blue
 * - avatar-helper.jpg  — mascot friendly + headset
 * - avatar-minimal.jpg — icon bubble + AI spark
 */
export const SUPPORT_BOT_AVATAR_SRC =
  "/images/support-chatbot/avatar-robot.jpg" as const;

export const SUPPORT_BOT_AVATAR_VARIANTS = {
  robot: "/images/support-chatbot/avatar-robot.jpg",
  helper: "/images/support-chatbot/avatar-helper.jpg",
  minimal: "/images/support-chatbot/avatar-minimal.jpg",
} as const;
