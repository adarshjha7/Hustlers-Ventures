"use client";

import { useState } from "react";
import { Send, Loader2, AlertCircle, CheckCircle, Copy, Bell, Plus } from "lucide-react";
import NewAddInvestmentDialog from "./NewAddInvestmentDialog";

export default function AdminOnboardSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    otp: string;
    url: string;
  } | null>(null);

  // Profile-reminder button state
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderNote, setReminderNote] = useState("");

  // New Add Investment dialog state
  const [investmentOpen, setInvestmentOpen] = useState(false);

  const handleSendReminders = async () => {
    setReminderBusy(true);
    setReminderNote("");
    try {
      const res = await fetch("/api/admin/send-profile-reminders", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setReminderNote(
        `Sent: ${data.sent}, skipped: ${data.skipped}, failed: ${data.failed}`
      );
    } catch (err: any) {
      setReminderNote(err?.message || "Failed");
    } finally {
      setReminderBusy(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/[^\d]/g, "");
    if (!trimmedName) {
      setError("Name required.");
      return;
    }
    if (!/^\d{8,15}$/.test(trimmedPhone)) {
      setError("Invalid phone.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, phone: trimmedPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setSuccess({ otp: data.otp, url: data.url });
      setName("");
      setPhone("");
    } catch (err: any) {
      setError(err?.message || "Failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex justify-end">
      <div className="inline-flex flex-col items-end gap-1.5">
        <form
          onSubmit={handleSend}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Name"
            className="w-24 px-2 py-1 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#05CE78] focus:border-transparent transition-all"
          />
          <input
            type="tel"
            inputMode="tel"
            maxLength={18}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^\d+\s-]/g, ""));
              if (error) setError("");
            }}
            placeholder="+91 9876543210"
            className="w-40 px-2 py-1 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#05CE78] focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={sending || !name || !phone}
            title="Create invite"
            className="bg-[#0B1120] hover:bg-[#05CE78] hover:text-black text-white font-bold px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            Send
          </button>

          <button
            type="button"
            onClick={handleSendReminders}
            disabled={reminderBusy}
            title="Send profile-completion reminder to investors with missing bank/PAN/IFSC"
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {reminderBusy ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Bell className="w-3 h-3" />
            )}
            Remind
          </button>

          <button
            type="button"
            onClick={() => setInvestmentOpen(true)}
            title="Add a new investment for an investor"
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            New Investment
          </button>
        </form>

        <NewAddInvestmentDialog
          open={investmentOpen}
          onOpenChange={setInvestmentOpen}
        />

        {error && (
          <div className="text-[11px] text-red-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </div>
        )}

        {reminderNote && (
          <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
            <Bell className="w-3 h-3" /> {reminderNote}
          </div>
        )}

        {success && (
          <div className="text-[11px] text-gray-700 max-w-md text-right space-y-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <div className="font-bold text-amber-900 flex items-center gap-1 justify-end">
              <CheckCircle className="w-3 h-3" /> Invite created (WhatsApp stubbed)
            </div>
            <div>
              OTP:{" "}
              <code
                onClick={() => navigator.clipboard.writeText(success.otp)}
                className="bg-white px-1.5 py-0.5 rounded font-mono cursor-pointer hover:bg-gray-50"
                title="Click to copy"
              >
                {success.otp}
              </code>
            </div>
            <div className="break-all">
              Link:{" "}
              <a
                href={success.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                {success.url}
              </a>{" "}
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(success.url)}
                className="inline-flex items-center text-gray-500 hover:text-gray-700"
                title="Copy link"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
