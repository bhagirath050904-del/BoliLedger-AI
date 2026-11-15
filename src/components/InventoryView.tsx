import { useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Globe, Loader2, Mic, Plus, Search } from "lucide-react";
import { t } from "../i18n/translations";
import { AppLanguage, Product, PurchaseRecord } from "../types";
import { formatDateTime, formatINR } from "../utils/format";

interface InventoryViewProps {
  language: AppLanguage;
  products: Product[];
  purchaseRecords: PurchaseRecord[];
  onAddOrRestock: (params: {
    existingProductId?: string;
    name: string;
    hindiAlias?: string;
    category: string;
    quantity: number;
    unit: string;
    minStock: number;
    costPrice: number;
    sellingPrice: number;
    supplier?: string;
  }) => void;
  onLaunchVoiceWithHint: (hint: string) => void;
}

export function InventoryView({
  language,
  products,
  purchaseRecords,
  onAddOrRestock,
  onLaunchVoiceWithHint,
}: InventoryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "stock" | "purchases" | "market"
  >("stock");
  const [stockFilter, setStockFilter] = useState<"all" | "low">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [marketQuery, setMarketQuery] = useState("");
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketResult, setMarketResult] = useState<{
    answer: string;
    sources: Array<{ uri: string; title: string }>;
  } | null>(null);

  const [existingId, setExistingId] = useState<string>("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Grocery");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("pcs");
  const [minStock, setMinStock] = useState("10");
  const [costPrice, setCostPrice] = useState("40");
  const [sellingPrice, setSellingPrice] = useState("50");
  const [supplier, setSupplier] = useState("Local Wholesale");

  const runMarketSearch = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;
    setMarketQuery(q);
    setMarketLoading(true);
    setMarketError(null);
    try {
      const res = await fetch("/api/market/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, language }),
      });
      const data = (await res.json()) as {
        answer?: string;
        sources?: Array<{ uri: string; title: string }>;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Failed to look up market rates.");
      }
      setMarketResult({
        answer: data.answer || "",
        sources: data.sources || [],
      });
    } catch (err: unknown) {
      setMarketError(
        err instanceof Error ? err.message : "Unable to fetch market rates."
      );
    } finally {
      setMarketLoading(false);
    }
  };

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (stockFilter === "low" && p.stock > p.minStock) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.hindiAlias || "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, stockFilter, search]);

  const openRestockFor = (prod: Product) => {
    setExistingId(prod.id);
    setName(prod.name);
    setCategory(prod.category);
    setQuantity(String(Math.max(10, prod.minStock)));
    setUnit(prod.unit);
    setMinStock(String(prod.minStock));
    setCostPrice(String(prod.costPrice));
    setSellingPrice(String(prod.sellingPrice));
    setShowForm(true);
  };

  const openNewProductForm = () => {
    setExistingId("");
    setName("");
    setCategory("Grocery");
    setQuantity("10");
    setUnit("pcs");
    setMinStock("8");
    setCostPrice("40");
    setSellingPrice("50");
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddOrRestock({
      existingProductId: existingId || undefined,
      name,
      category,
      quantity: Number(quantity) || 0,
      unit,
      minStock: Number(minStock) || 5,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      supplier,
    });
    setShowForm(false);
    setExistingId("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {t(language, "inventoryTitle")}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {t(language, "inventorySubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              onLaunchVoiceWithHint(
                "10 kilo cheeni aur 15 packet Parle-G stock mein daalo"
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 whitespace-nowrap shrink-0"
          >
            <Mic className="h-4 w-4" />
            <span>{t(language, "addViaVoice")}</span>
          </button>
          <button
            type="button"
            onClick={openNewProductForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{t(language, "addProduct")}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {existingId
                ? `${language === "hi" ? "स्टॉक भरें:" : "Restock:"} ${name}`
                : t(language, "addProduct")}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              {language === "hi" ? "बंद करें" : "Close"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "सामान का नाम *" : "Product Name *"}
              </label>
              <input
                type="text"
                required
                disabled={Boolean(existingId)}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Basmati Rice"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "मात्रा जोड़ें" : "Quantity to Add"}
              </label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "इकाई (kg/pkts/L)" : "Unit"}
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "श्रेणी" : "Category"}
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "खरीद मूल्य (₹)" : "Cost Price (₹)"}
              </label>
              <input
                type="number"
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "बिक्री मूल्य (₹)" : "Selling Price (₹)"}
              </label>
              <input
                type="number"
                min={0}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "न्यूनतम स्टॉक अलर्ट" : "Min Stock Alert"}
              </label>
              <input
                type="number"
                min={1}
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "सप्लायर" : "Supplier"}
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800"
            >
              {language === "hi" ? "स्टॉक सेव करें" : "Save Stock Entry"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSubTab("stock")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeSubTab === "stock"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t(language, "productCatalog")} ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("purchases")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeSubTab === "purchases"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t(language, "purchaseRecords")} ({purchaseRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("market")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeSubTab === "market"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {language === "hi" ? "ताज़ा मंडी भाव" : "Live Market Rates"}
            </button>
          </div>

          {activeSubTab === "stock" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    language === "hi" ? "सामान खोजें..." : "Search products..."
                  }
                  className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setStockFilter("all")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                    stockFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  {t(language, "allProducts")}
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter("low")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                    stockFilter === "low"
                      ? "bg-white text-amber-800 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  {t(language, "lowStockOnly")} ({lowStockCount})
                </button>
              </div>
            </div>
          )}
        </div>

        {activeSubTab === "stock" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">
                    {language === "hi" ? "सामान" : "Product"}
                  </th>
                  <th className="py-3 px-4">
                    {language === "hi" ? "श्रेणी" : "Category"}
                  </th>
                  <th className="py-3 px-4 text-right">
                    {language === "hi" ? "उपलब्ध स्टॉक" : "In Stock"}
                  </th>
                  <th className="py-3 px-4 text-right">
                    {language === "hi" ? "खरीद / बिक्री" : "Cost / Price"}
                  </th>
                  <th className="py-3 px-4">
                    {language === "hi" ? "स्थिति" : "Status"}
                  </th>
                  <th className="py-3 px-5 text-right">
                    {language === "hi" ? "कार्रवाई" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((prod) => {
                  const isLow = prod.stock <= prod.minStock;
                  const isOut = prod.stock === 0;
                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <p className="font-medium text-slate-900">{prod.name}</p>
                        {prod.hindiAlias && (
                          <p className="text-xs text-slate-500">
                            {prod.hindiAlias}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {prod.category}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {prod.stock} {prod.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-slate-600">
                        {formatINR(prod.costPrice)} / {formatINR(prod.sellingPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium">
                        {isOut ? (
                          <span className="text-rose-700 inline-flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {language === "hi" ? "खत्म" : "Out of stock"}
                          </span>
                        ) : isLow ? (
                          <span className="text-amber-700 inline-flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {language === "hi"
                              ? `कम स्टॉक (न्यूनतम ${prod.minStock})`
                              : `Low (min ${prod.minStock})`}
                          </span>
                        ) : (
                          <span className="text-emerald-700">
                            {language === "hi" ? "पर्याप्त" : "Healthy"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => openRestockFor(prod)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                        >
                          {t(language, "restockNow")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : activeSubTab === "purchases" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">
                    {language === "hi" ? "सामान" : "Product"}
                  </th>
                  <th className="py-3 px-4">
                    {language === "hi" ? "सप्लायर" : "Supplier"}
                  </th>
                  <th className="py-3 px-4 text-right">
                    {language === "hi" ? "मात्रा" : "Qty Added"}
                  </th>
                  <th className="py-3 px-4 text-right">
                    {language === "hi" ? "कुल लागत" : "Total Cost"}
                  </th>
                  <th className="py-3 px-5 text-right">
                    {language === "hi" ? "समय" : "Recorded"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {purchaseRecords.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-medium text-slate-900">
                      {pur.productName}
                      {pur.viaVoice && (
                        <span className="ml-2 text-xs font-normal text-emerald-700">
                          · {language === "hi" ? "आवाज़" : "Voice"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {pur.supplier}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800">
                      +{pur.quantity} {pur.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatINR(pur.totalCost)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-xs text-slate-500">
                      {formatDateTime(pur.createdAt, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-700" />
                <span>
                  {language === "hi"
                    ? "गूगल सर्च से ताज़ा थोक व मंडी भाव"
                    : "Live Wholesale & Mandi Rates (Google Search Grounded)"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === "hi"
                  ? "चीनी, दूध, तेल, कमर्शियल LPG सिलेंडर या सरकारी दुकानदार योजनाओं की ताज़ा जानकारी देखें।"
                  : "Check current Indian wholesale commodity prices, commercial LPG rates, or shopkeeper schemes with live web sources."}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runMarketSearch(marketQuery);
              }}
              className="flex flex-wrap gap-2.5"
            >
              <input
                type="text"
                value={marketQuery}
                onChange={(e) => setMarketQuery(e.target.value)}
                placeholder={
                  language === "hi"
                    ? "जैसे: आज भारत में चीनी और सरसों तेल का थोक भाव..."
                    : "e.g. Current wholesale sugar and mustard oil rate in India..."
                }
                className="flex-1 min-w-[240px] px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
              <button
                type="submit"
                disabled={marketLoading || !marketQuery.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 whitespace-nowrap"
              >
                {marketLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>
                  {language === "hi" ? "ताज़ा भाव खोजें" : "Check Live Rate"}
                </span>
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  labelEn: "Sugar Wholesale Rate",
                  labelHi: "चीनी थोक भाव",
                  q: "Current wholesale sugar price per kg in India today",
                },
                {
                  labelEn: "19kg Commercial LPG",
                  labelHi: "19kg कमर्शियल गैस",
                  q: "Current 19kg commercial LPG cylinder price in India today",
                },
                {
                  labelEn: "Mustard Oil & Milk",
                  labelHi: "सरसों तेल और दूध",
                  q: "Latest retail and wholesale mustard oil and Amul milk price in India",
                },
                {
                  labelEn: "PM SVANidhi Scheme",
                  labelHi: "PM स्वनिधि लोन",
                  q: "PM SVANidhi street vendor and small shopkeeper loan scheme details",
                },
              ].map((preset) => (
                <button
                  key={preset.labelEn}
                  type="button"
                  onClick={() => void runMarketSearch(preset.q)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                >
                  {language === "hi" ? preset.labelHi : preset.labelEn}
                </button>
              ))}
            </div>

            {marketError && (
              <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2">
                {marketError}
              </p>
            )}

            {marketResult && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 space-y-4">
                <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {marketResult.answer}
                </div>
                {marketResult.sources.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <p className="text-xs font-semibold text-slate-600">
                      {language === "hi" ? "स्रोत (Google Search)" : "Sources"}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {marketResult.sources.map((src) => (
                        <a
                          key={src.uri}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                        >
                          <span className="truncate max-w-[240px]">
                            {src.title}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
