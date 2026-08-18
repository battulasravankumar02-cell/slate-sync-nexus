# Slate WMS Elite

Build a production-grade, ultra-premium Enterprise AI Warehouse Management System (Helix WMS v5.0) engineered with luxury dark-slate aesthetics (Slate-950 UI, glassmorphic cards, neon accents), tailored specifically for Indian Enterprise Logistics as if designed by a 20+ year senior principal software architect.

Architectural Synchronization & Device Pairing:

- Dynamic Real-Time Event Bus: Use dynamic WebSockets / BroadcastChannel synchronization to guarantee instant state syncing between Desktop Dashboard (`/`) and Mobile Operations Interface (`/mobile`) without page refreshes.

- Universal Pairing System: Mobile app (/mobile) generates a persistent 4-character session code (e.g., "HX-9B4Z"). Entering this code in the Desktop header's [🔗 Connect Remote Device] modal establishes an immediate bi-directional live link with a glowing green "Synced: HX-9B4Z" status badge.

1. Universal Operations Mobile Web App (/mobile route):

   - Header: Session Pairing Code display + Top Mode Switcher Toggle: [ 👤 Customer E-Commerce Mode ] | [ 👷 Warehouse Executive Mode ].

   

   - Customer E-Commerce Mode Actions:

     * Product Catalog: 5G Smartphones, Gaming Laptops, Wireless Earbuds, Fast Chargers (65W), Smartwatches.

     * [ 🛒 Place Standard Order ]: Instantly triggers a visual dynamic top-right toast alert on Laptop ("🔔 NEW ORDER RECEIVED: #ORD-8821"), updates analytics charts, auto-packs stock, and queues order.

     * [ ⚡ Place Prime Urgent Order ]: Autonomous system instantly overrides standard flow, auto-assigns fastest courier (Delhivery Enterprise), highlights dynamic route, and activates live SLA timer (<2 Hours).

     * [ ↩️ Request Item Return ]: Updates return metrics on laptop, flags inventory ledger, and logs return reason.

     * [ 📦 Confirm Delivery Received ]: Triggers digital e-POD signature popup modal and marks order as DELIVERED in the dashboard.

   - Warehouse Executive Mode Actions:

     * [ ❌ Trigger Stock Out ]: Autonomous AI system automatically detects zero stock, selects preferred vendor (e.g., Tata Supply Chain), auto-generates a formal Purchase Order (PO) Invoice Bill in INR (₹), dispatches alert to laptop, and logs bill directly into the Supplier tab.

     * [ 📦 Receive & Inbound Stock ]: Prompts SKU input, updates stock levels, and dynamically highlights bin location on 3D Map.

     * [ 🚨 Flag Damaged Stock ]: Isolates SKU to Quarantine Zone and auto-reroutes 3D warehouse pick routes.

2. Laptop Command Center Dashboard (`/` route):

   - Header: Dynamic green sync status badge, instant notification popups for mobile triggers, eco-badge ("🌱 CO₂ Saved Today: 42.5 kg"), and AI Copilot launcher.

   - Autonomous Decision Engine: System automatically makes intelligent enterprise decisions (auto-routing, vendor selection based on lead-time, auto-procurement drafting) upon mobile inputs.

   - Vertical Navigation Sidebar (Tabs):

     1. ⚡ Operations Command Center: Live status board, real-time SLA countdown timers, active system alerts, and automated AI decision logs.

     2. 🚚 Delivery & Logistics: Displays active dispatches, assigned Indian Delivery Agents (Agent Name e.g., "Ramesh Kumar", Unique Agent ID e.g., "AGT-DEL-9942", Vehicle Reg Number e.g., "TS-09-EX-4821"), live tracking status, dynamic scannable QR shipping labels, and e-POD signature confirmations.

     3. 🏢 High-End 3D Warehouse Matrix Visualizer: Premium isometric 3D warehouse map with multi-tier racks, glowing active pick-path polylines, pulsing red stockout indicators, yellow quarantine zones, AI slotting optimizer badges, and dynamic 3D camera angle controls (2D Grid / 3D Isometric View).

     4. 🏭 Supplier & Replenishment (Enterprise Procurement Hub):

        - Displays registered Indian Enterprise Vendors: Tata Supply Chain, Reliance Logistics, Mahindra Logistics Hub, Delhivery Enterprise.

        - Interactive Vendor Profile Modal: Clicking any vendor profile card reveals: Total Stock Units Purchased to Date, Lifetime Expenditure in INR (₹), Active SLAs, and Historical Purchase Order Bills.

        - Dynamic PO Invoice Generator: Whenever 'Stock Out' is clicked on mobile, renders a formal digital Invoice Bill (PO Number, Item SKU, Units, Vendor GSTIN, Total Amount in ₹).

     5. 📊 Analytics & Performance: High-precision Recharts graphs (Order Volume vs Revenue Growth (₹), Stock Depletion vs Return Spikes).

     6. 📜 Audit & Exceptions: Comprehensive immutable log stream tracking every user action, mobile trigger, and autonomous system decision.

3. AI Copilot Drawer (Chatbot):

   - Floating drawer handling natural language queries ("What is total expenditure with Tata Supply Chain?", "Who is the delivery agent for ORD-8821?") and executing voice/text operational commands.

Design & Technical Requirements:

- Theme: Dark-mode luxury aesthetics: Slate-950 background, subtle glassmorphism borders, neon accent badges (emerald green, amber, cyan).

- High interactivity, dynamic animations, zero lag on real-time mobile-to-desktop event broadcasting.

- Abstract code complexity into a fully dynamic, enterprise presentation-ready web application.

-

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://slate-sync-nexus.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d69fe298-6d50-4397-9e32-3226176ac5a6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
