export function setAppBadgeCount(count: number): void {
  if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) {
    return;
  }

  if (count > 0) {
    void navigator.setAppBadge(count);
    return;
  }

  void navigator.clearAppBadge?.();
}
