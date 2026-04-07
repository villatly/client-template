import type { PriceLineItem } from "@/lib/types";

interface Props {
  breakdown: PriceLineItem[];
  totalPrice: number;
  currency: string;
  nights: number;
  compact?: boolean;
}

export default function PriceBreakdown({ breakdown, totalPrice, currency, nights, compact }: Props) {
  if (breakdown.length === 0) return null;

  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 ${compact ? "p-3" : "p-4"}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Price breakdown</p>
      <div className="space-y-1.5">
        {breakdown.map((item, i) => (
          <div key={i} className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-gray-600">
              {item.label}
              <span className="text-gray-400 ml-1.5 text-xs">
                {item.nights} {item.nights === 1 ? "night" : "nights"} × {currency} {item.pricePerNight.toLocaleString()}
              </span>
            </span>
            <span className="font-medium text-gray-900 tabular-nums shrink-0">
              {currency} {item.subtotal.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-gray-200 pt-2">
        <span className="text-sm font-semibold text-gray-900">
          Total · {nights} {nights === 1 ? "night" : "nights"}
        </span>
        <span className="text-base font-bold text-gray-900 tabular-nums">
          {currency} {totalPrice.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
