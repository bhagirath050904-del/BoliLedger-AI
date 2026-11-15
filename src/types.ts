export type AppLanguage = "en" | "hi";

export type NavTab =
  | "dashboard"
  | "voice"
  | "khata"
  | "inventory"
  | "analytics"
  | "reminders"
  | "settings";

export type VoiceIntent =
  | "SALE"
  | "UDHAAR_GIVEN"
  | "PAYMENT_RECEIVED"
  | "ADD_INVENTORY"
  | "EXPENSE"
  | "QUERY"
  | "UNKNOWN";

export type PaymentMode = "CASH" | "UPI" | "UDHAAR";

export interface LineItem {
  productName: string;
  matchedProductId?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface ParsedVoiceAction {
  intent: VoiceIntent;
  confidence: number;
  customerName?: string;
  matchedCustomerId?: string;
  amount: number;
  paymentMode: PaymentMode;
  expenseCategory?: string;
  notes?: string;
  confirmationSummaryEn: string;
  confirmationSummaryHi: string;
  queryAnswerEn?: string;
  queryAnswerHi?: string;
  items: LineItem[];
}

export interface KhataEntry {
  id: string;
  customerId: string;
  type: "CREDIT_GIVEN" | "PAYMENT_RECEIVED";
  amount: number;
  itemsSummary: string;
  paymentMode: PaymentMode;
  createdAt: string;
  viaVoice?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // positive = customer owes shopkeeper (udhaar)
  lastTransactionAt: string;
  dueDate?: string;
  reminderStatus: "NONE" | "REMINDED" | "PAID";
  lastRemindedAt?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  hindiAlias?: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  unitsSold: number;
  updatedAt: string;
}

export interface PurchaseRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  totalCost: number;
  supplier: string;
  createdAt: string;
  viaVoice?: boolean;
}

export interface Transaction {
  id: string;
  type: "SALE" | "UDHAAR_GIVEN" | "PAYMENT_RECEIVED" | "EXPENSE";
  amount: number;
  profitEstimate: number;
  customerName?: string;
  customerId?: string;
  paymentMode: PaymentMode;
  summary: string;
  items?: LineItem[];
  category?: string;
  createdAt: string;
  viaVoice: boolean;
}

export interface VoiceLogItem {
  id: string;
  transcript: string;
  intent: VoiceIntent;
  summary: string;
  amount: number;
  saved: boolean;
  createdAt: string;
}

export interface ShopProfile {
  shopName: string;
  ownerName: string;
  shopType: string;
  phone: string;
  address: string;
  avatarUrl: string;
}

export interface VoicePreferences {
  voiceLanguage: string;
  autoSpeakConfirmation: boolean;
  captureMode: "auto" | "gemini-audio";
}

export interface LedgerStore {
  language: AppLanguage;
  shopProfile: ShopProfile;
  voicePrefs: VoicePreferences;
  customers: Customer[];
  khataEntries: KhataEntry[];
  products: Product[];
  purchaseRecords: PurchaseRecord[];
  transactions: Transaction[];
  voiceLogs: VoiceLogItem[];
}
