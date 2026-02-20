const CACHE_NAME = "Masakin";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/database.js",
  "/manifest.json",
  "/icon",
  "icon/telur.png",
  "icon/tempe.png",
  "icon/tahu.png",
  "icon/ayam.png",
  "icon/bawang merah.png",
  "icon/cabe.png",
  "icon/kecap manis.png",
  "icon/nasi.png",
  "icon/logo-header-gelap.png.png",
  "icon/logo-header-terang.png",
  "icon/logo-tentang-gelap",
  "icon/logo-tentang-terang",
  // Kamu juga bisa menambahkan '/icon.png' jika mau logonya tersimpan offline
];

// 1. Install Service Worker & Simpan File ke Memori HP
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// 2. Saat HP Offline, Ambil Data dari Memori Pintar
self.addEventListener("fetch", (event) => {
  // Hanya simpan file yang sifatnya GET (mengambil data), abaikan perintah POST (menyimpan data)
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // 1. Jika file sudah ada di memori offline, langsung pakai!
        if (response) {
          return response;
        }

        // 2. Jika belum ada, ambil dari internet...
        return fetch(event.request).then((networkResponse) => {
          // ... LALU SIMPAN ke memori offline agar besok bisa dipakai saat gak ada internet!
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
      .catch(() => {
        // Abaikan error jaringan agar aplikasi tidak "nge-hang"
        console.log("Kamu sedang offline!");
      }),
  );
});
