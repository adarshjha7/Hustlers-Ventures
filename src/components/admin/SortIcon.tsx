import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface SortIconProps {
  column: string;
  sortKey: string;
  sortDir: "asc" | "desc";
}

export function SortIcon({ column, sortKey, sortDir }: SortIconProps) {
  if (column !== sortKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-gray-700" />
    : <ChevronDown className="w-3.5 h-3.5 text-gray-700" />;
}
