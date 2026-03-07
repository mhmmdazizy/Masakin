// File ini berjalan di background Android meskipun aplikasi ditutup!
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js",
);

// COPAS firebaseConfig dari app.js kamu ke sini
const firebaseConfig = {
  apiKey: "AIzaSyDVx1wRhRJ-UYfxEZLonx5RMkgiOOd8gB8",
  authDomain: "masakin-id.firebaseapp.com",
  projectId: "masakin-id",
  storageBucket: "masakin-id.firebasestorage.app",
  messagingSenderId: "466490310728",
  appId: "1:466490310728:web:677901a9b8c65f63a8187d",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Tangkap notif saat aplikasi DITUTUP (Background)
messaging.onBackgroundMessage((payload) => {
  console.log("Notif Background diterima:", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png",
    badge: "/icon.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Aksi saat notif di-klik dari panel Android
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  // Buka aplikasi saat notif diklik
  event.waitUntil(
    clients.openWindow("/"), // Bisa diarahkan ke link spesifik resep nanti
  );
});
