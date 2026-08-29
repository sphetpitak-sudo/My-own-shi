self.addEventListener("push", function(event) {
  const data = event.data ? event.data.json() : { title: "Sealo", body: "ดวงรายวันรอคุณอยู่ ✨" };
  event.waitUntil(
    self.registration.showNotification(data.title || "Sealo", {
      body: data.body || "เปิดดูดวงรายวันของคุณวันนี้",
      icon: "/logo-192.png",
      badge: "/logo-192.png",
      data: { url: "/dashboard/daily" }
    })
  );
});
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/dashboard/daily"));
});
self.addEventListener("install", function(e){ self.skipWaiting(); });
self.addEventListener("activate", function(e){ e.waitUntil(clients.claim()); });
