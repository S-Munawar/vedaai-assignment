"use client";

const UNREAD_KEY = "vedaai_notifications_unread_count";
const UNREAD_EVENT = "vedaai:notifications-unread-changed";

function normalizeCount(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

function notifyUnreadChanged(nextValue: number) {
  window.dispatchEvent(
    new CustomEvent<number>(UNREAD_EVENT, {
      detail: nextValue,
    }),
  );
}

export function getUnreadCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(UNREAD_KEY);

  if (!raw) {
    return 0;
  }

  const parsed = Number(raw);
  return normalizeCount(parsed);
}

export function setUnreadCount(nextValue: number) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeCount(nextValue);
  window.localStorage.setItem(UNREAD_KEY, String(normalized));
  notifyUnreadChanged(normalized);
}

export function incrementUnreadCount(step = 1) {
  const current = getUnreadCount();
  setUnreadCount(current + step);
}

export function clearUnreadCount() {
  setUnreadCount(0);
}

export function subscribeUnreadCount(onChange: (value: number) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== UNREAD_KEY) {
      return;
    }

    onChange(getUnreadCount());
  };

  const onCustom = (event: Event) => {
    const customEvent = event as CustomEvent<number>;
    onChange(normalizeCount(customEvent.detail));
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(UNREAD_EVENT, onCustom as EventListener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(UNREAD_EVENT, onCustom as EventListener);
  };
}
