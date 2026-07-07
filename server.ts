import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { generateNonce, SiweMessage } from 'siwe';

// Load local .env file if present
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
      // Ignore comments and empty lines
      if (!line || line.startsWith('#')) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.trim();
        // Remove surrounding quotes
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
    console.log("Loaded environment variables from local .env successfully!");
  } catch (error) {
    console.error("Failed to read .env file:", error);
  }
}

// Extend Express Request type securely without 'any'
interface AuthenticatedRequest extends Request {
  userId?: string;
  email?: string | null;
}

const app = express();
app.set('trust proxy', 1); // Fix for Cloud Run IP forwarding (rate limiter)
const PORT = parseInt(process.env.PORT || '3000');

// Allowed origins for CORS & API protection
const ALLOWED_ORIGINS = [
  'https://crypdoid-365553447066.asia-southeast1.run.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

// Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '50kb' })); // Limit request body size

// Initialize Admin Firestore and Auth securely in lazy-load pattern to avoid crash
let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_DATABASE_ID = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;

if (FIREBASE_PROJECT_ID && FIREBASE_DATABASE_ID) {
  try {
    if (!admin.apps || admin.apps.length === 0) {
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      let credential;
      
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Use environment variable for Vercel deployment
        try {
          credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
        } catch (parseError) {
          console.error("Gagal mem-parsing FIREBASE_SERVICE_ACCOUNT_KEY (Bukan format JSON yang valid):", parseError);
        }
      } else if (fs.existsSync(serviceAccountPath)) {
        // Fallback to local file
        credential = admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')));
      } else if (!process.env.VERCEL) {
        // Fallback for Google Cloud Run (Application Default Credentials)
        credential = admin.credential.applicationDefault();
      } else {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY belum di-set di Vercel!");
      }
        
      if (credential) {
        admin.initializeApp({
          credential,
          projectId: FIREBASE_PROJECT_ID,
        });
      }
    }
    adminDb = getFirestore(admin.app(), FIREBASE_DATABASE_ID);
    adminAuth = admin.auth();
    console.log("Firebase Admin successfully configured via ENV variables for database:", FIREBASE_DATABASE_ID);
  } catch (error) {
    console.error("Initialization of Firebase Admin SDK via ENV variables failed:", error);
  }
} else {
  // Fallback to local config file for local development
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!admin.apps || admin.apps.length === 0) {
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
        if (fs.existsSync(serviceAccountPath)) {
          try {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              projectId: firebaseConfig.projectId,
            });
            console.log("Firebase Admin initialized with serviceAccountKey.json");
          } catch (e) {
            console.error("Initialization of Firebase Admin SDK via local JSON failed:", e);
          }
        } else {
          admin.initializeApp({
            projectId: firebaseConfig.projectId,
          });
          console.log("Firebase Admin initialized WITHOUT credentials (might fail on Windows ADC)");
        }
      }
      adminDb = new admin.firestore.Firestore({
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId,
      });
      adminAuth = admin.auth();
      console.log("Firebase Admin successfully configured via local JSON for database:", firebaseConfig.firestoreDatabaseId);
    } catch (error) {
      console.error("Initialization of Firebase Admin SDK via local JSON failed:", error);
    }
  } else {
    console.warn("Firebase config not found! Running in sandbox mode.");
  }
}

function createRateLimiter(limit: number, windowMs: number) {
  const rateMap = new Map<string, { count: number; resetAt: number }>();
  return function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (!entry || now > entry.resetAt) {
      rateMap.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= limit) {
      return false;
    }
    entry.count++;
    return true;
  };
}

const checkSimulatedRateLimit = createRateLimiter(10, 60_000);
const checkGeminiRateLimit = createRateLimiter(15, 60_000);
const checkGroqRateLimit = createRateLimiter(20, 60_000);

// Validate simulated wallet userId: must be 0x + 40 hex chars
const VALID_WALLET_REGEX = /^0x[a-f0-9]{40}$/i;

