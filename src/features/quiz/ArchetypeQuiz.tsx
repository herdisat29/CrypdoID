import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReward } from '../../contexts/RewardContext';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAccount } from 'wagmi';
import ScrambleText from '../../components/common/ScrambleText';
import ArchetypeResult from './ArchetypeResult';
import { useUserStore } from '../../store/userStore';
import { 
  ChevronRight, 
  Zap, 
  Target
} from 'lucide-react';

// --- TYPES ---

import { TraitScores } from '../../store/userStore';

type ArchetypeID = 
  | 'conviction_holder' 
  | 'reward_hunter' 
  | 'momentum_chaser' 
  | 'deep_diver' 
  | 'community_native' 
  | 'narrative_reader' 
  | 'dopamine_trader'
  | 'accumulator';

interface ArchtypeInfo {
  id: ArchetypeID;
  name: string;
  emoji: string;
  title: string;
  desc: string;
  strengths: string[];
  weaknesses: string[];
  destroyer: string;
  needs: string;
  quote: string;
  compatibility: {
    trading: number;
    airdrop: number;
    investing: number;
    community: number;
    research: number;
  };
  psychProfile: {
    fomo: number;
    greed: number;
    conviction: number;
    defense: number;
    discipline: number;
  };
  insight?: string;
  bestStrategy?: string;
  whatToAvoid?: string;
  shadowSide: string;
}

interface Question {
  id: number;
  text: string;
  subtext?: string;
  options: {
    text: string;
    points: Partial<Record<keyof TraitScores, number>>;
  }[];
}

