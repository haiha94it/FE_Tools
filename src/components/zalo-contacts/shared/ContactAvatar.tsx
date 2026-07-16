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
}

export function ContactNameCell({ name, avatar }: ContactNameCellProps) {
  const displayName = name || "—";

  return (
    <div className="flex items-center gap-3">
      <ContactAvatar name={displayName} avatar={avatar} size="sm" />
      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
        {displayName}
      </span>
    </div>
  );
}

/** @deprecated Dùng ContactNameCell */
export const FriendNameCell = ContactNameCell;