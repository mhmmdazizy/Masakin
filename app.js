// --- BACA TEMA DETIK PERTAMA ---
const savedTheme = localStorage.getItem("appTheme");
if (savedTheme === "dark") {
  document.body.setAttribute("data-theme", "dark");
}
// --- DAFTARKAN SERVICE WORKER (UNTUK OFFLINE) ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("Mode Offline Aktif!"))
      .catch((err) => console.log("Mode Offline Gagal:", err));
  });
}
// ------------------------------------------------
// -------------------------------
// --- 1. CONFIG FIREBASE (PASTE CONFIG KAMU DI SINI) ---
const firebaseConfig = {
  apiKey: "AIzaSyDVx1wRhRJ-UYfxEZLonx5RMkgiOOd8gB8",
  authDomain: "masakin-id.firebaseapp.com",
  projectId: "masakin-id",
  storageBucket: "masakin-id.firebasestorage.app",
  messagingSenderId: "466490310728",
  appId: "1:466490310728:web:677901a9b8c65f63a8187d",
};

// Init Firebase & Firestore
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore(); // Database Gratis
// === TAMBAHKAN BLOK KODE INI BIAR FIREBASE KEBAL OFFLINE ===
db.enablePersistence().catch((err) => {
  if (err.code == "failed-precondition") {
    console.log("Memori offline gagal: Buka di banyak tab sekaligus.");
  } else if (err.code == "unimplemented") {
    console.log("Browser ini tidak mendukung memori offline Firebase.");
  }
});

// Variables
let selectedIngredients = new Set();
let currentUser = null;
let favorites = JSON.parse(localStorage.getItem("myFavorites")) || [];
let myRecipes = []; // Data dari Cloud
let allCloudRecipes = [];

// --- 3. START APP ---
document.addEventListener("DOMContentLoaded", () => {
  // === TEMBAKKAN SKELETON LANGSUNG ===
  showSkeletonLoading("explore-container", 6);
  showSkeletonLoading("menu-container", 6);
  showSkeletonLoading("favorit-container", 4);
  showSkeletonLoading("my-recipe-list", 2);
  // ===================================

  // Update teks tombol tema kalau sebelumnya mode gelap
  const themeBtn = document.getElementById("theme-btn");
  if (localStorage.getItem("appTheme") === "dark" && themeBtn) {
    themeBtn.innerHTML = `<i data-feather="sun"></i> Mode Terang`;
  }

  // Memori lokal akan mengembalikan angka fav menu statis yang sudah di-like
  favorites.forEach((fav) => {
    const staticMenu = menus.find((m) => m.title === fav.title);
    if (staticMenu) staticMenu.favCount = fav.favCount || 1;

    const staticArticle = articles.find((a) => a.title === fav.title);
    if (staticArticle) staticArticle.favCount = fav.favCount || 1;
  });

  // Render Data Statis Dulu (Supaya gak kosong)
  renderIngredients();
  renderGrid("explore-container", articles);
  if (typeof renderMenuGrid === "function") renderMenuGrid();
  if (typeof updateTotalLikesUI === "function") updateTotalLikesUI();

  // Render Icon (Penting biar gak hilang)
  if (typeof feather !== "undefined") feather.replace();

  // 1. Ambil Resep dari Cloud
  db.collection("recipes")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      myRecipes = [];
      allCloudRecipes = []; // Pakai variabel global yang baru

      snapshot.forEach((doc) => {
        const data = doc.data();
        data.id = doc.id;
        allCloudRecipes.push(data);

        if (currentUser && data.userId === currentUser.uid) {
          myRecipes.push(data);
        }
      });

      if (typeof globalFavCounts !== "undefined") {
        allCloudRecipes.forEach((item) => {
          const safeTitle = item.title.replace(/[^a-zA-Z0-9]/g, "_");
          item.favCount = globalFavCounts[safeTitle] || 0;
        });
      }

      renderMyRecipes();
      // Render jika sedang di halaman menu
      if (typeof renderMenuGrid === "function") renderMenuGrid();
      if (typeof updateTotalLikesUI === "function") updateTotalLikesUI();
    });

  // 2. SINKRONISASI ANGKA FAVORIT GLOBAL SE-DUNIA
  window.globalFavCounts = {}; // Memori pengingat angka Suka

  db.collection("counters").onSnapshot((snapshot) => {
    const globalCounts = {};

    snapshot.forEach((doc) => {
      let count = doc.data().favCount || 0;

      // --- FITUR SELF HEALING ---
      if (count < 0) {
        db.collection("counters")
          .doc(doc.id)
          .set({ favCount: 0 }, { merge: true });
        count = 0;
      }
      globalCounts[doc.id] = count;
    });

    // Simpan ke memori global biar nggak amnesia
    globalFavCounts = globalCounts;

    const applyFavCount = (arr) => {
      arr.forEach((item) => {
        const safeTitle = item.title.replace(/[^a-zA-Z0-9]/g, "_");
        item.favCount = globalFavCounts[safeTitle] || 0;
      });
    };

    applyFavCount(menus);
    applyFavCount(articles);
    applyFavCount(allCloudRecipes);
    applyFavCount(favorites);
    localStorage.setItem("myFavorites", JSON.stringify(favorites));

    // Render Ulang Layar secara Realtime
    renderGrid("explore-container", articles);
    if (typeof renderMenuGrid === "function") renderMenuGrid();
    renderGrid("favorit-container", favorites);

    if (typeof renderPublicRecipes === "function") renderPublicRecipes();
    if (typeof updateTotalLikesUI === "function") updateTotalLikesUI();
  });
});
// Cek Login & Load Data Cloud
let unsubscribeMyProfile = null; // Pastikan cuma ada satu baris ini di atas

auth.onAuthStateChanged(async (user) => {
  // === 1. KEMBALIKAN KODE UI ASLIMU YANG TERBUKTI AMAN ===
  currentUser = user;
  if (typeof updateUI === "function") {
    updateUI(user);
  }
  // ========================================================

  const myStatsContainer = document.getElementById("my-profile-stats");

  // Matikan radar lama biar memori HP nggak bocor
  if (unsubscribeMyProfile) {
    unsubscribeMyProfile();
    unsubscribeMyProfile = null;
  }

  if (user) {
    // --- 2. JIKA SUDAH LOGIN ---
    if (myStatsContainer) myStatsContainer.style.display = "flex";

    // A. Sinkronisasi Profil ke Database (Versi Agresif & Self-Healing)
    try {
      const userRef = db.collection("users").doc(user.uid);
      const doc = await userRef.get();
      
      // Tangkap nama asli dari akun Google-nya
      const realName = user.displayName || "Pengguna";
      const realPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(realName)}&background=random`;

      if (!doc.exists) {
        // 1. Jika belum ada sama sekali, buat baru
        await userRef.set({
          uid: user.uid,
          name: realName,
          photoURL: realPhoto,
          followers: [], following: []
        });
      } else {
        // 2. Jika dokumen sudah ada (misal karena pencet Follow duluan)
        const dataInDb = doc.data();
        
        // Cek apakah di database namanya masih kosong, atau "Pengguna", atau tidak sinkron
        if (!dataInDb.name || dataInDb.name === "Pengguna" || dataInDb.name !== realName) {
          // Paksa timpa dengan nama asli Google-nya!
          await userRef.update({
            name: realName,
            photoURL: realPhoto
          });
        }
      }
    } catch (e) {
      console.error("Gagal sinkron data user:", e);
    }

    // B. Pasang Radar Realtime untuk Angka Follower & Following
    unsubscribeMyProfile = db
      .collection("users")
      .doc(user.uid)
      .onSnapshot((doc) => {
        const data = doc.exists ? doc.data() : {};
        const followers = data.followers || [];
        const following = data.following || [];
        const elFollowers = document.getElementById("count-followers");
        const elFollowing = document.getElementById("count-following");
        if (elFollowers) elFollowers.innerText = followers.length;
        if (elFollowing) elFollowing.innerText = following.length;
      });
  } else {
    // --- 3. JIKA BELUM LOGIN (GUEST) ---
    if (myStatsContainer) myStatsContainer.style.display = "none";
    const elFollowers = document.getElementById("count-followers");
    const elFollowing = document.getElementById("count-following");
    if (elFollowers) elFollowers.innerText = "0";
    if (elFollowing) elFollowing.innerText = "0";
  }
});

// --- 4. RENDER FUNCTIONS ---
function renderIngredients() {
  const el = document.getElementById("ingredients-container");
  if (el)
    el.innerHTML = ingredients
      .map(
        (ing) => `
    <div class="ing-item" onclick="toggleIng('${ing.id}', this)">
        <img src="${ing.icon}" alt="${ing.name}" class="ing-png-icon">
        <span>${ing.name}</span>
    </div>`,
      )
      .join("");
}
// --- FUNGSI UPDATE NOMOR URUT LANGKAH OTOMATIS ---
window.updateStepNumbers = () => {
  // Cari semua kotak langkah yang masih ada di dalam form
  const stepCards = document.querySelectorAll("#steps-container .step-card");

  // Looping dan ganti nomornya satu per satu sesuai urutan barisnya
  stepCards.forEach((card, index) => {
    const numberSpan = card.querySelector(".step-number");
    if (numberSpan) {
      numberSpan.innerText = `Langkah ${index + 1}`;
    }
  });

  // Update memori counter agar tombol "+ Tambah Langkah" selanjutnya gak salah angka
  stepCounter = stepCards.length;
};
// --- FUNGSI DINAMIS LANGKAH RESEP ---
let stepCounter = 1;

window.addStepCard = () => {
  stepCounter++;
  const container = document.getElementById("steps-container");
  const newCard = document.createElement("div");
  newCard.className = "step-card";

  newCard.innerHTML = `
        <div class="step-header">
            <span class="step-number">Langkah ${stepCounter}</span>
            <button class="btn-remove-step" onclick="this.parentElement.parentElement.remove(); updateStepNumbers();">Hapus</button>
        </div>
        <textarea class="step-text form-input" rows="3" placeholder="Deskripsi langkah selanjutnya..."></textarea>
        <input type="file" class="step-img form-input" accept="image/*" style="font-size: 12px; padding: 8px;">
        
        <input type="hidden" class="old-step-img" value="">
    `;

  container.appendChild(newCard);

  // Otomatis geser layar ke card yang baru ditambah
  container.scrollLeft = container.scrollWidth;
};

// --- GANTI FUNGSI RENDER GRID ---
function renderGrid(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return; // Mencegah error jika wadah belum ada

  if (data.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#888;">Belum ada item.</p>`;
    return;
  }

  container.innerHTML = data
    .map((item) => {
      const isFav = favorites.some((f) => f.title === item.title);
      const safeDesc = (item.desc || "")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, "<br>")
        .replace(/\r/g, "");
      const authorName = item.authorName || "Admin";
      const favCount = item.favCount || 0;
      const docId = item.id || "undefined";
      const time = item.time || "- Menit";
      const servings = item.servings || "- Porsi";
      const authorUid = item.userUid || ""; // Pastikan kamu menyimpan UID pembuat resep

      // === LOGIKA NAMA AUTHOR DI CARD (TIDAK BISA DIKLIK) ===
      let authorHtml = "";

      if (authorName.toLowerCase() === "admin") {
        authorHtml = `<span style="color: var(--text-muted); display:flex; gap:5px; align-items:center;">
                    <i data-feather="shield" style="width:10px; flex-shrink: 0; margin-top: 1px;"></i> 
                    <span style="line-height: 1.4; word-wrap: break-word;">${authorName}</span>
                  </span>`;
      } else {
        authorHtml = `<span style="color: var(--text-muted); display:flex; gap:5px; align-items:center;">
                    <i data-feather="user" style="width:10px; flex-shrink: 0; margin-top: 1px;"></i> 
                    <span style="line-height: 1.4; word-wrap: break-word;">${authorName}</span>
                  </span>`;
      }

      return `
    <div class="card-item menu-card" onclick="openArticle('${item.title}', '${item.tag}', '${item.img}', '${safeDesc}', '${authorName}', '${time}', '${servings}')">
         
         <div class="fav-container">
             <button class="fav-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation(); toggleFavorite('${docId}', '${item.title}', '${item.tag}', '${item.img}', '${safeDesc}', '${authorName}', this)">
                 <i data-feather="heart"></i>
             </button>
             <span class="fav-count">${favCount}</span>
         </div>

         <img src="${item.img}" class="card-thumb" loading="lazy">
         <div class="card-info">
             <span class="card-tag">${item.tag}</span>
             <h4 class="menu-title">${item.title}</h4>
             
             <div class="card-author" style="font-size:10px; margin-top:5px;">
                ${authorHtml}
             </div>
             <div class="card-image" style="background-image: url('...'); position: relative;"></div>
        </div>
        <div class="card-rating-badge" data-title="${item.title}" style="display: none;"></div>
    </div>`;
    })
    .join("");
  if (typeof updateHomeRatings === "function") updateHomeRatings();
  if (typeof feather !== "undefined") feather.replace();
}