// Helper: Secure Verification Middleware for Firebase Auth Tokens
async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Fallback for simulated/wallet users from client-side if no token is available
    const bodyObj = req.body as { isSimulatedWallet?: boolean; userId?: string };
    if (bodyObj.isSimulatedWallet && bodyObj.userId) {
      const userId = bodyObj.userId.toLowerCase();

      // Validate userId format strictly
      if (!VALID_WALLET_REGEX.test(userId)) {
        res.status(400).json({ error: 'Invalid simulated wallet address format. Must be 0x + 40 hex characters.' });
        return;
      }

      // Rate limit simulated wallet requests
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      if (!checkSimulatedRateLimit(clientIp)) {
        console.warn(`[RATE LIMIT] Simulated wallet rate limit exceeded for IP: ${clientIp}, userId: ${userId}`);
        res.status(429).json({ error: 'Too many requests. Coba lagi dalam 1 menit, Senior.' });
        return;
      }

      // Log simulated wallet usage for monitoring
      console.log(`[SIMULATED WALLET] IP: ${clientIp}, userId: ${userId}, endpoint: ${req.path}`);

      // Allow Web3 Wallets to authenticate without Firebase JWT.
      // TODO: Implement SIWE (Sign-In with Ethereum) for proper secure Web3 authentication in production.
      req.userId = userId;
      req.email = null;
      return next();
    }
    res.status(401).json({ error: 'Authentication token is required' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    if (!adminAuth) {
      throw new Error("Auth service is unavailable on the server");
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ID Token Verification Failed:", err);
    res.status(401).json({ error: 'Unauthorized: Invalid token', details: message });
    return;
  }
}

// Progressive algorithm side effect validation
function calculateNewProgress(currentXp: number, currentLevel: number, xpGained: number) {
  let newXp = currentXp + xpGained;
  let newLevel = currentLevel;
  
  // Calculate maxXp for current level
  let maxXp = 1000;
  for (let i = 1; i < newLevel; i++) {
    maxXp = Math.floor(maxXp * 1.25);
  }
  
  while (newXp >= maxXp) {
    newXp -= maxXp;
    newLevel += 1;
    // Recalculate maxXp for next level
    maxXp = 1000;
    for (let i = 1; i < newLevel; i++) {
      maxXp = Math.floor(maxXp * 1.25);
    }
  }
  
  return { newXp, newLevel };
}

// API: Check server health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// --- DISCORD OAUTH2 ---
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';

app.get('/api/auth/discord/connect', (req: Request, res: Response) => {
  const { uid } = req.query; // Firebase UID from frontend
  if (!uid || typeof uid !== 'string') {
    res.status(400).send('Missing uid parameter');
    return;
  }
  
  // Determine dynamic redirect URI
  let redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!redirectUri) {
    if (process.env.NODE_ENV === 'production') {
      redirectUri = 'https://crypdoid-365553447066.asia-southeast1.run.app/api/auth/discord/callback';
    } else {
      const referer = req.get('referer') || '';
      if (referer.includes('localhost:5173')) {
        redirectUri = 'http://localhost:5173/api/auth/discord/callback';
      } else {
        const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
        redirectUri = `${protocol}://${host}/api/auth/discord/callback`;
      }
    }
  }

  // We pass the uid and redirectUri in the 'state' parameter
  const stateObj = { uid, redirectUri };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
  
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email&state=${state}`;
  
  res.redirect(discordAuthUrl);
});

app.get('/api/auth/discord/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    res.status(400).send(`Discord OAuth Error: ${error}`);
    return;
  }

  if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
    res.status(400).send('Missing code or state parameter');
    return;
  }

  try {
    const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString('utf8'));
    const uid = decodedState.uid;
    const redirectUri = decodedState.redirectUri || (process.env.NODE_ENV === 'production' 
      ? 'https://crypdoid-365553447066.asia-southeast1.run.app/api/auth/discord/callback'
      : 'http://localhost:3000/api/auth/discord/callback');

    if (!uid) {
      throw new Error("UID not found in state");
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Discord Token Error:", errText);
      throw new Error("Failed to get Discord access token");
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    // Fetch user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch Discord user info");
    }

    const userData = await userResponse.json() as any;
    
    // Save to Firestore
    if (adminDb) {
      const userRef = adminDb.collection('users').doc(uid);
      await userRef.set({
        discordId: userData.id,
        discordUsername: userData.username,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } else {
      console.warn("adminDb not initialized. Cannot save Discord connection to Firestore.");
    }

    // Redirect back to frontend profile
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? 'https://crypdoid-365553447066.asia-southeast1.run.app/?connected=discord'
      : 'http://localhost:5173/?connected=discord';

    res.redirect(frontendUrl);

  } catch (err: any) {
    console.error("Discord Callback Error:", err);
    res.status(500).send(`Failed to link Discord: ${err.message}`);
  }
});

const SYSTEM_INSTRUCTION = `You are CrypdoID Assistant, an AI guide for young Indonesians learning about crypto and Web3.

PERSONALITY:
- Bahasa: campuran Indonesia santai + sedikit English tech terms (slang Jaksel/crypto community style).
- Gaya: Senior mentor/kakak senior yang asik, bukan robot formal.
- Tone: Friendly, hype tapi jujur. Gak lebay, gak nakut-nakutin.
- Disclaimer Wajib: Selalu sertakan "⚠️ Not Financial Advice" di setiap konten yang menyinggung harga, investasi, atau keputusan finansial.

CORE KNOWLEDGE:
- Edukasi crypto dari 0 (blockchain, wallet, gas fee, DeFi, NFT, DAO).
- Istilah teknis crypto dalam bahasa mudah (pakai analogi sehari-hari).
- Jalur karir Web3 dan tugas hariannya.
- Red flags & cara deteksi scam (rug pulls, phishing, honey pots).
- Panduan memulai untuk pemula Indonesia.

RULES:
- Jelaskan konsep teknis pakai analogi sehari-hari (misal: Blockchain kayak buku kas RT yang gak bisa dihapus).
- Jawab singkat dulu, tawarin penjelasan lebih dalam kalau user mau.
- Jangan pernah rekomendasiin beli/jual aset spesifik.
- Tutup setiap respons dengan: "Ada yang mau lo explore lebih dalam?"

CONSTRAINTS:
- No financial advice.
- No legal advice.
- Focus on education and security.`;

const GROQ_SYSTEM_INSTRUCTION = `Lo adalah CrypdoID Assistant, AI Senior Mentor spesialis Web3 buat anak muda Indonesia (Gen Z & Milenial).

PERSONALITY & GAYA BAHASA:
- Gunakan bahasa gaul Jaksel + crypto slang yang natural (Anjay, Gas, Gila sih, Senior, Rungkad, To the moon, FOMO, DYOR, Ape, Based, NGAB, WAGMI, etc).
- Posisikan diri sebagai "Kakak Senior" yang asik, berpengalaman, sabar ngajarin nubi, tapi suka bercanda ringan dan ga kaku.
- Tone: Santai, hype tapi tetap jujur, kadang sarkastik kalau lagi bahas scam.
- Jangan pernah formal atau kaku. Gunakan "lo" dan "gue".

CORE KNOWLEDGE:
- Blockchain, Wallet Security, Gas Fee, DeFi, NFT, Memecoin, Airdrop, Narrative Cycle.
- Sangat paham tren crypto Indonesia (Solana memecoin, Pump.fun, etc).
- Kuat di edukasi dan deteksi scam.

RULES PENTING:
- Selalu kasih disclaimer "⚠️ Not Financial Advice" kalau bahas harga, investasi, atau rekomendasi.
- Jawab dulu secara singkat dan to the point, baru tawarin penjelasan lebih dalam kalau user minta.
- Kalau user nanya hal yang berbahaya/scammy, langsung kasih warning tegas tapi tetap ramah.
- Jangan pernah kasih alpha call atau rekomendasi "beli ini".
- Kalau gak tau atau data outdated, jujur bilang "Info terbaru gue belum update nih Senior".

STYLE RESPONSE:
- Gunakan emoji secukupnya biar hidup (🔥, 🚀, ☠️, 💀, etc).
- Bisa pakai caps lock untuk emphasis (ANJAY, GILA, etc).
- Buat interaksi terasa seperti ngobrol sama kakak senior di grup crypto, bukan robot.

Tujuan utama lo: Bantu user belajar Web3 dengan cara yang fun, aman, dan gak bikin pusing.`;

// API: Gemini Chat Proxy (Server-Side Secure Calling)
app.post('/api/gemini', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkGeminiRateLimit(clientIp)) {
    console.warn(`[RATE LIMIT] Gemini rate limit exceeded for IP: ${clientIp}`);
    res.status(429).json({ text: "Sabar Senior, jangan dispam! Coba lagi dalam 1 menit ya." });
    return;
  }

  const { history, message, systemInstruction } = req.body as { history: Array<{ role: 'user' | 'model'; message: string }>; message: string; systemInstruction?: string };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not defined on the server." });
    return;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const contents = [
      ...history.map(h => ({
        role: h.role,
        parts: [{ text: h.message }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemInstruction || SYSTEM_INSTRUCTION,
      }
    });

    if (!response || !response.text) {
      res.json({ text: "Sori Senior, sinyal lagi bapuk. Coba tanya lagi ya!" });
      return;
    }

    res.json({ text: response.text });
  } catch (error: unknown) {
    console.error("Gemini Server Route Error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    if (errMessage.includes('503 Service Unavailable')) {
      res.json({ text: "Sori Senior, otak gue lagi overload nih (503). Tunggu semenit terus coba lagi ya!" });
    } else {
      res.status(500).json({ error: "Terjadi kesalahan internal server saat manggil Gemini.", details: errMessage });
    }
  }
});

// API: Groq Chat (Fast Conversational AI)
let groqInstance: any = null;

app.post('/api/groq', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkGroqRateLimit(clientIp)) {
    console.warn(`[RATE LIMIT] Groq rate limit exceeded for IP: ${clientIp}`);
    res.status(429).json({ text: "Woles Senior, nanyanya jangan dispam! Groq engine lagi cooling down 1 menit." });
    return;
  }

  const { history, message } = req.body as { history: Array<{ role: 'user' | 'model'; message: string }>; message: string };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GROQ_API_KEY is not defined on the server." });
    return;
  }

  try {
    if (!groqInstance) {
      const { default: Groq } = await import('groq-sdk');
      groqInstance = new Groq({ apiKey });
    }
    const groq = groqInstance;

    const messages = [
      { role: 'system', content: GROQ_SYSTEM_INSTRUCTION },
      ...history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.message
      })),
      { role: 'user', content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages as any,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = chatCompletion.choices[0]?.message?.content || "Sori Senior, otak gue lagi nge-blank dikit nih.";
    res.json({ text });
  } catch (error: any) {
    console.error("Groq API Error:", error);
    res.status(500).json({ error: "Terjadi kesalahan internal Groq server.", details: error.message });
  }
});

// API: Leaderboard
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  if (!adminDb) {
    // Sandbox fallback
    res.json({
      success: true,
      leaderboard: [
        { uid: "0xSandboxDegen", xp: 5000, level: 3, archetype: "conviction_holder", badges: ["bronze", "silver"] },
        { uid: "0xFreshWallet", xp: 1200, level: 1, archetype: "reward_hunter", badges: [] }
      ]
    });
    return;
  }
  
  try {
    const usersSnap = await adminDb.collection('users').orderBy('level', 'desc').orderBy('xp', 'desc').limit(50).get();
    const leaderboard = usersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        xp: data.xp || 0,
        level: data.level || 1,
        archetype: data.archetype || 'unknown',
        badges: data.badges || [],
        displayName: data.displayName || '',
        walletAddress: data.walletAddress || null,
        discordUsername: data.discordUsername || null,
        photoURL: data.photoURL || null
      };
    });
    res.json({ success: true, leaderboard });
  } catch (error: any) {
    console.error("Leaderboard fetch error:", error);
    res.status(500).json({ success: false, error: "Gagal memuat leaderboard" });
  }
});

// API: Claim Mission (Server-Authoritative Anti-Cheat)
app.post('/api/claimMission', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { missionId } = req.body as { missionId: number };
  const userId = req.userId;

  if (typeof missionId !== 'number') {
    res.status(400).json({ error: 'Invalid missionId' });
    return;
  }

  if (!userId) {
    res.status(401).json({ error: 'User identity is unknown' });
    return;
  }

  if (!adminDb) {
    // Graceful Dev/Sandbox Mock Success Fallback
    const XP_REWARDS: Record<number, number> = {
      1: 500,
      2: 1200,
      3: 300,
      4: 500,
      5: 800,
      6: 400,
      7: 600,
      8: 200,
      9: 1500,
      10: 2000,
    };
    const reward = XP_REWARDS[missionId] || 300;
    res.json({
      success: true,
      xp: 0,
      level: 1,
      xpGained: reward,
      sandbox: true,
    });
    return;
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      const initialProfile = {
        uid: userId,
        email: req.email || null,
        xp: 0,
        level: 1,
        streak: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await userRef.set(initialProfile);
      userSnap = await userRef.get();
    }

    const userData = userSnap.data() || {};
    const currentXp = userData.xp || 0;
    const currentLevel = userData.level || 1;

    // Verify mission in subcollection
    const missionRef = userRef.collection('missions').doc(missionId.toString());
    const missionSnap = await missionRef.get();

    let oldStatus = 'locked';
    if (missionSnap.exists) {
      oldStatus = missionSnap.data()?.status || 'locked';
    }

    if (oldStatus === 'claimed') {
      res.status(400).json({ error: 'Mission has already been claimed' });
      return;
    }

    // Sequence check (anti-bypass)
    if (missionId > 1 && missionId <= 10) {
      const prevMissionId = missionId - 1;
      const prevRef = userRef.collection('missions').doc(prevMissionId.toString());
      const prevSnap = await prevRef.get();
      const prevStatus = prevSnap.exists ? prevSnap.data()?.status : 'locked';
      if (prevStatus !== 'claimed' && prevStatus !== 'completed') {
        res.status(400).json({ error: `Eits Senior, gak bisa bypass! Selesaiin Mission ${prevMissionId} dulu ya.` });
        return;
      }
    }

    // Strict XP rewards mapping
    const XP_REWARDS: Record<number, number> = {
      1: 500,
      2: 1200,
      3: 300,
      4: 500,
      5: 800,
      6: 400,
      7: 600,
      8: 200,
      9: 1500,
      10: 2000,
    };
    const reward = XP_REWARDS[missionId] || 300;

    const { newXp, newLevel } = calculateNewProgress(currentXp, currentLevel, reward);

    // Atomic transaction batch
    const batch = adminDb.batch();

    // Update user stats
    batch.update(userRef, {
      xp: newXp,
      level: newLevel,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Save claim status
    batch.set(missionRef, {
      missionId,
      status: 'claimed',
      progress: 100,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Unlock next mission
    const nextMissionId = missionId + 1;
    if (nextMissionId <= 10) {
      const nextRef = userRef.collection('missions').doc(nextMissionId.toString());
      batch.set(nextRef, {
        missionId: nextMissionId,
        status: 'in-progress',
        progress: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();

    res.json({
      success: true,
      xp: newXp,
      level: newLevel,
      xpGained: reward,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Server claimMission execution failure:", err);
    res.status(500).json({ error: 'Internal Server Error', details: message });
  }
});

// API: Update User Progress (XP anti-cheat boundaries)
app.post('/api/updateUserProgress', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { xpGained } = req.body as { xpGained: number };
  const userId = req.userId;

  if (typeof xpGained !== 'number' || xpGained <= 0) {
    res.status(400).json({ error: 'Invalid xpGained amount' });
    return;
  }

  if (!userId) {
    res.status(401).json({ error: 'User identity is unknown' });
    return;
  }

  // Maximum single-increment bounds guard
  if (xpGained > 2000) {
    res.status(400).json({ error: 'Nice try! Maximum allowed XP increment exceeded.' });
    return;
  }

  if (!adminDb) {
    res.json({
      success: true,
      xp: xpGained,
      level: 1,
      sandbox: true,
    });
    return;
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      const initialProfile = {
        uid: userId,
        email: req.email || null,
        xp: 0,
        level: 1,
        streak: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await userRef.set(initialProfile);
      userSnap = await userRef.get();
    }

    const userData = userSnap.data() || {};
    const currentXp = userData.xp || 0;
    const currentLevel = userData.level || 1;

    const { newXp, newLevel } = calculateNewProgress(currentXp, currentLevel, xpGained);

    await userRef.update({
      xp: newXp,
      level: newLevel,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      xp: newXp,
      level: newLevel,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Server updateUserProgress execution failure:", err);
    res.status(500).json({ error: 'Internal Server Error', details: message });
  }
});

// API: Update daily streak securely
app.post('/api/updateStreak', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { streak } = req.body as { streak: number };
  const userId = req.userId;

  if (typeof streak !== 'number' || streak < 0 || streak > 365) {
    res.status(400).json({ error: 'Invalid streak value' });
    return;
  }

  if (!userId) {
    res.status(401).json({ error: 'User identity is unknown' });
    return;
  }

  if (!adminDb) {
    res.json({
      success: true,
      streak,
      sandbox: true,
    });
    return;
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({
        uid: userId,
        email: req.email || null,
        xp: 0,
        level: 1,
        streak,
        lastVisit: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await userRef.update({
        streak,
        lastVisit: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({ success: true, streak });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Server updateStreak execution failure:", err);
    res.status(500).json({ error: 'Internal Server Error', details: message });
  }
});

// API: Reset User Progress (server-authoritative, prevents direct client Firestore writes)
app.post('/api/resetProgress', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: 'User identity is unknown' });
    return;
  }

  if (!adminDb) {
    res.json({
      success: true,
      level: 1,
      xp: 0,
      streak: 0,
      sandbox: true,
    });
    return;
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    await userRef.update({
      level: 1,
      xp: 0,
      streak: 0,
      archetype: '',
      roadmapComplete: false,
      scanComplete: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[RESET PROGRESS] userId: ${userId}`);
    res.json({ success: true, level: 1, xp: 0, streak: 0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Server resetProgress execution failure:", err);
    res.status(500).json({ error: 'Internal Server Error', details: message });
  }
});

