// ==========================================
// DATABASE LOKAL: MASAK APA?
// Tambahkan resep atau artikel baru di sini!
// ==========================================

// --- 1. DATA BAHAN (HOME) ---
const ingredients = [
  { id: "telur", name: "Telur", icon: "icon/telur.png" },
  { id: "tempe", name: "Tempe", icon: "icon/tempe.png" },
  { id: "tahu", name: "Tahu", icon: "icon/tahu.png" },
  { id: "ayam", name: "Ayam", icon: "icon/ayam.png" },
  { id: "bawang", name: "Bawang merah", icon: "icon/bawang merah.png" },
  { id: "cabe", name: "Cabai", icon: "icon/cabe.png" },
  { id: "kecap", name: "Kecap manis", icon: "icon/kecap manis.png" },
  { id: "nasi", name: "Nasi", icon: "icon/nasi.png" },
];

// --- 2. DATA ARTIKEL (EXPLORE) ---
const articles = [
  {
    title: "Tips Sayur Awet",
    tag: "TIPS",
    img: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&q=80",
    desc: "Bungkus sayuran dengan tisu dapur sebelum dimasukkan ke kulkas agar tidak cepat busuk.",
  },
  {
    title: "Bumbu Dasar",
    tag: "HACK",
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80",
    desc: "Buat bumbu dasar putih, merah, dan kuning di akhir pekan untuk mempercepat waktu masak harian.",
  },
  // ⬇️ TAMBAH ARTIKEL BARU DI BAWAH SINI ⬇️
];

// --- 3. DATA RESEP BAWAAN (MENU) ---
const menus = [
  {
    title: "Nasi Goreng Spesial",
    tag: "15 MIN",
    img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80",

    // 1. FORMAT BARU BAHAN (Gunakan backtick ` agar bisa di-enter ke bawah)
    ingredients: `200g nasi putih
1 butir telur
50g ayam suwir
2 siung bawang putih (cincang)
3 siung bawang merah (iris)
1 sdm kecap manis
1 sdt saus tiram
Garam dan lada secukupnya
Minyak untuk menumis`,

    // 2. FORMAT BARU LANGKAH (Gunakan Array berisi Object)
    steps: [
      {
        text: "Panaskan minyak, tumis bawang merah dan bawang putih hingga harum.",
        img: null, // Isi null jika resep lokal ini tidak punya foto per-langkah
      },
      {
        text: "Masukkan telur, orak-arik hingga matang.",
        img: null,
      },
      {
        text: "Tambahkan ayam suwir, aduk hingga tercampur rata.",
        img: null,
      },
      {
        text: "Masukkan nasi putih, kecap manis, saus tiram, garam, dan lada.",
        img: null,
      },
      {
        text: "Aduk hingga nasi panas merata dan bumbu menyatu sempurna.",
        img: null,
      },
      {
        text: "Sajikan hangat dengan kerupuk dan acar.",
        img: null,
      },
    ],

    // 3. TETAP SIMPAN DESC (Sebagai "Mesin Pencari" Rahasia)
    // Cukup jadikan satu paragraf panjang agar fitur Search di Beranda tetap bisa mendeteksi kata kuncinya.
    desc: "200g nasi putih 1 butir telur 50g ayam suwir 2 siung bawang putih (cincang) 3 siung bawang merah (iris) 1 sdm kecap manis 1 sdt saus tiram Garam lada Minyak menumis Panaskan tumis harum Masukkan orak-arik matang Tambahkan aduk tercampur rata kecap saus panas menyatu sempurna Sajikan hangat kerupuk acar",
  },
  {
    title: "Soto Ayam Kuning",
    tag: "KUAH",
    img: "https://images.unsplash.com/photo-1633436375795-12b3b339712f?w=300&q=80",

    // 1. FORMAT BAHAN (Tanpa strip, cukup enter saja)
    ingredients: `250g ayam
1 liter air
2 cm kunyit
2 cm jahe
3 siung bawang putih
4 siung bawang merah
1 batang serai
2 lembar daun salam
Soun secukupnya
Tauge secukupnya
Garam dan gula secukupnya`,

    // 2. FORMAT LANGKAH (Array Object, tanpa angka)
    steps: [
      {
        text: "Rebus ayam hingga matang, angkat dan suwir dagingnya.",
        img: null,
      },
      {
        text: "Haluskan kunyit, jahe, bawang merah, dan bawang putih.",
        img: null,
      },
      {
        text: "Tumis bumbu halus hingga harum.",
        img: null,
      },
      {
        text: "Masukkan bumbu ke dalam air rebusan ayam, tambahkan serai dan daun salam.",
        img: null,
      },
      {
        text: "Masukkan kembali ayam suwir, masak hingga kuah meresap.",
        img: null,
      },
      {
        text: "Sajikan dengan soun, tauge, dan taburan bawang goreng.",
        img: null,
      },
    ],

    // 3. DESC GABUNGAN (Untuk fitur mesin pencari di Beranda)
    desc: "250g ayam 1 liter air 2 cm kunyit 2 cm jahe 3 siung bawang putih 4 siung bawang merah 1 batang serai 2 lembar daun salam Soun secukupnya Tauge secukupnya Garam gula Rebus matang angkat suwir dagingnya Haluskan Tumis bumbu harum Masukkan rebusan tambahkan masak kuah meresap Sajikan taburan bawang goreng",
  },
];
