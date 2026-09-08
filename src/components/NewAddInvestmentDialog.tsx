"use client";

import { useEffect, useState } from "react";
import {
  X,
  Search,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  User,
  Layers,
  Wallet,
} from "lucide-react";

type Investor = {
  investor_id: string;
  investor_name: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  pan_number: string | null;
};
type Pool = {
  purchase_id: string;
  pool_name: string;
  investor_amount: number | null;
  status: string | null;
};
type Investment = {
  investment_id: string;
  total_amount: number;
  created_at: string;
};

export default function NewAddInvestmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Step 1
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [investorSearch, setInvestorSearch] = useState("");
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [showAddInvestor, setShowAddInvestor] = useState(false);
  const [newInvestor, setNewInvestor] = useState({
    investor_name: "",
    email: "",
    phone: "",
    pan: "",
    bank_acc: "",
    ifsc: "",
    associate: "",
  });

  // Step 2
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  // Step 3
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<
    Investment | "new" | null
  >(null);

  // Step 4
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<"Add" | "Withdrawal">("Add");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");

  // Reset + load lists when opened
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError("");
    setSelectedInvestor(null);
    setInvestorSearch("");
    setSelectedPool(null);
    setSelectedInvestment(null);
    setInvestments([]);
    setShowAddInvestor(false);
    setAmount("");
    setTxType("Add");
    setTxDate(new Date().toISOString().slice(0, 10));
    setRemarks("");
    setNewInvestor({
      investor_name: "",
      email: "",
      phone: "",
      pan: "",
      bank_acc: "",
      ifsc: "",
      associate: "",
    });

    fetch("/api/admin/list-investors")
      .then((r) => r.json())
      .then((d) => setInvestors(d.investors ?? []))
      .catch(() => setInvestors([]));

    fetch("/api/admin/list-pools")
      .then((r) => r.json())
      .then((d) => setPools(d.pools ?? []))
      .catch(() => setPools([]));
  }, [open]);

  // Load existing investments when investor + pool selected.
  useEffect(() => {
    if (!selectedInvestor || !selectedPool) {
      setInvestments([]);
      return;
    }
    fetch(
      `/api/admin/list-investments?investor_id=${selectedInvestor.investor_id}&purchase_id=${selectedPool.purchase_id}`
    )
      .then((r) => r.json())
      .then((d) => setInvestments(d.investments ?? []))
      .catch(() => setInvestments([]));
  }, [selectedInvestor, selectedPool]);

  const filteredInvestors = investorSearch
    ? investors.filter((i) => {
        const q = investorSearch.toLowerCase();
        return (
          i.investor_name?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.phone?.toLowerCase().includes(q)
        );
      })
    : investors;

  const handleAddInvestor = async () => {
    setError("");
    if (!newInvestor.investor_name.trim() || !newInvestor.email.trim() || !newInvestor.phone.trim()) {
      setError("Name, email, and phone are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/create-investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvestor),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      // Refresh and select the new investor.
      const updated = await (await fetch("/api/admin/list-investors")).json();
      setInvestors(updated.investors ?? []);
      const created = (updated.investors ?? []).find(
        (i: Investor) => i.investor_id === data.investor_id
      );
      if (created) {
        setSelectedInvestor(created);
        setStep(2);
      }
      setShowAddInvestor(false);
    } catch (err: any) {
      setError(err?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setBusy(true);
    try {
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) throw new Error("Enter a valid amount.");

      const isNew = selectedInvestment === "new";
      const existing = isNew ? null : (selectedInvestment as Investment);

      if (txType === "Withdrawal" && existing && amt > existing.total_amount) {
        throw new Error(
          `Withdrawal exceeds current balance of ₹${existing.total_amount.toLocaleString("en-IN")}.`
        );
      }

      const res = await fetch("/api/admin/create-investment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_id: selectedInvestor!.investor_id,
          user_id: selectedInvestor!.user_id,
          purchase_id: selectedPool!.purchase_id,
          investment_id: isNew ? null : existing!.investment_id,
          amount: amt,
          transaction_type: txType,
          transaction_date: txDate,
          remarks,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  const stepLabels = ["Investor", "Pool", "Investment", "Transaction"];

  return (
    <>
      <div
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 bg-black/40 z-40"
      />
      <div className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">New Investment</h2>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                {stepLabels[step - 1]}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Step pills */}
          <div className="flex items-center gap-1.5">
            {stepLabels.map((label, i) => {
              const isCompleted = step > i + 1;
              const isCurrent = step === i + 1;
              return (
                <div
                  key={label}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    isCompleted
                      ? "bg-[#05CE78]"
                      : isCurrent
                      ? "bg-[#05CE78]/40"
                      : "bg-gray-200"
                  }`}
                  title={label}
                />
              );
            })}
          </div>

          {/* Breadcrumb of selections */}
          {(selectedInvestor || selectedPool || selectedInvestment) && (
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              {selectedInvestor && (
                <span className="inline-flex items-center gap-1 bg-[#05CE78]/10 text-gray-800 px-2 py-0.5 rounded-md">
                  <User className="w-3 h-3 text-[#05CE78]" /> {selectedInvestor.investor_name}
                </span>
              )}
              {selectedPool && (
                <span className="inline-flex items-center gap-1 bg-[#05CE78]/10 text-gray-800 px-2 py-0.5 rounded-md">
                  <Layers className="w-3 h-3 text-[#05CE78]" /> {selectedPool.pool_name}
                </span>
              )}
              {selectedInvestment && (
                <span className="inline-flex items-center gap-1 bg-[#05CE78]/10 text-gray-800 px-2 py-0.5 rounded-md">
                  <Wallet className="w-3 h-3 text-[#05CE78]" />
                  {selectedInvestment === "new"
                    ? "New investment"
                    : `₹${Number((selectedInvestment as Investment).total_amount).toLocaleString("en-IN")}`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* STEP 1 - INVESTOR */}
          {step === 1 && !showAddInvestor && (
            <>
              <div>
                <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">
                  Search Investor
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={investorSearch}
                    onChange={(e) => setInvestorSearch(e.target.value)}
                    placeholder="Name, email, or phone"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {filteredInvestors.length === 0 ? (
                  <p className="text-xs text-gray-500 p-4 text-center">No investors found</p>
                ) : (
                  filteredInvestors.map((inv) => (
                    <button
                      key={inv.investor_id}
                      onClick={() => {
                        setSelectedInvestor(inv);
                        setStep(2);
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{inv.investor_name}</p>
                        {!inv.user_id && (
                          <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                            Pending
                          </span>
                        )}
                      </div>
                      {(inv.email || inv.phone) && (
                        <p className="text-xs text-gray-500">{inv.email || inv.phone}</p>
                      )}
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowAddInvestor(true)}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold text-[#05CE78] border border-dashed border-[#05CE78]/40 hover:bg-[#05CE78]/5 px-3 py-2.5 rounded-lg"
              >
                <UserPlus className="w-4 h-4" /> Add New Investor
              </button>
            </>
          )}

          {/* STEP 1 - INLINE ADD INVESTOR */}
          {step === 1 && showAddInvestor && (
            <>
              <button
                onClick={() => setShowAddInvestor(false)}
                className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to search
              </button>
              <h3 className="text-sm font-bold text-gray-900">New Investor</h3>
              <Input
                label="Full Name *"
                value={newInvestor.investor_name}
                onChange={(v) =>
                  setNewInvestor({ ...newInvestor, investor_name: v })
                }
              />
              <Input
                label="Email *"
                type="email"
                value={newInvestor.email}
                onChange={(v) => setNewInvestor({ ...newInvestor, email: v })}
              />
              <Input
                label="Phone *"
                placeholder="+91 9876543210"
                value={newInvestor.phone}
                onChange={(v) => setNewInvestor({ ...newInvestor, phone: v })}
              />
              <Input
                label="PAN"
                placeholder="ABCDE1234F"
                value={newInvestor.pan}
                onChange={(v) =>
                  setNewInvestor({ ...newInvestor, pan: v.toUpperCase() })
                }
              />
              <Input
                label="Bank Account"
                value={newInvestor.bank_acc}
                onChange={(v) =>
                  setNewInvestor({ ...newInvestor, bank_acc: v })
                }
              />
              <Input
                label="IFSC"
                value={newInvestor.ifsc}
                onChange={(v) =>
                  setNewInvestor({ ...newInvestor, ifsc: v.toUpperCase() })
                }
              />
              <Input
                label="Associate Name"
                value={newInvestor.associate}
                onChange={(v) =>
                  setNewInvestor({ ...newInvestor, associate: v })
                }
              />

              <button
                onClick={handleAddInvestor}
                disabled={busy}
                className="w-full bg-[#05CE78] hover:bg-[#04b86c] text-black font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Add Investor
              </button>
            </>
          )}

          {/* STEP 2 - POOL */}
          {step === 2 && (
            <>
              <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">
                Select Pool
              </label>
              {pools.length === 0 ? (
                <p className="text-xs text-gray-500">No pools available.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                  {pools.map((p) => (
                    <button
                      key={p.purchase_id}
                      onClick={() => {
                        setSelectedPool(p);
                        setStep(3);
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{p.pool_name}</p>
                      <p className="text-[11px] text-gray-500">
                        Pool size: ₹
                        {Number(p.investor_amount ?? 0).toLocaleString("en-IN")}
                        {p.status ? ` · ${p.status}` : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 3 - INVESTMENT */}
          {step === 3 && (
            <>
              <p className="text-[11px] text-gray-600">
                For <span className="font-bold">{selectedInvestor?.investor_name}</span> in{" "}
                <span className="font-bold">{selectedPool?.pool_name}</span>:
              </p>
              {investments.length > 0 && (
                <div className="space-y-2">
                  {investments.map((inv) => (
                    <button
                      key={inv.investment_id}
                      onClick={() => {
                        setSelectedInvestment(inv);
                        setStep(4);
                      }}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <p className="text-sm font-bold text-gray-900">
                        ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Created {new Date(inv.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedInvestment("new");
                  setStep(4);
                }}
                className="w-full p-3 border-2 border-dashed border-gray-300 text-gray-700 hover:border-[#05CE78] hover:text-[#05CE78] hover:bg-[#05CE78]/5 rounded-lg text-sm font-bold transition-colors"
              >
                + Create New Investment
              </button>
            </>
          )}

          {/* STEP 4 - TRANSACTION */}
          {step === 4 && (
            <>
              {/* Summary card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 mb-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Summary</p>
                <Row label="Investor" value={selectedInvestor?.investor_name ?? "-"} />
                <Row label="Pool" value={selectedPool?.pool_name ?? "-"} />
                <Row
                  label="Investment"
                  value={
                    selectedInvestment === "new"
                      ? "New"
                      : `₹${Number((selectedInvestment as Investment | null)?.total_amount ?? 0).toLocaleString("en-IN")} (existing)`
                  }
                />
              </div>

              {/* Amount input with formatted hint */}
              <div>
                <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100000"
                  inputMode="numeric"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent"
                />
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    ≈ ₹{Number(amount).toLocaleString("en-IN")}
                    {parseFloat(amount) >= 100000 && (
                      <span className="ml-1 text-[#05CE78] font-bold">
                        ({(parseFloat(amount) / 100000).toFixed(2)} L)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Type toggle (clearer than dropdown) */}
              <div>
                <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">
                  Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType("Add")}
                    className={`py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                      txType === "Add"
                        ? "bg-[#05CE78] text-black border-[#05CE78]"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    + Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType("Withdrawal")}
                    className={`py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                      txType === "Withdrawal"
                        ? "bg-amber-500 text-black border-amber-500"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    − Withdrawal
                  </button>
                </div>
              </div>

              <Input label="Date *" type="date" value={txDate} onChange={setTxDate} />
              <Input
                label="Remarks"
                value={remarks}
                onChange={setRemarks}
                placeholder="Optional"
              />
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-5 py-3 flex justify-between gap-2 bg-gray-50">
          <button
            onClick={() => step > 1 && setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
            disabled={step === 1 || busy}
            className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30"
          >
            ← Back
          </button>

          {step === 4 && (
            <button
              onClick={handleSubmit}
              disabled={busy || !amount}
              className="px-5 py-2 bg-[#05CE78] text-black text-sm font-bold rounded-lg hover:bg-[#04b86c] disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Save
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 truncate ml-2 max-w-[60%]" title={value}>
        {value}
      </span>
    </div>
  );
}
