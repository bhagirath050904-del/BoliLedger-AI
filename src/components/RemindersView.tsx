import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, MessageSquare } from "lucide-react";
import { t } from "../i18n/translations";
import { AppLanguage, Customer, PaymentMode } from "../types";
import {
  buildWhatsAppHref,
  buildWhatsAppReminderText,
  formatDateTime,
  formatINR,
} from "../utils/format";

interface RemindersViewProps {
  language: AppLanguage;
  shopName: string;
  customers: Customer[];
  onMarkReminded: (customerId: string) => void;
  onMarkPaid: (customerId: string, mode: PaymentMode) => void;
}

export function RemindersView({
  language,
  shopName,
  customers,
  onMarkReminded,
  onMarkPaid,
}: RemindersViewProps) {
  const [filter, setFilter] = useState<"pending" | "reminded" | "paid">(
    "pending"
  );
  const [messageLang, setMessageLang] = useState<AppLanguage>(language);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "paid") {
      return customers.filter((c) => c.balance === 0);
    }
    if (filter === "reminded") {
      return customers
        .filter((c) => c.balance > 0 && c.reminderStatus === "REMINDED")
        .sort((a, b) => b.balance - a.balance);
    }
    return customers
      .filter((c) => c.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [customers, filter]);

  const handleCopy = async (id: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {t(language, "remindersTitle")}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {t(language, "remindersSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMessageLang("hi")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                messageLang === "hi"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600"
              }`}
            >
              WhatsApp: हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setMessageLang("en")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                messageLang === "en"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600"
              }`}
            >
              WhatsApp: English
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                filter === "pending"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600"
              }`}
            >
              {t(language, "allPending")} (
              {customers.filter((c) => c.balance > 0).length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("reminded")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                filter === "reminded"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600"
              }`}
            >
              {t(language, "remindedTab")} (
              {
                customers.filter(
                  (c) => c.balance > 0 && c.reminderStatus === "REMINDED"
                ).length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setFilter("paid")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                filter === "paid"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600"
              }`}
            >
              {t(language, "paidTab")} (
              {customers.filter((c) => c.balance === 0).length})
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            {language === "hi"
              ? "इस श्रेणी में कोई ग्राहक नहीं है।"
              : "No customers in this reminder category."}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filtered.map((cust) => {
              const reminderMsg = buildWhatsAppReminderText({
                customerName: cust.name,
                balance: cust.balance,
                shopName,
                language: messageLang,
              });
              const isOverdue =
                cust.balance > 0 &&
                cust.dueDate &&
                new Date(cust.dueDate).getTime() < Date.now();

              const statusText =
                cust.balance === 0
                  ? language === "hi"
                    ? "भुगतान हो गया"
                    : "Paid"
                  : cust.reminderStatus === "REMINDED"
                  ? language === "hi"
                    ? "रिमाइंडर भेजा गया"
                    : "Reminded"
                  : isOverdue
                  ? language === "hi"
                    ? "तुरंत बकाया"
                    : "Overdue"
                  : language === "hi"
                  ? "बकाया"
                  : "Pending";

              const statusColor =
                cust.balance === 0
                  ? "text-emerald-700"
                  : cust.reminderStatus === "REMINDED"
                  ? "text-amber-700"
                  : isOverdue
                  ? "text-rose-700"
                  : "text-slate-700";

              return (
                <div key={cust.id} className="p-5 space-y-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-semibold text-slate-900">
                          {cust.name}
                        </h3>
                        <span className={`text-xs font-medium ${statusColor}`}>
                          · {statusText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        {cust.phone || "No phone"} ·{" "}
                        {language === "hi" ? "अंतिम लेन-देन:" : "Last entry:"}{" "}
                        {formatDateTime(cust.lastTransactionAt, language)}
                      </p>
                    </div>
                    <p
                      className={`text-xl font-bold font-mono tabular-nums ${
                        cust.balance > 0 ? "text-rose-700" : "text-emerald-700"
                      }`}
                    >
                      {formatINR(cust.balance)}
                    </p>
                  </div>

                  {cust.balance > 0 && (
                    <>
                      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                        <MessageSquare className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{reminderMsg}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {cust.phone ? (
                          <a
                            href={buildWhatsAppHref(cust.phone, reminderMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onMarkReminded(cust.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 whitespace-nowrap"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>{t(language, "sendWhatsApp")}</span>
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => void handleCopy(cust.id, reminderMsg)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium hover:bg-slate-50 whitespace-nowrap"
                        >
                          {copiedId === cust.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {copiedId === cust.id
                              ? t(language, "copied")
                              : t(language, "copyMessage")}
                          </span>
                        </button>

                        {cust.reminderStatus !== "REMINDED" && (
                          <button
                            type="button"
                            onClick={() => onMarkReminded(cust.id)}
                            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 whitespace-nowrap"
                          >
                            {t(language, "markReminded")}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onMarkPaid(cust.id, "UPI")}
                          className="px-3.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-medium hover:bg-emerald-100 whitespace-nowrap"
                        >
                          {t(language, "markPaid")}
                        </button>
                      </div>
                    </>
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
