
// import { useConnection, useWallet } from "@solana/wallet-adapter-react";
 import { useEffect } from "react";
 import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// export function SolanaFaucet() {
//     const wallet = useWallet();
//     const { connection } = useConnection();
//     const amountRef = useRef();
//     const [balance, setBalance] = useState(null);
//     const [publicKey, setPublicKey] = useState("");

//     // Fetch balance
//     async function fetchBalance(pubKey) {
//         if (!pubKey) return;
//         try {
//             const balance = await connection.getBalance(new PublicKey(pubKey));
//             setBalance(balance / LAMPORTS_PER_SOL);
//         } catch (error) {
//             console.error("Error fetching balance:", error);
//             setBalance(null);
//         }
//     }

//     useEffect(() => {
//         if (wallet.connected && wallet.publicKey) {
//             const interval = setInterval(() => {
//                 fetchBalance(wallet.publicKey.toBase58());
//             }, 2000);

//             return () => clearInterval(interval);
//         }
//     }, [wallet.connected,connection, wallet.publicKey]);

//     // Handle airdrop request
//     async function sendAirdrop() {
//         const solAmount = parseFloat(amountRef.current.value);
//         if (!solAmount || solAmount <= 0) {
//             alert("Please enter a valid amount");
//             return;
//         }

//         const recipient = publicKey || wallet.publicKey?.toBase58();
//         if (!recipient) {
//             alert("Please connect your wallet or enter a public key.");
//             return;
//         }

//         try {
//             const response = await connection.requestAirdrop(
//                 new PublicKey(recipient),
//                 solAmount * LAMPORTS_PER_SOL
//             );
//             console.log("Airdrop requested:", response);
//             alert("Airdrop successful! Check your wallet.");
//             fetchBalance(recipient);
//         } catch (error) {
//             console.error("Airdrop error:", error);
//             alert("Failed to request airdrop.");
//         }
//     }

//     return (
//         <div className="flex flex-col items-center pt-20 min-h-screen bg-gray-900 text-white p-4">

//         {!wallet.connected && (<div> you can proceed by connection wallet or ...</div>)}

//             <div className="relative bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
//                 {/* Display balance in top-right corner if wallet is connected */}
//                 {wallet.connected && balance !== null && (
//                     <div className="absolute top-2 right-2 bg-green-500 text-white text-sm px-3 py-1 rounded-md">
//                         {balance} SOL
//                     </div>
//                 )}

//                 <h1 className="text-2xl font-bold text-center mb-4">Solana Faucet</h1>

//                 {/* Note about Devnet/Testnet */}
//                 <p className="text-red-400 text-center text-sm mb-3">
//                     ⚠️ Faucet is only available on Devnet & Testnet, not Mainnet.
//                 </p>

//                 {/* Wallet/Public Key Input */}
//                 <div className="mb-4">
//                     {wallet.connected ? (
//                         <p className="text-green-400 text-center">
//                             Connected Wallet: {wallet.publicKey?.toBase58()}
//                         </p>
//                     ) : (
//                         <input
//                             type="text"
//                             placeholder="Enter public key"
//                             value={publicKey}
//                             onChange={(e) => setPublicKey(e.target.value)}
//                             className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md outline-none text-white"
//                         />
//                     )}
//                 </div>

//                 {/* Amount Input */}
//                 <input
//                     ref={amountRef}
//                     type="number"
//                     placeholder="Enter SOL amount"
//                     className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md outline-none text-white mb-4"
//                 />

//                 {/* Request Airdrop Button */}
//                 <button
//                     onClick={sendAirdrop}
//                     className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition"
//                 >
//                     Request Airdrop
//                 </button>
//             </div>
//         </div>
//     );
// }





import { useState, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useNetwork } from "../contexts/NetworkContext";
import { AlertCircle, CheckCircle2, Loader2, Wallet, Send } from "lucide-react";

