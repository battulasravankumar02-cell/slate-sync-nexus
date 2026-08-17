import { useSyncExternalStore } from "react";
import { makeSeedState } from "./seed";
import type { BusEvent, WmsState } from "./types";

const STORAGE_KEY = "helix-wms-v5-state";
const CHANNEL = "helix-wms-v5-bus";

let state: WmsState | null = null;
let serverSnapshot: WmsState | null = null;
let channel: BroadcastChannel | null = null;

const listeners = new Set<() => void>();
const eventListeners = new Set<(e: BusEvent) => void>();

function getServerState(): WmsState {
  if (!serverSnapshot) serverSnapshot = makeSeedState();
  return serverSnapshot;
}

function boot(): WmsState {
  if (state) return state;
  if (typeof window === "undefined") return getServerState();

  let loaded: WmsState | null = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) loaded = JSON.parse(raw) as WmsState;
  } catch {
    loaded = null;
  }
  state = loaded ?? makeSeedState();

  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => {
      const msg = event.data as { type: "state"; state: WmsState } | { type: "event"; event: BusEvent };
      if (msg?.type === "state") {
        state = msg.state;
        listeners.forEach((l) => l());
      } else if (msg?.type === "event") {
        eventListeners.forEach((l) => l(msg.event));
      }
    };
  } catch {
    channel = null;
  }

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = JSON.parse(e.newValue) as WmsState;
        listeners.forEach((l) => l());
      } catch {
        /* ignore */
      }
    }
  });

  return state;
}

function subscribe(cb: () => void) {
  boot();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): WmsState {
  return boot();
}

export function useWmsState(): WmsState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerState);
}

export function readState(): WmsState {
  return boot();
}

/** Mutate shared state, persist it and broadcast to every paired surface. */
export function mutate(recipe: (draft: WmsState) => void, events: BusEvent[] = []) {
  const current = boot();
  const next: WmsState = JSON.parse(JSON.stringify(current));
  recipe(next);
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
  }
  listeners.forEach((l) => l());
  channel?.postMessage({ type: "state", state: next });
  for (const ev of events) {
    channel?.postMessage({ type: "event", event: ev });
    eventListeners.forEach((l) => l(ev));
  }
}

export function subscribeEvents(cb: (e: BusEvent) => void) {
  boot();
  eventListeners.add(cb);
  return () => {
    eventListeners.delete(cb);
  };
}

export function resetWms() {
  mutate((d) => {
    const seed = makeSeedState();
    Object.assign(d, seed);
  });
}
