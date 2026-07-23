"use client";

interface PlaceholderHintProps {
  className?: string;
}

const DEFAULT_HINTS = [
  { key: "{{name}}", desc: "Tên khách" },
  { key: "{{title}}", desc: "Danh xưng" },
  { key: "{{phone_number}}", desc: "SĐT" },
  { key: "{{category}}", desc: "Danh mục" },
];

export default function PlaceholderHint({ className = "" }: PlaceholderHintProps) {
  return (
    <p className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      Hỗ trợ placeholder:{" "}
      {DEFAULT_HINTS.map((item, index) => (
        <span key={item.key}>
          {index > 0 ? ", " : null}
          <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px] text-brand-600 dark:bg-white/5 dark:text-brand-400">
            {item.key}
          </code>
          <span className="text-gray-400"> ({item.desc})</span>
        </span>
      ))}
    </p>
  );
}