export function SolanaFaucet() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useNetwork();
  const [publicKey, setPublicKey] = useState("");
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const amountRef = useRef(null);

  function showNotification(message, type) {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }

  async function sendAirdrop() {
    if (network === "Mainnet") {
      showNotification("Airdrop is only available on Devnet or Testnet", "error");
      return;
    }

    let pubKey;
    try {
      pubKey = wallet.connected && wallet.publicKey ? wallet.publicKey : new PublicKey(publicKey);
    } catch (error) {
      showNotification("Invalid public key", "error");
      return;
    }

    const amount = parseFloat(amountRef.current?.value);
    if (!amount || amount <= 0) {
      showNotification("Please enter a valid SOL amount", "error");
      return;
    }

    setIsLoading(true);
    try {
      await connection.requestAirdrop(pubKey, amount * 1e9); // Convert SOL to lamports
      showNotification(`Successfully requested ${amount} SOL airdrop!`, "success");

      if (wallet.connected && wallet.publicKey) {
        const newBalance = await connection.getBalance(wallet.publicKey);
        setBalance(newBalance / 1e9); // Convert lamports to SOL
      }
    } catch (error) {
      console.error("Airdrop error:", error);
      showNotification(`Error requesting airdrop: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch balance when wallet connects
//   useState(() => {
//     async function fetchBalance() {
//       if (wallet.connected && wallet.publicKey) {
//         const balance = await connection.getBalance(wallet.publicKey);
//         setBalance(balance / 1e9); // Convert lamports to SOL
//       }
//     }
//     fetchBalance();
//   }, [wallet.connected,connection,network, wallet.publicKey]);


    async function fetchBalance(pubKey) {
        if (!pubKey) return;
        try {
            const balance = await connection.getBalance(new PublicKey(pubKey));
            setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
            console.error("Error fetching balance:", error);
            setBalance(null);
        }
    }

    useEffect(() => {
        if (wallet.connected && wallet.publicKey) {
            const interval = setInterval(() => {
                fetchBalance(wallet.publicKey.toBase58());
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [wallet.connected,connection, wallet.publicKey]);


  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 pt-5">
      {/* Wallet Connection Prompt */}
      {!wallet.connected && (
        <div className="mb-8 bg-blue-900/30 border border-blue-700 rounded-xl p-6 max-w-md w-full animate-fadeIn">
          <div className="flex items-start gap-3">
            <Wallet size={24} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-blue-200 text-sm">
                Connect your wallet to request an airdrop directly, or enter a public key below to proceed manually.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Faucet Card */}
      <div className="relative bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl p-8 w-full max-w-md backdrop-blur-sm animate-fadeIn">
        {/* Balance Display */}
        {wallet.connected && balance !== null && (
          <div className="absolute top-4 right-4 bg-green-500/20 text-green-300 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">
            <CheckCircle2 size={16} />
            {balance.toFixed(4)} SOL
          </div>
        )}

        {/* Header */}
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
          Solana Faucet
        </h1>

        {/* Network Warning */}
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">
            Airdrop is only available on Devnet & Testnet, not Mainnet.
          </p>
        </div>

        {/* Wallet/Public Key Input */}
        <div className="mb-6">
          {wallet.connected ? (
            <div className="bg-gray-700/50 rounded-lg p-3 flex items-center gap-2">
              <Wallet size={18} className="text-green-400" />
              <p className="text-green-300 text-sm font-mono break-all">
                {wallet.publicKey?.toBase58()}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-white/90 font-semibold mb-2">
                Public Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter public key"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-white/90 font-semibold mb-2">
            Amount (SOL) <span className="text-red-400">*</span>
          </label>
          <input
            ref={amountRef}
            type="number"
            placeholder="Enter SOL amount (e.g., 1)"
            step="0.1"
            min="0.1"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum 2 SOL per request on Devnet</p>
        </div>

        {/* Request Airdrop Button */}
        <button
          onClick={sendAirdrop}
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition duration-300 flex items-center justify-center gap-2 ${
            isLoading
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/20"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Requesting Airdrop...
            </>
          ) : (
            <>
              <Send size={20} />
              Request Airdrop
            </>
          )}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg flex items-center gap-3 animate-slideIn ${
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