window.toggleFavorite = (id, title, tag, img, desc, authorName, btn) => {
  const idx = favorites.findIndex((f) => f.title === title);
  const countSpan = btn.parentElement.querySelector(".fav-count");
  const safeTitleId = title.replace(/[^a-zA-Z0-9]/g, "_");

  if (idx === -1) {
    // LAKUKAN LIKE
    favorites.push({ id, title, tag, img, desc, authorName });
    btn.classList.add("active");

    // Update angka di layar secepat kilat
    if (countSpan)
      countSpan.innerText = (parseInt(countSpan.innerText) || 0) + 1;

    // Kirim perintah +1 ke Firebase
    db.collection("counters")
      .doc(safeTitleId)
      .set(
        {
          favCount: firebase.firestore.FieldValue.increment(1),
        },
        { merge: true },
      )
      .catch(console.error);
  } else {
    // BATALKAN LIKE (UNLIKE)
    favorites.splice(idx, 1);
    btn.classList.remove("active");

    // Update angka di layar secepat kilat (minimal 0)
    if (countSpan)
      countSpan.innerText = Math.max(
        0,
        (parseInt(countSpan.innerText) || 0) - 1,
      );

    // Kirim perintah -1 ke Firebase
    db.collection("counters")
      .doc(safeTitleId)
      .set(
        {
          favCount: firebase.firestore.FieldValue.increment(-1),
        },
        { merge: true },
      )
      .catch(console.error);
  }

  // Refresh halaman favorit kalau lagi dibuka
  if (document.getElementById("favorit").classList.contains("active")) {
    renderGrid("favorit-container", favorites);
  }

  localStorage.setItem("myFavorites", JSON.stringify(favorites));
  if (typeof feather !== "undefined") feather.replace();
};

function renderMyRecipes() {
  const el = document.getElementById("my-recipes-scroll");
  if (!el) return;

  if (myRecipes.length === 0) {
    el.innerHTML = `<p style="font-size:12px; color:#888; padding:10px;">Belum ada resep.</p>`;
    return;
  }

  el.innerHTML = myRecipes
    .map((item, index) => {
      const safeDesc = (item.desc || "")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, "<br>")
        .replace(/\r/g, "");
      const authorName = item.authorName || "Saya";
      const time = item.time || "- Menit";
      const servings = item.servings || "- Porsi";

      return `
        <div class="mini-card" onclick="openArticle('${item.title}', '${item.tag}', '${item.img}', '${safeDesc}', '${authorName}', '${time}', '${servings}')">
            
            <div class="action-btns">
                <button class="edit-btn" onclick="event.stopPropagation(); openRecipeForm(${index})">
                    <i data-feather="edit-2" style="width:12px; height:12px;"></i>
                </button>
                <button class="del-btn" onclick="event.stopPropagation(); deleteMyRecipe('${item.id}')">
                    <i data-feather="trash-2" style="width:12px; height:12px;"></i>
                </button>
            </div>

            <img src="${item.img}" loading="lazy">
            <div class="mini-card-info">
                <span class="card-tag" style="font-size:8px;">${item.tag}</span>
                <h4 style="margin-top:4px;">${item.title}</h4>
            </div>
        </div>`;
    })
    .join("");

  if (typeof feather !== "undefined") feather.replace();
}

