import { useCallback, useEffect, useMemo, useState } from "react";
import { createInitialSeedData } from "../data/seedData";
import {
  AppLanguage,
  Customer,
  KhataEntry,
  LedgerStore,
  ParsedVoiceAction,
  PaymentMode,
  Product,
  PurchaseRecord,
  ShopProfile,
  Transaction,
  VoicePreferences,
} from "../types";
import { isSameLocalDay } from "../utils/format";

const STORAGE_KEY = "boliledger_store_v1";

function loadInitialStore(): LedgerStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LedgerStore>;
      if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.products)) {
        const seed = createInitialSeedData();
        return {
          ...seed,
          ...parsed,
          shopProfile: { ...seed.shopProfile, ...(parsed.shopProfile || {}) },
          voicePrefs: { ...seed.voicePrefs, ...(parsed.voicePrefs || {}) },
        };
      }
    }
  } catch {
    // Fallback to seed data if storage is malformed
  }
  return createInitialSeedData();
}

export function useLedgerStore() {
  const [store, setStore] = useState<LedgerStore>(loadInitialStore);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore quota errors
    }
  }, [store]);

  const metrics = useMemo(() => {
    const today = new Date();
    const todaySales = store.transactions
      .filter(
        (tx) =>
          (tx.type === "SALE" || tx.type === "UDHAAR_GIVEN") &&
          isSameLocalDay(tx.createdAt, today)
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const todaySalesCount = store.transactions.filter(
      (tx) =>
        (tx.type === "SALE" || tx.type === "UDHAAR_GIVEN") &&
        isSameLocalDay(tx.createdAt, today)
    ).length;

    const totalRevenue = store.transactions
      .filter((tx) => tx.type === "SALE" || tx.type === "UDHAAR_GIVEN")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const grossProductProfit = store.transactions
      .filter((tx) => tx.type === "SALE" || tx.type === "UDHAAR_GIVEN")
      .reduce((sum, tx) => sum + Math.max(0, tx.profitEstimate), 0);

    const totalExpenses = store.transactions
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalNetProfit = grossProductProfit - totalExpenses;

    const todayProfit = store.transactions
      .filter((tx) => isSameLocalDay(tx.createdAt, today))
      .reduce((sum, tx) => {
        if (tx.type === "SALE" || tx.type === "UDHAAR_GIVEN") {
          return sum + Math.max(0, tx.profitEstimate);
        }
        if (tx.type === "EXPENSE") {
          return sum - tx.amount;
        }
        return sum;
      }, 0);

    const pendingUdhaar = store.customers.reduce(
      (sum, c) => sum + Math.max(0, c.balance),
      0
    );

    const pendingCustomerCount = store.customers.filter((c) => c.balance > 0).length;

    const lowStockProducts = store.products.filter((p) => p.stock <= p.minStock);

    return {
      todaySales,
      todaySalesCount,
      totalRevenue,
      totalExpenses,
      totalNetProfit,
      todayProfit,
      pendingUdhaar,
      pendingCustomerCount,
      lowStockProducts,
    };
  }, [store.transactions, store.customers, store.products]);

  const setLanguage = useCallback((language: AppLanguage) => {
    setStore((prev) => ({ ...prev, language }));
  }, []);

  const updateShopProfile = useCallback((shopProfile: ShopProfile) => {
    setStore((prev) => ({ ...prev, shopProfile }));
  }, []);

  const updateVoicePrefs = useCallback((voicePrefs: VoicePreferences) => {
    setStore((prev) => ({ ...prev, voicePrefs }));
  }, []);

  const addCustomer = useCallback((name: string, phone: string, notes?: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const now = new Date().toISOString();
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: cleanName,
      phone: phone.trim(),
      balance: 0,
      lastTransactionAt: now,
      reminderStatus: "NONE",
      notes: notes?.trim() || undefined,
    };
    setStore((prev) => ({
      ...prev,
      customers: [newCust, ...prev.customers],
    }));
  }, []);

  const recordKhataTransaction = useCallback(
    (params: {
      customerId: string;
      type: "CREDIT_GIVEN" | "PAYMENT_RECEIVED";
      amount: number;
      itemsSummary: string;
      paymentMode: PaymentMode;
      viaVoice?: boolean;
    }) => {
      const amt = Math.max(0, Math.round(params.amount));
      if (!amt) return;
      const now = new Date().toISOString();

      setStore((prev) => {
        const customer = prev.customers.find((c) => c.id === params.customerId);
        if (!customer) return prev;

        const updatedCustomers = prev.customers.map((c) => {
          if (c.id !== params.customerId) return c;
          const nextBalance =
            params.type === "CREDIT_GIVEN"
              ? c.balance + amt
              : Math.max(0, c.balance - amt);
          return {
            ...c,
            balance: nextBalance,
            lastTransactionAt: now,
            reminderStatus:
              nextBalance === 0
                ? ("PAID" as const)
                : params.type === "CREDIT_GIVEN"
                ? ("NONE" as const)
                : c.reminderStatus,
          };
        });

        const khataEntry: KhataEntry = {
          id: `kh_${Date.now()}`,
          customerId: params.customerId,
          type: params.type,
          amount: amt,
          itemsSummary: params.itemsSummary || (params.type === "CREDIT_GIVEN" ? "Credit entry" : "Payment received"),
          paymentMode: params.paymentMode,
          createdAt: now,
          viaVoice: params.viaVoice,
        };

        const tx: Transaction = {
          id: `tx_${Date.now()}`,
          type: params.type === "CREDIT_GIVEN" ? "UDHAAR_GIVEN" : "PAYMENT_RECEIVED",
          amount: amt,
          profitEstimate: params.type === "CREDIT_GIVEN" ? Math.round(amt * 0.25) : 0,
          customerName: customer.name,
          customerId: customer.id,
          paymentMode: params.paymentMode,
          summary:
            params.type === "CREDIT_GIVEN"
              ? `Udhaar: ${params.itemsSummary}`
              : `Payment received from ${customer.name}`,
          createdAt: now,
          viaVoice: Boolean(params.viaVoice),
        };

        return {
          ...prev,
          customers: updatedCustomers,
          khataEntries: [khataEntry, ...prev.khataEntries],
          transactions: [tx, ...prev.transactions],
        };
      });
    },
    []
  );

  const addOrRestockProduct = useCallback(
    (params: {
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
      viaVoice?: boolean;
    }) => {
      const now = new Date().toISOString();
      const qty = Math.max(0, Number(params.quantity) || 0);

      setStore((prev) => {
        let targetProductId = params.existingProductId;
        let updatedProducts = [...prev.products];

        if (!targetProductId) {
          const match = prev.products.find(
            (p) => p.name.toLowerCase() === params.name.trim().toLowerCase()
          );
          if (match) targetProductId = match.id;
        }

        if (targetProductId) {
          updatedProducts = updatedProducts.map((p) =>
            p.id === targetProductId
              ? {
                  ...p,
                  stock: p.stock + qty,
                  costPrice: params.costPrice > 0 ? params.costPrice : p.costPrice,
                  sellingPrice: params.sellingPrice > 0 ? params.sellingPrice : p.sellingPrice,
                  updatedAt: now,
                }
              : p
          );
        } else {
          targetProductId = `prod_${Date.now()}`;
          const newProd: Product = {
            id: targetProductId,
            name: params.name.trim(),
            hindiAlias: params.hindiAlias?.trim() || undefined,
            category: params.category || "General",
            stock: qty,
            unit: params.unit || "pcs",
            minStock: params.minStock || 10,
            costPrice: params.costPrice || 0,
            sellingPrice: params.sellingPrice || 0,
            unitsSold: 0,
            updatedAt: now,
          };
          updatedProducts = [newProd, ...updatedProducts];
        }

        const totalCost = Math.round(qty * (params.costPrice || 0));
        const purchase: PurchaseRecord = {
          id: `pur_${Date.now()}`,
          productId: targetProductId,
          productName: params.name.trim(),
          quantity: qty,
          unit: params.unit || "pcs",
          totalCost,
          supplier: params.supplier?.trim() || "Local Wholesale",
          createdAt: now,
          viaVoice: params.viaVoice,
        };

        return {
          ...prev,
          products: updatedProducts,
          purchaseRecords: [purchase, ...prev.purchaseRecords],
        };
      });
    },
    []
  );

  const logExpense = useCallback(
    (params: {
      summary: string;
      amount: number;
      category: string;
      paymentMode: PaymentMode;
      viaVoice?: boolean;
    }) => {
      const amt = Math.max(0, Math.round(params.amount));
      if (!amt) return;
      const now = new Date().toISOString();
      const tx: Transaction = {
        id: `tx_${Date.now()}`,
        type: "EXPENSE",
        amount: amt,
        profitEstimate: -amt,
        paymentMode: params.paymentMode,
        category: params.category || "Other",
        summary: params.summary.trim() || "Shop expense",
        createdAt: now,
        viaVoice: Boolean(params.viaVoice),
      };
      setStore((prev) => ({
        ...prev,
        transactions: [tx, ...prev.transactions],
      }));
    },
    []
  );

  const markCustomerReminded = useCallback((customerId: string) => {
    const now = new Date().toISOString();
    setStore((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? { ...c, reminderStatus: "REMINDED", lastRemindedAt: now }
          : c
      ),
    }));
  }, []);

  const markCustomerPaid = useCallback(
    (customerId: string, paymentMode: PaymentMode = "UPI") => {
      const cust = store.customers.find((c) => c.id === customerId);
      if (!cust || cust.balance <= 0) return;
      recordKhataTransaction({
        customerId,
        type: "PAYMENT_RECEIVED",
        amount: cust.balance,
        itemsSummary: "Full balance settled",
        paymentMode,
        viaVoice: false,
      });
    },
    [store.customers, recordKhataTransaction]
  );

  const commitVoiceAction = useCallback(
    (transcript: string, action: ParsedVoiceAction) => {
      const now = new Date().toISOString();

      setStore((prev) => {
        let customers = [...prev.customers];
        let khataEntries = [...prev.khataEntries];
        let products = [...prev.products];
        let purchaseRecords = [...prev.purchaseRecords];
        let transactions = [...prev.transactions];

        const amt = Math.max(0, Math.round(action.amount || 0));
        const itemsSummary =
          action.items.length > 0
            ? action.items
                .map((i) => `${i.quantity} ${i.unit} ${i.productName}`)
                .join(", ")
            : action.notes || action.confirmationSummaryEn;

        // Deduct or add stock when items match inventory
        let computedCost = 0;
        if (action.intent === "SALE" || action.intent === "UDHAAR_GIVEN") {
          for (const item of action.items) {
            const idx = products.findIndex(
              (p) =>
                p.id === item.matchedProductId ||
                p.name.toLowerCase() === item.productName.toLowerCase()
            );
            if (idx >= 0) {
              const prod = products[idx];
              const qty = Math.max(0, item.quantity || 1);
              computedCost += qty * prod.costPrice;
              products[idx] = {
                ...prod,
                stock: Math.max(0, prod.stock - qty),
                unitsSold: prod.unitsSold + qty,
                updatedAt: now,
              };
            }
          }
        }

        const estimatedProfit =
          computedCost > 0 ? Math.max(0, amt - computedCost) : Math.round(amt * 0.28);

        if (action.intent === "SALE") {
          const tx: Transaction = {
            id: `tx_${Date.now()}`,
            type: "SALE",
            amount: amt,
            profitEstimate: estimatedProfit,
            paymentMode: action.paymentMode === "UDHAAR" ? "CASH" : action.paymentMode,
            summary: itemsSummary,
            items: action.items,
            createdAt: now,
            viaVoice: true,
          };
          transactions = [tx, ...transactions];
        } else if (
          action.intent === "UDHAAR_GIVEN" ||
          action.intent === "PAYMENT_RECEIVED"
        ) {
          const targetName = (action.customerName || "Walk-in Customer").trim();
          let custIndex = customers.findIndex(
            (c) =>
              (action.matchedCustomerId && c.id === action.matchedCustomerId) ||
              c.name.toLowerCase() === targetName.toLowerCase()
          );

          if (custIndex === -1) {
            const newCust: Customer = {
              id: `cust_${Date.now()}`,
              name: targetName,
              phone: "",
              balance: 0,
              lastTransactionAt: now,
              reminderStatus: "NONE",
            };
            customers = [newCust, ...customers];
            custIndex = 0;
          }

          const targetCust = customers[custIndex];
          const isCredit = action.intent === "UDHAAR_GIVEN";
          const nextBalance = isCredit
            ? targetCust.balance + amt
            : Math.max(0, targetCust.balance - amt);

          customers[custIndex] = {
            ...targetCust,
            balance: nextBalance,
            lastTransactionAt: now,
            reminderStatus:
              nextBalance === 0
                ? "PAID"
                : isCredit
                ? "NONE"
                : targetCust.reminderStatus,
          };

          const khEntry: KhataEntry = {
            id: `kh_${Date.now()}`,
            customerId: targetCust.id,
            type: isCredit ? "CREDIT_GIVEN" : "PAYMENT_RECEIVED",
            amount: amt,
            itemsSummary,
            paymentMode: isCredit ? "UDHAAR" : action.paymentMode === "UDHAAR" ? "CASH" : action.paymentMode,
            createdAt: now,
            viaVoice: true,
          };
          khataEntries = [khEntry, ...khataEntries];

          const tx: Transaction = {
            id: `tx_${Date.now()}`,
            type: isCredit ? "UDHAAR_GIVEN" : "PAYMENT_RECEIVED",
            amount: amt,
            profitEstimate: isCredit ? estimatedProfit : 0,
            customerName: targetCust.name,
            customerId: targetCust.id,
            paymentMode: khEntry.paymentMode,
            summary: isCredit
              ? `Udhaar (${targetCust.name}): ${itemsSummary}`
              : `Payment from ${targetCust.name}`,
            items: action.items,
            createdAt: now,
            viaVoice: true,
          };
          transactions = [tx, ...transactions];
        } else if (action.intent === "ADD_INVENTORY") {
          const itemsToAdd =
            action.items.length > 0
              ? action.items
              : [
                  {
                    productName: action.notes || "General Stock Item",
                    quantity: 1,
                    unit: "pcs",
                    unitPrice: amt,
                    totalPrice: amt,
                  },
                ];

          itemsToAdd.forEach((item, index) => {
            const prodIdx = products.findIndex(
              (p) =>
                p.id === item.matchedProductId ||
                p.name.toLowerCase() === item.productName.toLowerCase()
            );
            const qty = Math.max(1, item.quantity || 1);
            const itemCost =
              item.totalPrice > 0
                ? item.totalPrice
                : itemsToAdd.length === 1 && amt > 0
                ? amt
                : qty * (item.unitPrice || 20);

            if (prodIdx >= 0) {
              const existing = products[prodIdx];
              products[prodIdx] = {
                ...existing,
                stock: existing.stock + qty,
                updatedAt: now,
              };
              purchaseRecords = [
                {
                  id: `pur_${Date.now()}_${index}`,
                  productId: existing.id,
                  productName: existing.name,
                  quantity: qty,
                  unit: existing.unit,
                  totalCost: Math.round(itemCost),
                  supplier: "Voice Restock",
                  createdAt: now,
                  viaVoice: true,
                },
                ...purchaseRecords,
              ];
            } else {
              const newId = `prod_${Date.now()}_${index}`;
              const unitCost = Math.round(itemCost / qty);
              const newProd: Product = {
                id: newId,
                name: item.productName,
                category: "General",
                stock: qty,
                unit: item.unit || "pcs",
                minStock: 10,
                costPrice: unitCost,
                sellingPrice: Math.round(unitCost * 1.25),
                unitsSold: 0,
                updatedAt: now,
              };
              products = [newProd, ...products];
              purchaseRecords = [
                {
                  id: `pur_${Date.now()}_${index}`,
                  productId: newId,
                  productName: newProd.name,
                  quantity: qty,
                  unit: newProd.unit,
                  totalCost: Math.round(itemCost),
                  supplier: "Voice Restock",
                  createdAt: now,
                  viaVoice: true,
                },
                ...purchaseRecords,
              ];
            }
          });
        } else if (action.intent === "EXPENSE") {
          const tx: Transaction = {
            id: `tx_${Date.now()}`,
            type: "EXPENSE",
            amount: amt,
            profitEstimate: -amt,
            paymentMode: action.paymentMode === "UDHAAR" ? "CASH" : action.paymentMode,
            category: action.expenseCategory || "Other",
            summary: action.notes || itemsSummary,
            createdAt: now,
            viaVoice: true,
          };
          transactions = [tx, ...transactions];
        }

        const voiceLog = {
          id: `vlog_${Date.now()}`,
          transcript,
          intent: action.intent,
          summary:
            prev.language === "hi"
              ? action.confirmationSummaryHi
              : action.confirmationSummaryEn,
          amount: amt,
          saved: true,
          createdAt: now,
        };

        return {
          ...prev,
          customers,
          khataEntries,
          products,
          purchaseRecords,
          transactions,
          voiceLogs: [voiceLog, ...prev.voiceLogs].slice(0, 30),
        };
      });
    },
    []
  );

  const exportBackupJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(store, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateSlug = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `boliledger-backup-${dateSlug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [store]);

  const importBackupJson = useCallback((jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText) as LedgerStore;
      if (
        parsed &&
        Array.isArray(parsed.customers) &&
        Array.isArray(parsed.products) &&
        Array.isArray(parsed.transactions)
      ) {
        setStore(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const resetToSeedData = useCallback(() => {
    const fresh = createInitialSeedData();
    setStore(fresh);
  }, []);

  return {
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
  };
}
