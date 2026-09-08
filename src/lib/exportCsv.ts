export function exportToCsv(
  filename: string,
  rows: Record<string, any>[],
  headers: { key: string; label: string }[]
) {
  const escape = (val: any): string => {
    const str = val === null || val === undefined ? "" : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const headerRow = headers.map(h => escape(h.label)).join(",");
  const dataRows = rows.map(row =>
    headers.map(h => escape(row[h.key])).join(",")
  );

  // BOM ensures Excel opens UTF-8 correctly
  const csv = "﻿" + [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