// --- 5. LOGIC SIMPAN RESEP (COMPRESS GAMBAR) ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement("canvas");
        // Resize ke lebar 500px (Biar ringan di database)
        const scaleFactor = 500 / img.width;
        elem.width = 500;
        elem.height = img.height * scaleFactor;
        const ctx = elem.getContext("2d");
        ctx.drawImage(img, 0, 0, elem.width, elem.height);
        // Kompres JPEG 70%
        resolve(elem.toDataURL("image/jpeg", 0.7));
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- 5. LOGIC SIMPAN RESEP (UPDATE UNTUK CAROUSEL LANGKAH) ---
window.saveMyRecipe = async () => {
  if (!currentUser) return alert("Login dulu!");

  // 1. Validasi Judul
  const titleInput = document.getElementById("rec-title");
  const titleError = document.getElementById("error-title");
  const title = titleInput.value.trim();

  if (!title) {
    titleInput.style.borderColor = "#dc3545";
    titleError.style.display = "block";
    titleInput.focus();
    return;
  }
  const tagInput = document.getElementById("rec-tag");
  const tagError = document.getElementById("error-tag");
  const tag = tagInput.value;

  // === SATPAM MOOD MASAKAN ===
  if (!tag) {
    tagInput.style.borderColor = "#dc3545";
    tagError.style.display = "block";
    tagInput.focus();
    showToast("Pilih Mood Masakannya dulu ya!");
    return;
  } else {
    tagInput.style.borderColor = "";
    tagError.style.display = "none";
  }
  const mainFileInput = document.getElementById("rec-file");
  const editId = document.getElementById("edit-id").value;

  const rawTime = document.getElementById("input-time").value;
  const rawServings = document.getElementById("input-servings").value;
  const time = rawTime ? `${rawTime} Menit` : "- Menit";
  const servings = rawServings ? `${rawServings} Porsi` : "- Porsi";

  // Tangkap Teks Bahan-bahan
  const ingredientsText = document
    .getElementById("rec-ingredients")
    .value.trim();

  if (!editId && mainFileInput.files.length === 0) {
    showToast("Wajib pilih foto sampul resep ya!");
    return;
  }

  // Ubah tombol jadi status loading
  const btn = document.querySelector("#recipe-form .find-btn");
  const originalText = btn.innerText;
  btn.innerText = "Menyimpan...";
  btn.disabled = true;

  try {
    let mainImageBase64 = null;
    if (mainFileInput.files.length > 0) {
      mainImageBase64 = await compressImage(mainFileInput.files[0]);
    }

    // === MESIN PENYEDOT DATA LANGKAH (CAROUSEL) ===
    const stepCards = document.querySelectorAll(".step-card");
    let stepsArray = [];
    let combinedDesc = ingredientsText + " ";

    for (let i = 0; i < stepCards.length; i++) {
      const card = stepCards[i];
      const textVal = card.querySelector(".step-text").value.trim();
      const stepImgInput = card.querySelector(".step-img");
      const oldStepImgInput = card.querySelector(".old-step-img"); // Tangkap foto lama

      // Default pakai foto lama (kalau ada)
      let stepImgBase64 = oldStepImgInput ? oldStepImgInput.value : null;

      // Tapi, KALAU user upload foto BARU, kompres dan timpa foto lamanya!
      if (stepImgInput.files.length > 0) {
        stepImgBase64 = await compressImage(stepImgInput.files[0]);
      }

      stepsArray.push({
        text: textVal,
        img: stepImgBase64,
      });

      combinedDesc += textVal + " ";
    }
    // ===============================================

    const recipeData = {
      userId: currentUser.uid,
      authorName: currentUser.displayName,
      authorPhoto: currentUser.photoURL,
      title: title,
      tag: tag,
      time: time,
      servings: servings,
      ingredients: ingredientsText, // Simpan format baru
      steps: stepsArray, // Simpan format baru
      desc: combinedDesc.trim(), // Simpan format lama (untuk Search Database)
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (mainImageBase64) {
      recipeData.img = mainImageBase64;
    }

    if (editId) {
      // UPDATE DATA LAMA
      await db.collection("recipes").doc(editId).update(recipeData);
      {
        showToast("Resep berhasil diperbarui!");
        closeRecipeForm();
      }
    } else {
      // SIMPAN DATA BARU
      recipeData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      if (!recipeData.img) throw new Error("Gambar utama wajib!");
      await db.collection("recipes").add(recipeData);
      {
        showToast("Resep berhasil dipublish!");
        closeRecipeForm();
      }
    }

    closeRecipeForm();
  } catch (error) {
    console.error(error);
    {
      showToast("Gagal: " + error.message);
      closeRecipeForm();
    }
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

// --- 6. NAVIGASI & UTILS ---
window.toggleIng = (id, el) => {
  if (selectedIngredients.has(id)) {
    selectedIngredients.delete(id);
    el.classList.remove("selected");
  } else {
    selectedIngredients.add(id);
    el.classList.add("selected");
  }
};

window.switchPage = (pageId) => {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  let idx = 0;
  if (pageId === "explore") idx = 1;
  if (pageId === "menu-page") idx = 2;
  if (pageId === "favorit") idx = 3;
  if (pageId === "profile-page") idx = 4;

  const items = document.querySelectorAll(".nav-item");
  if (items[idx]) items[idx].classList.add("active");

  const header = document.getElementById("main-header");
  header.style.display = pageId === "profile-page" ? "none" : "flex";

  if (pageId === "favorit") renderGrid("favorit-container", favorites);
  window.scrollTo(0, 0);
};

window.toggleNotifSheet = () => {
  const sheet = document.getElementById("notif-sheet");
  const backdrop = document.getElementById("sheet-backdrop");
  if (sheet.classList.contains("active")) {
    sheet.classList.remove("active");
    backdrop.classList.remove("active");
    setTimeout(() => (backdrop.style.display = "none"), 300);
  } else {
    backdrop.style.display = "block";
    backdrop.offsetHeight;
    backdrop.classList.add("active");
    sheet.classList.add("active");
  }
};

window.toggleTheme = () => {
  const body = document.body;
  const isDark = body.getAttribute("data-theme") === "dark";
  const btn = document.getElementById("theme-btn");

  if (isDark) {
    // Kembali ke mode terang
    body.removeAttribute("data-theme");
    if (btn) btn.innerHTML = `<i data-feather="moon"></i> Mode Gelap`;
    // Simpan ke memori
    localStorage.setItem("appTheme", "light");
  } else {
    // Pindah ke mode gelap
    body.setAttribute("data-theme", "dark");
    if (btn) btn.innerHTML = `<i data-feather="sun"></i> Mode Terang`;
    // Simpan ke memori
    localStorage.setItem("appTheme", "dark");
  }

  if (typeof feather !== "undefined") feather.replace();
};

window.resetData = () => {
  openPopup("reset");
};

window.confirmReset = () => {
  location.reload();
};

// --- 7. MODALS & POPUPS ---

// --- FUNGSI OPEN ARTICLE (YANG ERROR SUDAH DIPERBAIKI) ---
window.openRecipeForm = (index = -1) => {
  if (!currentUser) {
    openPopup("login dulu");
    return;
  }
  const form = document.getElementById("recipe-form");

  // === RESET FORM (VERSI BARU) ===
  document.getElementById("rec-title").value = "";
  document.getElementById("rec-tag").value = "";
  document.getElementById("edit-index").value = index;
  document.getElementById("edit-id").value = "";

  const fileInput = document.getElementById("rec-file");
  if (fileInput) fileInput.value = "";
  const fileStatus = document.getElementById("rec-file-status");
  if (fileStatus) fileStatus.innerHTML = "";

  // Reset Input Bahan
  const ingInput = document.getElementById("rec-ingredients");
  if (ingInput) ingInput.value = "";

  // Reset Langkah-langkah kembali ke 1 card default
  const stepsContainer = document.getElementById("steps-container");
  if (stepsContainer) {
    stepCounter = 1; // Kembalikan counter ke 1
    stepsContainer.innerHTML = `
        <div class="step-card">
            <div class="step-header">
                <span class="step-number">Langkah 1</span>
            </div>
            <textarea class="step-text form-input" rows="3" placeholder="Tumis bawang putih hingga harum..."></textarea>
            <input type="file" class="step-img form-input" accept="image/*" style="font-size: 12px; padding: 8px;">
        </div>
      `;
  }
  // ===============================

  // JUDUL MODAL
  const titleEl = form.querySelector("h3");
  if (titleEl)
    titleEl.innerText = index >= 0 ? "Edit Resep" : "Buat Resep Baru";

  // JIKA MODE EDIT (Index >= 0)
  if (index >= 0 && myRecipes[index]) {
    const item = myRecipes[index];
    document.getElementById("rec-title").value = item.title || "";
    document.getElementById("rec-tag").value = item.tag || "";
    document.getElementById("edit-id").value = item.id;
    if (fileStatus && item.img) {
      fileStatus.innerHTML = `<p style="font-size:11px; color:#28a745; margin-top:-12px; margin-bottom:15px; margin-left:4px; font-weight:bold;">✓ Foto tersimpan (Pilih file baru untuk mengganti)</p>`;
    }

    const ingInput = document.getElementById("rec-ingredients");
    const stepsContainer = document.getElementById("steps-container");

    // JIKA RESEP PUNYA FORMAT BARU (Bahan & Langkah)
    if (item.ingredients && item.steps) {
      if (ingInput) ingInput.value = item.ingredients;

      // Bongkar langkah-langkahnya
      if (stepsContainer) {
        stepsContainer.innerHTML = ""; // Kosongkan default-nya
        stepCounter = 0; // Reset counter

        item.steps.forEach((step, i) => {
          stepCounter++;
          const newCard = document.createElement("div");
          newCard.className = "step-card";
          newCard.innerHTML = `
                    <div class="step-header">
                        <span class="step-number">Langkah ${stepCounter}</span>
                        ${stepCounter > 1 ? `<button class="btn-remove-step" onclick="this.parentElement.parentElement.remove(); updateStepNumbers();">Hapus</button>` : ""}
                    </div>
                    <textarea class="step-text form-input" rows="3" placeholder="Deskripsi...">${step.text || ""}</textarea>
                    
                    <input type="file" class="step-img form-input" accept="image/*" style="font-size: 12px; padding: 8px;">
                    
                    <input type="hidden" class="old-step-img" value="${step.img || ""}">
                    
                    ${step.img ? `<p style="font-size:10px; color:#28a745; margin-top:-12px; font-weight:bold;">✓ Foto tersimpan (Pilih file baru untuk mengganti)</p>` : ""}
                `;
          stepsContainer.appendChild(newCard);
        });
      }
    } else {
      // JIKA FORMAT LAMA (Cuma Desc Biasa)
      if (ingInput) ingInput.value = item.desc || "";
      // Form langkah biarkan kosong 1 default
    }
  }

  form.style.display = "flex";
  history.pushState({ modal: "form" }, null, "");
};
// --- FUNGSI MEMBUKA HALAMAN DETAIL RESEP (SUDAH DIPERBAIKI) ---
window.openArticle = (
  title,
  tag,
  img,
  desc = null,
  author = "Admin",
  time = "- Menit",
  servings = "- Porsi",
) => {
  document.getElementById("detail-title").innerText = title;
  document.getElementById("detail-category").innerText = tag;
  document.getElementById("detail-image").style.backgroundImage =
    `url('${img}')`;
  document.getElementById("detail-time").innerText = time;
  document.getElementById("detail-servings").innerText = servings;

  // === TRIK CERDAS: CARI DATA ASLI DARI MEMORI BERDASARKAN JUDUL ===
  const staticMenus = typeof menus !== "undefined" ? menus : [];

  // PERBAIKAN 1: Tambahkan data articles (Explore) agar tidak terlewat
  const staticArticles = typeof articles !== "undefined" ? articles : [];

  const cloudMenus =
    typeof allCloudRecipes !== "undefined" ? allCloudRecipes : [];

  // Gabungkan semua data dari berbagai sumber
  const allItems = [...staticMenus, ...staticArticles, ...cloudMenus];
  const item = allItems.find((i) => i.title === title);

  const authorContainer = document.getElementById("detail-author-container");
  if (authorContainer) {
    // === INI BARIS YANG KETINGGALAN TADI ===
    const authorName = item && item.authorName ? item.authorName : author;
    // =======================================

    // Trik tahan banting: Cari 'userId', kalau nggak ada cari 'authorUid'
    const authorUid = item ? item.userId || item.authorUid : "";
    const authorPhoto = item && item.authorPhoto ? item.authorPhoto : "";

    if (authorName.toLowerCase() === "admin") {
      // 1. Kalau Admin: Abu-abu & Gabisa diklik
      authorContainer.innerHTML = `<span style="color: var(--text-muted); cursor: default; font-weight: bold;">
                <i data-feather="shield" style="width:12px;"></i> ${authorName}
            </span>`;
    } else if (authorUid !== "") {
      // 2. Kalau Punya Akun Firebase: MERAH & BISA DIKLIK!
      authorContainer.innerHTML = `<span style="color: var(--primary, #ff6b6b); font-weight: bold; cursor: pointer; text-decoration: underline;" 
                onclick="openPublicProfile('${authorUid}', '${authorName}', '${authorPhoto}')">
                <i data-feather="user" style="width:12px;"></i> ${authorName}
            </span>`;
    } else {
      // 3. Fallback (Resep statis dari database.js yang nggak punya akun): Abu-abu
      authorContainer.innerHTML = `<span style="color: var(--text-muted); cursor: default;">
                <i data-feather="user" style="width:12px;"></i> ${authorName}
            </span>`;
    }

    // Render ulang icon feather
    if (typeof feather !== "undefined") feather.replace();
  }

  let htmlContent = "";

  // JIKA RESEP INI PAKAI FORMAT BARU (Punya Bahan & Langkah)
  if (item && item.ingredients && item.steps) {
    // 1. Render Bahan-bahan
    const bahanArray = item.ingredients.split("\n");
    let bahanHTML = `<h4 style="margin-bottom: 10px;">Bahan-bahan:</h4><ul style="padding-left: 20px; color: var(--text-muted); margin-bottom: 25px;">`;
    bahanArray.forEach((bahan) => {
      if (bahan.trim() !== "")
        bahanHTML += `<li style="margin-bottom: 5px;">${bahan}</li>`;
    });
    bahanHTML += `</ul>`;

    // 2. Render Langkah-langkah dengan Desain Nomor Keren
    let langkahHTML = `<h4 style="margin-bottom: 15px;">Cara Membuat:</h4>`;
    item.steps.forEach((step, index) => {
      langkahHTML += `
          <div style="display: flex; gap: 15px; margin-bottom: 20px;">
              <div style="width: 28px; height: 28px; background: var(--primary, #ff6b6b); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; font-size: 14px;">
                  ${index + 1}
              </div>
              <div style="flex: 1;">
                  <p style="margin: 0 0 10px 0; line-height: 1.6; color: var(--text);">${step.text}</p>
                  ${step.img ? `<img src="${step.img}" style="width: 100%; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border, #ddd);">` : ""}
              </div>
          </div>`;
    });

    htmlContent = bahanHTML + langkahHTML;
  } else {
    // JIKA RESEP FORMAT LAMA (Cuma teks desc biasa)
    htmlContent = desc || "Belum ada deskripsi.";
  }

  // Tampilkan ke layar
  document.getElementById("detail-desc").innerHTML = htmlContent;

  // Trigger fitur sosial
  const safeTitleId = title.replace(/[^a-zA-Z0-9]/g, "_");
  if (typeof renderReactions === "function") renderReactions(safeTitleId);
  if (typeof renderRatings === "function") renderRatings(safeTitleId);
  if (typeof loadComments === "function") loadComments(safeTitleId);

  // Tampilkan Pop-up
  document.getElementById("article-view").classList.add("active");
  history.pushState({ modal: "article" }, null, "");

  if (typeof feather !== "undefined") feather.replace();
};
// ==========================================
// --- FITUR RATING BINTANG (FIREBASE) ---
// ==========================================

let globalRatings = {};

// 1. Dengar data Rating dari Firebase secara realtime
db.collection("ratings").onSnapshot((snapshot) => {
  globalRatings = {};
  snapshot.forEach((doc) => {
    globalRatings[doc.id] = doc.data();
  });

  // A. Auto-update UI kalau modal artikel lagi kebuka
  const articleView = document.getElementById("article-view");
  if (articleView && articleView.classList.contains("active")) {
    const title = document.getElementById("detail-title").innerText;
    const safeTitleId = title.replace(/[^a-zA-Z0-9]/g, "_");
    if (typeof renderRatings === "function") renderRatings(safeTitleId);
  }

  // B. Auto-update SEMUA badge bintang di halaman depan
  if (typeof updateHomeRatings === "function") updateHomeRatings();
});

// FUNGSI BARU: Menyuntikkan bintang ke kartu beranda
window.updateHomeRatings = () => {
  // Cari semua elemen badge yang tadi kita pasang di HTML renderGrid
  const ratingBadges = document.querySelectorAll(".card-rating-badge");

  ratingBadges.forEach((badge) => {
    const title = badge.getAttribute("data-title");
    if (!title) return;

    const safeTitleId = title.replace(/[^a-zA-Z0-9]/g, "_");
    const data = globalRatings[safeTitleId] || {};
    const userIds = Object.keys(data);

    // Kalau ada yang ngasih rating, hitung rata-ratanya lalu munculkan!
    if (userIds.length > 0) {
      let total = 0;
      userIds.forEach((id) => (total += data[id]));
      const avg = (total / userIds.length).toFixed(1);

      badge.innerHTML = `⭐ ${avg}`;
      badge.style.display = "flex"; // Munculkan badge-nya
    } else {
      badge.style.display = "none"; // Sembunyikan kalau resep belum ada rating
    }
  });
};

// 2. Fungsi menggambar Bintang & Menghitung Rata-rata
window.renderRatings = (safeTitleId) => {
  const container = document.getElementById("detail-ratings");
  if (!container) return;

  const data = globalRatings[safeTitleId] || {};
  const userIds = Object.keys(data); // Daftar akun yang udah ngasih rating
  const totalUsers = userIds.length;

  let totalStars = 0;
  let currentUserRating = 0;
  const uid = currentUser ? currentUser.uid : null;

  // Hitung total nilai semua orang
  userIds.forEach((id) => {
    totalStars += data[id];
    // Cek rating khusus milik user yang lagi login
    if (id === uid) currentUserRating = data[id];
  });

  // Rumus Rata-rata (Dibulatkan 1 angka di belakang koma)
  const avgRating = totalUsers > 0 ? (totalStars / totalUsers).toFixed(1) : 0;

  // Gambar 5 Bintang yang bisa diklik
  let starsHtml = `<div class="stars-interactive">`;
  for (let i = 1; i <= 5; i++) {
    const isActive = i <= currentUserRating ? "active" : "";
    starsHtml += `<button class="star-btn ${isActive}" onclick="rateRecipe('${safeTitleId}', ${i})">★</button>`;
  }
  starsHtml += `</div>`;

  // Teks Rata-rata
  let textHtml = `<span class="rating-text">`;
  if (totalUsers > 0) {
    textHtml += `<strong style="color:var(--text); font-size:15px;">${avgRating}</strong> dari ${totalUsers} ulasan`;
  } else {
    textHtml += `Belum ada ulasan.`;
  }
  textHtml += `</span>`;

  container.innerHTML = starsHtml + textHtml;
};

// 3. Fungsi saat user ngeklik Bintang
window.rateRecipe = (safeTitleId, stars) => {
  if (!currentUser) {
    openPopup("Login dengan Google dulu untuk memberi nilai!");
    return;
  }

  const docRef = db.collection("ratings").doc(safeTitleId);

  // Simpan/Timpa nilai pakai ID user sebagai kuncinya
  docRef.set(
    {
      [currentUser.uid]: stars,
    },
    { merge: true },
  );
};
window.closeArticle = () => history.back();
window.closeRecipeForm = () => history.back();

window.openPopup = (type) => {
  let title = "",
    content = "",
    icon = "info";
  if (type === "bantuan") {
    title = "Bantuan & FAQ";
    icon = "help-circle";
    content = `
        <div style="position: relative; margin-bottom: 15px;">
            <i data-feather="search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-muted);"></i>
            <input type="text" id="faq-search" onkeyup="searchFaq()" placeholder="Cari pertanyaan..." 
                   style="width: 100%; padding: 12px 12px 12px 40px; border-radius: 12px; border: 1px solid var(--border, #ddd); background: var(--bg); color: var(--text); box-sizing: border-box; outline: none;">
        </div>

        <div id="faq-list" style="margin-bottom:20px; max-height:320px; overflow-y:auto;">

            <div class="faq-item" onclick="this.classList.toggle('active')">
                <div class="faq-question">Apa itu Masakin? <i data-feather="chevron-down" style="float:right;"></i></div>
                <div class="faq-answer">
                    Masakin adalah aplikasi pencarian resep berbasis bahan. Kamu cukup pilih bahan yang tersedia di dapur, lalu aplikasi akan membantu menampilkan rekomendasi resep yang bisa kamu masak.
                </div>
            </div>

            <div class="faq-item" onclick="this.classList.toggle('active')">
                <div class="faq-question">Bagaimana cara mencari resep? <i data-feather="chevron-down" style="float:right;"></i></div>
                <div class="faq-answer">
                    Masuk ke halaman Home, pilih atau centang bahan-bahan yang kamu miliki, lalu tekan tombol <b>"Cari Resep"</b>. Sistem akan menampilkan resep yang sesuai dengan kombinasi bahan tersebut.
                </div>
            </div>

            <div class="faq-item" onclick="this.classList.toggle('active')">
                <div class="faq-question">Kenapa hasil resep tidak muncul? <i data-feather="chevron-down" style="float:right;"></i></div>
                <div class="faq-answer">
                    Jika tidak ada resep yang muncul, kemungkinan kombinasi bahan terlalu spesifik atau belum tersedia di database. Coba kurangi jumlah bahan yang dipilih atau gunakan bahan yang lebih umum.
                </div>
            </div>

            <div class="faq-item" onclick="this.classList.toggle('active')">
                <div class="faq-question">Apakah Masakin gratis? <i data-feather="chevron-down" style="float:right;"></i></div>
                <div class="faq-answer">
                    Ya, Masakin dapat digunakan secara gratis. Jika kamu merasa aplikasi ini bermanfaat, kamu bisa mendukung pengembang melalui dukungan sukarela.
                </div>
            </div>

            <div class="faq-item" onclick="this.classList.toggle('active')">
                <div class="faq-question">Apakah saya perlu login untuk menggunakan aplikasi? <i data-feather="chevron-down" style="float:right;"></i></div>
                <div class="faq-answer">
                    Login bersifat opsional, digunakan untuk personalisasi seperti menampilkan nama dan foto profil, mengunggah dan menyimpan resep sendiri. Kamu tetap bisa menggunakan fitur utama tanpa menyimpan data pribadi di server kami.
                </div>
            </div>

            <div class="faq-item" onclick="this.classList.toggle('active')">
                <div class="faq-question">Apakah data saya aman? <i data-feather="chevron-down" style="float:right;"></i></div>
                <div class="faq-answer">
                    Masakin tidak menyimpan data sensitif pengguna di server eksternal. Informasi personalisasi hanya digunakan secara lokal di perangkat Anda.
                </div>
            </div>

            <div class="faq-item" onclick="this.classList.toggle('active')">
                <div class="faq-question">Bagaimana cara melaporkan bug atau memberi saran? <i data-feather="chevron-down" style="float:right;"></i></div>
                <div class="faq-answer">
                    Kamu bisa menghubungi kami melalui tombol dukungan di bawah. Sertakan detail masalah atau saran agar kami dapat menindaklanjuti dengan lebih cepat.
                </div>
            </div>

        </div>

        <button class="find-btn" onclick="window.location.href='mailto:muhammadazizy48@gmail.com'" style="display:flex; justify-content:center; align-items:center; gap:10px;">
            <i data-feather="mail"></i> Hubungi Dukungan
        </button>
    `;
  } else if (type === "privasi") {
    title = "Kebijakan Privasi";
    icon = "shield";
    content = `
    <div class="privacy-text" style="height:300px; overflow-y:auto; background:var(--bg); padding:15px; border-radius:12px; font-size:12px; line-height:1.6; margin-bottom:10px;">
        
        <b>1. Pendahuluan</b><br>
        Kebijakan Privasi ini menjelaskan bagaimana Aplikasi <b>Masakin</b> mengelola, menggunakan, dan melindungi informasi pengguna. Dengan menggunakan aplikasi ini, Anda dianggap telah membaca dan menyetujui kebijakan yang berlaku.<br><br>
        
        <b>2. Informasi yang Kami Akses</b><br>
        Aplikasi ini dapat mengakses informasi akun Google Anda seperti <b>nama dan foto profil</b> semata-mata untuk keperluan personalisasi tampilan di dalam aplikasi. Informasi tersebut hanya digunakan secara lokal pada perangkat Anda dan tidak dikirimkan atau disimpan di server eksternal kami.<br><br>
        
        <b>3. Data yang Tidak Kami Kumpulkan</b><br>
        Kami tidak mengumpulkan, menyimpan, atau membagikan:
        <ul style="margin:5px 0 5px 15px; padding:0;">
            <li>Data pribadi sensitif</li>
            <li>Riwayat aktivitas di luar aplikasi</li>
            <li>Informasi lokasi pengguna</li>
            <li>Kredensial akun</li>
        </ul><br>
        
        <b>4. Penyimpanan Data</b><br>
        Data yang ditampilkan dalam aplikasi (seperti preferensi atau pengaturan) disimpan secara lokal di perangkat pengguna dan dapat dihapus kapan saja dengan menghapus data aplikasi.<br><br>
        
        <b>5. Keamanan</b><br>
        Kami berkomitmen menjaga keamanan aplikasi dengan praktik terbaik pengembangan perangkat lunak. Namun, pengguna tetap disarankan untuk menjaga keamanan akun Google masing-masing.<br><br>
        
        <b>6. Layanan Pihak Ketiga</b><br>
        Aplikasi ini dapat menggunakan layanan pihak ketiga seperti Google untuk autentikasi dan menyimpan database menu. Kebijakan privasi layanan tersebut tunduk pada kebijakan resmi dari penyedia layanan terkait.<br><br>
        
        <b>7. Perubahan Kebijakan</b><br>
        Kebijakan Privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan ditampilkan melalui pembaruan tanggal pada bagian akhir dokumen ini.<br><br>
        
        <b>8. Kontak</b><br>
        Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi:<br>
        Email: muhammadazizy48@gmail.com
        
    </div>
    <p style="text-align:right; font-size:10px; color:var(--text-muted);">Diperbarui: 19 Februari 2026</p>
    <button class="find-btn" onclick="closePopup()">Saya Mengerti</button>
    `;
  } else if (type === "tentang") {
    title = "Tentang Aplikasi";
    content = `
<div class="logo-tentang">
    
    <img src="icon/logo-tentang-terang.png"
         class="logo-light"
         alt="Logo Masakin">

    <img src="icon/logo-tentang-gelap.png"
         class="logo-dark"
         alt="Logo Masakin">
                <p style="margin:5px 0 0; color:var(--text-muted); font-size:14px;">Versi 1.0.0</p>
                <p style="margin:0; font-size:12px; color:var(--text-muted);">Update: 19 Feb 2026</p>
            </div><br>
            
            <div style="background:var(--bg); padding:15px; border-radius:12px; font-size:13px;">
                <b>Yang Baru:</b>
                <ul style="padding-left:20px; margin:10px 0;">
                    <li>Tampilan baru lebih fresh</li>
                    <li>Fitur Favorit Resep</li>
                    <li>Mode Gelap & Terang</li>
                </ul>
            </div>

            <button class="find-btn" style="background:var(--bg); color:var(--text); margin-top:15px; border:1px solid var(--border);" onclick="location.reload()">
                <i data-feather="refresh-cw"></i> Cek Pembaruan
            </button>
        `;
  } else if (type === "Belum ada yang dipilih") {
    title = "Belum ada yang dipilih";
    icon = "info"; // Icon peringatan
    content = `
            <p style="text-align:center; margin-bottom:15px;">Pilih minimal 1 bahan di dapurmu dulu ya!</p>
            <button class="find-btn" onclick="closePopup()" style="width:100%;">Oke, Siap!</button>
        `;
  } else if (type === "login dulu") {
    title = "Tidak bisa tambah resep";
    icon = "info"; // Icon peringatan
    content = `
            <p style="text-align:center; margin-bottom:15px;">Silakan login terlebih dahulu.</p>
            <button class="find-btn" onclick="closePopup()" style="width:100%;">Oke</button>
        `;
  } else if (type === "reset") {
    title = "Reset Aplikasi";
    icon = "alert-triangle"; // Icon peringatan
    content = `
            <p style="text-align:center; margin-bottom:15px;">Memulai ulang aplikasi,<br>tidak akan menghapus akun ataupun resepmu.</p>
            <button class="find-btn" onclick="confirmReset()" style="width:100%;">Reset</button>
        `;
  }
  document.getElementById("popup-title").innerText = title;
  document.getElementById("popup-icon").setAttribute("data-feather", icon);
  document.getElementById("popup-body").innerHTML = content;
  document.getElementById("info-popup").classList.add("active");
  if (typeof feather !== "undefined") feather.replace();
  history.pushState({ modal: "popup" }, null, "");
};
window.closePopup = () => history.back();

// Listener Back Button Bawaan HP / Browser
window.addEventListener("popstate", () => {
  // === TAMBAHKAN ID PROFIL DAN MODAL FOLLOW KE DALAM DAFTAR INI ===
  const ids = [
    "recipe-form",
    "article-view",
    "info-popup",
    "public-profile-page",
    "follow-list-modal",
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      if (el.style.display === "flex") el.style.display = "none";
      el.classList.remove("active"); // Ini yang membuat animasinya turun/menghilang
    }
  });
});

// UI Auth Update
function updateUI(user) {
  const googleIcon =
    "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg";
  const btn = document.getElementById("auth-btn-container");
  if (!btn) return;

  if (user) {
    document.getElementById("header-username").innerText =
      user.displayName.split(" ")[0];
    document.getElementById("header-avatar").innerHTML =
      `<img src="${user.photoURL}">`;
    document.getElementById("profile-name-large").innerText = user.displayName;
    document.getElementById("profile-email-large").innerText = user.email;
    document.getElementById("profile-avatar-large").innerHTML =
      `<img src="${user.photoURL}">`;
    btn.innerHTML = `<button class="login-google-btn" style="color:red" onclick="auth.signOut()">Logout</button>`;
  } else {
    document.getElementById("header-username").innerText = "Guest";
    document.getElementById("header-avatar").innerHTML = "G";
    document.getElementById("profile-name-large").innerText = "Guest User";
    document.getElementById("profile-email-large").innerText =
      "Masuk untuk dapat mengunggah resep";
    document.getElementById("profile-avatar-large").innerHTML = "G";
    btn.innerHTML = `<button class="login-google-btn" onclick="auth.signInWithPopup(provider)"><img src="${googleIcon}" width="18"> Masuk dengan Google</button>`;
  }
}

// --- FITUR HAPUS RESEPKU ---
// --- 1. FUNGSI MUNCULIN POP-UP KONFIRMASI HAPUS ---
window.deleteMyRecipe = (docId) => {
  if (!docId || docId === "undefined") {
    showToast("Data error!");
    return;
  }

  // Gunakan wadah pop-up bawaan yang sudah kamu buat
  document.getElementById("popup-title").innerText = "Hapus Resep";
  document.getElementById("popup-icon").setAttribute("data-feather", "trash-2");

  // Desain dua tombol: Batal dan Hapus (Warna Merah)
  document.getElementById("popup-body").innerHTML = `
    <p style="text-align:center; margin-bottom:20px;">Yakin ingin menghapus resep ini secara permanen?</p>
    <div style="display: flex; gap: 10px;">
        <button class="find-btn" onclick="closePopup()" style="flex: 1; background: var(--bg); color: var(--text); border: 1px solid var(--border);">
            Batal
        </button>
        <button class="find-btn" onclick="executeDelete('${docId}')" style="flex: 1; background: #dc3545; color: white; border: none;">
            Hapus
        </button>
    </div>
  `;

  // Munculkan Pop-up ke layar
  document.getElementById("info-popup").classList.add("active");
  if (typeof feather !== "undefined") feather.replace();
  history.pushState({ modal: "popup" }, null, "");
};

// --- 2. FUNGSI EKSEKUSI HAPUS (DIPANGGIL DARI TOMBOL MERAH) ---
window.executeDelete = async (docId) => {
  // Tutup pop-up konfirmasinya dulu
  closePopup();

  try {
    await db.collection("recipes").doc(docId).delete();
    showToast("Resep berhasil dihapus!");
  } catch (error) {
    console.error("Gagal hapus:", error);
    showToast("Gagal menghapus: " + error.message);
  }
};

// --- FITUR SEARCH UNIVERSAL (Bisa dipakai di Menu, Explore, Favorit) ---
window.searchGrid = (inputId, containerId) => {
  const input = document.getElementById(inputId);
  if (!input) return;

  const filter = input.value.toLowerCase();
  const container = document.getElementById(containerId);
  if (!container) return;

  // Cari semua kartu di dalam container tersebut
  const cards = container.querySelectorAll(".card-item");

  cards.forEach((card) => {
    // Cari elemen H4 (Judulnya)
    const titleEl = card.querySelector("h4");
    if (titleEl) {
      const titleText = titleEl.innerText.toLowerCase();
      if (titleText.indexOf(filter) > -1) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    }
  });
};

// --- FITUR SHARE NATIVE ---
window.shareArticle = () => {
  // Ambil judul resep yang sedang dibuka
  const title = document.getElementById("detail-title").innerText;
  const url = window.location.href; // Link website kamu

  // Teks pesan yang akan dikirim
  const shareText = `Coba deh resep "${title}" ini! Cari resep praktis lainnya di aplikasi Masakin?`;

  // Cek apakah HP/Browser mendukung fitur Share Native
  if (navigator.share) {
    navigator
      .share({
        title: title,
        text: shareText,
        url: url,
      })
      .then(() => {
        console.log("Berhasil membagikan resep!");
      })
      .catch((error) => {
        console.log("Batal membagikan:", error);
      });
  } else {
    // Fallback untuk browser laptop/jadul yang gak support
    alert(`Bagikan resep ini ke temanmu!\n\n${shareText}\n${url}`);
  }
};
// --- FITUR CARI RESEP BERDASARKAN BAHAN (HOME) ---

// --- FITUR CARI RESEP BERDASARKAN BAHAN (HOME) ---
window.findRecipes = () => {
  // 1. Cek apakah ada bahan yang dicentang
  if (selectedIngredients.size === 0) {
    openPopup("Belum ada yang dipilih");
    return;
  }

  // === PERBAIKAN 1: Gunakan allCloudRecipes agar SELURUH resep Firebase ikut dicari ===
  const staticMenus = typeof menus !== "undefined" ? menus : [];
  const cloudMenus =
    typeof allCloudRecipes !== "undefined" ? allCloudRecipes : [];
  const allRecipes = [...staticMenus, ...cloudMenus];

  // 3. Ubah daftar bahan yang dicentang menjadi Array
  const selectedArr = Array.from(selectedIngredients);

  // 4. Deteksi & Filter Resep Otomatis
  const matchedRecipes = allRecipes.filter((recipe) => {
    // === PERBAIKAN 2: Gabungkan Judul, Deskripsi, DAN Bahan-bahan ===
    // Pakai fallback ("") biar gak error kalau ada data lama yang kosong
    const safeTitle = recipe.title || "";
    const safeDesc = recipe.desc || "";
    const safeIngredients = recipe.ingredients || "";

    const textToSearch = (
      safeTitle +
      " " +
      safeDesc +
      " " +
      safeIngredients
    ).toLowerCase();

    // Cek kecocokan
    return selectedArr.some((bahan) =>
      textToSearch.includes(bahan.toLowerCase()),
    );
  });

  // 5. Tampilkan Hasilnya ke Layar
  const resultSection = document.getElementById("recipe-results");
  const container = document.getElementById("results-container");

  container.classList.add("masonry-grid");
  resultSection.style.display = "block";

  if (matchedRecipes.length > 0) {
    renderGrid("results-container", matchedRecipes);
  } else {
    container.innerHTML = `
      <p style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); font-size:13px; margin-top:10px;">
        Yah, belum ada resep yang cocok dengan bahan tersebut. Coba pilih bahan lain atau kurangi pilihannya!
      </p>
    `;
  }

  // 6. Gulir (scroll) layar otomatis ke bawah
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
};
// ==========================================
// --- FITUR REACTION EMOTICON (FIREBASE) ---
// ==========================================

let globalReactions = {};

// 1. Dengar data dari Firebase secara realtime
db.collection("reactions").onSnapshot((snapshot) => {
  globalReactions = {};
  snapshot.forEach((doc) => {
    globalReactions[doc.id] = doc.data();
  });

  // Kalau halaman detail resep lagi dibuka, langsung update UI-nya!
  const articleView = document.getElementById("article-view");
  if (articleView && articleView.classList.contains("active")) {
    const title = document.getElementById("detail-title").innerText;
    const safeTitleId = title.replace(/[^a-zA-Z0-9]/g, "_");
    renderReactions(safeTitleId);
  }
});

// 2. Fungsi untuk menggambar tombol emot ke layar
window.renderReactions = (safeTitleId) => {
  const container = document.getElementById("detail-reactions");
  if (!container) return;

  // Ambil data emot untuk resep ini (kalau belum ada, anggap kosong)
  const data = globalReactions[safeTitleId] || {};

  // Siapkan array user yang ngeklik tiap emot
  const likes = data.like || [];
  const drools = data.drool || [];
  const loves = data.love || [];

  // Cek apakah user yang lagi login udah ngeklik?
  const uid = currentUser ? currentUser.uid : null;
  const isLikeActive = uid && likes.includes(uid) ? "active" : "";
  const isDroolActive = uid && drools.includes(uid) ? "active" : "";
  const isLoveActive = uid && loves.includes(uid) ? "active" : "";

  container.innerHTML = `
        <button class="reaction-btn ${isLikeActive}" onclick="toggleReaction('${safeTitleId}', 'like')">
            👍 <span class="count">${likes.length > 0 ? likes.length : ""}</span>
        </button>
        <button class="reaction-btn ${isDroolActive}" onclick="toggleReaction('${safeTitleId}', 'drool')">
            🤤 <span class="count">${drools.length > 0 ? drools.length : ""}</span>
        </button>
        <button class="reaction-btn ${isLoveActive}" onclick="toggleReaction('${safeTitleId}', 'love')">
            😍 <span class="count">${loves.length > 0 ? loves.length : ""}</span>
        </button>
    `;
};

// 3. Fungsi saat user ngeklik tombol emot
window.toggleReaction = (safeTitleId, type) => {
  if (!currentUser) {
    openPopup("login dulu");
    return;
  }

  const docRef = db.collection("reactions").doc(safeTitleId);
  const uid = currentUser.uid;
  const data = globalReactions[safeTitleId] || {};
  const reactedUsers = data[type] || [];

  // Kalau user sudah pernah ngeklik, HAPUS (Unlike). Kalau belum, TAMBAHKAN (Like).
  if (reactedUsers.includes(uid)) {
    docRef.set(
      {
        [type]: firebase.firestore.FieldValue.arrayRemove(uid),
      },
      { merge: true },
    );
  } else {
    docRef.set(
      {
        [type]: firebase.firestore.FieldValue.arrayUnion(uid),
      },
      { merge: true },
    );
  }
};

// --- FITUR NOTIFIKASI GLOBAL (FIREBASE) ---

// 1. Ambil memori notif apa saja yang sudah dihapus oleh user ini
let deletedNotifs = JSON.parse(localStorage.getItem("deletedNotifs")) || [];
let allNotifs = [];

// 2. Dengarkan data dari koleksi "notifications" di Firebase secara realtime
db.collection("notifications")
  .orderBy("createdAt", "desc")
  .onSnapshot((snapshot) => {
    allNotifs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      data.id = doc.id;
      allNotifs.push(data);
    });
    renderNotifications();
  });

