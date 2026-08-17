import type { WmsState } from "./types";

export interface CatalogItem {
  id: string;
  name: string;
  sku: string;
  price: number;
}

const PHONE: CatalogItem = { id: "sku-5g", name: "5G Smartphone — Aurora X5", sku: "HX-MOB-5G-001", price: 42999 };
const LAPTOP: CatalogItem = { id: "sku-lap", name: "Gaming Laptop — Titan RTX", sku: "HX-LAP-GMX-002", price: 138499 };
const BUDS: CatalogItem = { id: "sku-buds", name: "Wireless Earbuds — SonicPro", sku: "HX-AUD-TWS-003", price: 6499 };
const CHARGER: CatalogItem = { id: "sku-chg", name: "Fast Charger 65W GaN", sku: "HX-PWR-65W-004", price: 2299 };
const WATCH: CatalogItem = { id: "sku-watch", name: "Smartwatch — Pulse Elite", sku: "HX-WCH-PLS-005", price: 18999 };

export const CATALOG: CatalogItem[] = [PHONE, LAPTOP, BUDS, CHARGER, WATCH];

const BASE = 1_760_000_000_000;

export function makeSeedState(): WmsState {
  return {
    session: { code: null, connected: false, pairedAt: null },
    skus: [
      { ...PHONE, stock: 184, bin: "A-02-T1", aisle: 0, bay: 1, tier: 1, status: "ok" },
      { ...LAPTOP, stock: 46, bin: "B-04-T2", aisle: 1, bay: 3, tier: 2, status: "low" },
      { ...BUDS, stock: 320, bin: "C-01-T1", aisle: 2, bay: 0, tier: 1, status: "ok" },
      { ...CHARGER, stock: 512, bin: "C-05-T3", aisle: 2, bay: 4, tier: 3, status: "ok" },
      { ...WATCH, stock: 88, bin: "D-03-T2", aisle: 3, bay: 2, tier: 2, status: "ok" },
    ],
    orders: [
      {
        id: "ORD-8814",
        customer: "Ananya Iyer",
        city: "Hyderabad",
        lines: [{ sku: BUDS.sku, name: BUDS.name, qty: 2, price: BUDS.price }],
        total: 12998,
        priority: "standard",
        status: "dispatched",
        courier: "Mahindra Logistics Hub",
        agentId: "AGT-HYD-7731",
        createdAt: BASE - 7_200_000,
        slaDeadline: null,
        pod: null,
      },
      {
        id: "ORD-8815",
        customer: "Rohit Sharma",
        city: "Mumbai",
        lines: [{ sku: PHONE.sku, name: PHONE.name, qty: 1, price: PHONE.price }],
        total: 42999,
        priority: "prime",
        status: "delivered",
        courier: "Delhivery Enterprise",
        agentId: "AGT-DEL-9942",
        createdAt: BASE - 18_000_000,
        slaDeadline: null,
        pod: { signedAt: BASE - 14_000_000, signature: "R. Sharma" },
      },
    ],
    agents: [
      { id: "AGT-DEL-9942", name: "Ramesh Kumar", vehicle: "TS-09-EX-4821", hub: "Delhi NCR Hub", phone: "+91 98110 44821", courier: "Delhivery Enterprise" },
      { id: "AGT-HYD-7731", name: "Suresh Nair", vehicle: "TS-07-GH-1190", hub: "Hyderabad Gachibowli", phone: "+91 90005 77310", courier: "Mahindra Logistics Hub" },
      { id: "AGT-BLR-5520", name: "Manoj Patil", vehicle: "KA-05-MJ-7742", hub: "Bengaluru Whitefield", phone: "+91 88611 55201", courier: "Reliance Logistics" },
      { id: "AGT-MUM-3308", name: "Vikram Deshmukh", vehicle: "MH-12-QT-9033", hub: "Mumbai Bhiwandi", phone: "+91 99206 33081", courier: "Tata Supply Chain" },
    ],
    vendors: [
      { id: "VEN-TATA", name: "Tata Supply Chain", gstin: "27AAACT2727Q1ZW", leadTimeHrs: 18, sla: "98.4% OTIF · 18h lead", rating: 4.8, unitsPurchased: 18420, lifetimeSpend: 48250000, city: "Mumbai" },
      { id: "VEN-REL", name: "Reliance Logistics", gstin: "24AAACR5055K1Z2", leadTimeHrs: 26, sla: "96.1% OTIF · 26h lead", rating: 4.5, unitsPurchased: 12240, lifetimeSpend: 31870000, city: "Jamnagar" },
      { id: "VEN-MAH", name: "Mahindra Logistics Hub", gstin: "27AAACM3025E1ZB", leadTimeHrs: 22, sla: "97.2% OTIF · 22h lead", rating: 4.6, unitsPurchased: 9310, lifetimeSpend: 22940000, city: "Pune" },
      { id: "VEN-DEL", name: "Delhivery Enterprise", gstin: "07AAECD1234F1Z5", leadTimeHrs: 12, sla: "99.1% OTIF · 12h lead", rating: 4.9, unitsPurchased: 15680, lifetimeSpend: 40120000, city: "Gurugram" },
    ],
    pos: [
      {
        id: "PO-70041",
        vendorId: "VEN-TATA",
        vendorName: "Tata Supply Chain",
        gstin: "27AAACT2727Q1ZW",
        sku: "HX-LAP-GMX-002",
        item: "Gaming Laptop — Titan RTX",
        units: 40,
        unitPrice: 110799,
        subtotal: 4431960,
        gst: 797752,
        total: 5229712,
        createdAt: BASE - 86_400_000,
        status: "received",
      },
    ],
    returns: [],
    logs: [
      { id: "LOG-1", at: BASE - 86_000_000, actor: "autonomous-ai", severity: "ai", message: "AI slotting optimizer rebalanced aisle C — travel distance reduced 14.2%." },
      { id: "LOG-2", at: BASE - 20_000_000, actor: "desktop", severity: "info", message: "Shift supervisor authenticated at Command Center." },
    ],
    alerts: [
      { id: "ALT-1", at: BASE - 3_600_000, title: "Low stock threshold breached", detail: "HX-LAP-GMX-002 at 46 units — below 60 unit reorder point.", tone: "amber" },
    ],
    series: [
      { label: "Mon", orders: 412, revenue: 8420000, depletion: 640, returns: 18 },
      { label: "Tue", orders: 468, revenue: 9110000, depletion: 705, returns: 22 },
      { label: "Wed", orders: 522, revenue: 10480000, depletion: 812, returns: 15 },
      { label: "Thu", orders: 498, revenue: 9870000, depletion: 764, returns: 31 },
      { label: "Fri", orders: 611, revenue: 12960000, depletion: 948, returns: 27 },
      { label: "Sat", orders: 702, revenue: 15310000, depletion: 1084, returns: 24 },
      { label: "Today", orders: 318, revenue: 7240000, depletion: 486, returns: 9 },
    ],
    pickPath: ["A-02-T1", "C-01-T1", "C-05-T3"],
    co2Saved: 42.5,
    counters: { order: 8820, po: 70041, ret: 4400, log: 2, alert: 1 },
  };
}
