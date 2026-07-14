const SW_URL = "/sw.js";
const SW_SCOPE = "/";

export function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

export function getPushPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

function waitForWorkerActivation(
  registration: ServiceWorkerRegistration,
  timeoutMs: number,
): Promise<ServiceWorkerRegistration | null> {
  if (registration.active) {
    return Promise.resolve(registration);
  }

  const worker = registration.installing ?? registration.waiting;
  if (!worker) {
    return Promise.resolve(registration.active ? registration : null);
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      worker.removeEventListener("statechange", onStateChange);
      resolve(registration.active ? registration : null);
    }, timeoutMs);

    function onStateChange() {
      if (!worker) {
        return;
      }
      if (worker.state === "activated" || registration.active) {
        worker.removeEventListener("statechange", onStateChange);
        window.clearTimeout(timer);
        resolve(registration.active ? registration : registration);
      }
    }

    worker.addEventListener("statechange", onStateChange);
    onStateChange();
  });
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);

    if (!registration) {
      registration = await navigator.serviceWorker.register(SW_URL, {
        scope: SW_SCOPE,
        updateViaCache: "none",
      });
    } else {
      void registration.update();
    }

    return await waitForWorkerActivation(registration, 8000);
  } catch {
    return null;
  }
}

export async function getServiceWorkerRegistration(
  timeoutMs = 15000,
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registered = await registerServiceWorker();
    if (registered?.active) {
      return registered;
    }

    const ready = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);

    if (ready?.active) {
      return ready;
    }

    const fallback = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    if (fallback?.active) {
      return fallback;
    }

    if (fallback) {
      return waitForWorkerActivation(fallback, 5000);
    }

    return null;
  } catch {
    return null;
  }
}
