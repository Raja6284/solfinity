import { useState, useRef, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction, 
  getAssociatedTokenAddress,
  getMint
} from "@solana/spl-token";
import { useNetwork } from "../contexts/NetworkContext";
import { AlertCircle, CheckCircle2, Loader2, Droplet } from "lucide-react";

// Raydium v4 liquidity program ID
const RAYDIUM_LIQUIDITY_V4_PROGRAM_ID = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");

export function CreateLiquidity() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [poolCreated, setPoolCreated] = useState(false);
  const [poolAddress, setPoolAddress] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(9); // Default to 9 decimals
  const tokenAddressRef = useRef(null);
  const solAmountRef = useRef(null);
  const tokenAmountRef = useRef(null);

  const currNetwork = {
    Devnet: "devnet",
    Mainnet: "mainnet-beta",
    Testnet: "testnet",
  };

  // Fetch token decimals when token address changes
  useEffect(() => {
    async function fetchTokenDecimals() {
      try {
        const tokenAddress = tokenAddressRef.current?.value;
        if (tokenAddress && PublicKey.isOnCurve(tokenAddress)) {
          const tokenMint = new PublicKey(tokenAddress);
          const mintInfo = await getMint(connection, tokenMint);
          setTokenDecimals(mintInfo.decimals);
        }
      } catch (error) {
        console.error("Error fetching token decimals:", error);
      }
    }

    // Debounce the fetch to avoid too many calls
    const timer = setTimeout(() => {
      if (tokenAddressRef.current?.value) {
        fetchTokenDecimals();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [connection, tokenAddressRef.current?.value]);

  function showNotification(message, type) {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }

  async function createLiquidityPool() {
    if (!wallet.connected || !wallet.publicKey) {
      showNotification("Please connect your wallet first", "error");
      return;
    }

    const tokenAddress = tokenAddressRef.current?.value;
    const solAmount = parseFloat(solAmountRef.current?.value);
    const tokenAmount = parseFloat(tokenAmountRef.current?.value);

    // Validate inputs
    if (!tokenAddress) {
      showNotification("Token address is required", "error");
      return;
    }
    if (!solAmount || solAmount <= 0) {
      showNotification("Valid SOL amount is required", "error");
      return;
    }
    if (!tokenAmount || tokenAmount <= 0) {
      showNotification("Valid token amount is required", "error");
      return;
    }

    try {
      setIsLoading(true);
      
      // Validate token address
      let tokenMint;
      try {
        tokenMint = new PublicKey(tokenAddress);
      } catch (e) {
        showNotification("Invalid token address format", "error");
        setIsLoading(false);
        return;
      }

      // Convert amounts to lamports/token base units
      const solLamports = solAmount * LAMPORTS_PER_SOL;
      const tokenBaseUnits = tokenAmount * Math.pow(10, tokenDecimals);

      // Check wallet balance
      const balance = await connection.getBalance(wallet.publicKey);
      if (balance < solLamports) {
        showNotification(`Insufficient SOL balance. You have ${balance / LAMPORTS_PER_SOL} SOL`, "error");
        setIsLoading(false);
        return;
      }

      const owner = wallet.publicKey;

      // Get associated token account for the token
      const tokenATA = await getAssociatedTokenAddress(
        tokenMint,
        owner,
        false,
        TOKEN_PROGRAM_ID
      );

      // Check if ATA exists, create if not
      const tokenAccountInfo = await connection.getAccountInfo(tokenATA);
      let transaction = new Transaction();

      if (!tokenAccountInfo) {
        console.log("Creating token account for user");
        transaction.add(
          createAssociatedTokenAccountInstruction(
            owner, // payer
            tokenATA, // associated token account
            owner, // owner
            tokenMint, // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Check token balance
      let tokenBalance = 0;
      if (tokenAccountInfo) {
        const tokenAccount = await connection.getTokenAccountBalance(tokenATA);
        tokenBalance = Number(tokenAccount.value.amount);
      }
      
      if (tokenBalance < tokenBaseUnits) {
        showNotification(`Insufficient token balance. You have ${tokenBalance / Math.pow(10, tokenDecimals)} tokens`, "error");
        setIsLoading(false);
        return;
      }

      // IMPORTANT NOTE: The following code is a simplified placeholder.
      // Actual Raydium SDK integration requires much more setup:
      // 1. Creating or finding a Serum market
      // 2. Setting up proper accounts for AMM
      // 3. Handling LP token creation
      // 4. Proper serialization of instructions

      // For demonstration purposes, we're creating a simulated pool address
      // In a real implementation, you would:
      // 1. Import correct Raydium SDK components
      // 2. Follow their API documentation to create a proper liquidity pool

      console.log("Creating liquidity pool with:");
      console.log(`- SOL: ${solAmount} (${solLamports} lamports)`);
      console.log(`- Token: ${tokenAmount} (${tokenBaseUnits} base units)`);
      console.log(`- Token Decimals: ${tokenDecimals}`);

      // Simulate pool creation (REPLACE WITH ACTUAL RAYDIUM SDK CALLS)
      // This is where you would use the actual Raydium SDK methods:
      
      /* 
      // Example of how actual Raydium SDK integration might look:
      import { 
        Liquidity, 
        Percent, 
        Token, 
        TokenAmount, 
        LiquidityPoolKeys 
      } from "@raydium-io/raydium-sdk";
      
      // Define tokens
      const solToken = new Token(
        connection,
        new PublicKey("So11111111111111111111111111111111111111112"), // SOL token mint
        9, // SOL decimals
        "SOL", // Symbol
        "Solana" // Name
      );
      
      const userToken = new Token(
        connection,
        tokenMint,
        tokenDecimals,
        "TOKEN", // Replace with actual symbol
        "User Token" // Replace with actual name
      );
      
      // Create liquidity pool
      const { poolKeys, lpMint } = await Liquidity.createLiquidityPool({
        connection,
        wallet: { publicKey: owner, signTransaction: wallet.signTransaction },
        baseToken: userToken,
        quoteToken: solToken,
        startTime: new Date(),
        slippage: new Percent(5, 100), // 5% slippage
        version: 4
      });
      
      // Add liquidity
      const { transaction: addLiquidityTx } = await Liquidity.addLiquidity({
        connection,
        poolKeys,
        userKeys: {
          tokenAccounts: [tokenATA],
          owner,
        },
        amountIn: {
          baseToken: new TokenAmount(userToken, tokenBaseUnits.toString()),
          quoteToken: new TokenAmount(solToken, solLamports.toString()),
        },
        fixedSide: "both",
      });
      
      // Combine transactions
      transaction.add(addLiquidityTx);
      */
      
      // For demonstration, we'll use a deterministic "fake" pool address
      // In a real implementation, this would come from the SDK
      const poolSeed = `${tokenMint.toString().substring(0, 8)}-${owner.toString().substring(0, 8)}`;
      const poolAddressBytes = await PublicKey.findProgramAddress(
        [Buffer.from(poolSeed)],
        RAYDIUM_LIQUIDITY_V4_PROGRAM_ID
      );
      const simulatedPoolAddress = poolAddressBytes[0].toString();
      
      // Set fee payer and get latest blockhash
      transaction.feePayer = wallet.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // In a real implementation, you would send the actual transaction
      // For this placeholder, we'll just simulate success
      console.log("Would send transaction with instructions:", transaction.instructions.length);
      
      // This is where you'd actually send the transaction:
      // const txid = await wallet.sendTransaction(transaction, connection);
      // await connection.confirmTransaction(txid);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set the pool address and show success
      setPoolAddress(simulatedPoolAddress);
      setPoolCreated(true);
      showNotification("Liquidity pool created successfully! (Demo)", "success");
    } catch (error) {
      console.error("Error creating liquidity pool:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Success Card - Show when pool is created */}
      {poolCreated && (
        <div className="mb-8 bg-green-900/30 border border-green-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-500/20 rounded-full p-3">
              <CheckCircle2 size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Liquidity Pool Created Successfully!</h3>
              <p className="text-green-200 mb-4">Your liquidity pool has been created on the Solana blockchain.</p>

              <div className="bg-black/30 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-400 mb-1">Pool Address:</div>
                <div className="font-mono text-green-300 break-all">{poolAddress}</div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(poolAddress)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
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
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Copy Address
                </button>

                <button
                  onClick={() =>
                    window.open(
                      `https://explorer.solana.com/address/${poolAddress}?cluster=${currNetwork[network]}`,
                      "_blank"
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
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
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                  View in Explorer
                </button>

                <button
                  onClick={() => {
                    setPoolCreated(false);
                    setPoolAddress("");
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
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
                    <path d="M12 9v6" />
                    <path d="M15 12H9" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Create Another Pool
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Liquidity Creation Form */}
      {!poolCreated && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
            <h1 className="text-3xl font-bold text-white text-center mb-2">🌊 Solana Liquidity Pool Creator</h1>
            <p className="text-blue-100 text-center text-sm">Create a liquidity pool for your token on Raydium</p>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Network Warning */}
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-6 flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-400 shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v.01" />
                <path d="M12 8v4" />
              </svg>
              <p className="text-blue-200 text-sm">
                {/* You are creating a liquidity pool on the Solana {network} network. Ensure you have enough SOL and tokens
                to cover the pool creation and transaction fees. */}
                <b className="text-red-700">This page is under maintenance</b>
              </p>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Token Address Field */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-white/90 font-semibold mb-2">
                  Token Address <span className="text-red-400">*</span>
                </label>
                <input
                  ref={tokenAddressRef}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                  type="text"
                  placeholder="Enter your token mint address"
                />
                <p className="text-xs text-gray-500 mt-1">The mint address of the token you created</p>
              </div>

              {/* SOL Amount Field */}
              <div className="col-span-1">
                <label className="block text-white/90 font-semibold mb-2">
                  SOL Amount <span className="text-red-400">*</span>
                </label>
                <input
                  ref={solAmountRef}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 1.0"
                />
                <p className="text-xs text-gray-500 mt-1">Amount of SOL to add to the pool</p>
              </div>

              {/* Token Amount Field */}
              <div className="col-span-1">
                <label className="block text-white/90 font-semibold mb-2">
                  Token Amount <span className="text-red-400">*</span>
                </label>
                <input
                  ref={tokenAmountRef}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 1000"
                />
                <p className="text-xs text-gray-500 mt-1">Amount of tokens to add to the pool</p>
              </div>
            </div>

            {/* Create Pool Button */}
            <button
              className={`mt-8 w-full px-6 py-4 rounded-lg shadow-lg transition duration-300 flex items-center justify-center gap-2 font-bold text-lg ${
                isLoading
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-blue-500/20"
              }`}
              onClick={createLiquidityPool}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Pool...
                </>
              ) : (
                <>
                  <Droplet size={20} />
                  Create Liquidity Pool
                </>
              )}
            </button>
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