// --- DATA ---

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Rekan kerja lo heboh pamer profit 300% dari token meme baru berlogo anjing pake topi dalam waktu 3 hari. Respon spontan lo?",
    options: [
      { text: "Wah gokil! Bagi kontaknya, gue langsung beli dikit pake uang dingin. Takut ketinggalan tren!", points: { fomo: 25, greed: 15, discipline: -10 } },
      { text: "Selamat ya! Tapi gue skip dulu, koin kayak gitu gak masuk kriteria riset fundamental gue.", points: { defense: 20, discipline: 15, fomo: -15 } },
      { text: "Biasa aja. Gue konsisten nabung rutin tiap bulan di aset blue-chip, gak terpengaruh sensasi sesaat.", points: { discipline: 25, fomo: -20, greed: -10 } },
      { text: "Ikut seneng! Boleh deh gue pelajari komunitasnya dan cari tahu apa yang bikin token ini mendadak ramai.", points: { fomo: 10, conviction: 10 } },
    ]
  },
  {
    id: 2,
    text: "Portofolio investasi utama lo mendadak anjlok -25% karena FUD (berita buruk) makro global. Apa yang lo lakuin?",
    options: [
      { text: "Panic! Langsung cutloss sebelum modal gue habis tak tersisa. Amankan cash dulu!", points: { conviction: -25, discipline: -15, defense: 10 } },
      { text: "Cuek aja. Ini bagian dari siklus pasar. Malah kesempatan buat tambah muatan (buy the dip)!", points: { conviction: 25, discipline: 15, greed: 10 } },
      { text: "Tetap tenang dan pegang rencana awal. Gak usah dibuka-buka dulu aplikasinya biar gak stres.", points: { discipline: 20, conviction: 15, fomo: -10 } },
      { text: "Cari info detail di grup diskusi komunitas untuk validasi apakah fundamentalnya benar-benar rusak.", points: { defense: 15, conviction: 10 } },
    ]
  },
  {
    id: 3,
    text: "Aset lo baru aja naik 3x lipat (gain +200%) dalam waktu kurang dari sebulan. Langkah apa yang lo ambil?",
    options: [
      { text: "Hold semua! Masih bisa 2x lagi ini, target berikutnya pasti tercapai. Sayang kalau dijual sekarang.", points: { greed: 25, discipline: -15, fomo: 10 } },
      { text: "Langsung jual semuanya tanpa ragu. Uangnya masuk ke tabungan aman / dideposito.", points: { greed: -20, discipline: 20, fomo: -10 } },
      { text: "Tarik modal awal + sebagian profit. Sisanya biarkan berjalan sebagai 'free money'.", points: { discipline: 15, greed: -10 } },
      { text: "Putar seluruh keuntungan ke aset baru lainnya yang grafiknya sedang mulai terbang.", points: { fomo: 20, greed: 20, discipline: -10 } },
    ]
  },
  {
    id: 4,
    text: "Lo nemu platform investasi baru yang menjanjikan 'Jaminan Keuntungan Stabil 30% Per Bulan Tanpa Risiko'. Sikap lo?",
    options: [
      { text: "Wah menarik banget! Mumpung baru, coba masuk pake dana kecil dulu ah.", points: { defense: -25, greed: 20, fomo: 15 } },
      { text: "Langsung curiga. Cek legalitas, tim di balik layar, dan smart contract-nya sebelum menyentuh.", points: { defense: 25, discipline: 10 } },
      { text: "Langsung abaikan dan laporkan sebagai potensi Ponzi / scam. Gak masuk akal!", points: { defense: 25, greed: -15 } },
      { text: "Coba cari review dari influencer terkenal atau diskusi di Reddit/Twitter dulu.", points: { defense: 10, fomo: 5 } },
    ]
  },
  {
    id: 5,
    text: "Seberapa sering lo mengubah rencana investasi lo karena membaca opini influencer atau berita di media sosial?",
    options: [
      { text: "Sering banget. Kalau tokoh favorit bilang A bagus, gue cenderung langsung ikut merombak portofolio.", points: { fomo: 25, conviction: -20, discipline: -15 } },
      { text: "Kadang-kadang, kalau analisa mereka disertai data yang valid dan melengkapi riset gue.", points: { defense: 10, discipline: 5 } },
      { text: "Jarang sekali. Riset pribadi gue jauh lebih kuat dibanding omongan orang di luar sana.", points: { conviction: 25, fomo: -20, discipline: 10 } },
      { text: "Hampir gak pernah. Gue kan tipe pasif yang cuma nabung otomatis tanpa peduli opini pasar.", points: { discipline: 25, fomo: -20, greed: -15 } },
    ]
  },
  {
    id: 6,
    text: "Bagaimana cara lo mendanai investasi bulanan lo?",
    options: [
      { text: "Gue sisihkan di awal bulan secara ketat dengan nominal tetap (sistematis).", points: { discipline: 25, greed: -10 } },
      { text: "Gue pakai uang sisa kebutuhan bulanan aja, fleksibel seadanya.", points: { discipline: -15, fomo: 10 } },
      { text: "Gue berani pakai uang tabungan darurat atau pinjaman kalau ada peluang super langka di pasar.", points: { greed: 25, discipline: -25, defense: -15 } },
      { text: "Gue fokus nyari insentif gratisan (airdrop/rewards) ketimbang keluar modal pribadi besar.", points: { defense: 15, greed: -10 } },
    ]
  },
  {
    id: 7,
    text: "Ketika membeli suatu aset investasi (misal koin Crypto baru atau Saham teknologi), seberapa dalam riset yang lo lakuin?",
    options: [
      { text: "Nonton video singkat / baca ringkasan tren 5 menit aja, yang penting ngerti konsep gedenya.", points: { defense: -15, discipline: -10, fomo: 15 } },
      { text: "Bedah tuntas prospektus, tokenomics, kode github, background tim pendiri, dan kompetitor.", points: { defense: 25, discipline: 15, conviction: 15 } },
      { text: "Gak perlu ribet riset. Asalkan proyeknya ramai didukung komunitas solid dan aktif.", points: { fomo: 20, defense: -10 } },
      { text: "Gue cuma beli aset blue-chip teratas yang reputasinya udah puluhan tahun teruji pasar.", points: { discipline: 20, defense: 20, fomo: -15 } },
    ]
  },
  {
    id: 8,
    text: "Ada koin / aset baru yang baru rilis dan langsung naik +500% dalam sehari. Orang-orang di Discord/Twitter teriak '100x Next BTC!'. Apa tindakan lo?",
    options: [
      { text: "Langsung ikutan beli! Gak apa-apa di pucuk, siapa tahu masih lanjut terbang 10x lagi.", points: { fomo: 25, greed: 20, discipline: -20 } },
      { text: "Gak peduli. Lonjakan secepat itu biasanya berakhir dengan crash parah. Gue tonton aja.", points: { fomo: -25, defense: 25, discipline: 15 } },
      { text: "Gue tunggu harganya koreksi tajam dulu, baru pertimbangkan masuk kalau fundamentalnya oke.", points: { discipline: 15, fomo: -10 } },
      { text: "Ikutan masuk tapi pake uang jajan receh banget demi ngerasain sensasinya.", points: { fomo: 10, discipline: -10 } },
    ]
  },
  {
    id: 9,
    text: "Sikap lo mengenai target investasi jangka panjang lo?",
    options: [
      { text: "Punya target profit yang jelas, dan gue patuh jual secara bertahap saat target tercapai.", points: { discipline: 25, greed: -20 } },
      { text: "Pengen hold selama-lamanya (generational wealth), yakin aset ini bakal mendominasi dunia.", points: { conviction: 25, greed: 15, discipline: -10 } },
      { text: "Target gue fleksibel, selalu berubah mengikuti ke mana arah tren industri bergerak.", points: { fomo: 15, discipline: -10 } },
      { text: "Yang penting modal aman dulu, profit berapapun bersyukur.", points: { defense: 20, greed: -15 } },
    ]
  },
  {
    id: 10,
    text: "Apa definisi kesuksesan investasi menurut lo?",
    options: [
      { text: "Bisa melipatgandakan aset secepat mungkin dengan memanfaatkan momentum pasar.", points: { greed: 25, fomo: 15, discipline: -10 } },
      { text: "Konsistensi mengalahkan inflasi jangka panjang secara aman dan tenang tanpa beban mental.", points: { discipline: 25, fomo: -20, greed: -15 } },
      { text: "Menemukan 'permata tersembunyi' (hidden gem) dari dasar sebelum meledak berkat riset mandiri.", points: { defense: 20, conviction: 20 } },
      { text: "Menikmati proses belajar teknologi baru dan menjadi bagian dari komunitas masa depan.", points: { conviction: 15, fomo: 10 } },
    ]
  }
];

