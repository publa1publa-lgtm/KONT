export type ToastType = "success" | "info" | "warning" | "error";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
};

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 5000;

type Listener = (items: ToastItem[]) => void;

const listeners = new Set<Listener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let items: ToastItem[] = [];

function notify() {
  for (const listener of listeners) listener(items);
}

function clearTimer(id: string) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}

function dismiss(id: string) {
  if (!items.some((item) => item.id === id)) return;
  clearTimer(id);
  items = items.filter((item) => item.id !== id);
  notify();
}

function push(type: ToastType, message: string) {
  const text = message.trim();
  if (!text) return;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const next: ToastItem = { id, type, message: text, createdAt: Date.now() };
  const kept = [next, ...items].slice(0, MAX_TOASTS);
  const dropped = items.filter((item) => !kept.some((k) => k.id === item.id));
  for (const item of dropped) clearTimer(item.id);
  items = kept;

  if (type !== "error") {
    timers.set(
      id,
      setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS),
    );
  }

  notify();
}

export const toast = {
  success(message: string) {
    push("success", message);
  },
  info(message: string) {
    push("info", message);
  },
  warning(message: string) {
    push("warning", message);
  },
  error(message: string) {
    push("error", message);
  },
  dismiss,
};

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(items);
  return () => {
    listeners.delete(listener);
  };
}