// 3. Render Notifikasi ke Layar
function renderNotifications() {
  const container = document.getElementById("notif-list-container");
  const dot = document.querySelector(".notif-dot"); // Titik merah di icon lonceng
  if (!container) return;

  // Filter: Hanya tampilkan notif yang ID-nya belum ada di daftar 'deletedNotifs'
  const visibleNotifs = allNotifs.filter((n) => !deletedNotifs.includes(n.id));

  if (visibleNotifs.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#888; font-size:12px; margin-top:20px;">Belum ada notifikasi baru.</p>`;
    if (dot) dot.style.display = "none"; // Sembunyikan titik merah
    return;
  }

  if (dot) dot.style.display = "block"; // Munculkan titik merah karena ada notif

  container.innerHTML = visibleNotifs
    .map(
      (n) => `
        <div class="notif-item unread">
            <div class="notif-icon bg-blue" style="background:var(--primary);"><i data-feather="${n.icon || "bell"}"></i></div>
            <div style="flex:1;">
                <b style="font-size:13px;">${n.title}</b>
                <p style="margin:2px 0 0; font-size:11px; color:var(--text-muted);">${n.desc}</p>
            </div>
            <button class="del-notif-btn" onclick="deleteNotif('${n.id}')">
                <i data-feather="x" style="width:16px; height:16px;"></i>
            </button>
        </div>
    `,
    )
    .join("");

  if (typeof feather !== "undefined") feather.replace();
}

