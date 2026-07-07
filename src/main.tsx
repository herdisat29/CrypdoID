import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider, createConfig, http, fallback } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet, base } from 'viem/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient();

const wcProjectId = (import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string) || 'ddbd18c25287f60a364cf29920bc4b72';

const config = createConfig({
  chains: [mainnet, base],
  connectors: [
    injected(),
    walletConnect({
      projectId: wcProjectId,
      showQrModal: true,
      metadata: {
        name: 'CrypdoID',
        description: 'AI Crypto Companion for Indonesian Youth',
        url: window.location.origin,
        icons: ['https://crypdoid.com/icon.png']
      }
    }),
  ],
  transports: {
    [mainnet.id]: http('https://cloudflare-eth.com'),
    [base.id]: fallback([
      http('https://base.drpc.org'),
      http('https://base-rpc.publicnode.com'),
      http('https://mainnet.base.org')
    ]),
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
