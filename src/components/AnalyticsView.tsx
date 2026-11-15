import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { t } from "../i18n/translations";
import {
  AppLanguage,
  PaymentMode,
  Product,
  Transaction,
} from "../types";
import { formatDateTime, formatINR } from "../utils/format";

interface AnalyticsViewProps {
  language: AppLanguage;
  transactions: Transaction[];
  products: Product[];
  onLogExpense: (params: {
    summary: string;
    amount: number;
    category: string;
    paymentMode: PaymentMode;
  }) => void;
}

interface ChartPoint {
  label: string;
  sales: number;
  expenses: number;
  profit: number;
}

export function AnalyticsView({
  language,
  transactions,
  products,
  onLogExpense,
}: AnalyticsViewProps) {
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [expSummary, setExpSummary] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("Milk & Raw Material");
  const [expMode, setExpMode] = useState<PaymentMode>("CASH");

  const summary = useMemo(() => {
    const sales = transactions
      .filter((tx) => tx.type === "SALE" || tx.type === "UDHAAR_GIVEN")
      .reduce((s, tx) => s + tx.amount, 0);
    const grossProfit = transactions
      .filter((tx) => tx.type === "SALE" || tx.type === "UDHAAR_GIVEN")
      .reduce((s, tx) => s + Math.max(0, tx.profitEstimate), 0);
    const expenses = transactions
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((s, tx) => s + tx.amount, 0);
    const netProfit = grossProfit - expenses;
    const margin = sales > 0 ? Math.round((netProfit / sales) * 100) : 0;
    return { sales, expenses, netProfit, margin };
  }, [transactions]);

  const chartData: ChartPoint[] = useMemo(() => {
    const now = new Date();
    if (period === "daily") {
      const points: ChartPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayStr = d.toLocaleDateString(
          language === "hi" ? "hi-IN" : "en-IN",
          { weekday: "short", day: "numeric" }
        );
        const dayTxs = transactions.filter((tx) => {
          const td = new Date(tx.createdAt);
          return (
            td.getDate() === d.getDate() &&
            td.getMonth() === d.getMonth() &&
            td.getFullYear() === d.getFullYear()
          );
        });
        const sales = dayTxs
          .filter((tx) => tx.type === "SALE" || tx.type === "UDHAAR_GIVEN")
          .reduce((s, tx) => s + tx.amount, 0);
        const expenses = dayTxs
          .filter((tx) => tx.type === "EXPENSE")
          .reduce((s, tx) => s + tx.amount, 0);
        const gross = dayTxs
          .filter((tx) => tx.type === "SALE" || tx.type === "UDHAAR_GIVEN")
          .reduce((s, tx) => s + Math.max(0, tx.profitEstimate), 0);
        points.push({
          label: dayStr,
          sales,
          expenses,
          profit: Math.max(0, gross - expenses),
        });
      }
      return points;
    }

    const points: ChartPoint[] = [];
    for (let i = 2; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = mDate.toLocaleDateString(
        language === "hi" ? "hi-IN" : "en-IN",
        { month: "short", year: "2-digit" }
      );
      const monthTxs = transactions.filter((tx) => {
        const td = new Date(tx.createdAt);
        return (
          td.getMonth() === mDate.getMonth() &&
          td.getFullYear() === mDate.getFullYear()
        );
      });
      const sales = monthTxs
        .filter((tx) => tx.type === "SALE" || tx.type === "UDHAAR_GIVEN")
        .reduce((s, tx) => s + tx.amount, 0);
      const expenses = monthTxs
        .filter((tx) => tx.type === "EXPENSE")
        .reduce((s, tx) => s + tx.amount, 0);
      const gross = monthTxs
        .filter((tx) => tx.type === "SALE" || tx.type === "UDHAAR_GIVEN")
        .reduce((s, tx) => s + Math.max(0, tx.profitEstimate), 0);
      points.push({
        label,
        sales,
        expenses,
        profit: Math.max(0, gross - expenses),
      });
    }
    return points;
  }, [transactions, period, language]);

  const maxChartValue = Math.max(
    100,
    ...chartData.map((d) => Math.max(d.sales, d.expenses))
  );

  const bestSellingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.unitsSold * b.sellingPrice - a.unitsSold * a.sellingPrice)
      .slice(0, 6);
  }, [products]);

  const recentExpenses = useMemo(
    () => transactions.filter((tx) => tx.type === "EXPENSE").slice(0, 6),
    [transactions]
  );

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expAmount);
    if (!amt || amt <= 0) return;
    onLogExpense({
      summary: expSummary || expCategory,
      amount: amt,
      category: expCategory,
      paymentMode: expMode,
    });
    setExpSummary("");
    setExpAmount("");
    setShowExpenseForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {t(language, "analyticsTitle")}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {t(language, "analyticsSubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowExpenseForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{t(language, "logExpense")}</span>
        </button>
      </div>

      {showExpenseForm && (
        <form
          onSubmit={handleExpenseSubmit}
          className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {language === "hi" ? "खर्च विवरण *" : "Expense Description *"}
            </label>
            <input
              type="text"
              required
              value={expSummary}
              onChange={(e) => setExpSummary(e.target.value)}
              placeholder="e.g. Milk & Ginger"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {language === "hi" ? "श्रेणी" : "Category"}
            </label>
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="Milk & Raw Material">Milk & Raw Material</option>
              <option value="Gas & Fuel">Gas & Fuel</option>
              <option value="Rent & Utilities">Rent & Utilities</option>
              <option value="Transport">Transport</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {language === "hi" ? "राशि (₹) *" : "Amount (₹) *"}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                required
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="250"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
              />
              <select
                value={expMode}
                onChange={(e) => setExpMode(e.target.value as PaymentMode)}
                className="px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800"
            >
              {language === "hi" ? "सेव करें" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowExpenseForm(false)}
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm text-slate-600"
            >
              ✕
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            {t(language, "grossRevenue")}
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatINR(summary.sales)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            {t(language, "operatingExpenses")}
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-rose-700 mt-1">
            {formatINR(summary.expenses)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            {t(language, "netProfit")}
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {formatINR(summary.netProfit)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">
            {t(language, "profitMargin")}
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {summary.margin}%
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {language === "hi"
                ? "बिक्री बनाम खर्च और मुनाफ़ा"
                : "Sales vs Expenses & Profit"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "hi"
                ? "विवरण देखने के लिए बार पर होवर करें"
                : "Hover any bar group for exact breakdown"}
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setPeriod("daily")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                period === "daily"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t(language, "dailyView")}
            </button>
            <button
              type="button"
              onClick={() => setPeriod("monthly")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                period === "monthly"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t(language, "monthlyView")}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-700" />
            {language === "hi" ? "बिक्री" : "Sales"}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" />
            {language === "hi" ? "खर्च" : "Expenses"}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-800" />
            {language === "hi" ? "शुद्ध मुनाफ़ा" : "Est. Profit"}
          </span>
        </div>

        <div className="relative pt-2">
          <div className="grid grid-cols-1 gap-2">
            <div className="h-64 flex items-end gap-3 sm:gap-6 border-b border-slate-200 pb-2 px-2">
              {chartData.map((pt, idx) => {
                const salesH = Math.max(4, Math.round((pt.sales / maxChartValue) * 195));
                const expH = Math.max(
                  pt.expenses > 0 ? 4 : 0,
                  Math.round((pt.expenses / maxChartValue) * 195)
                );
                const profH = Math.max(
                  pt.profit > 0 ? 4 : 0,
                  Math.round((pt.profit / maxChartValue) * 195)
                );
                return (
                  <div
                    key={pt.label}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  >
                    {hoveredIdx === idx && (
                      <div className="absolute -top-2 z-10 -translate-y-full bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-md whitespace-nowrap pointer-events-none">
                        <p className="font-semibold mb-1">{pt.label}</p>
                        <p className="font-mono tabular-nums text-emerald-300">
                          Sales: {formatINR(pt.sales)}
                        </p>
                        <p className="font-mono tabular-nums text-amber-300">
                          Exp: {formatINR(pt.expenses)}
                        </p>
                        <p className="font-mono tabular-nums text-slate-200">
                          Profit: {formatINR(pt.profit)}
                        </p>
                      </div>
                    )}
                    <div className="flex items-end justify-center gap-1.5 w-full max-w-[72px]">
                      <div
                        style={{ height: `${salesH}px` }}
                        className="flex-1 bg-emerald-700 rounded-t-sm transition-opacity group-hover:opacity-90"
                      />
                      <div
                        style={{ height: `${expH}px` }}
                        className="flex-1 bg-amber-500 rounded-t-sm transition-opacity group-hover:opacity-90"
                      />
                      <div
                        style={{ height: `${profH}px` }}
                        className="flex-1 bg-slate-800 rounded-t-sm transition-opacity group-hover:opacity-90"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 sm:gap-6 px-2">
              {chartData.map((pt) => (
                <div
                  key={pt.label}
                  className="flex-1 text-center text-xs text-slate-500 font-mono truncate"
                >
                  {pt.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              {t(language, "bestSelling")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-5">
                    {language === "hi" ? "सामान" : "Product"}
                  </th>
                  <th className="py-2.5 px-4 text-right">
                    {language === "hi" ? "बिक्री मात्रा" : "Units Sold"}
                  </th>
                  <th className="py-2.5 px-4 text-right">
                    {language === "hi" ? "कुल बिक्री" : "Revenue"}
                  </th>
                  <th className="py-2.5 px-5 text-right">
                    {language === "hi" ? "अनुमानित मुनाफ़ा" : "Est. Profit"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {bestSellingProducts.map((p) => {
                  const rev = p.unitsSold * p.sellingPrice;
                  const profit = p.unitsSold * Math.max(0, p.sellingPrice - p.costPrice);
                  return (
                    <tr key={p.id}>
                      <td className="py-3 px-5 font-medium text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {p.unitsSold} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatINR(rev)}
                      </td>
                      <td className="py-3 px-5 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {formatINR(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              {t(language, "recentExpenses")}
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentExpenses.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">
                {language === "hi"
                  ? "कोई खर्च दर्ज नहीं है।"
                  : "No expenses logged yet."}
              </p>
            ) : (
              recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="px-5 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {exp.summary}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span>{exp.category || "General"}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">
                        {formatDateTime(exp.createdAt, language)}
                      </span>
                    </p>
                  </div>
                  <p className="text-sm font-mono tabular-nums font-semibold text-rose-700 shrink-0">
                    -{formatINR(exp.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