// 4. Fungsi Hapus Notifikasi (Hanya di HP user tersebut)
window.deleteNotif = (notifId) => {
  // Masukkan ID ke daftar hitam
  deletedNotifs.push(notifId);

  // Simpan ke memori HP
  localStorage.setItem("deletedNotifs", JSON.stringify(deletedNotifs));

  // Render ulang biar langsung hilang
  renderNotifications();
};
window.searchFaq = () => {
  const input = document.getElementById("faq-search");
  const filter = input.value.toLowerCase();
  const faqList = document.getElementById("faq-list");
  const items = faqList.getElementsByClassName("faq-item");

  for (let i = 0; i < items.length; i++) {
    const question = items[i].getElementsByClassName("faq-question")[0];
    const txtValue = question.textContent || question.innerText;
    if (txtValue.toLowerCase().indexOf(filter) > -1) {
      items[i].style.display = "";
    } else {
      items[i].style.display = "none";
    }
  }
};
// --- FITUR INSTALL PWA CERDAS ---
let deferredPrompt;
const installBtn = document.getElementById("install-btn");

// 1. Browser mendeteksi web bisa diinstall & belum terinstall
window.addEventListener("beforeinstallprompt", (e) => {
  // Cegah browser memunculkan popup install bawaan yang tiba-tiba
  e.preventDefault();
  // Simpan event-nya untuk dipanggil saat tombol diklik
  deferredPrompt = e;

  // Munculkan tombol "Unduh Aplikasi" di menu Preferensi
  if (installBtn) {
    installBtn.style.display = "flex"; // atau 'block' sesuai style kamu
  }
});