const ARCHETYPES: Record<string, ArchtypeInfo> = {
  conviction_holder: {
    id: 'conviction_holder',
    name: "The Conviction Holder",
    emoji: "💎",
    title: "The Unshakable Believer",
    desc: "Lo adalah tipe yang punya 'iman' kuat di crypto. Sekali lo yakin sama satu project, badai FUD setinggi apa pun nggak bakal bikin lo lepas barang. Lo percaya kalau masa depan dibangun dengan kesabaran, bukan sekadar klik-klik mouse.",
    strengths: ["Mental baja", "Mindset jangka panjang", "Kebal FUD"],
    weaknesses: ["Kelamaan exit", "Sering bias sama project idola"],
    destroyer: "Ketidakmampuan buat mengakui kalau project yang lo puja sebenarnya udah 'dead'.",
    needs: "Update pandangan secara objektif tanpa melibatkan emosi berlebihan.",
    quote: "Hold bukan sekadar nahan barang, tapi nahan godaan buat jadi kaya dalam semalam.",
    compatibility: { trading: 40, airdrop: 30, investing: 95, community: 60, research: 80 },
    psychProfile: { fomo: 15, discipline: 90, conviction: 95, defense: 75, greed: 70 },
    insight: "Gokil, lo tipe investor yang punya iman setahan tembok beton! Koin lo drop 80%? Lo malah senyum-senyum dengerin FUD sambil bilang 'This is a test of conviction'. Hebatnya, lo kebal panic sell. Jeleknya, lo sering kecintaan sama tokennya sampe lupa caranya take profit. Ingat Senior, 'Hold to die' itu romantis di komunitas, tapi boncos di dompet.",
    bestStrategy: "Mulai pasang target take profit (TP) berjenjang (misal tiap naik 50%, ambil 10% modal). Jangan biarkan portofolio lo yang sempat ratusan persen menguap jadi debu cuma gara-gara kesetiaan buta.",
    whatToAvoid: "Hindari dengerin 'cult leaders' di Discord/Twitter yang ngelarang orang jualan demi kebaikan bersama. Realistis aja Senior, kita di sini nyari cuan, bukan bikin sekte spiritual.",
    shadowSide: "Terlalu bebal dan sering terjebak dalam bias kepemilikan (bias pemujaan token). Lo cenderung mengabaikan data baru yang buruk atau perubahan fundamental krusial karena terlanjur cinta mati. Seringkali memegang aset dari puncak kejayaan hingga ludes menguap kembali ke bumi cuma karena menolak jualan demi idealisme komunitas."
  },
  reward_hunter: {
    id: 'reward_hunter',
    name: "The Reward Hunter",
    emoji: "🪂",
    title: "The Ultimate Grinder",
    desc: "Capital lo mungkin nggak sebesar whale, tapi effort lo nggak ada tandingannya. Lo rela isi form, garap testnet, dan mainin 10 wallet demi potensi airdrop jutaan rupiah. Lo adalah definisi 'kerja cerdas' di Web3.",
    strengths: ["Sangat teliti", "Konsistensi tinggi", "Modal minim untung maksimal"],
    weaknesses: ["Opportunity cost waktu", "Sering burnout karena grinding"],
    destroyer: "Project yang nge-ghosting atau kasih airdrop yang 'zonk' setelah lo capek garap.",
    needs: "Istirahat cukup dan fokus ke project yang benar-benar berkualitas (tier 1).",
    quote: "Airdrop adalah upah bagi mereka yang sabar mengisi form di saat orang lain sibuk FOMO.",
    compatibility: { trading: 30, airdrop: 100, investing: 50, community: 70, research: 60 },
    psychProfile: { fomo: 30, discipline: 85, conviction: 40, defense: 80, greed: 45 },
    insight: "Lo adalah kuli digital Web3 tersukses. Modal tipis, effort tanpa batas! Lo rela bikin banyak wallet, garap testnet subuh-subuh demi dapet beras gratisan dari airdrop. Saking berpengalamannya, lo udah paham trik developer koin buat ngulur waktu. Tapi ati-ati, sisa waktu produktif lo bisa abis di depan laptop sampe lupa sosialisasi sama manusia asli.",
    bestStrategy: "Fokus ke project Tier-1 yang dapet funding besar dari VC raksasa (backed by Paradigm, a16z, dll). Kurangi kuantitas garapan gaje, pertahankan kualitas demi alokasi airdrop yang bernilai tinggi.",
    whatToAvoid: "Jangan pernah bayar 'gas fee bridging' di website airdrop abal-abal yang dapet infonya dari reply bots Twitter. Itu fix phishing scam yang siap kuras habis balance dompet lo!",
    shadowSide: "Analysis paralysis dan opportunity cost waktu yang sangat parah. Lo rela membuang waktu produktif puluhan jam demi airdrop receh gratisan yang seringkali tidak sebanding dengan usaha. Rentan terkena burnout mental karena terus memantau tugas-tugas mikro harian di depan layar komputer."
  },
  momentum_chaser: {
    id: 'momentum_chaser',
    name: "The Momentum Chaser",
    emoji: "⚡",
    title: "The Speed Demon",
    desc: "Mana koin yang lagi ijo, di situ ada lo. Lo sangat reaktif sama pergerakan market dan bisa mengambil keputusan dalam hitungan detik. Lo nggak peduli teknologinya, yang penting harganya mau naik.",
    strengths: ["Cepat ambil peluang", "Berani ambil risiko", "Decision maker"],
    weaknesses: ["Sering terjebak di pucuk", "Beli karena emosi/FOMO"],
    destroyer: "Market yang tiba-tiba berbalik arah (reversal) pas lo lagi all-in.",
    needs: "Sistem trading yang lebih disiplin dan Stop Loss yang ketat.",
    quote: "Telat masuk satu menit bisa berarti kehilangan 10% potensi profit.",
    compatibility: { trading: 90, airdrop: 40, investing: 30, community: 50, research: 40 },
    psychProfile: { fomo: 90, discipline: 30, conviction: 60, defense: 40, greed: 85 },
    insight: "Tangan lo gatel banget ya kalau liat chart hijau tegak lurus? Lo adalah raja FOMO sejati, Senior. Tiap ada tren baru terbang, lo orang pertama yang loncat ke gerbong. Kelebihan lo adalah mental eksekutor yang sat-set, tapi lo langganan nyangkut di pucuk es karena emosi sesaat. Begitu market merah dikit, lo keringat dingin terus panic sell di harga terendah.",
    bestStrategy: "Pake 'Rule of 5-Minute Cooldown'. Begitu liat koin terbang, jangan langsung klik buy. Tarik nafas dulu 5 menit, cek volume harian di DEX, dan pastiin leverage lo gak overkill sebelum masuk ke market.",
    whatToAvoid: "Hindari beli koin micin baru yang naiknya udah lebih dari 150% dalam 24 jam terakhir. Itu namanya lo sukarela nyerahin leher ke liquidity provider (LP) buat di-dump massal.",
    shadowSide: "Sangat emosional dan gampang goyah. Lo rentan terjebak di harga tertinggi (nyangkut di pucuk) karena keputusan impulsif tanpa riset memadai. Sulit menahan rasa panik saat harga terkoreksi tajam, yang berujung pada kebiasaan panic sell di harga terendah demi melegakan kecemasan sesaat."
  },
  deep_diver: {
    id: 'deep_diver',
    name: "The Deep Diver",
    emoji: "🔬",
    title: "The Scientific Analyst",
    desc: "Lo adalah 'nerd'-nya crypto. Putih-hitam whitepaper udah lo lahap semua. Lo nggak bakal masuk ke project kalau belum tau siapa dev-nya, tokenomics-nya gimana, dan masalah apa yang mereka pecahkan.",
    strengths: ["Keputusan berbasis data", "Jarang kena scam", "Edukator yang baik"],
    weaknesses: ["Analysis paralysis", "Sering telat masuk karena kelamaan mikir"],
    destroyer: "Project 'sampah' tanpa fundamental yang malah naik harganya berkali-kali lipat.",
    needs: "Belajar memahami sentimen market, nggak semua hal di crypto itu logis.",
    quote: "Data nggak pernah bohong, tapi market seringkali gila.",
    compatibility: { trading: 60, airdrop: 50, investing: 80, community: 40, research: 100 },
    psychProfile: { fomo: 10, discipline: 80, conviction: 85, defense: 95, greed: 40 },
    insight: "Lo adalah profesor-nya sirkus crypto ini. Whitepaper puluhan halaman lo lahap habis, github commits lo pantau detail tiap malam. Kelebihannya, lo hampir gak mungkin kena scam receh karena lo paham logika smart contract. Tapi penyakitnya: Analysis Paralysis. Lo sibuk nyari kelemahan kode koin, sementara retail lain udah pesta pora naikin harga meme koin sampah.",
    bestStrategy: "Sadari kalau market crypto itu digerakkan 80% spekulasi & emosi manusia. Dedikasikan 10-15% portfolio lo khusus buat ikutan tren retail (meme/narrative meta) tanpa perlu overthinking perihal teknis.",
    whatToAvoid: "Jangan kelamaan nunggu formula tokenomics yang 'sempurna' pas bull market sedang panas-panasnya. Kadang, momentum gerak jauh lebih penting daripada validitas matematika.",
    shadowSide: "Analysis Paralysis kronis. Lo terlalu sibuk membedah kode kontrak, audit keamanan, dan matematika tokenomics sampai melewatkan momentum terbaik saat tren naik sedang panas. Kerap menolak peluang bagus yang tidak logis di atas kertas, padahal pasar crypto seringkali digerakkan murni oleh sentimen emosional kerumunan."
  },
  community_native: {
    id: 'community_native',
    name: "The Community Native",
    emoji: "📣",
    title: "The Social Guardian",
    desc: "Crypto bagi lo adalah soal orang-orangnya. Lo paling aktif di Discord, sering share 'alpha' di grup Telegram, dan punya networking yang luas banget. Lo percaya kalau bareng-bareng, market bakal lebih mudah ditaklukin.",
    strengths: ["Networking luas", "Akses alpha paling cepat", "Collaborative mindset"],
    weaknesses: ["Social validation bias", "Gampang kemakan grup pump & dump"],
    destroyer: "Drama internal komunitas yang bikin lo kehilangan fokus sama trading lo.",
    needs: "Cek ulang info yang lo dapet, jangan ditelan bulat-bulat cuma karena 'kata temen'.",
    quote: "Jika ingin meluncur cepat, pergilah sendiri. Jika ingin meluncur tinggi, pergilah bersama komunitas.",
    compatibility: { trading: 50, airdrop: 70, investing: 60, community: 100, research: 50 },
    psychProfile: { fomo: 85, discipline: 40, conviction: 50, defense: 30, greed: 65 },
    insight: "Bagi lo, crypto adalah tempat nongkrong virtual. Lo aktif di Twitter Space, ikutan komunitas, dan gampang banget kepancing beli koin cuma karena admin grup TG lo teriak 'to the moon'. Lo ramah banget, tapi gampang kena brainwash shiller koin. Pas grup mulai sepi karena market bearish, lo langsung lunglai dan bingung arah.",
    bestStrategy: "Belajar bikin check-list evaluasi mandiri sebelum beli koin rekomen dari teman. Jadikan bisikan komunitas sebagai referensi awal (DYOR), bukan sebagai kebenaran mutlak buat all-in.",
    whatToAvoid: "Jauhi grup Telegram berbayar yang menjanjikan sinyal cuan 1000% dalam sehari. Itu taktik bandar terselubung buat nge-dump koin tidak likuid ke dompet pengikut setianya.",
    shadowSide: "Sangat mudah dipengaruhi oleh opini massa dan validasi sosial. Opini lo gampang berubah dalam hitungan menit tergantung perbincangan di grup Discord/Telegram. Rentan menjadi target empuk skema manipulasi pasar (Pump & Dump) dari shiller tersembunyi yang lo anggap teman dekat."
  },
  narrative_reader: {
    id: 'narrative_reader',
    name: "The Narrative Reader",
    emoji: "📚",
    title: "The Storyteller Strategist",
    desc: "Lo jago banget baca tren. Lo udah tau kapan narasi AI bakal booming sebelum semua orang bahas. Lo main di level 'cerita' besar market, dan selalu satu langkah di depan kerumunan.",
    strengths: ["Visioner", "Strategic thinker", "Early mover"],
    weaknesses: ["Eksekusi sering kurang", "Gampang bosen kalau narasi berganti"],
    destroyer: "Ketamakan lo sendiri yang bikin lo nggak mau TP pas narasi lagi di puncak.",
    needs: "Disiplin eksekusi, ide bagus tanpa eksekusi cuma jadi mimpi di siang bolong.",
    quote: "Market adalah kumpulan cerita, dan mereka yang menang adalah yang bisa membaca bab selanjutnya.",
    compatibility: { trading: 70, airdrop: 60, investing: 75, community: 70, research: 85 },
    psychProfile: { fomo: 60, discipline: 60, conviction: 70, defense: 65, greed: 75 },
    insight: "Otak lo emang visioner banget, pinter baca arah angin narasi makro! Lo udah beli token AI, Layer-2, atau RWA sebelum influencer YouTube bikin thumbnail kaget. Sayangnya lo kurang disiplin eksekusi target profit. Lo terlalu asik berfantasi tentang seberapa jauh teknologi ini berkembang, sampe lupa kalau bandar udah mulai pelan-pelan jualan barang.",
    bestStrategy: "Selalu bikin batas waktu (expiration date) di setiap narasi yang lo ikuti. Contoh: Tren AI bakal jenuh begitu konfrensi teknologi tahunan selesai. Begitu hari H tiba, bungkus cuan lo tanpa penyesalan.",
    whatToAvoid: "Hindari nostalgia nahan koin dari narasi lama yang udah mati likuiditasnya (seperti metaverse sisa siklus 2021) cuma karena lo rindu masa kejayaan tren tersebut.",
    shadowSide: "Kurang disiplin eksekusi target profit karena terlalu asik memproyeksikan masa depan fiktif. Lo sering membiarkan portofolio yang sempat hijau ratusan persen menguap kembali ke modal awal karena serakah menanti cerita gila lo menjadi kenyataan sempurna di dunia nyata."
  },
  dopamine_trader: {
    id: 'dopamine_trader',
    name: "The Dopamine Trader",
    emoji: "🎰",
    title: "The Adrenaline Seeker",
    desc: "Lo butuh sensasi tiap kali buka app crypto. Candle merah bikin lo deg-degan, candle ijo bikin lo fly. Lo seringkali trading bukan buat cari duit, tapi buat cari rasa 'hidup'.",
    strengths: ["Mental baja (atau nekat)", "Resilience tinggi", "Action oriented"],
    weaknesses: ["Overtrading", "Poor emotional control", "Revenge trading"],
    destroyer: "Leverage gede (100x) di saat lo lagi emosi pengen balas dendam ke market.",
    needs: "Jeda waktu (timeout) setiap kali habis loss besar dan kurangi porsi leverage.",
    quote: "Chart adalah detak jantung lo, dan volatilitas adalah oksigen lo.",
    compatibility: { trading: 100, airdrop: 20, investing: 20, community: 40, research: 30 },
    psychProfile: { fomo: 95, discipline: 15, conviction: 30, defense: 20, greed: 95 },
    insight: "Jujur aja Senior, lo buka exchange bukan buat nabung masa depan, tapi buat ngejar sensasi roller coaster kan? Leverage futures 100x itu nembak dopamin lo ke luar angkasa! Kalau menang lo ngerasa dewa bursa, kalau kalah lo langsung emosi all-in (revenge trade) biar modal balik. Akun lo udah sering kena margin call tapi besoknya didepo lagi.",
    bestStrategy: "Terapkan isolasi modal ekstrem. Taruh 85% modal utama lo di cold wallet (BTC/ETH/Stable), sisakan hanya 15% maksimal buat 'uang bermain' di akun futures. Anggap uang bensin itu hilang dari awal.",
    whatToAvoid: "Jangan sekali-kali menyentuh tombol trading pas lo lagi rugi besar. Tarik kabel, lepas HP, pergi mandi, atau nongkrong keluar cari udara segar biar pikiran lo jernih lagi.",
    shadowSide: "Overtrading ekstrem tanpa kendali emosi (Revenge Trading). Lo memperlakukan pasar seperti kasino untuk memuaskan lonjakan adrenalin harian. Sangat tidak patuh pada stop-loss dan seringkali nekat melipatgandakan leverage di kala emosi, yang berujung pada siklus likuidasi akun berulang kali."
  },
  accumulator: {
    id: 'accumulator',
    name: "The Accumulator",
    emoji: "🐢",
    title: "The Steady Warrior",
    desc: "Prinsip lo sederhana: DCA and chill. Lo nggak pusing sama gejolak harian. Bagi lo, crypto adalah tabungan masa depan yang lo cicil sedikit demi sedikit dengan penuh kedisiplinan.",
    strengths: ["Disiplin tinggi", "Stress level rendah", "Average price bagus"],
    weaknesses: ["Kurang eksploitasi peluang baru", "Terlalu pasif"],
    destroyer: "Kebutuhan mendadak yang bikin lo terpaksa jual 'tabungan' lo di saat harga lagi dipucuk bawah.",
    needs: "Cobalah alokasikan sedikit (5-10%) buat eksplorasi narasi baru biar nggak terlalu kaku.",
    quote: "Kekayaan sejati dibangun tetes demi tetes, bukan sekali siram.",
    compatibility: { trading: 20, airdrop: 30, investing: 100, community: 50, research: 40 },
    psychProfile: { fomo: 15, discipline: 95, conviction: 80, defense: 85, greed: 20 },
    insight: "Si kura-kura baja yang super disiplin! Filosofi lo solid: DCA tiap bulan, tutup monitor, nikmati kopi hangat. Level stres lo terendah se-crypto raya, dan harga rata-rata beli lo mantap banget. Cuma karena lo terlalu cari aman, lo seringkali cuma nonton pas ada gelembung altcoin rilis yang sebenernya bisa ngasih leverage profit cepet.",
    bestStrategy: "Pertahankan 90% rutinitas DCA lo di koin utama. Tapi coba beranikan diri bikin 'Satelit Portfolio' mini sebesar 5-10% modal buat ditaruh di proyek inovatif yang punya risiko tinggi tapi berpotensi multiplier cuan.",
    whatToAvoid: "Sikap terlalu apatis sama perkembangan teknologi baru. Jangan sampai saking dinginnya lo cuek, lo tetap nyimpan koin usang sisa masa lalu yang likuiditas pasarnya makin lama makin kering.",
    shadowSide: "Terlalu kaku dan lambat memanfaatkan peluang emas. Sikap cari aman lo bikin lo enggan mengalokasikan sedikit modal ke sektor inovatif berisiko tinggi yang sebenarnya bisa memberikan lompatan aset yang signifikan. Kadang mengabaikan pembusukan perlahan aset portofolio lama karena terlalu nyaman pasif nabung."
  }
};

