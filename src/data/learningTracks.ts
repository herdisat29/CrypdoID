export type LearningTrackID = 'defi' | 'airdrop' | 'trading' | 'security' | 'tokenomics' | 'blockchain';

export interface LearningTrack {
  id: LearningTrackID;
  title: string;
  emoji: string;
  desc: string;
  color: string;
  estimatedHours: number;
  totalModules: number;
  recommendedFor: string[]; // berdasarkan archetype dari quiz
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface LearningModule {
  id: number;
  trackId: LearningTrackID;
  phase: number;
  title: string;
  desc: string;
  duration: string;
  xp: number;
  slug: string;
  content: string;
  funFact: string;
  question: string;
  options: QuizOption[];
}

export const learningTracks: LearningTrack[] = [
  {
    id: 'defi',
    title: "DeFi Mastery",
    emoji: "🏦",
    desc: "Bongkar rahasia lending, yield farming, dan liquidity pools dari nol",
    color: "vibrant-purple",
    estimatedHours: 4,
    totalModules: 3,
    recommendedFor: ['accumulator', 'conviction_holder', 'deep_diver']
  },
  {
    id: 'airdrop',
    title: "Airdrop Hunter",
    emoji: "🪂",
    desc: "Strategi cerdas grinding testnet sikat ribuan dollar cuma modal internet",
    color: "sky-500",
    estimatedHours: 3,
    totalModules: 3,
    recommendedFor: ['reward_hunter', 'community_native']
  },
  {
    id: 'trading',
    title: "Smart Trading",
    emoji: "📈",
    desc: "Kuasai psikologi pasar, emosi, dan cara ngatur risk management anti-fomo",
    color: "amber-500",
    estimatedHours: 3,
    totalModules: 3,
    recommendedFor: ['momentum_chaser', 'dopamine_trader', 'narrative_reader']
  },
  {
    id: 'security',
    title: "Security & Survival",
    emoji: "🛡️",
    desc: "Jaga mutlak seed phrase & rontokkan link phishing scam pencuri koin",
    color: "emerald-500",
    estimatedHours: 2,
    totalModules: 3,
    recommendedFor: ['deep_diver', 'conviction_holder']
  },
  {
    id: 'tokenomics',
    title: "Tokenomics 101",
    emoji: "🧮",
    desc: "Baca supply, vesting schedule, dan allocation chart sebelum kena dump dev",
    color: "rose-500",
    estimatedHours: 3,
    totalModules: 3,
    recommendedFor: ['deep_diver', 'conviction_holder', 'narrative_reader', 'accumulator']
  },
  {
    id: 'blockchain',
    title: "Blockchain dari Nol",
    emoji: "⛓️",
    desc: "Buat yang beneran mulai dari nol — blockchain, wallet, gas fee, semua dijelasin santai",
    color: "cyan-500",
    estimatedHours: 2,
    totalModules: 3,
    recommendedFor: ['community_native', 'accumulator', 'reward_hunter']
  }
];

export const allModules: LearningModule[] = [
  // --- DEFI MASTERY ('defi') ---
  {
    id: 1,
    trackId: 'defi',
    phase: 1,
    title: "DeFi 101: TradFi vs DeFi",
    desc: "Bongkar perbedaan mendasar antara perbankan tradisional dan protokol terdesentralisasi.",
    duration: "10 min",
    xp: 150,
    slug: "defi-101",
    content: "TradFi (Traditional Finance) itu serba terpusat, Senior. Tiap lo transfer atau pinjem duit, ada bank tengah yang ngatur, minta potongan fee gede, dan butuh waktu lama buat approval. Kalau DeFi (Decentralized Finance), semuanya otomatis digerakkin pake Smart Contract di blockchain! No middleman (tanpa calo/perantara), open terus 24 jam non-stop, transparan abis, dsn siapa aja di dunia asal punya internet bisa langsung pake tanpa perlu BI Checking!",
    funFact: "DeFi gak punya hari libur, Senior! Saat bank tradisional tutup di hari Sabtu-Minggu, smart contract DeFi tetep memproses penukaran milyaran dolar per detik secara realtime.",
    question: "Apa perbedaan paling mendasar antara TradFi dan DeFi?",
    options: [
      { text: "DeFi dikendalikan penuh oleh bank swasta terbesar.", isCorrect: false },
      { text: "DeFi berjalan otomatis via Smart Contract tanpa perantara pihak ketiga.", isCorrect: true },
      { text: "DeFi hanya bisa diakses saat jam kerja kantor pusat.", isCorrect: false }
    ]
  },
  {
    id: 2,
    trackId: 'defi',
    phase: 1,
    title: "Stablecoins: Digital Dollar",
    desc: "Pahami apa itu USDT, USDC, DAI, dan kenapa koin-koin stabil ini penting banget di crypto portfolio.",
    duration: "12 min",
    xp: 180,
    slug: "stablecoins",
    content: "Crypto biasa kayak Bitcoin emang volatil banget, naik turun bikin jantungan! Biar tetep stabil pas badai market, ada namanya Stablecoin. Ini koin khusus yang harganya dipatok 1:1 sama mata uang fiat (biasanya USD). Contoh populernya ada USDT (by Tether), USDC (by Circle), dan DAI (berbasis kolateral over-secured). Berguna banget buat tempat berteduh 'parking cash' pas harga koin lain lagi terjun bebas.",
    funFact: "Meskipun nilainya $1 dolar, volume transaksi harian USDT sering melampaui volume transaksi dari gabungan puluhan koin teratas lainnya demi likuiditas perdagangan.",
    question: "Manakah di bawah ini yang merupakan fungsi utama Stablecoin?",
    options: [
      { text: "Dipatok nilainya 1:1 dengan mata uang fiat (seperti USD) demi kestabilan harga.", isCorrect: true },
      { text: "Koin untuk spekulasi ekstrim agar cepat kaya dalam semalam.", isCorrect: false },
      { text: "Mata uang resmi kementerian perdagangan regional.", isCorrect: false }
    ]
  },
  {
    id: 3,
    trackId: 'defi',
    phase: 2,
    title: "DEX & Liquidity Pools",
    desc: "Bongkar cara kerja bursa desentralisasi seperti Uniswap tanpa bantuan order book pusat.",
    duration: "15 min",
    xp: 250,
    slug: "dex-liquidity",
    content: "DEX (Decentralized Exchange) kayak Uniswap atau PancakeSwap gak pake order book konvensional, tapi pake AMM (Automated Market Maker) berbasis Liquidity Pool. Kolam likuiditas ini diisi oleh kontributor biasa (Liquidity Providers) yang mengunci pasangan koin (misal ETH-USDT). Nah, tiap kali ada trader swap koin di pool tersebut, trader bakal bayar trading fee, yang kemudian dibagikan secara proporsional sebagai imbalan buat para penyedia likuiditas!",
    funFact: "Siapa saja berkantong tipis maupun tebal bebas menjadi Liquidity Provider di DEX untuk menikmati deviden komisi swap trading koin.",
    question: "Bagaimana cara dApps DEX memproses swap koin tanpa order book terpusat?",
    options: [
      { text: "Menggunakan database tersembunyi milik admin web.", isCorrect: false },
      { text: "Mengandalkan perantara makelar saham tradisional.", isCorrect: false },
      { text: "Memanfaatkan Liquidity Pool terprogram otomatis via rumus AMM (Automated Market Maker).", isCorrect: true }
    ]
  },

  // --- AIRDROP HUNTER ('airdrop') ---
  {
    id: 4,
    trackId: 'airdrop',
    phase: 1,
    title: "Intro to Airdrops & Testnets",
    desc: "Mengapa project membagikan token gratis dan bagaimana cara berburu testnet.",
    duration: "15 min",
    xp: 150,
    slug: "airdrop-intro",
    content: "Airdrop adalah pembagian token gratis kepada pengguna awal sebagai hadiah loyalitas atau partisipasi jaringan. Seringkali jaringan baru seperti Layer-1 atau Layer-2 butuh dicoba (stress-tested) di fase 'Testnet' menggunakan token bohongan gratis. Nah, lo bisa berkontribusi dengan aktif bertransaksi di sana agar dianggap berkontribusi saat Mainnet meluncur dan membagikan token gratis bernilai asli!",
    funFact: "Salah satu kisah legendaris adalah airdrop koin Uniswap (UNI) di tahun 2020 yang membagikan 400 UNI gratis ke siapa saja yang pernah swap di platform mereka — semudah satu klik langsung cair seharga motor baru!",
    question: "Kenapa proyek koin bersedia membagikan token gratis lewat mekanisme Airdrop?",
    options: [
      { text: "Sebagai bentuk sedekah tanpa imbal balik kepentingan apa pun.", isCorrect: false },
      { text: "Untuk mendistribusikan token secara tersebar ke komunitas awal dan mendorong desentralisasi.", isCorrect: true },
      { text: "Karena koin tersebut sudah tidak laku lagi di bursa saham.", isCorrect: false }
    ]
  },
  {
    id: 5,
    trackId: 'airdrop',
    phase: 1,
    title: "Airdrop Hunting Strategy",
    desc: "Cara cerdas farming airdrop potensial tanpa terjebak buang-buang waktu dan modal.",
    duration: "20 min",
    xp: 180,
    slug: "airdrop-strategy",
    content: "Airdrop itu dapet koin gratis dari project baru sebagai imbalan partisipasi komunitas di fase awal. Tapi banyak yang salah kaprah bikin wallet ratusan dan garap project sampah berbulan-bulan cuma dapet receh. Strategi pro: Fokus ke 'Airdrop Tier 1' yang didukung (backed by) investor raksasa (VC Tier 1 seperti a16z, Paradigm) dengan nominal pendanaan belasan juta dollar. Fokus ke kualitas interaksi dApps (volume transaksi, konsistensi hari aktif), bukan cuma isi form gaje.",
    funFact: "Tahun 2024, satu wallet aktif yang rutin berinteraksi di testnet/mainnet Ethereum Layer-2 bisa dapet airdrop senilai belasan hingga puluhan juta rupiah secara cuma-cuma!",
    question: "Bagaimana kriteria utama menyaring project airdrop yang berpotensi menghasilkan cuan besar?",
    options: [
      { text: "Berpartisipasi di ribuan proyek tidak jelas asal-usulnya yang penting gratis.", isCorrect: false },
      { text: "Fokus pada proyek dengan backing Venture Capital (VC) raksasa dan nominal pendanaan besar.", isCorrect: true },
      { text: "Membeli koin airdrop langsung dari akun bot spam di Twitter.", isCorrect: false }
    ]
  },
  {
    id: 6,
    trackId: 'airdrop',
    phase: 2,
    title: "Sybil Protection & Wallet Isolation",
    desc: "Bongkar sensor bot sybil yang rajin diterapkan token andalan di sirkus Web3.",
    duration: "18 min",
    xp: 220,
    slug: "sybil-protection",
    content: "Sybil Attack adalah taktik satu orang menguasai ribuan wallet palsu demi mengambil alokasi airdrop terbanyak secara curang. Tim developer sekarang menggunakan AI untuk memfilter wallet yang memiliki alur transaksi identik atau berasal dari satu sumber funding pendanaan yang sama. Tips survive: Selalu pisahkan pendanaan tiap wallet lewat bursa terpusat (CEX), jangan transfer koin antar bot wallet-mu secara langsung!",
    funFact: "Pernah ada pemburu airdrop gigit jari karena ribuan wallet miliknya dianggap bot sybil oleh Arbitrum karena dicurigai mengirimkan gas koin secara berantai dari satu wallet induk.",
    question: "Kenapa lo dilarang keras mentransfer koin secara berantai (chains) di antara wallet-wallet airdrop milik lo?",
    options: [
      { text: "Karena gas fee transfer blockchain bisa mendadak gratis.", isCorrect: false },
      { text: "Sistem on-chain analyzer proyek akan menganggap semua wallet lo sebagai satu bot pelaku Sybil Attack.", isCorrect: true },
      { text: "Karena transaksi di blockchain dilarang di akhir pekan.", isCorrect: false }
    ]
  },

  // --- SMART TRADING ('trading') ---
  {
    id: 7,
    trackId: 'trading',
    phase: 1,
    title: "Trading Psychology & Risk Management",
    desc: "Kendalikan emosi keserakahan (Greed) dan rasa takut tertinggal (FOMO) agar bertahan di bursa.",
    duration: "18 min",
    xp: 200,
    slug: "trading-psychology",
    content: "Musuh terbesar lo di crypto bukan bandar atau whale, Senior, tapi pikiran lo sendiri! Pas liat chart koin terbang +200% dalam sehari, otak lo bakal dibanjiri dopamin dan teriak 'FOMO beli sekarang biar gak miskin!' Begitu lo beli, pasar langsung longsor (dump) dan lo nangis cutloss demi emosi balas dendam. Untuk sukses jangka panjang, lo wajib paham: Trading Plan (kapan harus beli & jual), batasi alokasi koin micin maksimal 5% portfolio, dan pahami kalo kesempatan cuan di crypto itu selalu ada tiap hari!",
    funFact: "Pemenang sirkus crypto bukanlah mereka yang profit 10,000% dalam sehari lalu rontok besoknya, melainkan mereka yang konsisten mengamankan modal (survive) melewati beberapa siklus pasar.",
    question: "Bagaimana cara meredam risiko psikologis FOMO saat mendapati koin sedang terbang tinggi?",
    options: [
      { text: "Langsung beli menggunakan modal leverage 100x demi melipatgandakan profit cepat.", isCorrect: false },
      { text: "Terapkan jeda emosional (cooldown) 5-15 menit untuk menganalisis fundamental, dan pertahankan Trading Plan rasional.", isCorrect: true },
      { text: "Menjual seluruh aset utama (BTC/ETH) demi all-in di koin mainan yang sedang viral.", isCorrect: false }
    ]
  },
  {
    id: 8,
    trackId: 'trading',
    phase: 1,
    title: "Understanding Market Cycles",
    desc: "Memahami sirkulasi Bitcoin Halving dan beda Bull vs Bear market crypto.",
    duration: "15 min",
    xp: 220,
    slug: "market-cycles",
    content: "Pasar crypto bergerak secara siklus 4 tahunan yang dipicu oleh Bitcoin Halving (pengurangan separuh hadiah block miner BTC). Siklus ini terdiri dari empat fase utama: Akumulasi (akumulasi koin murah), Bull Market (harga terbang bebas), Distribusi (fase whale take profit), dan Bear Market (harga rontok berkepanjangan). Be smart: Belilah saat pasar berdarah-darah sepi (bear market) dan jualan saat semua orang sedang euforia gembira (extreme greed)!",
    funFact: "Bitcoin halving terjadi rata-rata 4 tahun sekali. Secara historis, harga BTC selalu meroket menembus rekor baru tertinggi dalam waktu 12-18 bulan setelah event halving berlangsung.",
    question: "Kapan waktu paling ideal secara psikologis dan strategis untuk membeli aset crypto jangka panjang?",
    options: [
      { text: "Di puncak kejayaan bull market saat seluruh media memberitakannya.", isCorrect: false },
      { text: "Pada fase akumulasi (Bear Market) saat harga drop di bawah rata-rata dan suasana sedang sepi ketakutan.", isCorrect: true },
      { text: "Pas koin tersebut sudah diumumkan delisting dari exchange.", isCorrect: false }
    ]
  },
  {
    id: 9,
    trackId: 'trading',
    phase: 2,
    title: "Finding High-Potential Narratives",
    desc: "Cara membaca aliran uang di sektor AI, L2, Real World Assets (RWA), dan meme.",
    duration: "20 min",
    xp: 240,
    slug: "market-narratives",
    content: "Uang mengalir di market crypto dalam bentuk gelombang narasi (meta narratives), misalnya narasi AI, Real World Assets (RWA), GameFi, DePIN, atau Meme. Narasi berkembang sangat dinamis tergantung inovasi teknologi dunia nyata atau gebrakan trend dari institusi raksasa. Siapa cepat masuk sebelum narasi itu viral di media massa (Retail FOMO), ialah yang mendulang profit ratusan persen!",
    funFact: "Ketika Nvidia mengumumkan pertumbuhan pendapatan AI yang fantastis di bursa saham biasa, koin-koin berbau kecerdasan buatan (AI) di bursa crypto ikut melonjak tebal secara instan.",
    question: "Bagaimana cara mendulang profit maksimal dari perputaran narasi di bursa crypto?",
    options: [
      { text: "Membeli narasi koin yang sudah sepi dan dilupakan tim developernya semenjak 5 tahun lalu.", isCorrect: false },
      { text: "Masuk lebih awal (early) di sektor narasi potensial sebelum tren tersebut dibahas massal oleh retail dan media arus utama.", isCorrect: true },
      { text: "Selalu membeli koin setelah harganya naik 500% dalam sehari.", isCorrect: false }
    ]
  },

  // --- SECURITY & SURVIVAL ('security') ---
  {
    id: 10,
    trackId: 'security',
    phase: 1,
    title: "Web3 Wallets Deep Dive",
    desc: "MetaMask, Rabby, Trust Wallet — kupas tuntas cara kerja dompet non-custodial.",
    duration: "15 min",
    xp: 200,
    slug: "wallets-security",
    content: "Di dunia Web3, dompet lo adalah identitas lo sekaligus pintu masuk utama. Gak ada username/password kayak internet Web2, gantinya ada Private Key dan Seed Phrase (12/24 kata sakti). Ingat Senior, dApps wallet itu 'Self-Custodial' — lo adalah bank untuk diri lo sendiri. Jaga baik-baik Seed Phrase lo, catat di kertas fisik dan simpan rahasia. Kalau ada web / orang minta Seed Phrase, FIX ITU RUGPULL/PHISHING SCAM!",
    funFact: "Jika seed phrase lo hilang atau dicuri orang, seluruh isi koin lo lenyap selamanya. Developer dApps terkaya sekalipun GAK BISA nge-reset password dompet lo!",
    question: "Apa aturan emas nomor satu perihal keamanan dompet Web3?",
    options: [
      { text: "Simpan Seed Phrase di memo HP umum agar mudah disalin.", isCorrect: false },
      { text: "Jangan pernah membagikan Seed Phrase ke siapa pun atau menginputnya di situs tak dikenal.", isCorrect: true },
      { text: "Mengirimkan Seed Phrase ke customer support dApps via Twitter.", isCorrect: false }
    ]
  },
  {
    id: 11,
    trackId: 'security',
    phase: 1,
    title: "Smart Contract Vulnerabilities",
    desc: "Belajar mendeteksi kelemahan kode pintar dan cara membaca laporan kelayakan audit.",
    duration: "15 min",
    xp: 180,
    slug: "contract-risks-security",
    content: "Walaupun Blockchain aman, kode Smart Contract dApps ditulis oleh developer manusia yang kadang bikin celah (bug). Hacker selalu memantau celah re-entrancy atau math-overflow buat nguras token di sistem dApps. Makanya sebelum taruh modal di DeFi, check dlu apakah developer dApps sudah menyerahkan audit kode secara publik ke badan audit terpercaya seperti CertiK, OpenZeppelin, atau Hacken.",
    funFact: "Hanya butuh satu baris kesalahan logika kode smart contract untuk melayangkan dana senilai ratusan juta dolar keluar ke akun peretas selamanya.",
    question: "Apa yang harus lo lakukan untuk meminimalisir risiko bug Smart Contract?",
    options: [
      { text: "Melihat postingan influencer favorit berpose naik sports car.", isCorrect: false },
      { text: "Memastikan dApps telah lolos audit keamanan independen tingkat tinggi (CertiK/Hacken/dll).", isCorrect: true },
      { text: "Mengirimkan email permohonan santunan ke dev crypto.", isCorrect: false }
    ]
  },
  {
    id: 12,
    trackId: 'security',
    phase: 2,
    title: "Phishing & Permisive Security",
    desc: "Pahami bahaya 'Approve Transaction' sembarangan dan mitigasi bahaya scam digital.",
    duration: "20 min",
    xp: 220,
    slug: "scam-security-revoking",
    content: "Phishing adalah taktik penipuan paling mematikan. Modusnya: pelaku mendesain website replika yang persis dApps DeFi asli, lalu memancing lo menandatangani akses 'Approve unlimited spending limit' token lo. Begitu ditandatangani, smart contract pembobol milik scammer berhak menyedot koin pilihan dari dalam dompet lo tanpa perlu seed phrase lagi! Gunakan dApps Revoke.cash secara berkala buat ngebatalin approval transaksional gaje.",
    funFact: "Selalu sediakan dompet 'Burner-Wallet' (dompet sekali pakai dengan dana tipis) khusus buat coba-coba airdrop baru demi mengisolasi wallet tabungan utama lo.",
    question: "Bagaimana cara memproteksi wallet dari transaksi approval jahat tak terlihat?",
    options: [
      { text: "Rutin memutus tautan & me-revoke permission izin dApps mencurigakan secara berkala memakai tools terpercaya.", isCorrect: true },
      { text: "Melaporkan kejadian phishing ke kantor polisi terdekat.", isCorrect: false },
      { text: "Membeli hardware wallet tambahan tapi disimpan gratis di tumpukan buku.", isCorrect: false }
    ]
  },

  // --- TOKENOMICS 101 ('tokenomics') ---
  {
    id: 13,
    trackId: 'tokenomics',
    phase: 1,
    title: "Supply & Circulating Supply",
    desc: "Bedain max supply, total supply, dan circulating supply — tiga angka yang sering dimanipulasi project scam.",
    duration: "12 min",
    xp: 180,
    slug: "supply-basics",
    content: "Salah satu trik paling classic project crypto buat nyesatin lo adalah main-mainin angka supply. Ada tiga angka yang wajib lo pahami: (1) Max Supply — batas atas total koin yang akan pernah ada (kayak total cetakan uang). (2) Total Supply — semua koin yang sudah dicetak, termasuk yang masih dikunci. (3) Circulating Supply — koin yang udah beredar bebas di market dan bisa diperjualbelikan sekarang. Banyak project kasih market cap kecil dengan sengaja numpuk koin di treasury dev supaya tampak murah, padahal pas unlock nanti harga bisa rontok gila-gilaan.",
    funFact: "Bitcoin punya max supply 21 juta BTC. Sampai sekarang sekitar 19,7 juta sudah beredar. Sisanya akan dicetak perlahan lewat hadiah mining sampai tahun 2140.",
    question: "Koin X punya max supply 1 miliar tapi circulating supply-nya baru 10 juta. Ini artinya apa?",
    options: [
      { text: "Koin ini langka dan pasti naik nilainya.", isCorrect: false },
      { text: "Ada 990 juta koin yang belum beredar — potensial selling pressure besar di masa depan.", isCorrect: true },
      { text: "Market cap-nya dihitung dari max supply, jadi valuasinya kecil.", isCorrect: false }
    ]
  },
  {
    id: 14,
    trackId: 'tokenomics',
    phase: 1,
    title: "Vesting Schedule & Token Unlock",
    desc: "Cara baca jadwal unlock token biar lo gak kena dump mendadak dari tim dan investor awal.",
    duration: "15 min",
    xp: 200,
    slug: "vesting-schedule",
    content: "Vesting schedule adalah jadwal kapan tim, investor, dan advisor boleh jual token mereka. Ini penting banget dipahami sebelum lo invest, Senior! Kalau lo invest di project yang timnya bakal bisa jual 20% token dalam 6 bulan lagi, lo harus hitung: apakah market sanggup nyerap selling pressure sebesar itu? Tools buat ngecek ini ada di TokenUnlocks.app atau CoinGecko di bagian 'Tokenomics'. Tanda bahaya: cliff period pendek (< 6 bulan), alokasi tim > 20%, dan tidak ada lock sama sekali untuk investor private sale.",
    funFact: "Banyak project altcoin yang crash habis-habisan bukan karena proyeknya jelek, tapi karena investor private sale serentak jual token setelah masa lock (cliff) berakhir.",
    question: "Apa yang dimaksud 'cliff' dalam konteks vesting schedule token?",
    options: [
      { text: "Periode waktu minimum sebelum token pertama kali boleh dijual oleh penerima alokasi.", isCorrect: true },
      { text: "Batas maksimum harga jual token yang diizinkan regulator.", isCorrect: false },
      { text: "Jumlah minimum token yang harus dipegang investor.", isCorrect: false }
    ]
  },
  {
    id: 15,
    trackId: 'tokenomics',
    phase: 2,
    title: "Red Flag di Allocation Chart",
    desc: "Belajar baca pie chart tokenomics dan kenali tanda bahaya yang sering disembunyiin project.",
    duration: "18 min",
    xp: 250,
    slug: "allocation-red-flags",
    content: "Allocation chart adalah pie chart yang nunjukin siapa dapat berapa persen dari total supply. Ini yang perlu lo waspadai: (1) Alokasi Tim > 20% — terlalu besar, risiko dump. (2) Tidak ada 'Community/Ecosystem' allocation — berarti project ini bukan buat komunitas, tapi buat dev. (3) Private Sale/Seed alokasi > 30% dengan harga murah banget — investor awal bakal jual dengan profit ribuan persen. (4) 'Foundation' atau 'Reserve' yang kabur tanpa penjelasan kegunaan — ini bisa dijual kapan saja. Benchmark sehat: Tim < 15%, Community/Ecosystem > 40%, dengan vesting panjang.",
    funFact: "Beberapa project legendaris seperti Ethereum mengalokasikan lebih dari 60% supply mereka untuk komunitas dan ekosistem developer — itulah kenapa mereka survive dan berkembang selama bertahun-tahun.",
    question: "Dari allocation chart berikut: Tim 35%, Private Sale 30%, Public 15%, Ecosystem 20% — apa red flag paling kritis?",
    options: [
      { text: "Alokasi Public terlalu kecil untuk menampung demand retail.", isCorrect: false },
      { text: "Tim + Private Sale = 65% total supply, risiko dump ekstrem saat unlock.", isCorrect: true },
      { text: "Tidak ada yang salah, ini distribusi standar industri.", isCorrect: false }
    ]
  },

  // --- BLOCKCHAIN DARI NOL ('blockchain') ---
  {
    id: 16,
    trackId: 'blockchain',
    phase: 1,
    title: "Blockchain Itu Apa Sih?",
    desc: "Penjelasan blockchain paling santai — tanpa jargon teknis yang bikin kepala pusing.",
    duration: "10 min",
    xp: 150,
    slug: "blockchain-intro",
    content: "Blockchain itu simpelnya seperti buku kas RT yang digital. Bedanya: buku kas RT bisa dihapus sama ketua RT. Blockchain gak bisa dihapus atau diubah oleh siapapun, bahkan pembuatnya sendiri! Setiap transaksi dicatat dalam 'blok', lalu blok-blok ini dirantai (chain) satu sama lain secara kronologis. Salinannya ada di ribuan komputer sekaligus di seluruh dunia — jadi gak ada satu titik yang bisa dimanipulasi atau dimatiin. Inilah kenapa koin crypto yang ada di blockchain lo itu benar-benar milik lo, bukan milik perusahaan mana pun.",
    funFact: "Transaksi Bitcoin pertama di dunia terjadi pada 3 Januari 2009. Blok pertama itu (Genesis Block) masih bisa lo lihat sendiri sampai sekarang di blockchain explorer publik — transparan selamanya.",
    question: "Kenapa data di blockchain hampir mustahil untuk dimanipulasi?",
    options: [
      { text: "Karena diawasi ketat oleh tim keamanan perusahaan blockchain.", isCorrect: false },
      { text: "Karena data tersimpan identik di ribuan komputer sekaligus — mengubah satu berarti harus ubah semuanya.", isCorrect: true },
      { text: "Karena blockchain menggunakan enkripsi password yang sangat panjang.", isCorrect: false }
    ]
  },
  {
    id: 17,
    trackId: 'blockchain',
    phase: 1,
    title: "Wallet, Private Key & Seed Phrase",
    desc: "Ini fondasi paling penting. Salah ngerti ini, aset lo bisa hilang selamanya.",
    duration: "12 min",
    xp: 200,
    slug: "wallet-basics",
    content: "Di crypto, 'wallet' itu bukan dompet yang nyimpen koin — koin lo sebenernya ada di blockchain. Wallet itu lebih kayak kunci brankas. Ada dua kunci yang wajib lo pahami: (1) Public Key / Wallet Address — ini alamat lo, boleh dibagikan ke siapa saja untuk menerima kiriman koin, kayak nomor rekening. (2) Private Key / Seed Phrase — ini PASSWORD TERKUAT lo, jangan dibagikan ke siapapun dalam kondisi apapun. Kalau private key lo bocor, semua koin lo bisa dikuras habis dalam hitungan detik. Customer service manapun tidak perlu seed phrase lo — kalau ada yang minta, itu 100% scammer.",
    funFact: "Ada sekitar 3-4 juta Bitcoin yang diperkirakan hilang selamanya karena pemiliknya lupa atau kehilangan private key. Nilainya ratusan triliun rupiah — lenyap tanpa bisa dipulihkan siapapun.",
    question: "Siapakah yang boleh menerima Seed Phrase / Private Key wallet crypto lo?",
    options: [
      { text: "Customer service exchange resmi jika lo butuh bantuan recovery.", isCorrect: false },
      { text: "Tim developer dApps yang lo gunakan untuk verifikasi identitas.", isCorrect: false },
      { text: "Tidak ada satu pun — seed phrase adalah rahasia mutlak milik lo sendiri.", isCorrect: true }
    ]
  },
  {
    id: 18,
    trackId: 'blockchain',
    phase: 2,
    title: "Gas Fee: Biaya Transaksi Blockchain",
    desc: "Kenapa setiap transaksi ada biaya, dan cara ngakalin gas fee yang kadang gila-gilaan.",
    duration: "12 min",
    xp: 180,
    slug: "gas-fee-basics",
    content: "Setiap kali lo kirim koin atau interaksi dengan smart contract di blockchain, lo bayar yang namanya 'gas fee' — biaya ke jaringan komputer (miner/validator) yang memproses transaksi lo. Di Ethereum, gas fee bisa sangat mahal saat jaringan ramai (bisa ratusan ribu rupiah per transaksi!). Tipsnya: (1) Cek gas fee lewat situs GasNow atau langsung di MetaMask sebelum transaksi. (2) Transaksi di Layer-2 (Arbitrum, Optimism, Base) jauh lebih murah — bisa 10-100x lebih hemat. (3) Jangan transaksi saat jam ramai (biasanya malam hari USA timezone).",
    funFact: "Di puncak bull market 2021, gas fee Ethereum pernah mencapai $200 hanya untuk satu transaksi sederhana. Itulah kenapa banyak developer pindah bikin dApps di jaringan alternatif yang lebih murah.",
    question: "Strategi mana yang paling efektif untuk menghemat gas fee transaksi crypto?",
    options: [
      { text: "Melakukan transaksi sebanyak mungkin sekaligus di jam-jam sibuk.", isCorrect: false },
      { text: "Gunakan jaringan Layer-2 (Arbitrum/Base/dll) dan transaksi di luar jam sibuk.", isCorrect: true },
      { text: "Gas fee tidak bisa dihemat, sudah ditetapkan fixed oleh Ethereum Foundation.", isCorrect: false }
    ]
  }
];

export const getModulesByTrack = (trackId: LearningTrackID): LearningModule[] => {
  return allModules.filter(m => m.trackId === trackId);
};

export const calculateTrackProgress = (trackId: LearningTrackID, completedIds: number[]) => {
  const trackModules = getModulesByTrack(trackId);
  if (trackModules.length === 0) return 0;

  const completedCount = trackModules.filter(m => completedIds.includes(m.id)).length;
  return Math.round((completedCount / trackModules.length) * 100);
};

