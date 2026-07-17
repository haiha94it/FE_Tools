import AvatarText, { type AvatarTextSize } from "@/components/ui/avatar/AvatarText";

interface ContactAvatarProps {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md";
}

const sizeMap: Record<NonNullable<ContactAvatarProps["size"]>, AvatarTextSize> = {
  sm: "sm",
  md: "md",
};

const imageSizeMap = {
  sm: 32,
  md: 40,
} as const;

const imageClassMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
} as const;

export default function ContactAvatar({
  name,
  avatar,
  size = "sm",
}: ContactAvatarProps) {
  const displayName = name.trim() || "?";

  if (avatar) {
    return (
      <div
        className={`${imageClassMap[size]} shrink-0 overflow-hidden rounded-full`}
      >
        <img
          width={imageSizeMap[size]}
          height={imageSizeMap[size]}
          src={avatar}
          alt={displayName}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return <AvatarText name={displayName} size={sizeMap[size]} />;
}

interface ContactNameCellProps {
  name?: string | null;
  avatar?: string | null;
  /** Nhãn phụ dưới tên (vd. "Nam", "Nữ") */
  subtitle?: string | null;
}

export function ContactNameCell({
  name,
  avatar,
  subtitle,
}: ContactNameCellProps) {
  const displayName = name || "—";
  const sub = subtitle?.trim();

  return (
    <div className="flex items-center gap-3">
      <ContactAvatar name={displayName} avatar={avatar} size="sm" />
      <div className="min-w-0">
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {displayName}
        </span>
        {sub ? (
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {sub}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** @deprecated Dùng ContactNameCell */
export const FriendNameCell = ContactNameCell;