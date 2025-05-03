import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Connection } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  TOKEN_2022_PROGRAM_ID, 
  getAccount, 
  getMint 
} from "@solana/spl-token";
import { useNetwork } from "../contexts/NetworkContext";
import { AlertCircle, CheckCircle2, Loader2, Copy, ExternalLink } from "lucide-react";

// Metaplex constants for token metadata
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const METADATA_PREFIX = "metadata";

export function MyTokens() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [noTokens, setNoTokens] = useState(false);

  const currNetwork = {
    Devnet: "devnet",
    Mainnet: "mainnet-beta",
    Testnet: "testnet",
  };

  function showNotification(message, type) {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }

  // Helper function to fetch token metadata
  async function fetchTokenMetadata(connection, mint) {
    try {
      // Find the metadata PDA address for this mint
      const [metadataPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from(METADATA_PREFIX),
          METADATA_PROGRAM_ID.toBuffer(),
          new PublicKey(mint).toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      // Try to fetch metadata
      const metadataAccount = await connection.getAccountInfo(metadataPDA);
      
      if (!metadataAccount) {
        return { name: "Unknown", symbol: "UNK", image: null };
      }

      // Parse metadata (simplified version)
      // In a production app, use @metaplex-foundation/js or proper metadata parsing
      const data = metadataAccount.data;
      
      // This is a very simplified parser that might not work for all tokens
      // In production, use proper metadata parsing libraries
      try {
        // Skip the first byte which is the metadata version
        let nameLength = data[1];
        let name = data.slice(2, 2 + nameLength).toString('utf8').replace(/\u0000/g, '');
        
        let symbolStart = 2 + nameLength;
        let symbolLength = data[symbolStart];
        let symbol = data.slice(symbolStart + 1, symbolStart + 1 + symbolLength).toString('utf8').replace(/\u0000/g, '');
        
        // For URI, a production app would parse it correctly and fetch the image
        // This is just a placeholder
        return { name, symbol, image: null };
      } catch (e) {
        console.warn("Error parsing metadata:", e);
        return { name: "Unknown", symbol: "UNK", image: null };
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata for mint ${mint}:`, error);
      return { name: "Unknown", symbol: "UNK", image: null };
    }
  }

  async function fetchTokens() {
    if (!wallet.connected || !wallet.publicKey) {
      showNotification("Please connect your wallet to view tokens", "error");
      setTokens([]);
      setNoTokens(false);
      return;
    }

    setIsLoading(true);
    try {
      // Need to fetch both standard tokens and Token-2022 tokens
      const tokenResults = [];
      
      // Fetch standard token accounts
      const standardTokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey, 
        { programId: TOKEN_PROGRAM_ID }
      );
      
      // Fetch Token-2022 accounts (if supported by the connection)
      let token2022Accounts = [];
      try {
        token2022Accounts = await connection.getParsedTokenAccountsByOwner(
          wallet.publicKey,
          { programId: TOKEN_2022_PROGRAM_ID }
        );
      } catch (e) {
        console.warn("Error fetching Token-2022 accounts, might not be supported:", e);
      }
      
      // Combine the results
      const allAccounts = [
        ...standardTokenAccounts.value,
        ...token2022Accounts.value || []
      ];
      
      if (allAccounts.length === 0) {
        setNoTokens(true);
        setTokens([]);
        showNotification("No tokens found for this wallet", "error");
        return;
      }

      // Process token accounts
      const tokenData = await Promise.all(
        allAccounts.map(async (account) => {
          try {
            const parsedInfo = account.account.data.parsed.info;
            const mintAddress = parsedInfo.mint;
            const amount = parsedInfo.tokenAmount.amount;
            const decimals = parsedInfo.tokenAmount.decimals;
            
            // Get mint info to fetch decimals if not available
            let mintInfo;
            try {
              mintInfo = await getMint(
                connection,
                new PublicKey(mintAddress),
                undefined,
                parsedInfo.isNative ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
              );
            } catch (e) {
              console.warn(`Error fetching mint ${mintAddress}:`, e);
            }

            // Fetch token metadata (name, symbol, etc.)
            const metadata = await fetchTokenMetadata(connection, mintAddress);

            const actualDecimals = decimals || (mintInfo?.decimals || 0);
            const actualAmount = BigInt(amount);
            const balance = Number(actualAmount) / Math.pow(10, actualDecimals);

            return {
              mint: mintAddress,
              balance,
              decimals: actualDecimals,
              metadata,
            };
          } catch (error) {
            console.error(`Error processing token account:`, error);
            return null;
          }
        })
      );

      // Filter out errors and zero-balance tokens
      const filteredTokens = tokenData
        .filter(token => token !== null)
        .filter(token => token.balance > 0);

      setTokens(filteredTokens);
      setNoTokens(filteredTokens.length === 0);
      
      if (filteredTokens.length === 0) {
        showNotification("No tokens with non-zero balance found", "error");
      } else {
        showNotification("Tokens fetched successfully!", "success");
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
      showNotification(`Error: ${error.message}`, "error");
      setTokens([]);
      setNoTokens(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (wallet.connected) {
      fetchTokens();
    } else {
      setTokens([]);
      setNoTokens(false);
    }
  }, [wallet.connected, wallet.publicKey, network]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-2xl mb-8">
        <h1 className="text-3xl font-bold text-white text-center mb-2">💰 My Tokens</h1>
        <p className="text-blue-100 text-center text-sm">
          View all tokens owned by your wallet on the Solana {network} network
        </p>
      </div>

      {/* Mainnet Warning */}
      {network === "Mainnet" && wallet.connected && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-6">
          <p className="text-yellow-200 text-sm">
            You are on Mainnet. Ensure you have sufficient SOL for transaction fees.
          </p>
        </div>
      )}

      {/* Wallet Not Connected Warning */}
      {!wallet.connected && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="text-red-400" />
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Wallet Not Connected</h3>
              <p className="text-red-200">
                Please connect your wallet to view your tokens. Use the wallet button in the top-right corner.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && wallet.connected && (
        <div className="flex justify-center items-center p-8">
          <Loader2 size={40} className="text-blue-500 animate-spin" />
        </div>
      )}

      {/* No Tokens Found */}
      {noTokens && wallet.connected && !isLoading && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <p className="text-gray-300 text-lg">No tokens found in your wallet on the {network} network.</p>
          <p className="text-gray-400 text-sm mt-2">
            Create a new token using the "Create Token" page to get started!
          </p>
        </div>
      )}

      {/* Tokens Table */}
      {tokens.length > 0 && !isLoading && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Your Tokens</h2>
          
          {/* Refresh Button */}
          <button
            onClick={fetchTokens}
            className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Refresh Tokens
          </button>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 font-semibold">Token Name</th>
                  <th className="py-3 px-4 font-semibold">Symbol</th>
                  <th className="py-3 px-4 font-semibold">Mint Address</th>
                  <th className="py-3 px-4 font-semibold">Balance</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-4 flex items-center gap-2">
                      {token.metadata.image ? (
                        <img
                          src={token.metadata.image}
                          alt={token.metadata.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-600 rounded-full" />
                      )}
                      {token.metadata.name}
                    </td>
                    <td className="py-3 px-4">{token.metadata.symbol}</td>
                    <td className="py-3 px-4 font-mono text-sm break-all">{token.mint}</td>
                    <td className="py-3 px-4">{token.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 6
                    })}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(token.mint);
                          showNotification("Mint address copied!", "success");
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition"
                        title="Copy Mint Address"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() =>
                          window.open(
                            `https://explorer.solana.com/address/${token.mint}?cluster=${currNetwork[network]}`,
                            "_blank"
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition"
                        title="View on Explorer"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-green-900/90 border border-green-700"
              : "bg-red-900/90 border border-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={20} className="text-green-400" />
          ) : (
            <AlertCircle size={20} className="text-red-400" />
          )}
          <p className="text-white text-sm">{notification.message}</p>
        </div>
      )}
    </div>
  );
}