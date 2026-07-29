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
  return null;
}
