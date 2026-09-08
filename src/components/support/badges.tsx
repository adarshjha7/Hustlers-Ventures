"use client";

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-600 border-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  CLOSED: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Resolved",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[status] ?? STATUS_STYLES.OPEN}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function CategoryPill({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
      {category}
    </span>
  );
}
