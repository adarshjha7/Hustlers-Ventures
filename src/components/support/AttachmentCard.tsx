"use client";

import { FileText, Download } from "lucide-react";
import { formatFileSize } from "@/lib/supportUtils";

interface Attachment {
  id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  file_category: "IMAGE" | "DOCUMENT";
  downloadUrl: string | null;
}

export default function AttachmentCard({ attachment }: { attachment: Attachment }) {
  // Images render inline as a viewable thumbnail; other file types keep the file-card + download link.
  if (attachment.file_category === "IMAGE" && attachment.downloadUrl) {
    return (
      <a
        href={attachment.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-[240px] rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic signed Supabase Storage URL */}
        <img
          src={attachment.downloadUrl}
          alt={attachment.file_name}
          className="w-full max-h-64 object-cover bg-gray-100"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 max-w-sm">
      <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 truncate">{attachment.file_name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size_bytes)}</p>
      </div>
      {attachment.downloadUrl ? (
        <a
          href={attachment.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 bg-[#0B1120] hover:bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Download className="w-3 h-3" /> Download
        </a>
      ) : null}
    </div>
  );
}
