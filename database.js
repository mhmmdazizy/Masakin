// ==========================================
// DATABASE LOKAL: MASAK APA?
// Tambahkan resep atau artikel baru di sini!
// ==========================================

// --- 1. DATA BAHAN (HOME) LENGKAP KATEGORI ---
const ingredients = [
  // === PROTEIN ===
  {
    id: "ayam",
    name: "Ayam",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Ayam&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "daging_sapi",
    name: "Daging Sapi",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Daging+Sapi&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "daging_kambing",
    name: "Daging Kambing",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Daging+Kambing&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "bebek",
    name: "Bebek",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Bebek&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "ikan_kembung",
    name: "Ikan kembung",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Ikan+kembung&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "ikan_nila",
    name: "Ikan nila",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Ikan+nila&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "ikan_emas",
    name: "Ikan emas",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Ikan+emas&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "ikan_gurame",
    name: "Ikan gurame",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Ikan+gurame&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "ikan_kakap",
    name: "Ikan kakap",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Ikan+kakap&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "ikan_tuna",
    name: "Ikan tuna",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Ikan+tuna&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "ikan_salmon",
    name: "Ikan salmon",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Ikan+salmon&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "cumi",
    name: "Cumi",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Cumi&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "udang",
    name: "Udang",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Udang&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kerang",
    name: "Kerang",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Kerang&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "tahu_sumedang",
    name: "Tahu Sumedang",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Tahu+Sumedang&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "tahu",
    name: "Tahu",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Tahu&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "tahu_sutera",
    name: "Tahu sutera",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Tahu+sutera&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "tahu_telur",
    name: "Tahu telur",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Tahu+telur&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "tempe",
    name: "Tempe",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Tempe&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "oncom",
    name: "Oncom",
    category: "Protein",
    icon: "https://ui-avatars.com/api/?name=Oncom&background=random&color=fff&rounded=true&bold=true",
  },

  // === SAYUR ===
  {
    id: "bayam",
    name: "Bayam",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Bayam&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kangkung",
    name: "Kangkung",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Kangkung&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "jamur",
    name: "Jamur",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Jamur&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "wortel",
    name: "Wortel",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Wortel&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "tomat",
    name: "Tomat",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Tomat&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "daun_bawang",
    name: "Daun bawang",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Daun+bawang&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "sawi_putih",
    name: "Sawi putih",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Sawi+putih&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "sawi_hijau",
    name: "Sawi hijau",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Sawi+hijau&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "pokcoy",
    name: "Pokcoy",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Pokcoy&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kol",
    name: "Kol",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Kol&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "bunga_kol",
    name: "Bunga kol",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Bunga+kol&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "brokoli",
    name: "Brokoli",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Brokoli&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "terong",
    name: "Terong",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Terong&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "timun",
    name: "Timun",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Timun&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "daun_kemangi",
    name: "Daun kemangi",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Daun+kemangi&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "daun_singkong",
    name: "Daun singkong",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Daun+singkong&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "daun_katuk",
    name: "Daun katuk",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Daun+katuk&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "selada",
    name: "Selada",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Selada&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "paprika",
    name: "Paprika",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Paprika&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "asparagus",
    name: "Asparagus",
    category: "Sayur",
    icon: "https://ui-avatars.com/api/?name=Asparagus&background=random&color=fff&rounded=true&bold=true",
  },

  // === KARBOHIDRAT ===
  {
    id: "nasi_putih",
    name: "Nasi putih",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Nasi+putih&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "nasi_merah",
    name: "Nasi merah",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Nasi+merah&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "nasi_ketan",
    name: "Nasi ketan",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Nasi+ketan&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "nasi_basmati",
    name: "Nasi basmati",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Nasi+basmati&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "nasi_jagung",
    name: "Nasi Jagung",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Nasi+Jagung&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kentang",
    name: "Kentang",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Kentang&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "ubi",
    name: "Ubi",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Ubi&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "singkong",
    name: "Singkong",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Singkong&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "jagung",
    name: "Jagung",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Jagung&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "oyek",
    name: "Oyek",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Oyek&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "mie_telur",
    name: "Mie telur",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Mie+telur&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "misoa",
    name: "Misoa",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Misoa&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "bihun",
    name: "Bihun",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Bihun&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "soun",
    name: "Soun",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Soun&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "pasta",
    name: "Pasta",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Pasta&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "roti",
    name: "Roti",
    category: "Karbohidrat",
    icon: "https://ui-avatars.com/api/?name=Roti&background=random&color=fff&rounded=true&bold=true",
  },

  // === BUMBU ===
  {
    id: "garam",
    name: "Garam",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Garam&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "gula",
    name: "Gula",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Gula&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "merica",
    name: "Merica",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Merica&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "ketumbar",
    name: "Ketumbar",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Ketumbar&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kayu_manis",
    name: "Kayu manis",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kayu+manis&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kapulaga",
    name: "Kapulaga",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kapulaga&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "pala",
    name: "Pala",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Pala&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "bunga_lawang",
    name: "Bunga lawang/pekak",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Bunga+lawang&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "cengkeh",
    name: "Cengkeh",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Cengkeh&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "jahe",
    name: "Jahe",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Jahe&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "lengkuas",
    name: "Lengkuas",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Lengkuas&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kencur",
    name: "Kencur",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kencur&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kecap_manis",
    name: "Kecap manis",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kecap+manis&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kecap_asin",
    name: "Kecap asin",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kecap+asin&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kecap_asin_pekat",
    name: "Kecap asin pekat",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kecap+asin+pekat&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kecap_ikan",
    name: "Kecap ikan",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kecap+ikan&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kecap_inggris",
    name: "Kecap inggris",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kecap+inggris&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "saos_sambal",
    name: "Saos sambal",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Saos+sambal&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "saos_tomat",
    name: "Saos tomat",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Saos+tomat&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "saos_bbq",
    name: "Saos bbq",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Saos+bbq&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kaldu_ayam",
    name: "Kaldu ayam",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kaldu+ayam&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kaldu_sapi",
    name: "Kaldu sapi",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kaldu+sapi&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "micin",
    name: "Micin",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Micin&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kaldu_jamur",
    name: "Kaldu jamur",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kaldu+jamur&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "cuka",
    name: "Cuka",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Cuka&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "asem_jawa",
    name: "Asem Jawa",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Asem+Jawa&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "gula_merah",
    name: "Gula merah",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Gula+merah&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "bawang_merah",
    name: "Bawang merah",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Bawang+merah&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "bawang_putih",
    name: "Bawang putih",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Bawang+putih&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "bawang_bombai",
    name: "Bawang bombai",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Bawang+bombai&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "cabe_merah_besar",
    name: "Cabe merah besar",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Cabe+merah+besar&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "cabe_merah_keriting",
    name: "Cabe merah keriting",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Cabe+merah+keriting&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "cabe_hijau_besar",
    name: "Cabe hijau besar",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Cabe+hijau+besar&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "cabe_hijau_keriting",
    name: "Cabe hijau keriting",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Cabe+hijau+keriting&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "cabe_rawit_hijau",
    name: "Cabe rawit hijau",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Cabe+rawit+hijau&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "cabe_rawit_jablay",
    name: "Cabe rawit jablay",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Cabe+rawit+jablay&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kemiri",
    name: "Kemiri",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kemiri&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "kunyit",
    name: "Kunyit",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Kunyit&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "daun_sereh",
    name: "Daun sereh",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Daun+sereh&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "daun_salam",
    name: "Daun salam",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Daun+salam&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "jeruk_nipis",
    name: "Jeruk nipis",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Jeruk+nipis&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "daun_jeruk",
    name: "Daun jeruk",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Daun+jeruk&background=random&color=fff&rounded=true&bold=true",
  },
  {
    id: "jeruk_limau",
    name: "Jeruk limau",
    category: "Bumbu",
    icon: "https://ui-avatars.com/api/?name=Jeruk+limau&background=random&color=fff&rounded=true&bold=true",
  },
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
    tag: "Sat-Set",
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
    tag: "Anget-Anget",
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
