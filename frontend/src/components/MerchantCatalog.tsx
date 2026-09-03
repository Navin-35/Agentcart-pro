import React, { useState } from 'react';
import { Database, RefreshCw, AlertTriangle, TrendingUp, Star } from 'lucide-react';
import { Product } from '../types';

interface Props {
  products: Product[];
  onReset: () => void;
  onPriceSurge: (productId: string, currentPrice: number) => void;
  onStockout: (productId: string) => void;
}

export const MerchantCatalog: React.FC<Props> = ({
  products,
  onReset,
  onPriceSurge,
  onStockout
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "cables", "peripherals", "accessories", "pantry", "audio", "storage", "workspace"];

  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col h-full shadow-rzp-card">
      <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-slate-100">
        <span className="text-xs font-bold text-[#0c2340] uppercase tracking-wider flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[#ebf3ff] text-[#0c83ff] flex items-center justify-center">
            <Database className="h-3.5 w-3.5" />
          </div>
          Merchant Inventory (MCP Catalog)
        </span>
        <button
          onClick={onReset}
          className="text-[11px] font-semibold text-slate-600 hover:text-[#0c83ff] flex items-center gap-1 bg-slate-100 hover:bg-[#ebf3ff] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className="h-3 w-3" /> Reset Catalog
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        Live inventory database queried by buyer agents via MCP tools. Test self-healing and anti-hallucination via chaos injection:
      </p>

      {/* Category Filter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-3 text-[11px] scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap font-semibold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#0c83ff] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Cards */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[620px]">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl p-3.5 hover:border-[#0c83ff]/40 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-2">
                <div className="flex items-center space-x-1.5 mb-0.5">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0c83ff] transition-colors">{p.name}</h4>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{p.description}</p>
                
                {/* Specs Chips */}
                {p.specs && Object.keys(p.specs).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(p.specs).slice(0, 3).map(([k, v], idx) => (
                      <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-bold text-[#0c2340] font-mono block">
                  ₹{p.price.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center justify-end gap-0.5 mt-1">
                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> {p.rating}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/80 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    p.stock > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                  }`}
                >
                  {p.stock > 0 ? `${p.stock} in stock` : 'OUT OF STOCK'}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[110px] font-medium">{p.merchant_name}</span>
              </div>

              {/* Chaos Action Buttons */}
              <div className="flex items-center space-x-1.5">
                <button
                  title="Simulate sudden +80% price surge (Tests Live DB anti-hallucination check)"
                  onClick={() => onPriceSurge(p.id, p.price)}
                  className="px-2 py-1 rounded-md bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 text-[10px] font-semibold border border-slate-200 hover:border-amber-300 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <TrendingUp className="h-3 w-3 text-amber-600" />
                  <span>+Surge</span>
                </button>
                <button
                  title="Simulate stockout (Tests agent self-healing alternative discovery)"
                  onClick={() => onStockout(p.id)}
                  className="px-2 py-1 rounded-md bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-800 text-[10px] font-semibold border border-slate-200 hover:border-rose-300 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <AlertTriangle className="h-3 w-3 text-rose-600" />
                  <span>Deplete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
