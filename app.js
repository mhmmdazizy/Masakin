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
  console.log("App Started...");

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
  renderGrid("menu-container", menus);

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

      renderMyRecipes();
      // Render jika sedang di halaman menu
      renderGrid("menu-container", [...menus, ...allCloudRecipes]);
    });

  // 2. SINKRONISASI ANGKA FAVORIT GLOBAL SE-DUNIA
  db.collection("counters").onSnapshot((snapshot) => {
    const globalCounts = {};

    snapshot.forEach((doc) => {
      let count = doc.data().favCount || 0;

      // --- FITUR SELF HEALING ---
      // Kalau database diam-diam minus, langsung paksa kembali ke 0 di server!
      if (count < 0) {
        db.collection("counters")
          .doc(doc.id)
          .set({ favCount: 0 }, { merge: true });
        count = 0; // Tampilkan 0 di layar
      }

      globalCounts[doc.id] = count;
    });

    const applyFavCount = (arr) => {
      arr.forEach((item) => {
        const safeTitle = item.title.replace(/[^a-zA-Z0-9]/g, "_");
        item.favCount = globalCounts[safeTitle] || 0;
      });
    };

    applyFavCount(menus);
    applyFavCount(articles);
    applyFavCount(allCloudRecipes);
    applyFavCount(favorites);
    localStorage.setItem("myFavorites", JSON.stringify(favorites));

    // Render Ulang Layar secara Realtime
    renderGrid("explore-container", articles);
    renderGrid("menu-container", [...menus, ...allCloudRecipes]);
    renderGrid("favorit-container", favorites);
  });
});
// Cek Login & Load Data Cloud
auth.onAuthStateChanged((user) => {
  currentUser = user;
  updateUI(user);
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
             <div class="card-author" style="font-size:10px; color:#888; margin-top:5px; display:flex; gap:5px; align-items:center;">
                <i data-feather="user" style="width:10px;"></i> ${authorName}
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

  const tag = document.getElementById("rec-tag").value;
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
    return alert("Wajib pilih foto utama resep!");
  }

  // Ubah tombol jadi status loading
  const btn = document.querySelector("#recipe-form .find-btn");
  const originalText = btn.innerText;
  btn.innerText = "Mengompres & Menyimpan...";
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
      alert("Resep berhasil diperbarui!");
    } else {
      // SIMPAN DATA BARU
      recipeData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      if (!recipeData.img) throw new Error("Gambar utama wajib!");
      await db.collection("recipes").add(recipeData);
      alert("Resep berhasil dipublish!");
    }

    closeRecipeForm();
  } catch (error) {
    console.error(error);
    alert("Gagal: " + error.message);
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
// --- FUNGSI MEMBUKA HALAMAN DETAIL RESEP ---
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

  document.getElementById("detail-author").innerText = author;
  document.getElementById("detail-time").innerText = time;
  document.getElementById("detail-servings").innerText = servings;

  // === TRIK CERDAS: CARI DATA ASLI DARI MEMORI BERDASARKAN JUDUL ===
  // Cek apakah 'menus' ada (dari database statis)
  const staticMenus = typeof menus !== "undefined" ? menus : [];
  // Cek apakah 'allCloudRecipes' ada (dari Firebase)
  const cloudMenus =
    typeof allCloudRecipes !== "undefined" ? allCloudRecipes : [];

  // Gabungkan dan cari resep yang diklik
  const allItems = [...staticMenus, ...cloudMenus];
  const item = allItems.find((i) => i.title === title);

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
  // Trigger render reaction emot
  const safeTitleId = title.replace(/[^a-zA-Z0-9]/g, "_");
  if (typeof renderReactions === "function") renderReactions(safeTitleId);
  if (typeof renderRatings === "function") renderRatings(safeTitleId);
  if (typeof loadComments === "function") loadComments(safeTitleId);
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
    <p style="text-align:right; font-size:10px; color:var(--text-muted);">Diperbaharui: 19 Februari 2026</p>
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
    title = "Hapus data & reset";
    icon = "alert-triangle"; // Icon peringatan
    content = `
            <p style="text-align:center; margin-bottom:15px;">Yakin mau reset?</p>
            <button class="find-btn" onclick="confirmReset()" style="width:100%;">Yakin</button>
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

// Listener Back Button
window.addEventListener("popstate", () => {
  const ids = ["recipe-form", "article-view", "info-popup"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      if (el.style.display === "flex") el.style.display = "none";
      el.classList.remove("active");
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
window.deleteMyRecipe = async (docId) => {
  if (!docId || docId === "undefined") return alert("Data error!");

  const confirmDelete = confirm(
    "Yakin ingin menghapus resep ini secara permanen?",
  );
  if (confirmDelete) {
    try {
      await db.collection("recipes").doc(docId).delete();
      alert("Resep berhasil dihapus!");
      // Tidak perlu panggil render ulang manual, karena .onSnapshot di atas otomatis mendeteksi perubahan database.
    } catch (error) {
      console.error("Gagal hapus:", error);
      alert("Gagal menghapus: " + error.message);
    }
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
