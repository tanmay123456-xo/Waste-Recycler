import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX = "0xaa36a7";
export const CONTRACT_ADDRESS = "0xE88a606cdD91BA8dc384dDc2027d39Aa192FB47f";
export const RCT_PER_KG = 10;

export const CONTRACT_ABI = [
  { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "rewardUser", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

export async function ensureSepoliaNetwork(): Promise<void> {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  const chainIdHex = await window.ethereum.request({ method: "eth_chainId" }) as string;
  const chainId = parseInt(chainIdHex, 16);
  if (chainId === SEPOLIA_CHAIN_ID) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_HEX }],
    });
  } catch (switchErr: unknown) {
    const err = switchErr as { code?: number };
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: SEPOLIA_HEX,
          chainName: "Sepolia Testnet",
          rpcUrls: ["https://rpc.sepolia.org"],
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        }],
      });
    } else {
      throw switchErr;
    }
  }
}

export async function getTokenBalance(address: string): Promise<number> {
  if (!window.ethereum) return 0;
  const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const raw = await contract.balanceOf(address) as bigint;
  const decimals = await contract.decimals() as bigint;
  return Number(ethers.formatUnits(raw, decimals));
}

export async function callRewardUser(
  userAddress: string,
  amountRCT: number
): Promise<ethers.TransactionResponse> {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  await ensureSepoliaNetwork();
  const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const amountWei = ethers.parseUnits(amountRCT.toString(), 18);
  return contract.rewardUser(userAddress, amountWei) as Promise<ethers.TransactionResponse>;
}
