import AvatarText from "@/components/ui/avatar/AvatarText";

interface ContactAvatarProps {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md";
}

export default function ContactAvatar({
  name,
  avatar,
  size = "sm",
}: ContactAvatarProps) {
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const textSizeClass = size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10";
  const imageSize = size === "sm" ? 36 : 40;

  if (avatar) {
    return (
      <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full`}>
        <img
          width={imageSize}
          height={imageSize}
          src={avatar}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return <AvatarText name={name} className={textSizeClass} />;
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