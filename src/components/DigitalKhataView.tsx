import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Mic,
  Phone,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import { t } from "../i18n/translations";
import {
  AppLanguage,
  Customer,
  KhataEntry,
  PaymentMode,
} from "../types";
import { formatDateTime, formatINR } from "../utils/format";

interface DigitalKhataViewProps {
  language: AppLanguage;
  customers: Customer[];
  khataEntries: KhataEntry[];
  onAddCustomer: (name: string, phone: string, notes?: string) => void;
  onRecordEntry: (params: {
    customerId: string;
    type: "CREDIT_GIVEN" | "PAYMENT_RECEIVED";
    amount: number;
    itemsSummary: string;
    paymentMode: PaymentMode;
  }) => void;
  onLaunchVoiceWithHint: (hint: string) => void;
}

export function DigitalKhataView({
  language,
  customers,
  khataEntries,
  onAddCustomer,
  onRecordEntry,
  onLaunchVoiceWithHint,
}: DigitalKhataViewProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("all");
  const [selectedId, setSelectedId] = useState<string>(
    customers[0]?.id || ""
  );

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [entryModalType, setEntryModalType] = useState<
    "CREDIT_GIVEN" | "PAYMENT_RECEIVED" | null
  >(null);
  const [entryAmount, setEntryAmount] = useState("");
  const [entrySummary, setEntrySummary] = useState("");
  const [entryMode, setEntryMode] = useState<PaymentMode>("CASH");

  const totalPending = useMemo(
    () => customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (filter === "pending" && c.balance <= 0) return false;
      if (filter === "settled" && c.balance > 0) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
      );
    });
  }, [customers, search, filter]);

  const activeCustomer =
    customers.find((c) => c.id === selectedId) || filteredCustomers[0] || null;

  const customerHistory = useMemo(() => {
    if (!activeCustomer) return [];
    return khataEntries.filter((e) => e.customerId === activeCustomer.id);
  }, [khataEntries, activeCustomer]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCustomer(newName, newPhone, newNotes);
    setNewName("");
    setNewPhone("");
    setNewNotes("");
    setShowAddCustomer(false);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !entryModalType) return;
    const amt = Number(entryAmount);
    if (!amt || amt <= 0) return;

    onRecordEntry({
      customerId: activeCustomer.id,
      type: entryModalType,
      amount: amt,
      itemsSummary:
        entrySummary.trim() ||
        (entryModalType === "CREDIT_GIVEN"
          ? "Shop items on credit"
          : "Balance payment"),
      paymentMode:
        entryModalType === "CREDIT_GIVEN" ? "UDHAAR" : entryMode,
    });
    setEntryAmount("");
    setEntrySummary("");
    setEntryModalType(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {t(language, "khataTitle")}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {t(language, "khataSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right pr-3 border-r border-slate-200">
            <p className="text-xs text-slate-500">
              {t(language, "totalReceivable")}
            </p>
            <p className="text-lg font-bold font-mono tabular-nums text-rose-700">
              {formatINR(totalPending)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCustomer((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t(language, "addCustomer")}</span>
          </button>
        </div>
      </div>

      {showAddCustomer && (
        <form
          onSubmit={handleCreateCustomer}
          className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {language === "hi" ? "ग्राहक का नाम *" : "Customer Name *"}
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Suresh Gupta"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {language === "hi" ? "मोबाइल नंबर" : "Phone Number"}
            </label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="98XXXXXXXX"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {language === "hi" ? "नोट" : "Notes"}
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800"
            >
              {language === "hi" ? "सेव करें" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddCustomer(false)}
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              {language === "hi" ? "बंद" : "Cancel"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(language, "searchCustomers")}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(["all", "pending", "settled"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    filter === tab
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab === "all"
                    ? t(language, "allCustomers")
                    : tab === "pending"
                    ? t(language, "pendingOnly")
                    : t(language, "settledOnly")}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">
                {t(language, "noCustomersFound")}
              </p>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = activeCustomer?.id === cust.id;
                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => setSelectedId(cust.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors ${
                      isSelected ? "bg-emerald-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {cust.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        {cust.phone || (language === "hi" ? "फ़ोन नहीं" : "No phone")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold font-mono tabular-nums ${
                          cust.balance > 0
                            ? "text-rose-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {formatINR(cust.balance)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cust.balance > 0
                          ? language === "hi"
                            ? "बाक़ी"
                            : "Due"
                          : language === "hi"
                          ? "चुकता"
                          : "Settled"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {!activeCustomer ? (
            <div className="p-10 text-center text-sm text-slate-500">
              {language === "hi"
                ? "विवरण देखने के लिए किसी ग्राहक को चुनें।"
                : "Select a customer to view their khata details."}
            </div>
          ) : (
            <div>
              <div className="p-5 border-b border-slate-200 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {activeCustomer.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    {activeCustomer.phone && (
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Phone className="h-3 w-3" />
                        {activeCustomer.phone}
                      </span>
                    )}
                    {activeCustomer.notes && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{activeCustomer.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    {language === "hi" ? "कुल बकाया" : "Outstanding Balance"}
                  </p>
                  <p
                    className={`text-2xl font-bold font-mono tabular-nums ${
                      activeCustomer.balance > 0
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {formatINR(activeCustomer.balance)}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEntryModalType("CREDIT_GIVEN")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 text-white text-xs font-medium hover:bg-rose-800 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t(language, "giveUdhaar")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryModalType("PAYMENT_RECEIVED")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 whitespace-nowrap"
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  <span>{t(language, "recordJama")}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onLaunchVoiceWithHint(
                      `${activeCustomer.name} ne 200 rupaye udhaar wapas diye`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium hover:bg-slate-100 whitespace-nowrap"
                >
                  <Mic className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{t(language, "speakCommand")}</span>
                </button>
              </div>

              {entryModalType && (
                <form
                  onSubmit={handleSaveEntry}
                  className="p-5 bg-slate-50/70 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {entryModalType === "CREDIT_GIVEN"
                        ? language === "hi"
                          ? "उधार राशि (₹)"
                          : "Credit Amount (₹)"
                        : language === "hi"
                        ? "जमा राशि (₹)"
                        : "Payment Amount (₹)"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={entryAmount}
                      onChange={(e) => setEntryAmount(e.target.value)}
                      placeholder="150"
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {language === "hi" ? "विवरण / सामान" : "Items / Notes"}
                    </label>
                    <input
                      type="text"
                      value={entrySummary}
                      onChange={(e) => setEntrySummary(e.target.value)}
                      placeholder={
                        entryModalType === "CREDIT_GIVEN"
                          ? "Chai, Biscuit..."
                          : "Cash / UPI"
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {entryModalType === "PAYMENT_RECEIVED" && (
                      <select
                        value={entryMode}
                        onChange={(e) =>
                          setEntryMode(e.target.value as PaymentMode)
                        }
                        className="px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                      </select>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 whitespace-nowrap"
                    >
                      {language === "hi" ? "सेव" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryModalType(null)}
                      className="py-2 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                </form>
              )}

              <div className="p-5">
                <h4 className="text-xs font-semibold text-slate-500 mb-3">
                  {t(language, "paymentHistory")}
                </h4>
                {customerHistory.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">
                    {language === "hi"
                      ? "अभी तक कोई लेन-देन नहीं है।"
                      : "No transactions recorded for this customer yet."}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customerHistory.map((entry) => {
                      const isCredit = entry.type === "CREDIT_GIVEN";
                      return (
                        <div
                          key={entry.id}
                          className="py-3 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {entry.itemsSummary}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              <span>
                                {isCredit
                                  ? language === "hi"
                                    ? "उधार दिया"
                                    : "Credit Given"
                                  : language === "hi"
                                  ? "जमा प्राप्त"
                                  : "Payment Received"}
                              </span>
                              <span aria-hidden="true"> · </span>
                              <span>{entry.paymentMode}</span>
                              {entry.viaVoice && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span>
                                    {language === "hi" ? "आवाज़" : "Voice"}
                                  </span>
                                </>
                              )}
                              <span aria-hidden="true"> · </span>
                              <span className="font-mono tabular-nums">
                                {formatDateTime(entry.createdAt, language)}
                              </span>
                            </p>
                          </div>
                          <p
                            className={`text-sm font-semibold font-mono tabular-nums inline-flex items-center gap-1 shrink-0 ${
                              isCredit ? "text-rose-700" : "text-emerald-700"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            )}
                            {formatINR(entry.amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
