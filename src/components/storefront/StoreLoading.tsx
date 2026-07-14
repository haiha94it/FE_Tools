export default function StoreLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-28">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 animate-ping rounded-full bg-[var(--store-accent)] opacity-20" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--store-primary)] border-t-[var(--store-accent)] animate-spin" />
      </div>
      <p className="mt-6 text-sm font-medium text-[var(--store-muted)]">Đang tải...</p>
    </div>
  );
}