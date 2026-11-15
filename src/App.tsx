import { useState } from "react";
import { Menu, Mic } from "lucide-react";
import { AnalyticsView } from "./components/AnalyticsView";
import { DashboardView } from "./components/DashboardView";
import { DigitalKhataView } from "./components/DigitalKhataView";
import { InventoryView } from "./components/InventoryView";
import { RemindersView } from "./components/RemindersView";
import { SettingsView } from "./components/SettingsView";
import { Sidebar } from "./components/Sidebar";
import { VoiceAssistantView } from "./components/VoiceAssistantView";
import { useLedgerStore } from "./hooks/useLedgerStore";
import { NAV_ITEMS, t } from "./i18n/translations";
import { NavTab } from "./types";

export default function App() {
  const {
    store,
    metrics,
    setLanguage,
    updateShopProfile,
    updateVoicePrefs,
    addCustomer,
    recordKhataTransaction,
    addOrRestockProduct,
    logExpense,
    markCustomerReminded,
    markCustomerPaid,
    commitVoiceAction,
    exportBackupJson,
    importBackupJson,
    resetToSeedData,
  } = useLedgerStore();

  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  const handleLaunchVoiceWithHint = (hint: string) => {
    setVoiceHint(hint);
    setActiveTab("voice");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        language={store.language}
        onToggleLanguage={setLanguage}
        shopProfile={store.shopProfile}
        lowStockCount={metrics.lowStockProducts.length}
        pendingUdhaarCount={metrics.pendingCustomerCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 truncate hidden sm:inline">
                {store.shopProfile.shopName}
              </span>
              <span
                className="text-slate-300 hidden sm:inline"
                aria-hidden="true"
              >
                /
              </span>
              <h1 className="font-semibold text-slate-900 truncate">
                {store.language === "hi" ? currentNav.hi : currentNav.en}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("voice")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Mic className="h-4 w-4" />
            <span>{t(store.language, "speakCommand")}</span>
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1200px] w-full mx-auto">
          {activeTab === "dashboard" && (
            <DashboardView
              language={store.language}
              todaySales={metrics.todaySales}
              todaySalesCount={metrics.todaySalesCount}
              todayProfit={metrics.todayProfit}
              totalNetProfit={metrics.totalNetProfit}
              pendingUdhaar={metrics.pendingUdhaar}
              pendingCustomerCount={metrics.pendingCustomerCount}
              lowStockProducts={metrics.lowStockProducts}
              transactions={store.transactions}
              onNavigate={setActiveTab}
              onLaunchVoiceWithHint={handleLaunchVoiceWithHint}
            />
          )}

          {activeTab === "voice" && (
            <VoiceAssistantView
              language={store.language}
              voicePrefs={store.voicePrefs}
              customers={store.customers}
              products={store.products}
              todaySales={metrics.todaySales}
              pendingUdhaar={metrics.pendingUdhaar}
              voiceLogs={store.voiceLogs}
              initialPromptHint={voiceHint}
              onClearHint={() => setVoiceHint(null)}
              onChangeVoiceLang={(langCode) =>
                updateVoicePrefs({ ...store.voicePrefs, voiceLanguage: langCode })
              }
              onCommitAction={commitVoiceAction}
            />
          )}

          {activeTab === "khata" && (
            <DigitalKhataView
              language={store.language}
              customers={store.customers}
              khataEntries={store.khataEntries}
              onAddCustomer={addCustomer}
              onRecordEntry={recordKhataTransaction}
              onLaunchVoiceWithHint={handleLaunchVoiceWithHint}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryView
              language={store.language}
              products={store.products}
              purchaseRecords={store.purchaseRecords}
              onAddOrRestock={addOrRestockProduct}
              onLaunchVoiceWithHint={handleLaunchVoiceWithHint}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView
              language={store.language}
              transactions={store.transactions}
              products={store.products}
              onLogExpense={logExpense}
            />
          )}

          {activeTab === "reminders" && (
            <RemindersView
              language={store.language}
              shopName={store.shopProfile.shopName}
              customers={store.customers}
              onMarkReminded={markCustomerReminded}
              onMarkPaid={markCustomerPaid}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              language={store.language}
              shopProfile={store.shopProfile}
              voicePrefs={store.voicePrefs}
              onChangeLanguage={setLanguage}
              onSaveProfile={updateShopProfile}
              onSaveVoicePrefs={updateVoicePrefs}
              onDownloadBackup={exportBackupJson}
              onImportBackup={importBackupJson}
              onResetDemo={resetToSeedData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