// --- COMPONENTS ---

const ProgressBar = ({ current, total }: { current: number, total: number }) => {
  const progress = (current / total) * 100;
  return (
    <div className="w-full h-1 bg-slate-800/40 rounded-full overflow-hidden mb-8 border border-white/5">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
      />
    </div>
  );
};

interface ArchetypeQuizProps {
  setView?: (view: 'dashboard' | 'quiz' | 'security' | 'learning' | 'missions' | 'assistant') => void;
}

export default function ArchetypeQuiz({ setView }: ArchetypeQuizProps) {
  const { user } = useAuth();
  const { address: realAddress } = useAccount();
  const { addReward } = useReward();
  const { hasArchetype, archetype: savedArchetypeId } = useUserStore();
  
  const [step, setStep] = useState<'landing' | 'quiz' | 'result'>(hasArchetype ? 'result' : 'landing');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [hasTakenQuizThisSession, setHasTakenQuizThisSession] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [traits, setTraits] = useState<TraitScores>({
    fomo: 50,
    discipline: 50,
    conviction: 50,
    defense: 50,
    greed: 50
  });

  // Consistent effectiveId: prioritize firebase uid over wallet address
  const mockAddress = localStorage.getItem('crypdo_mock_wallet');
  const address = mockAddress || realAddress;
  const effectiveId = user?.uid || address?.toLowerCase();

  const finalArchetype = useMemo(() => {
    if (step !== 'result') return null;
    
    // If they actively went through the quiz this session, compute from scores (bypass Firestore/cache locks!)
    if (hasTakenQuizThisSession) {
      // Weighted Euclidean distance matching
      const weights = {
        defense: 2.0,
        discipline: 2.0,
        conviction: 1.5,
        fomo: 1.5,
        greed: 1.5,
      };

      let bestArchetypeId: ArchetypeID = 'accumulator';
      let minDistance = Infinity;

      Object.entries(ARCHETYPES).forEach(([id, arch]) => {
        const ideal = arch.psychProfile;
        const dist = Math.sqrt(
          weights.defense * Math.pow(traits.defense - ideal.defense, 2) +
          weights.discipline * Math.pow(traits.discipline - ideal.discipline, 2) +
          weights.conviction * Math.pow(traits.conviction - ideal.conviction, 2) +
          weights.fomo * Math.pow(traits.fomo - ideal.fomo, 2) +
          weights.greed * Math.pow(traits.greed - ideal.greed, 2)
        );

        if (dist < minDistance) {
          minDistance = dist;
          bestArchetypeId = id as ArchetypeID;
        }
      });

      return ARCHETYPES[bestArchetypeId];
    }

    if (hasArchetype && savedArchetypeId && ARCHETYPES[savedArchetypeId]) {
      return ARCHETYPES[savedArchetypeId];
    }
    
    // Fallback computed archetypes
    return ARCHETYPES.accumulator;
  }, [traits, step, hasArchetype, savedArchetypeId, hasTakenQuizThisSession]);

  // Grant reward when result is reached and save archetype
  useEffect(() => {
    if (step === 'result' && finalArchetype && hasTakenQuizThisSession) {
      // Prevent XP farming by checking if they already completed the quiz before
      const hasCompletedQuizBefore = localStorage.getItem('crypdo_archetype');
      if (!hasCompletedQuizBefore) {
        addReward(500);
      }
      
      useUserStore.getState().setTraits(traits);
      useUserStore.getState().setArchetype(finalArchetype.id);
      // Mark mission 1 as completeable
      localStorage.setItem('crypdo_archetype', finalArchetype.id);
      window.dispatchEvent(new Event('storage'));
      
      if (effectiveId) {
        const userRef = doc(db, 'users', effectiveId);
        setDoc(userRef, {
          archetype: finalArchetype.id,
          traits: traits,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch((err: any) => console.error("Archetype sync failed:", err));
      }
    }
  }, [step, finalArchetype, addReward, effectiveId, traits, hasTakenQuizThisSession]);

  // Reset answering lock when step or question changes
  useEffect(() => {
    setIsAnswering(false);
  }, [currentQuestion, step]);

  const handleAnswer = (points: Partial<Record<keyof TraitScores, number>>) => {
    if (isAnswering) return;
    setIsAnswering(true);

    setTraits(prev => {
      const next = { ...prev };
      Object.entries(points).forEach(([key, val]) => {
        const traitKey = key as keyof TraitScores;
        next[traitKey] = Math.max(0, Math.min(100, next[traitKey] + (val || 0)));
      });
      return next;
    });

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setStep('result');
    }
  };

  const restartQuiz = () => {
    // Clear saved archetype in store & localStorage so they can get a new computed score!
    useUserStore.getState().setArchetype('');
    localStorage.removeItem('crypdo_archetype');
    window.dispatchEvent(new Event('storage'));

    setTraits({
      fomo: 50,
      discipline: 50,
      conviction: 50,
      defense: 50,
      greed: 50
    });
    setCurrentQuestion(0);
    setHasTakenQuizThisSession(true);
    setStep('landing');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AnimatePresence mode="wait">
        {step === 'landing' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col gap-8 pt-8 md:pt-16 pb-24 max-w-2xl mx-auto w-full px-4"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vibrant-purple/20 border border-vibrant-purple/30 text-vibrant-purple text-xs font-bold uppercase tracking-tight">
                <div className="w-1.5 h-1.5 rounded-full bg-vibrant-purple animate-pulse shadow-[0_0_8px_#7e22ce]" />
                Profil Investor v1.0
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] text-white">
                What's Your <br />
                <span className="text-gold-accent italic drop-shadow-[0_0_10px_#facc15]">
                  <ScrambleText text="Investor Archetype?" />
                </span>
              </h1>
              <p className="text-slate-400 text-sm md:text-lg leading-relaxed font-medium">
                Cari tahu cerminan psikologis lo di dunia investasi. Apakah lo tipe DCA Lovers, Diamond Hand, atau Trend Surfer?
              </p>
            </div>

            <div className="bg-surface-dark border border-border-purple p-6 rounded-3xl space-y-4 backdrop-blur-md">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-vibrant-purple/10 flex items-center justify-center flex-shrink-0 border border-vibrant-purple/20">
                  <Zap className="w-5 h-5 text-gold-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Behavioral Analysis</h3>
                  <p className="text-xs text-slate-500 leading-tight">Analisa psikologi finansial lo saat menghadapi naik turunnya pasar.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-vibrant-purple/10 flex items-center justify-center flex-shrink-0 border border-vibrant-purple/20">
                  <Target className="w-5 h-5 text-gold-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Investor Insights</h3>
                  <p className="text-xs text-slate-500 leading-tight">Ketahui kelebihan dan kelemahan portofolio lo untuk hasil maksimal.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setHasTakenQuizThisSession(true);
                setStep('quiz');
              }}
              className="group w-full py-5 bg-gradient-to-r from-vibrant-purple to-purple-600 hover:from-gold-accent hover:to-orange-500 text-white hover:text-black font-black uppercase text-sm rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-vibrant-purple/20 hover:shadow-gold-accent/30 active:scale-95 italic"
            >
              START QUIZ
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {import.meta.env.DEV && (
              <div className="bg-slate-900/60 border border-amber-500/30 p-5 rounded-3xl mt-4 space-y-3">
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest text-center flex items-center justify-center gap-2">
                  <span>🧪 DEV BYPASS</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px]">DEVELOPMENT MODE ONLY</span>
                </h4>
                <p className="text-[9px] text-slate-500 font-bold text-center leading-relaxed">
                  Gak usah capek-capek ngerjain 10 kuis berulang kali Senior! Klik salah satu di bawah ini buat ngeliat &amp; nge-test hasil visual dari masing-masing 8 Archetype secara instant:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ARCHETYPES).map(([id, arch]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setTraits(arch.psychProfile);
                        setHasTakenQuizThisSession(true);
                        setStep('result');
                      }}
                      className="py-2.5 px-3 bg-black/40 hover:bg-amber-500/20 text-[10px] text-slate-300 font-bold border border-white/5 rounded-xl transition-all text-left truncate flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span className="text-sm shrink-0">{arch.emoji}</span>
                      <span className="truncate">{arch.name.replace('The ', '')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 pt-8 md:pt-16 flex flex-col max-w-2xl mx-auto w-full px-4"
          >
            <ProgressBar current={currentQuestion + 1} total={QUESTIONS.length} />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col gap-8"
              >
                <div className="min-h-[140px] md:min-h-[180px] flex flex-col justify-center gap-3">
                  <div>
                    <span className="text-gold-accent text-[10px] font-black tracking-widest uppercase italic">
                      Fase Kuis {currentQuestion + 1} / {QUESTIONS.length}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-black leading-tight text-white italic tracking-tighter mt-1">
                      {QUESTIONS[currentQuestion]?.text}
                    </h2>
                  </div>
                  {QUESTIONS[currentQuestion]?.subtext && (
                    <p className="text-slate-500 text-sm italic font-medium">{QUESTIONS[currentQuestion]?.subtext}</p>
                  )}
                </div>

                <div className="grid gap-4 mt-4">
                  {QUESTIONS[currentQuestion]?.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt.points)}
                      className="relative w-full text-left p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-black/40 border-2 border-white/5 hover:border-vibrant-purple hover:bg-vibrant-purple/5 group transition-all duration-300 overflow-hidden cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-vibrant-purple/0 via-vibrant-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative flex items-center gap-4 md:gap-6 z-10">
                        <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl bg-surface-dark border-2 border-white/10 flex items-center justify-center text-slate-500 group-hover:bg-vibrant-purple group-hover:border-vibrant-purple group-hover:text-white transition-all duration-300 font-black text-xs md:text-sm italic shadow-lg group-hover:shadow-[0_0_20px_rgba(126,34,206,0.4)] group-hover:scale-110">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-sm md:text-base font-bold leading-relaxed text-slate-400 group-hover:text-white transition-colors">{opt?.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {step === 'result' && finalArchetype && (
          <ArchetypeResult 
            archetype={{
              id: finalArchetype.id,
              name: finalArchetype.name,
              emoji: finalArchetype.emoji,
              title: finalArchetype.title,
              desc: finalArchetype.desc,
              insight: finalArchetype.insight || finalArchetype.desc,
              strengths: finalArchetype.strengths,
              weaknesses: finalArchetype.weaknesses,
              bestStrategy: finalArchetype.bestStrategy || finalArchetype.needs,
              whatToAvoid: finalArchetype.whatToAvoid || finalArchetype.destroyer,
              shadowSide: finalArchetype.shadowSide,
              psychProfile: finalArchetype.psychProfile
            }}
            onRestart={restartQuiz}
            onContinue={() => {
              if (setView) {
                setView('missions');
              } else {
                restartQuiz();
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
