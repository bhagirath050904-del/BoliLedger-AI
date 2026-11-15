import { useRef, useState } from "react";
import { Check, Download, RotateCcw, Upload } from "lucide-react";
import { t, VOICE_LANGUAGE_OPTIONS } from "../i18n/translations";
import { AppLanguage, ShopProfile, VoicePreferences } from "../types";

interface SettingsViewProps {
  language: AppLanguage;
  shopProfile: ShopProfile;
  voicePrefs: VoicePreferences;
  onChangeLanguage: (lang: AppLanguage) => void;
  onSaveProfile: (profile: ShopProfile) => void;
  onSaveVoicePrefs: (prefs: VoicePreferences) => void;
  onDownloadBackup: () => void;
  onImportBackup: (jsonText: string) => boolean;
  onResetDemo: () => void;
}

export function SettingsView({
  language,
  shopProfile,
  voicePrefs,
  onChangeLanguage,
  onSaveProfile,
  onSaveVoicePrefs,
  onDownloadBackup,
  onImportBackup,
  onResetDemo,
}: SettingsViewProps) {
  const [profile, setProfile] = useState<ShopProfile>(shopProfile);
  const [prefs, setPrefs] = useState<VoicePreferences>(voicePrefs);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    onSaveVoicePrefs(prefs);
    showNotice(t(language, "savedToast"));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = onImportBackup(text);
    showNotice(
      ok
        ? language === "hi"
          ? "बैकअप सफलतापूर्वक रीस्टोर हुआ!"
          : "Backup restored successfully!"
        : language === "hi"
        ? "अमान्य बैकअप फ़ाइल।"
        : "Invalid backup JSON file."
    );
    e.target.value = "";
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {t(language, "settingsTitle")}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {t(language, "settingsSubtitle")}
          </p>
        </div>
        {toast && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" />
            {toast}
          </span>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900">
          {t(language, "languageSetting")}
        </h3>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg max-w-xs">
          <button
            type="button"
            onClick={() => onChangeLanguage("en")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              language === "en"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onChangeLanguage("hi")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              language === "hi"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center border border-slate-200">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.ownerName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-base font-bold text-slate-700">
                  {profile.ownerName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {t(language, "shopProfileTitle")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "hi"
                  ? "यह विवरण आपके WhatsApp रिमाइंडर और रिपोर्ट में दिखता है"
                  : "Shown on your WhatsApp payment reminders and shop header"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "दुकान का नाम" : "Shop Name"}
              </label>
              <input
                type="text"
                value={profile.shopName}
                onChange={(e) =>
                  setProfile({ ...profile, shopName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "मालिक का नाम" : "Owner Name"}
              </label>
              <input
                type="text"
                value={profile.ownerName}
                onChange={(e) =>
                  setProfile({ ...profile, ownerName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "व्यवसाय प्रकार" : "Shop Category"}
              </label>
              <input
                type="text"
                value={profile.shopType}
                onChange={(e) =>
                  setProfile({ ...profile, shopType: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "फ़ोन नंबर" : "Phone Number"}
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi" ? "दुकान का पता" : "Shop Address"}
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h3 className="text-base font-semibold text-slate-900">
            {t(language, "voicePrefsTitle")}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi"
                  ? "बोलने की भाषा (Voice Language)"
                  : "Primary Spoken Language"}
              </label>
              <select
                value={prefs.voiceLanguage}
                onChange={(e) =>
                  setPrefs({ ...prefs, voiceLanguage: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {VOICE_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {language === "hi"
                  ? "आवाज़ कैप्चर मोड"
                  : "Voice Recognition Mode"}
              </label>
              <select
                value={prefs.captureMode}
                onChange={(e) =>
                  setPrefs({
                    ...prefs,
                    captureMode: e.target.value as "auto" | "gemini-audio",
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="auto">
                  {language === "hi"
                    ? "लाइव ब्राउज़र + AI फॉलबैक"
                    : "Live Browser Speech + AI Fallback"}
                </option>
                <option value="gemini-audio">
                  {language === "hi"
                    ? "AI ऑडियो रिकॉर्डिंग (उच्च सटीकता)"
                    : "Record Audio & AI Transcribe"}
                </option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.autoSpeakConfirmation}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  autoSpeakConfirmation: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
            />
            <span className="text-sm text-slate-700">
              {language === "hi"
                ? "सेव करने से पहले AI पुष्टि बोलकर सुनाएं"
                : "Automatically speak AI confirmation summary aloud before saving"}
            </span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors"
            >
              {t(language, "saveSettings")}
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900">
          {t(language, "dataBackupTitle")}
        </h3>
        <p className="text-sm text-slate-600">
          {language === "hi"
            ? "अपना पूरा डिजिटल खाता, स्टॉक और लेन-देन रिकॉर्ड सुरक्षित JSON फ़ाइल के रूप में डाउनलोड या रीस्टोर करें।"
            : "Export your complete digital khata, inventory, and sales history as a JSON backup file or restore from an existing backup."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onDownloadBackup}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-emerald-700" />
            <span>{t(language, "downloadBackup")}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={(e) => void handleFileChange(e)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 whitespace-nowrap"
          >
            <Upload className="h-4 w-4 text-slate-600" />
            <span>{t(language, "restoreBackup")}</span>
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t(language, "resetDemo")}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetDemo();
                  setConfirmReset(false);
                  showNotice(
                    language === "hi"
                      ? "सैंपल डेटा रीसेट हो गया।"
                      : "Sample data restored."
                  );
                }}
                className="px-3.5 py-2 rounded-lg bg-rose-700 text-white text-xs font-medium hover:bg-rose-800"
              >
                {language === "hi" ? "हाँ, रीसेट करें" : "Confirm Reset"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600"
              >
                {language === "hi" ? "रद्द" : "Cancel"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
