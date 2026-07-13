const CACHE_NAME = "together-shell-v8";
const SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-144.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/screenshots/mobile.png",
  "/screenshots/desktop.png",
];

function isShellAsset(pathname: string): boolean {
  return (
    SHELL_URLS.includes(pathname) ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/screenshots/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() ?? {};
  const title = typeof payload.title === "string" ? payload.title : "Together";
  const body = typeof payload.body === "string" ? payload.body : "Новое сообщение";
  const url = typeof payload.url === "string" ? payload.url : "/chat";
  const tag = typeof payload.tag === "string" ? payload.tag : "together-chat";

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-144.png",
        tag,
        data: { url },
        renotify: true,
      });

      if (payload.badge && "setAppBadge" in navigator) {
        await navigator.setAppBadge(payload.badge);
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/chat";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Dynamic RSC payloads and API must always hit the network.
  if (url.search.includes("_rsc") || url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Document navigation must not be intercepted — a hanging fetch blocks the whole page.
  if (event.request.mode === "navigate") {
    return;
  }

  if (!isShellAsset(url.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
  );
});
