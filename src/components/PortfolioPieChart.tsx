"use client";

import { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Filter, PieChart as PieIcon } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface AssetProp {
  company_name?: string | null;
  company_pools?: { pool_name?: string } | null;
  total_amount: number;
  lifetime_returns?: number;
}

interface Props {
  assets: AssetProp[];
}

const PALETTE = [
  '#05CE78', // Green (Brand)
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export default function PortfolioPieChart({ assets }: Props) {
  const [metric, setMetric] = useState<'invested' | 'profit'>('invested');
  
  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const data = useMemo(() => {
    if (!assets || assets.length === 0) return [];
    
    // Exact logic from your working version
    const mappedData = assets.map((a, index) => ({
      name: a.company_name || a.company_pools?.pool_name || "Asset",
      // Calculate a single 'value' property to simplify the chart logic
      value: metric === 'invested' ? Number(a.total_amount) : Number(a.lifetime_returns || 0),
      // Stable color assignment by index
      fill: PALETTE[index % PALETTE.length]
    }));

    return mappedData.sort((a, b) => b.value - a.value);
  }, [assets, metric]);

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  if (!isMounted) return <div className="h-[300px] w-full bg-gray-50 animate-pulse rounded-lg" />;
  
  if (data.length === 0) return (
    <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
      <div className="bg-gray-50 p-4 rounded-full mb-3">
        <PieIcon className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-sm font-medium">No data to display</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      
      {/* 1. Header & Controls */}
      <div className="flex justify-between items-center px-4 pt-4 mb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          By {metric === 'invested' ? 'Invested' : 'Profit'}
        </span>
        
        <button 
          onClick={() => setMetric(metric === 'invested' ? 'profit' : 'invested')}
          className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors text-xs font-bold"
        >
          <Filter className="w-3 h-3" />
          {metric === 'invested' ? 'Show Profit' : 'Show Invested'}
        </button>
      </div>

      {/* 2. Chart Area - FIXED HEIGHT prevents invisible chart */}
      <div className="h-[300px] relative w-full">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value" // Using the pre-calculated 'value' field
              stroke="none"
              isAnimationActive={true}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
              ))}
            </Pie>
            
            <Tooltip 
              formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#111827', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
          <p className="text-sm font-extrabold text-gray-900 whitespace-nowrap">
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      {/* 3. Custom Legend (Avoids TS errors & rendering bugs) */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 pb-4">
        {data.map((item, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: item.fill }} 
            />
            <span className="text-xs font-medium text-gray-600">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}