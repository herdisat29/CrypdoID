# CrypdoID

CrypdoID is a web-based crypto assistant with interactive learning paths, scam radar, and personalized portfolio archetypes.

## Technologies Used
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Web3**: Wagmi, Viem, WalletConnect
- **Backend/AI**: Google Gemini API, Groq SDK
- **Database**: Firebase

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables in `.env`:
   - `GEMINI_API_KEY`
   - `VITE_GROQ_API_KEY`
   *(See `.env.example` for reference)*
3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

Refer to `DEPLOY_CLOUDRUN.md` for instructions on deploying the application to Google Cloud Run.
