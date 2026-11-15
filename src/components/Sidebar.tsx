import {
  BarChart3,
  BellRing,
  BookOpen,
  LayoutDashboard,
  Mic,
  Package,
  Settings,
  X,
} from "lucide-react";
import { NAV_ITEMS } from "../i18n/translations";
import { AppLanguage, NavTab, ShopProfile } from "../types";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  language: AppLanguage;
  onToggleLanguage: (lang: AppLanguage) => void;
  shopProfile: ShopProfile;
  lowStockCount: number;
  pendingUdhaarCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const TAB_ICONS: Record<NavTab, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  voice: Mic,
  khata: BookOpen,
  inventory: Package,
  analytics: BarChart3,
  reminders: BellRing,
  settings: Settings,
};

export function Sidebar({
  activeTab,
  onSelectTab,
  language,
  onToggleLanguage,
  shopProfile,
  lowStockCount,
  pendingUdhaarCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const content = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200 w-64">
      <div>
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white font-semibold text-sm">
              BL
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base whitespace-nowrap truncate">
              BoliLedger AI
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = TAB_ICONS[item.id];
            const isActive = activeTab === item.id;
            const countHint =
              item.id === "inventory" && lowStockCount > 0
                ? lowStockCount
                : item.id === "reminders" && pendingUdhaarCount > 0
                ? pendingUdhaarCount
                : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-emerald-700" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">
                    {language === "hi" ? item.hi : item.en}
                  </span>
                </span>
                {countHint !== null && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      item.id === "inventory"
                        ? "text-amber-700 font-semibold"
                        : "text-slate-500 font-medium"
                    }`}
                  >
                    {countHint}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div
          className="flex items-center p-1 bg-slate-100 rounded-lg"
          role="group"
          aria-label="Language switch"
        >
          <button
            type="button"
            onClick={() => onToggleLanguage("en")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              language === "en"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onToggleLanguage("hi")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              language === "hi"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            हिन्दी
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onSelectTab("settings");
            onCloseMobile();
          }}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
        >
          <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
            {shopProfile.avatarUrl ? (
              <img
                src={shopProfile.avatarUrl}
                alt={shopProfile.ownerName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-slate-700">
                {shopProfile.ownerName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">
              {shopProfile.shopName}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {shopProfile.ownerName}
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
