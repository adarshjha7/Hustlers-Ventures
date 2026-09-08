"use client";

import { useState, useEffect, useCallback } from "react";
import { DatabaseBackup, Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

interface BackupRun {
  id: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  metadata: {
    fileName?: string;
    driveLink?: string;
    counts?: Record<string, number>;
    sizeBytes?: number;
    error?: string;
  };
  created_at: string;
}

export default function BackupsPage() {
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/backup-database/history");
    const data = await res.json();
    setRuns(data.runs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleRunNow = async () => {
    setRunning(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/backup-database", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Backup failed." });
      } else {
        setStatus({ type: "success", message: `Backup "${data.fileName}" uploaded to Drive.` });
        fetchHistory();
      }
    } catch {
      setStatus({ type: "error", message: "Backup failed." });
    }
    setRunning(false);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DatabaseBackup className="w-6 h-6 text-[#05CE78]" /> Database Backups
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Weekly snapshot of investors, investments, transactions, payouts, loans, EMIs and auth users (user_id + email) — uploaded to Drive as a zipped CSV bundle.
          </p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b067] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-900/20 text-sm whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Run Backup Now
        </button>
      </div>

      {status && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${status.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
          {status.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {status.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">Backup History</h2>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
        ) : runs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No backups have run yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {runs.map(run => {
              const ok = run.message === "Weekly database backup completed";
              return (
                <div key={run.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {ok
                      ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      : <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {ok ? (run.metadata.fileName ?? "Backup") : "Backup failed"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(run.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {ok && run.metadata.counts && (
                          <span> · {Object.values(run.metadata.counts).reduce((a, b) => a + b, 0)} rows · {formatBytes(run.metadata.sizeBytes)}</span>
                        )}
                        {!ok && run.metadata.error && <span className="text-red-500"> · {run.metadata.error}</span>}
                      </p>
                    </div>
                  </div>
                  {ok && run.metadata.driveLink && (
                    <a
                      href={run.metadata.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in Drive
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