// 2. Saat user mengklik tombol "Unduh Aplikasi"
if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
      // Munculkan popup konfirmasi install
      deferredPrompt.prompt();

      // Tunggu user milih "Install" atau "Cancel"
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User setuju menginstall aplikasi");
      }

      // Hapus event yang sudah dipakai
      deferredPrompt = null;
      // Sembunyikan tombolnya lagi
      installBtn.style.display = "none";
    }
  });
}

// 3. Jika aplikasi sukses terinstall, pastikan tombol hilang
window.addEventListener("appinstalled", () => {
  const installBtn = document.getElementById("install-btn");
  if (installBtn) installBtn.style.display = "none";
  deferredPrompt = null;

  // Munculkan toast saat berhasil diinstall!
  showToast("Aplikasi berhasil diinstall! 🎉");
});
// --- FITUR NOTIFIKASI MELAYANG (TOAST) ---
window.showToast = (message) => {
  const toast = document.getElementById("toast-notif");
  if (!toast) return;
  toast.innerText = message;
  toast.classList.add("show");

  // Sembunyikan otomatis setelah 3 detik
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
};

// --- DETEKSI INTERNET (OFFLINE / ONLINE) ---
window.addEventListener("offline", () => {
  showToast("Tidak dapat menyambungkan ke internet. Silakan coba lagi.");
});

