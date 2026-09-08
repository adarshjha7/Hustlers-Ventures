"use client";

import { Plus, Trash2 } from "lucide-react";

interface Field {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  width?: "full" | "half";
}

interface Props {
  label: string;
  value: Record<string, any>[];
  onChange: (val: Record<string, any>[]) => void;
  fields: Field[];
  defaultRow: Record<string, any>;
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05CE78]/30 focus:border-[#05CE78] bg-white";

export default function JsonArrayEditor({ label, value, onChange, fields, defaultRow }: Props) {
  const rows = value ?? [];

  const update = (i: number, key: string, val: any) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, [key]: val } : r);
    onChange(next);
  };

  const add = () => onChange([...rows, { ...defaultRow }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <button type="button" onClick={add}
          className="flex items-center gap-1.5 text-xs font-bold text-[#05CE78] hover:text-[#04b86c] transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Row
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
          <p className="text-xs text-gray-400">No entries yet. Click "Add Row" to start.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${fields.filter(f => f.width !== "full").length > 1 ? 2 : 1}, 1fr)` }}>
                {fields.map(f => (
                  <div key={f.key} className={f.width === "full" ? "col-span-2" : ""}>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{f.label}</label>
                    {f.type === "select" ? (
                      <select value={row[f.key] ?? ""} onChange={e => update(i, f.key, e.target.value)} className={inputCls}>
                        {(f.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea value={row[f.key] ?? ""} onChange={e => update(i, f.key, e.target.value)}
                        placeholder={f.placeholder} rows={2} className={inputCls + " resize-none"} />
                    ) : (
                      <input type={f.type ?? "text"} value={row[f.key] ?? ""} onChange={e => update(i, f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                        placeholder={f.placeholder} className={inputCls} />
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => remove(i)}
                className="mt-6 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
