import { useEffect, useRef, useState } from "react";
import { Bot, Mic, Send, Sparkles, X } from "lucide-react";
import { Pill } from "./primitives";
import { inr, inrCompact, placeOrder, triggerStockOut } from "@/lib/wms/actions";
import type { WmsState } from "@/lib/wms/types";

interface Msg {
  id: number;
  role: "user" | "ai";
  text: string;
}

const SUGGESTIONS = [
  "What is total expenditure with Tata Supply Chain?",
  "Who is the delivery agent for the latest order?",
  "Which SKUs are stocked out?",
  "Raise a prime order for earbuds",
];

function answer(q: string, s: WmsState): string {
  const t = q.toLowerCase();

  const vendor = s.vendors.find((v) => t.includes(v.name.toLowerCase().split(" ")[0]!));
  if (vendor && /(spend|expenditure|paid|cost|total)/.test(t)) {
    return `Lifetime expenditure with ${vendor.name} is ${inr(vendor.lifetimeSpend)} across ${vendor.unitsPurchased.toLocaleString("en-IN")} units. SLA: ${vendor.sla}. Bills on record: ${s.pos.filter((p) => p.vendorId === vendor.id).length}.`;
  }

  const idMatch = q.toUpperCase().match(/ORD-\d+/);
  const order = idMatch ? s.orders.find((o) => o.id === idMatch[0]) : s.orders[0];
  if (/(agent|driver|who is delivering|vehicle)/.test(t) && order) {
    const agent = s.agents.find((a) => a.id === order.agentId);
    return `${order.id} is assigned to ${agent?.name} (${agent?.id}), vehicle ${agent?.vehicle}, via ${order.courier}. Current status: ${order.status.toUpperCase()}${order.pod ? ` · e-POD signed by ${order.pod.signature}` : ""}.`;
  }

  if (/(stock ?out|out of stock|zero stock)/.test(t)) {
    const out = s.skus.filter((x) => x.status === "out");
    return out.length
      ? `${out.length} SKU(s) at zero stock: ${out.map((x) => `${x.sku} (${x.bin})`).join(", ")}. Auto-procurement has issued ${s.pos.filter((p) => p.status === "issued").length} PO(s).`
      : "No SKUs are currently stocked out. Lowest position: " +
          [...s.skus].sort((a, b) => a.stock - b.stock)[0]!.sku;
  }

  if (/(revenue|gmv|sales)/.test(t)) {
    const today = s.series[s.series.length - 1]!;
    return `Revenue today is ${inrCompact(today.revenue)} across ${today.orders} orders, with ${today.returns} returns logged. CO₂ saved: ${s.co2Saved} kg.`;
  }

  if (/(return|rto)/.test(t)) {
    return s.returns.length
      ? `${s.returns.length} return(s) in the reverse-logistics queue. Latest: ${s.returns[0]!.item} on ${s.returns[0]!.orderId} — reason "${s.returns[0]!.reason}".`
      : "No returns pending. Reverse-logistics queue is clear.";
  }

  if (/(sla|late|breach|timer)/.test(t)) {
    const prime = s.orders.filter((o) => o.slaDeadline);
    return prime.length
      ? `${prime.length} prime consignment(s) under active SLA. ${prime.map((o) => `${o.id} due ${new Date(o.slaDeadline!).toLocaleTimeString("en-IN")}`).join("; ")}.`
      : "No active SLA countdowns. All express lanes clear.";
  }

  if (/(order|buy|place|raise)/.test(t) && /(prime|urgent)/.test(t)) {
    const sku = s.skus.find((x) => t.includes(x.name.toLowerCase().split(" ")[0]!)) ?? s.skus[2]!;
    const id = placeOrder(sku.id, "prime");
    return `Executed: prime urgent order ${id} raised for ${sku.name}. Delhivery Enterprise auto-assigned with a sub-2-hour SLA.`;
  }
  if (/(order|place)/.test(t)) {
    const sku = s.skus.find((x) => t.includes(x.name.toLowerCase().split(" ")[0]!)) ?? s.skus[0]!;
    const id = placeOrder(sku.id, "standard");
    return `Executed: standard order ${id} raised for ${sku.name} and auto-packed at ${sku.bin}.`;
  }
  if (/(procure|purchase order|reorder|replenish)/.test(t)) {
    const sku = [...s.skus].sort((a, b) => a.stock - b.stock)[0]!;
    const po = triggerStockOut(sku.id);
    return `Executed: ${po} drafted for ${sku.sku} against the best lead-time vendor and logged in the Supplier hub.`;
  }
  if (/(agent|fleet|driver)/.test(t)) {
    return `Fleet on duty: ${s.agents.map((a) => `${a.name} (${a.id}, ${a.vehicle})`).join(" · ")}.`;
  }

  return `I track orders, SLAs, inventory, vendors, expenditure and audit trails across ${s.orders.length} orders and ${s.pos.length} purchase orders. Ask about vendor spend, delivery agents, stock-outs, returns or say "raise a prime order for earbuds".`;
}

export function Copilot({ state, open, onOpenChange }: { state: WmsState; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, role: "ai", text: "Helix Copilot online. I have full read/write access to the live warehouse graph. Ask me anything or issue a command." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setInput("");
    setMsgs((m) => [...m, { id: m.length, role: "user", text: q }]);
    const reply = answer(q, state);
    setTimeout(() => setMsgs((m) => [...m, { id: m.length, role: "ai", text: reply }]), 260);
  };

  return (
    <>
      {!open ? (
        <button
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-neon/20 px-5 py-3 text-sm font-semibold text-neon neon-ring backdrop-blur transition-transform hover:scale-105"
        >
          <Sparkles className="size-4" /> AI Copilot
        </button>
      ) : null}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col glass transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-neon/40 bg-neon/10 p-2 text-neon">
              <Bot className="size-4" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">Helix AI Copilot</p>
              <p className="text-[11px] text-muted-foreground">Autonomous operations assistant</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary/60">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed animate-rise ${
                m.role === "user" ? "ml-auto bg-neon/15 text-foreground" : "glass-2"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="space-y-2 border-t border-border p-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-secondary/60"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask or command Helix…"
              className="flex-1 rounded-xl border border-input bg-secondary/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <button className="rounded-xl border border-border p-2 text-muted-foreground" title="Voice command" onClick={() => send("What is the SLA status?")}>
              <Mic className="size-4" />
            </button>
            <button onClick={() => send(input)} className="rounded-xl bg-neon/20 p-2 text-neon">
              <Send className="size-4" />
            </button>
          </div>
          <Pill tone="violet">Grounded on live event-bus state</Pill>
        </div>
      </div>
    </>
  );
}
