import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Mic,
  PackagePlus,
  PlusCircle,
} from "lucide-react";
import { t } from "../i18n/translations";
import {
  AppLanguage,
  NavTab,
  Product,
  Transaction,
} from "../types";
import { formatDateTime, formatINR } from "../utils/format";

interface DashboardViewProps {
  language: AppLanguage;
  todaySales: number;
  todaySalesCount: number;
  todayProfit: number;
  totalNetProfit: number;
  pendingUdhaar: number;
  pendingCustomerCount: number;
  lowStockProducts: Product[];
  transactions: Transaction[];
  onNavigate: (tab: NavTab) => void;
  onLaunchVoiceWithHint: (hint: string) => void;
}

export function DashboardView({
  language,
  todaySales,
  todaySalesCount,
  todayProfit,
  totalNetProfit,
  pendingUdhaar,
  pendingCustomerCount,
  lowStockProducts,
  transactions,
  onNavigate,
  onLaunchVoiceWithHint,
}: DashboardViewProps) {
  const recentTxs = transactions.slice(0, 7);

  return (
    <div className="space-y-6">
      <section aria-label="Key business metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
            <p className="text-xs font-medium text-slate-500">
              {t(language, "todaysSales")}
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatINR(todaySales)}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              {todaySalesCount}{" "}
              {language === "hi" ? "आज के लेन-देन" : "entries today"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
            <p className="text-xs font-medium text-slate-500">
              {t(language, "totalProfit")}
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {formatINR(totalNetProfit)}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              {language === "hi" ? "आज का मुनाफ़ा:" : "Today:"}{" "}
              {formatINR(todayProfit)}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
            <p className="text-xs font-medium text-slate-500">
              {t(language, "pendingUdhaar")}
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-rose-700">
              {formatINR(pendingUdhaar)}
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              {pendingCustomerCount}{" "}
              {language === "hi" ? "ग्राहकों पर बाक़ी" : "customers due"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
            <p className="text-xs font-medium text-slate-500">
              {t(language, "lowStockAlerts")}
            </p>
            <p
              className={`text-2xl font-bold font-mono tabular-nums ${
                lowStockProducts.length > 0
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}
            >
              {lowStockProducts.length}
            </p>
            <p className="text-xs text-slate-500">
              {lowStockProducts.length > 0
                ? language === "hi"
                  ? "तुरंत स्टॉक भरने की ज़रूरत"
                  : "Items below minimum stock"
                : language === "hi"
                ? "सभी सामान पर्याप्त हैं"
                : "All inventory levels healthy"}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-label="Quick actions"
        className="bg-white border border-slate-200 rounded-xl p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-900">
            {t(language, "quickActions")}
          </h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate("voice")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Mic className="h-4 w-4" />
              <span>{t(language, "recordSaleVoice")}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onLaunchVoiceWithHint(
                  language === "hi"
                    ? "रमेश के नाम 100 रुपये उधार लिखो"
                    : "Rajesh Sharma ke naam 100 rupaye udhaar likho"
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <PlusCircle className="h-4 w-4 text-rose-600" />
              <span>{t(language, "addUdhaar")}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("khata")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowDownLeft className="h-4 w-4 text-emerald-700" />
              <span>{t(language, "receivePayment")}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("inventory")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <PackagePlus className="h-4 w-4 text-amber-700" />
              <span>{t(language, "addStock")}</span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              {t(language, "recentActivity")}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("analytics")}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
            >
              {t(language, "viewAll")}
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTxs.map((tx) => {
              const isInflow =
                tx.type === "SALE" || tx.type === "PAYMENT_RECEIVED";
              const isUdhaar = tx.type === "UDHAAR_GIVEN";
              const typeLabel =
                tx.type === "SALE"
                  ? language === "hi"
                    ? "बिक्री"
                    : "Sale"
                  : tx.type === "UDHAAR_GIVEN"
                  ? language === "hi"
                    ? "उधार"
                    : "Udhaar"
                  : tx.type === "PAYMENT_RECEIVED"
                  ? language === "hi"
                    ? "जमा"
                    : "Received"
                  : language === "hi"
                  ? "खर्च"
                  : "Expense";

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {tx.summary}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span>{typeLabel}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{tx.paymentMode}</span>
                      {tx.viaVoice && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{language === "hi" ? "आवाज़ से" : "Voice"}</span>
                        </>
                      )}
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">
                        {formatDateTime(tx.createdAt, language)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold font-mono tabular-nums inline-flex items-center gap-1 ${
                        isInflow
                          ? "text-emerald-700"
                          : isUdhaar
                          ? "text-rose-700"
                          : "text-slate-800"
                      }`}
                    >
                      {isInflow ? (
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                      {formatINR(tx.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              {t(language, "lowStockItems")}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("inventory")}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
            >
              {t(language, "viewAll")}
            </button>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {language === "hi"
                ? "कोई सामान कम स्टॉक में नहीं है।"
                : "No items are currently low on stock."}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5 inline-flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono tabular-nums">
                        {item.stock} {item.unit}{" "}
                        {language === "hi" ? "बाक़ी" : "left"} ·{" "}
                        {language === "hi" ? "न्यूनतम" : "min"} {item.minStock}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onLaunchVoiceWithHint(
                        `${item.minStock * 2} ${item.unit} ${item.name} stock mein daalo`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    {t(language, "restockNow")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
