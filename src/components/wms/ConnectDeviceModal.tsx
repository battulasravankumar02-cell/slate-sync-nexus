import { useState } from "react";
import { Link2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { connectRemoteDevice } from "@/lib/wms/actions";
import { Pill } from "./primitives";

export function ConnectDeviceModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (connectRemoteDevice(code)) {
      setError(null);
      setCode("");
      onOpenChange(false);
    } else {
      setError("No mobile terminal is broadcasting that session code. Open /mobile to generate one.");
      toast.error("Pairing failed", { description: "Session code not recognised." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Link2 className="size-4 text-neon" /> Connect Remote Device
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Enter the 4-character session code shown in the header of the mobile operations terminal
            (<span className="font-mono">/mobile</span>) to open a bi-directional live link.
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-border bg-secondary/40 px-3 py-2 font-mono text-sm text-muted-foreground">HX-</span>
            <input
              autoFocus
              value={code}
              maxLength={7}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="9B4Z"
              className="flex-1 rounded-xl border border-input bg-secondary/40 px-3 py-2 font-mono text-lg tracking-[0.35em] outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <button
            onClick={submit}
            className="w-full rounded-xl bg-neon/20 py-2.5 text-sm font-semibold text-neon neon-ring transition-transform hover:scale-[1.01]"
          >
            Establish live link
          </button>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Smartphone className="size-3.5" />
            <Pill tone="cyan">BroadcastChannel event bus</Pill>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
