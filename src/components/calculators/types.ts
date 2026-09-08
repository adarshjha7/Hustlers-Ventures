export interface SliderConfig {
  key: string;
  label: string;
  icon: string; // lucide icon name
  min: number;
  max: number;
  step: number;
  default: number;
  format: "currency" | "number" | "percent";
  unit?: string;
}

export interface FinancialModel {
  formula_type: "transport" | "fnb" | "hospitality";
  total_capex: number;
  tenure_years: number;
  investor_profit_split: number; // e.g. 0.75
  sliders: SliderConfig[];
  fixed_costs: { label: string; amount: number }[];
  capex_breakdown: { item: string; amount: number }[];
  investor_note?: string;

  // transport-specific
  debt_ratio?: number;
  monthly_emi?: number;
  resale_pct?: number; // fraction of total_capex at exit
  capital_gain_share?: number; // investor share of capital gain

  // hospitality-specific
  room_types?: { type: string; rooms: number; beds: number; price_per_bed: number }[];

  // fnb-specific
  food_cost_pct?: number;
  driver_cost_per_bus?: number;
}