window.addEventListener("online", () => {
  showToast("Kembali online! Internet terhubung.");
});
// ==========================================
// --- FITUR KOMENTAR BERSUARA (FIREBASE) ---
// ==========================================

let unsubscribeComments = null; // Kunci untuk mematikan tarikan data kalau user pindah resep

// 1. Fungsi Menarik & Menggambar Komentar
window.loadComments = (safeTitleId) => {
  const listContainer = document.getElementById("comments-list");
  if (!listContainer) return;

  // Bersihkan jalur data lama sebelum membuka yang baru
  if (unsubscribeComments) unsubscribeComments();

  listContainer.innerHTML = `<p style="text-align:center; font-size:12px; color:var(--text-muted);">Memuat komentar...</p>`;

  // Tarik data dari sub-collection 'messages' diurutkan berdasarkan waktu (paling lama di atas)
  unsubscribeComments = db
    .collection("comments")
    .doc(safeTitleId)
    .collection("messages")
    .orderBy("timestamp", "asc")
    .onSnapshot((snapshot) => {
      listContainer.innerHTML = ""; // Bersihkan teks 'Memuat'

      if (snapshot.empty) {
        listContainer.innerHTML = `<p style="font-size:13px; color:var(--text-muted); text-align:center;">Belum ada komentar. Jadilah yang pertama!</p>`;
        return;
      }

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Ubah waktu mesin Firebase jadi format jam/tanggal yang enak dibaca
        let dateText = "Baru saja";
        if (data.timestamp) {
          const date = data.timestamp.toDate();
          dateText = date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        // Fallback foto profil (Kalau user gak punya foto profil Google, pakai gambar inisial huruf)
        const photoUrl =
          data.photoURL ||
          `https://ui-avatars.com/api/?name=${data.name}&background=random`;

        // Cetak kartunya
        listContainer.innerHTML += `
                    <div class="comment-card">
                        <img src="${photoUrl}" class="comment-avatar" alt="Avatar">
                        <div class="comment-content">
                            <div class="comment-name">
                                ${data.name} 
                                <span class="comment-date">${dateText}</span>
                            </div>
                            <div class="comment-text">${data.text}</div>
                        </div>
                    </div>
                `;
      });

      // Otomatis gulir layar ke komentar paling bawah (terbaru)
      listContainer.scrollTop = listContainer.scrollHeight;
    });
};

// 2. Fungsi Mengirim Komentar Baru
window.submitComment = (btnElement) => {
  if (!currentUser) {
    openPopup("Login dengan Google dulu untuk ikut berkomentar!");
    return;
  }

  const inputElement = document.getElementById("comment-input");
  const text = inputElement.value.trim();

  if (text === "") {
    openPopup("Komentar tidak boleh kosong!");
    return;
  }

  const title = document.getElementById("detail-title").innerText;
  const safeTitleId = title.replace(/[^a-zA-Z0-9]/g, "_");

  // Ubah teks tombol biar ada efek loading
  const originalBtnText = btnElement.innerText;
  btnElement.innerText = "Mengirim...";
  btnElement.disabled = true;

  // Tembakkan ke Firebase
  db.collection("comments")
    .doc(safeTitleId)
    .collection("messages")
    .add({
      uid: currentUser.uid,
      name: currentUser.displayName || "Pengguna",
      photoURL: currentUser.photoURL,
      text: text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      // Kalau sukses, bersihkan kotak ketik
      inputElement.value = "";
      btnElement.innerText = originalBtnText;
      btnElement.disabled = false;
    })
    .catch((error) => {
      console.error("Gagal mengirim:", error);
      openPopup("Gagal mengirim komentar. Coba lagi.");
      btnElement.innerText = originalBtnText;
      btnElement.disabled = false;
    });
};
// ==========================================
// --- FITUR FOLLOW / UNFOLLOW (FIREBASE) ---
// ==========================================

let currentRecipeAuthorUid = null; // Menyimpan UID author dari resep yang sedang dibuka

// 1. Dengar Data Profil Secara Realtime (SINKRONISASI GLOBAL UNTUK AKUN SAYA)

firebase.auth().onAuthStateChanged((user) => {
  const myStatsContainer = document.getElementById("my-profile-stats");

  // Matikan mesin pendengar lama jika ada (biar gak narik data dobel)
  if (unsubscribeMyProfile) {
    unsubscribeMyProfile();
    unsubscribeMyProfile = null;
  }

  if (user) {
    // --- JIKA SUDAH LOGIN ---
    if (myStatsContainer) myStatsContainer.style.display = "flex";

    // Pasang radar REALTIME khusus untuk akun sendiri
    unsubscribeMyProfile = db
      .collection("users")
      .doc(user.uid)
      .onSnapshot((doc) => {
        const data = doc.exists ? doc.data() : {};
        const followers = data.followers || [];
        const following = data.following || [];

        // Tembak langsung perubahannya ke angka di tab Profil (Akun Saya)
        const elFollowers = document.getElementById("count-followers");
        const elFollowing = document.getElementById("count-following");

        if (elFollowers) elFollowers.innerText = followers.length;
        if (elFollowing) elFollowing.innerText = following.length;
      });
  } else {
    // --- JIKA BELUM LOGIN (GUEST) ---
    if (myStatsContainer) myStatsContainer.style.display = "none";

    // Kembalikan ke 0
    const elFollowers = document.getElementById("count-followers");
    const elFollowing = document.getElementById("count-following");
    if (elFollowers) elFollowers.innerText = "0";
    if (elFollowing) elFollowing.innerText = "0";
  }
  // Dengar perubahan followers/following milik akun yang sedang login
  db.collection("users")
    .doc(user.uid)
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const followers = data.followers || [];
        const following = data.following || [];

        // Update angka di Profil Header
        const elFollowers = document.getElementById("count-followers");
        const elFollowing = document.getElementById("count-following");

        if (elFollowers) elFollowers.innerText = followers.length;
        if (elFollowing) elFollowing.innerText = following.length;
      }
    });
});

// 2. Cek Status Follow Saat Buka Detail Resep
// PANGGIL FUNGSI INI di dalam window.openArticle() setelah kamu mendapatkan data resepnya
window.checkFollowStatus = (authorUid) => {
  const btnFollow = document.getElementById("btn-follow-author");
  if (!btnFollow || !authorUid) return;

  currentRecipeAuthorUid = authorUid;

  // Sembunyikan tombol kalau resep ini buatan sendiri atau user belum login
  if (!currentUser || currentUser.uid === authorUid) {
    btnFollow.style.display = "none";
    return;
  }

  btnFollow.style.display = "block"; // Munculkan tombol

  // Cek apakah kita sudah nge-follow orang ini
  db.collection("users")
    .doc(currentUser.uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const following = data.following || [];

        if (following.includes(authorUid)) {
          btnFollow.innerText = "Mengikuti";
          btnFollow.classList.add("following");
        } else {
          btnFollow.innerText = "+ Follow";
          btnFollow.classList.remove("following");
        }
      }
    });
};

// 3. Eksekusi Follow / Unfollow Saat Tombol Diklik
window.toggleFollow = () => {
  if (!currentUser) {
    openPopup("Login dengan Google dulu untuk nge-follow!");
    return;
  }

  if (!currentRecipeAuthorUid) return;

  const myUid = currentUser.uid;
  const targetUid = currentRecipeAuthorUid;

  const myRef = db.collection("users").doc(myUid);
  const targetRef = db.collection("users").doc(targetUid);

  // Ambil data kita sekarang buat ngecek udah follow atau belum
  myRef.get().then((doc) => {
    const data = doc.exists ? doc.data() : {};
    const following = data.following || [];
    const isFollowing = following.includes(targetUid);

    if (isFollowing) {
      // JIKA SUDAH FOLLOW -> UNFOLLOW
      myRef.set(
        { following: firebase.firestore.FieldValue.arrayRemove(targetUid) },
        { merge: true },
      );
      targetRef.set(
        { followers: firebase.firestore.FieldValue.arrayRemove(myUid) },
        { merge: true },
      );

      // Update UI tombol
      const btn = document.getElementById("btn-follow-author");
      btn.innerText = "+ Follow";
      btn.classList.remove("following");
    } else {
      // JIKA BELUM FOLLOW -> FOLLOW
      myRef.set(
        { following: firebase.firestore.FieldValue.arrayUnion(targetUid) },
        { merge: true },
      );
      targetRef.set(
        { followers: firebase.firestore.FieldValue.arrayUnion(myUid) },
        { merge: true },
      );

      // Update UI tombol
      const btn = document.getElementById("btn-follow-author");
      btn.innerText = "Mengikuti";
      btn.classList.add("following");
    }
  });
};
let viewedPublicUid = null;

// 1. Membuka Halaman Profil Orang Lain
window.openPublicProfile = (uid, name, photoUrl) => {
  // Tutup pop-up resep jika sedang terbuka
  const articleView = document.getElementById("article-view");
  if (articleView) articleView.classList.remove("active");

  // Jika klik diri sendiri, lari ke menu profil pribadi
  if (currentUser && currentUser.uid === uid) {
    switchPage("profile-page");
    return;
  }

  viewedPublicUid = uid;
  if (typeof updateTotalLikesUI === "function") updateTotalLikesUI();

  // === MUNCULKAN OVERLAY SEPERTI ARTICLE-VIEW ===
  const profilePage = document.getElementById("public-profile-page");
  profilePage.style.display = ""; // Bersihkan sisa display none jika ada
  profilePage.classList.add("active");
  history.pushState({ modal: "public-profile" }, null, "");
  // ==============================================

  document.getElementById("public-profile-name").innerText = name || "Pengguna";
  document.getElementById("public-profile-avatar").src =
    photoUrl || `https://ui-avatars.com/api/?name=${name}&background=random`;

  // Tarik Followers
  db.collection("users")
    .doc(uid)
    .onSnapshot((doc) => {
      const data = doc.exists ? doc.data() : {};
      const followers = data.followers || [];
      const following = data.following || [];

      document.getElementById("public-followers").innerText = followers.length;
      document.getElementById("public-following").innerText = following.length;

      const btnFollow = document.getElementById("btn-follow-public");
      if (currentUser) {
        btnFollow.style.display = "block";
        if (followers.includes(currentUser.uid)) {
          btnFollow.innerText = "Mengikuti";
          btnFollow.style.background = "rgba(0,0,0,0.05)";
          btnFollow.style.color = "var(--text-muted)";
        } else {
          btnFollow.innerText = "+ Ikuti";
          btnFollow.style.background = "var(--primary, #ff6b6b)";
          btnFollow.style.color = "white";
        }
      } else {
        btnFollow.style.display = "none";
      }
    });

  // --- GANTI BAGIAN TARIK RESEP MENJADI SEPERTI INI ---
  document.getElementById("public-profile-recipes").innerHTML =
    `<p style="text-align:center; width:100%; color:#888;">Memuat resep...</p>`;

  // Panggil fungsi render realtime
  renderPublicRecipes();

  if (typeof feather !== "undefined") feather.replace();
};

