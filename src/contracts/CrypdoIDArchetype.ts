// src/contracts/CrypdoIDArchetype.ts

export const CRYPDO_ARCHETYPE_ADDRESS = '0x77E958aF5207022d9Ab8F1aCa69F6bA27721bb1B' as const;

export const crypdoArchetypeABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
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
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "hasMinted",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "ownerOf",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "tokenURI",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;