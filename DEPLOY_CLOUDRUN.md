# 🚀 CrypdoID — Google Cloud Run Deployment Guide

---

## ⚠️ STEP 0 — Fix Bug Kritis di server.ts DULU

Buka `server.ts` lo, cari baris ini:

```ts
const PORT = 3000;
```

Ganti jadi:

```ts
const PORT = parseInt(process.env.PORT || '3000');
```

Cloud Run inject `PORT=8080` otomatis. Kalau hardcoded 3000, container-nya bakal health check gagal dan langsung crash.

---

## STEP 1 — Pastiin Prerequisites

```bash
# Install Google Cloud SDK kalau belum ada
# https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Set project (ganti dengan project ID lo)
gcloud config set project YOUR_GCP_PROJECT_ID

# Enable Cloud Run & Artifact Registry
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
```

---

## STEP 2 — Build & Push Docker Image

```bash
# Di root folder project lo (tempat Dockerfile berada)
# Ganti: YOUR_GCP_PROJECT_ID dan YOUR_REGION (misal: asia-southeast1)

gcloud builds submit \
  --tag gcr.io/YOUR_GCP_PROJECT_ID/crypdoid \
  --project YOUR_GCP_PROJECT_ID
```

Atau kalau mau build lokal dulu:

```bash
docker build -t gcr.io/YOUR_GCP_PROJECT_ID/crypdoid .
docker push gcr.io/YOUR_GCP_PROJECT_ID/crypdoid
```

---

## STEP 3 — Deploy ke Cloud Run

```bash
gcloud run deploy crypdoid \
  --image gcr.io/YOUR_GCP_PROJECT_ID/crypdoid \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --port 8080
```

> **Catatan `--allow-unauthenticated`**: ini biar app bisa diakses publik tanpa auth GCP.  
> Kalau mau private, hapus flag itu.

---

## STEP 4 — Environment Variables yang Dibutuhkan

Set ini di Cloud Run console atau via `--set-env-vars`:

| Variable | Keterangan |
|---|---|
| `GEMINI_API_KEY` | API key Gemini lo (wajib) |
| `NODE_ENV` | Set ke `production` (otomatis dari Dockerfile) |

> **Firebase config** (`firebase-applet-config.json`) sudah di-bake ke dalam image di `/app/firebase-applet-config.json`.  
> Kalau mau lebih aman, pindahin isinya ke Cloud Secret Manager nanti.

---

## STEP 5 — Verifikasi

Setelah deploy selesai, lo bakal dapet URL seperti:
```
https://crypdoid-xxxxxxxxxx-et.a.run.app
```

Test dulu:
```bash
curl https://crypdoid-XXXXX.a.run.app/api/health
# Expected: {"status":"ok","serverTime":"..."}
```

---

## 🐛 Troubleshooting

### Container crash saat startup
- Cek log: `gcloud run logs read --service=crypdoid --region=asia-southeast1`
- Paling sering: PORT masih hardcoded 3000 → fix Step 0

### Gemini error: model not found
- Di `server.ts` ada `model: "gemini-3.5-flash"` — **model ini gak ada**.
- Ganti ke: `"gemini-1.5-flash"` atau `"gemini-2.0-flash-exp"`

### Firebase Admin gagal init
- Pastiin `firebase-applet-config.json` ter-copy ke image (cek Dockerfile baris COPY)
- Atau set `GOOGLE_APPLICATION_CREDENTIALS` kalau pakai service account

### Cold start lambat
- Ini normal untuk `--min-instances 0` (free tier)
- Kalau mau always-on: `--min-instances 1` (ada biaya tambahan)

---

## 💰 Estimasi Biaya

- **Cloud Run free tier**: 2 juta request/bulan gratis
- **Compute**: 180,000 vCPU-seconds + 360,000 GB-seconds gratis/bulan
- Untuk traffic pemula (< 10K user/bulan): **practically free**

---

## One-liner kalau udah familiar

```bash
gcloud run deploy crypdoid \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY
```

Flag `--source .` bikin Cloud Build otomatis build Docker image dari source — gak perlu push manual.