// ==========================================
// --- FUNGSI RENDER RESEP PROFIL PUBLIK ---
// ==========================================
window.renderPublicRecipes = () => {
  if (!viewedPublicUid) return;

  // Ambil resep langsung dari memori global yang sudah ter-update realtime!
  const userRecipes = allCloudRecipes.filter(
    (r) => r.userId === viewedPublicUid,
  );

  const container = document.getElementById("public-profile-recipes");
  if (!container) return;

  if (userRecipes.length > 0) {
    renderGrid("public-profile-recipes", userRecipes);
  } else {
    container.innerHTML = `<p style="text-align:center; width:100%; color:#888; font-size:12px;">Pengguna ini belum membagikan resep.</p>`;
  }
};

// 2. Tutup Profil (Sama seperti menutup resep, cukup panggil history.back)
window.closePublicProfile = () => {
  viewedPublicUid = null;
  history.back();
};

// === JURUS 2: BUAT WADAH CACHE DI MEMORI ===
window.userProfileCache = {}; // Ingatan sementara biar gak download ulang

// 3. Menampilkan Modal Daftar Pengikut/Mengikuti (VERSI NGEBUT & CACHE)
window.showFollowList = async (type, isMyProfile = false) => {
  const targetUid = isMyProfile ? (currentUser ? currentUser.uid : null) : viewedPublicUid;
  if (!targetUid) return;
  
  const titleText = type === 'followers' ? 'Pengikut' : 'Mengikuti';
  document.getElementById('follow-list-title').innerText = titleText;
  
  const content = document.getElementById('follow-list-content');
  content.innerHTML = '<p style="text-align:center; font-size:12px; color:#888;">Memuat data...</p>';
  document.getElementById('follow-list-modal').style.display = 'flex';

  try {
    const doc = await db.collection('users').doc(targetUid).get();
    const data = doc.exists ? doc.data() : {};
    const listIds = data[type] || [];

    if(listIds.length === 0) {
      content.innerHTML = `<p style="text-align:center; font-size:12px; color:#888;">Belum ada ${titleText.toLowerCase()}.</p>`;
      return;
    }

    // === JURUS 1: AMBIL DATA SERENTAK BARENGAN ===
    // Kita sebar "pasukan" untuk ngambil data setiap ID secara bersamaan
    const userPromises = listIds.map(async (id) => {
      // Cek Cache: Kalau datanya udah pernah didownload, langsung pakai!
      if (window.userProfileCache[id]) {
        return { id, ...window.userProfileCache[id] };
      }
      
      // Kalau belum ada di cache, download dari Firebase
      const userDoc = await db.collection('users').doc(id).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        window.userProfileCache[id] = uData; // Simpan ke cache buat nanti!
        return { id, ...uData };
      }
      return null;
    });

    // Tunggu semua loket selesai melayani secara serentak (super cepat)
    const usersData = await Promise.all(userPromises);

    let htmlString = ""; 
    
    // === RAKIT HTML-NYA ===
    usersData.forEach((uData) => {
      if (uData) {
        const uName = uData.name || "Pengguna";
        const safeName = uName.replace(/'/g, "\\'"); 
        const uPhoto = uData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(uName)}&background=random`;
        
        htmlString += `
        <div style="display:flex; align-items:center; gap:10px; cursor:pointer; padding: 5px;" 
             onclick="document.getElementById('follow-list-modal').style.display='none'; openPublicProfile('${uData.id}', '${safeName}', '${uPhoto}')">
            <img src="${uPhoto}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border: 1px solid #eee;">
            <b style="font-size:14px; color:var(--text);">${uName}</b>
        </div>`;
      }
    });
    
    // Tembakkan ke layar
    content.innerHTML = htmlString;

  } catch (e) {
    console.error(e);
    content.innerHTML = '<p style="text-align:center; color:red;">Gagal memuat data.</p>';
  }
};
// ==========================================
// --- FUNGSI KLIK TOMBOL IKUTI DI PROFIL ---
// ==========================================
window.toggleFollowPublic = () => {
  // 1. Cek apakah user sudah login
  if (!currentUser) {
    openPopup("login dulu");
    return;
  }

  if (!viewedPublicUid) return;

  const myUid = currentUser.uid;
  const targetUid = viewedPublicUid;

  const myRef = db.collection("users").doc(myUid);
  const targetRef = db.collection("users").doc(targetUid);

  // 2. Efek Loading di Tombol
  const btnFollow = document.getElementById("btn-follow-public");
  const originalText = btnFollow.innerText;
  btnFollow.innerText = "Tunggu...";
  btnFollow.style.opacity = "0.7";
  btnFollow.disabled = true; // Kunci tombol biar gak diklik dobel (spam)

  // 3. Eksekusi ke Firebase
  myRef
    .get()
    .then((doc) => {
      const data = doc.exists ? doc.data() : {};
      const following = data.following || [];
      const isFollowing = following.includes(targetUid);

      if (isFollowing) {
        // PROSES UNFOLLOW
        myRef.set(
          { following: firebase.firestore.FieldValue.arrayRemove(targetUid) },
          { merge: true },
        );
        targetRef.set(
          { followers: firebase.firestore.FieldValue.arrayRemove(myUid) },
          { merge: true },
        );
      } else {
        // PROSES FOLLOW
        myRef.set(
          { following: firebase.firestore.FieldValue.arrayUnion(targetUid) },
          { merge: true },
        );
        targetRef.set(
          { followers: firebase.firestore.FieldValue.arrayUnion(myUid) },
          { merge: true },
        );
      }

      // Kembalikan status tombol
      btnFollow.disabled = false;
      btnFollow.style.opacity = "1";
    })
    .catch((error) => {
      console.error("Gagal follow:", error);
      btnFollow.innerText = originalText;
      btnFollow.disabled = false;
      btnFollow.style.opacity = "1";
      {
        showToast("Gagal memproses, periksa koneksi internetmu.");
        return;
      }
    });
};
// ==========================================
// --- FITUR MENGHITUNG TOTAL LIKES ---
// ==========================================
window.updateTotalLikesUI = () => {
  // 1. Update Likes di "Akun Saya"
  if (currentUser) {
    // Cari resep buatan kita, lalu jumlahkan favCount-nya
    const myTotalLikes = allCloudRecipes
      .filter((r) => r.userId === currentUser.uid)
      .reduce((sum, r) => sum + (r.favCount || 0), 0);

    const elMyLikes = document.getElementById("count-likes");
    if (elMyLikes) elMyLikes.innerText = myTotalLikes;
  }

  // 2. Update Likes di Profil Orang Lain
  if (typeof viewedPublicUid !== "undefined" && viewedPublicUid) {
    // Cari resep buatan target, lalu jumlahkan favCount-nya
    const publicTotalLikes = allCloudRecipes
      .filter((r) => r.userId === viewedPublicUid)
      .reduce((sum, r) => sum + (r.favCount || 0), 0);

    const elPublicLikes = document.getElementById("public-likes");
    if (elPublicLikes) elPublicLikes.innerText = publicTotalLikes;
  }
};
// ==========================================
// --- FITUR SORTING MOOD DI HALAMAN MENU ---
// ==========================================
let selectedMenuMood = null; // Memori pengingat mood apa yang lagi diklik

window.toggleMenuMood = (btn, moodValue) => {
  // 1. Atur Tampilan Tombol (Aktif/Nonaktif)
  if (selectedMenuMood === moodValue) {
    // Kalau diklik dua kali, matikan filternya
    selectedMenuMood = null;
    btn.classList.remove("active");
  } else {
    // Matikan semua tombol lain dulu
    document
      .querySelectorAll(".mood-pill")
      .forEach((el) => el.classList.remove("active"));
    // Hidupkan tombol yang ini
    selectedMenuMood = moodValue;
    btn.classList.add("active");
  }

  // 2. Susun ulang resep di layar
  renderMenuGrid();
};

window.renderMenuGrid = () => {
  const staticMenus = typeof menus !== "undefined" ? menus : [];
  const cloudMenus =
    typeof allCloudRecipes !== "undefined" ? allCloudRecipes : [];
  let allMenus = [...staticMenus, ...cloudMenus];

  // JIKA ADA MOOD YANG DIPILIH, PRIORITASKAN DI ATAS
  if (selectedMenuMood) {
    // Kelompokkan resep yang mood-nya cocok
    const matchedRecipes = allMenus.filter(
      (item) => item.tag === selectedMenuMood,
    );
    // Kelompokkan sisanya
    const otherRecipes = allMenus.filter(
      (item) => item.tag !== selectedMenuMood,
    );

    // Gabungkan: Yang cocok taruh di paling atas, sisanya ngekor di bawah
    allMenus = [...matchedRecipes, ...otherRecipes];
  }

  // Render ulang ke layar
  renderGrid("menu-container", allMenus);
};
// ==========================================
// --- FITUR SKELETON LOADING (SHIMMER) ---
// ==========================================
function showSkeletonLoading(containerId, count = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `
        <div class="card-item skeleton-card">
            <div class="skeleton-img shimmer"></div>
            <div class="skeleton-text badge shimmer" style="margin-top: 15px;"></div>
            <div class="skeleton-text shimmer" style="margin-top: 5px;"></div>
            <div class="skeleton-text short shimmer" style="margin-top: 5px;"></div>
        </div>`;
    }
    
    container.innerHTML = skeletonHTML;
}