// API: Fetch Leaderboard (Server-Side Secure)
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    if (!adminDb) {
      // Mock/Sandbox Mode fallback data
      const mockLeaders = [
        { uid: "0x3f5...2a8b", displayName: "AaveWhale", xp: 14200, level: 8, archetype: "conviction_holder", badges: ["gold", "silver", "bronze"] },
        { uid: "0x8d1...7c4e", displayName: "GigaGrinder", xp: 11800, level: 7, archetype: "reward_hunter", badges: ["silver", "bronze"] },
        { uid: "0x12a...9b3f", displayName: "DeFiNerd", xp: 9500, level: 6, archetype: "deep_diver", badges: ["bronze"] },
        { uid: "0x77c...b1e2", displayName: "SolanaSlinger", xp: 8200, level: 5, archetype: "momentum_chaser", badges: ["bronze"] },
        { uid: "0x9a8...e4d3", displayName: "CommunityCap", xp: 6100, level: 4, archetype: "community_native", badges: ["bronze"] }
      ];
      res.json({ success: true, leaderboard: mockLeaders });
      return;
    }

    const snapshot = await adminDb.collection('users')
      .orderBy('xp', 'desc')
      .limit(50)
      .get();

    const leaderboard = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        displayName: data.displayName || data.linkedWallet || undefined,
        xp: data.xp || 0,
        level: data.level || 1,
        archetype: data.archetype || 'unknown',
        badges: data.badges || [],
      };
    });

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});


