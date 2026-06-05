// Deployed on Base Mainnet
export const CRYPDO_BADGE_ADDRESS = '0xC61696aF44E338A1b69d97Ba497a6b5cAb45c0b5';
export const CRYPDO_ARCHETYPE_ADDRESS = '0x77E958aF5207022d9Ab8F1aCa69F6bA27721bb1B';
export const CHAIN_ID = 8453; // Base Mainnet

export const crypdoBadgeABI = [
  {
    "inputs": [{ "internalType": "uint8", "name": "tier", "type": "uint8" }],
    "name": "mintBadge",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "uint8", "name": "", "type": "uint8" }
    ],
    "name": "hasMintedTier",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const crypdoArchetypeABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "uri", "type": "string" },
      { "internalType": "string", "name": "_archetypeType", "type": "string" },
      { "internalType": "uint8", "name": "_fomo", "type": "uint8" },
      { "internalType": "uint8", "name": "_greed", "type": "uint8" },
      { "internalType": "uint8", "name": "_scamResistance", "type": "uint8" }
    ],
    "name": "mintArchetype",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "hasMinted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
