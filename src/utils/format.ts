import { AppLanguage } from "../types";

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatShortDate(iso: string, lang: AppLanguage = "en"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(iso: string, lang: AppLanguage = "en"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return lang === "hi" ? `आज · ${timeStr}` : `Today · ${timeStr}`;
  }

  return `${formatShortDate(iso, lang)} · ${timeStr}`;
}

export function isSameLocalDay(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getDate() === ref.getDate() &&
    d.getMonth() === ref.getMonth() &&
    d.getFullYear() === ref.getFullYear()
  );
}

export function buildWhatsAppReminderText(params: {
  customerName: string;
  balance: number;
  shopName: string;
  language: AppLanguage;
}): string {
  const { customerName, balance, shopName, language } = params;
  const formattedAmt = formatINR(balance);
  if (language === "hi") {
    return `नमस्ते ${customerName} जी, ${shopName} पर आपका ${formattedAmt} का उधार बकाया है। कृपया अपनी सुविधा के अनुसार भुगतान करें। धन्यवाद!`;
  }
  return `Namaste ${customerName} ji, your pending udhaar balance at ${shopName} is ${formattedAmt}. Kindly clear it at your convenience. Thank you!`;
}

export function buildWhatsAppHref(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