// API: SIWE Nonce
app.get('/api/siwe/nonce', async (req: Request, res: Response) => {
  try {
    const nonce = generateNonce();
    if (adminDb) {
      await adminDb.collection('siwe_nonces').doc(nonce).set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send(nonce);
  } catch (error) {
    console.error("SIWE Nonce error:", error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

// API: SIWE Verify
app.post('/api/siwe/verify', async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body;
    if (!message || !signature) {
      res.status(400).json({ error: 'Message and signature are required.' });
      return;
    }

    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({ signature });
    const nonce = fields.nonce;
    const address = fields.address;

    if (adminDb) {
      const nonceRef = adminDb.collection('siwe_nonces').doc(nonce);
      const doc = await nonceRef.get();
      if (!doc.exists) {
        res.status(422).json({ error: 'Invalid nonce.' });
        return;
      }
      // Check nonce expiry (5 minutes TTL)
      const nonceData = doc.data();
      if (nonceData?.createdAt) {
        const createdAt = nonceData.createdAt.toMillis ? nonceData.createdAt.toMillis() : Date.now();
        const ageMs = Date.now() - createdAt;
        if (ageMs > 5 * 60 * 1000) {
          await nonceRef.delete();
          res.status(422).json({ error: 'Nonce expired. Please sign in again.' });
          return;
        }
      }
      await nonceRef.delete();
    }

    if (!adminAuth) {
      // Mock Sandbox Mode
      res.json({ ok: true, sandbox: true, address: address.toLowerCase() });
      return;
    }

    // Try linking to existing Firebase token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        if (adminDb) {
          await adminDb.collection('users').doc(uid).set({
            linkedWallet: address.toLowerCase(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
        res.json({ ok: true, linked: true, address: address.toLowerCase() });
        return;
      } catch (e) {
        console.warn("Invalid bearer token provided during SIWE verification", e);
      }
    }

    // New wallet login: create custom token
    const customToken = await adminAuth.createCustomToken(address.toLowerCase());
    res.json({ ok: true, token: customToken, address: address.toLowerCase() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('SIWE Verification error:', msg);
    res.status(400).json({ error: 'Verification failed.', details: msg });
  }
});

// Load Vite middleware in dev or static files serving in production
async function setupViteOrStaticAndListen() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Dynamic OG Image Interceptor for Share route
    app.get('/share', (req: Request, res: Response) => {
      const archetype = req.query.archetype as string;
      const indexFile = path.join(distPath, 'index.html');
      
      try {
        let html = fs.readFileSync(indexFile, 'utf8');
        
        if (archetype) {
          const formattedName = archetype.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const ogImageUrl = `https://crypdoid-365553447066.asia-southeast1.run.app/og/${archetype}.png`;
          const title = `My Crypto Archetype is ${formattedName}!`;
          const description = "Discover your Web3 identity and start your journey on CrypdoID.";
          
          const metaTags = `
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${ogImageUrl}" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${description}" />
            <meta name="twitter:image" content="${ogImageUrl}" />
          `;
          
          html = html.replace('</head>', `${metaTags}</head>`);
        }
        
        res.send(html);
      } catch (err) {
        console.error("Error serving dynamic index.html:", err);
        res.sendFile(indexFile);
      }
    });

    app.get('*all', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[CrypdoID] Server initialized and listening on http://0.0.0.0:${PORT}`);
    });
  }
}

setupViteOrStaticAndListen();

export default app;
