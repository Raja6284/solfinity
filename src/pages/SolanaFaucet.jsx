
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState, useRef, useEffect } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export function SolanaFaucet() {
    const wallet = useWallet();
    const { connection } = useConnection();
    const amountRef = useRef();
    const [balance, setBalance] = useState(null);
    const [publicKey, setPublicKey] = useState("");

    // Fetch balance
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
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [wallet.connected, wallet.publicKey]);

    // Handle airdrop request
    async function sendAirdrop() {
        const solAmount = parseFloat(amountRef.current.value);
        if (!solAmount || solAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        const recipient = publicKey || wallet.publicKey?.toBase58();
        if (!recipient) {
            alert("Please connect your wallet or enter a public key.");
            return;
        }

        try {
            const response = await connection.requestAirdrop(
                new PublicKey(recipient),
                solAmount * LAMPORTS_PER_SOL
            );
            console.log("Airdrop requested:", response);
            alert("Airdrop successful! Check your wallet.");
            fetchBalance(recipient);
        } catch (error) {
            console.error("Airdrop error:", error);
            alert("Failed to request airdrop.");
        }
    }

    return (
        <div className="flex flex-col items-center pt-20 min-h-screen bg-gray-900 text-white p-4">

        {!wallet.connected && (<div> you can proceed by connection wallet or ...</div>)}

            <div className="relative bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                {/* Display balance in top-right corner if wallet is connected */}
                {wallet.connected && balance !== null && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-sm px-3 py-1 rounded-md">
                        {balance} SOL
                    </div>
                )}

                <h1 className="text-2xl font-bold text-center mb-4">Solana Faucet</h1>

                {/* Note about Devnet/Testnet */}
                <p className="text-red-400 text-center text-sm mb-3">
                    ⚠️ Faucet is only available on Devnet & Testnet, not Mainnet.
                </p>

                {/* Wallet/Public Key Input */}
                <div className="mb-4">
                    {wallet.connected ? (
                        <p className="text-green-400 text-center">
                            Connected Wallet: {wallet.publicKey?.toBase58()}
                        </p>
                    ) : (
                        <input
                            type="text"
                            placeholder="Enter public key"
                            value={publicKey}
                            onChange={(e) => setPublicKey(e.target.value)}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md outline-none text-white"
                        />
                    )}
                </div>

                {/* Amount Input */}
                <input
                    ref={amountRef}
                    type="number"
                    placeholder="Enter SOL amount"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md outline-none text-white mb-4"
                />

                {/* Request Airdrop Button */}
                <button
                    onClick={sendAirdrop}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition"
                >
                    Request Airdrop
                </button>
            </div>
        </div>
    );
}
