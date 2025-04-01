

import { useState, useRef } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js"
import {
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  LENGTH_SIZE,
  ExtensionType,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
} from "@solana/spl-token"
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata"
import axios from "axios"
import { Upload, AlertCircle, CheckCircle2, Trash2, Info, Rocket, ImageIcon, Loader2 } from "lucide-react"
import { useNetwork } from "../contexts/NetworkContext"

export function CreateToken() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const cloud_name = import.meta.env.VITE_CLOUD_NAME

  const nameRef = useRef(null)
  const symbolRef = useRef(null)
  const initialSupplyRef = useRef(null)
  const decimalRef = useRef(null)
  const descriptionRef = useRef(null)

  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("No file chosen")
  const [image, setImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [tokenCreated, setTokenCreated] = useState(false)
  const [mintAddress, setMintAddress] = useState("")
  const [descriptionLength, setDescriptionLength] = useState(0)
  const {network} = useNetwork();


  const currNetwork = {
    "Devnet":"devnet",
    "Mainnet":"mainnet",
    "Testnet":"testnet"
  }

  //console.log(network)

  function handleChange(e) {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setImage(selectedFile)
      setFile(URL.createObjectURL(selectedFile))
      setFileName(selectedFile.name)
    } else {
      setFileName("No file chosen")
    }
  }

  function clearImage() {
    setFile(null)
    setImage(null)
    setFileName("No file chosen")
  }

  function showNotification(message, type) {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  async function saveImage() {
    const data = new FormData()
    data.append("file", image)
    data.append("upload_preset", "myCloud")
    data.append("cloud_name", cloud_name)

    try {
      if (image == null) {
        throw new Error("Please upload an image")
      }

      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
          pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
        },
      })

      console.log(res.data)
      const cloudData = await res.data.IpfsHash
      console.log(cloudData)
      console.log(`https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`)
      return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  const uploadMetadataToIPFS = async (metadata) => {
    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
          pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
        },
      })

      console.log("Metadata uploaded:", response.data)
      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
    } catch (error) {
      console.error("Error uploading metadata:", error)
      throw error
    }
  }


  async function createToken() {
    if (!wallet.connected) {
      showNotification("Please connect your wallet first", "error")
      return
    }

    // Validate inputs
    if (!nameRef.current?.value) {
      showNotification("Token name is required", "error")
      return
    }

    if (!symbolRef.current?.value) {
      showNotification("Token symbol is required", "error")
      return
    }

    if (!image) {
      showNotification("Token image is required", "error")
      return
    }

    try {
      setIsLoading(true)

      // Upload image to IPFS
      const imageUrl = await saveImage()

      // Create metadata
      const metadata = {
        name: nameRef.current?.value,
        symbol: symbolRef.current?.value,
        description: descriptionRef.current?.value,
        image: imageUrl,
        attributes: [{ trait_type: "Launch Date", value: new Date().toISOString() }],
      }

      // Upload metadata to IPFS
      const url = await uploadMetadataToIPFS(metadata)
      console.log("Metadata URL: " + url)

      // Generate keypair for the mint
      const mintKeypair = Keypair.generate()

      // Create token metadata
      const metadata1 = {
        mint: mintKeypair.publicKey,
        name: nameRef.current?.value,
        symbol: symbolRef.current?.value,
        uri: url,
        additionalMetadata: [],
      }

      // Calculate required space and rent
      const mintLen = getMintLen([ExtensionType.MetadataPointer])
      const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata1)?.length
      const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen)

      // Create transaction
      const transaction = new Transaction()
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports: lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          wallet.publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID,
        ),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          Number.parseInt(decimalRef.current?.value || "9"),
          wallet.publicKey,
          null,
          TOKEN_2022_PROGRAM_ID,
        ),
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          mint: mintKeypair.publicKey,
          metadata: mintKeypair.publicKey,
          name: metadata1.name,
          symbol: metadata1.symbol,
          uri: metadata1.uri,
          mintAuthority: wallet.publicKey,
          updateAuthority: wallet.publicKey,
        }),
      )

      transaction.feePayer = wallet.publicKey
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      transaction.partialSign(mintKeypair)

      // Send transaction
      const txid = await wallet.sendTransaction(transaction, connection)
      console.log(`Token mint created at ${mintKeypair.publicKey.toString()}`)

      setMintAddress(mintKeypair.publicKey.toString())
      setTokenCreated(true)
      showNotification("Token created successfully!", "success")
    } catch (error) {
      console.error("Error creating token:", error)
      showNotification(`Error creating token: ${error.message}`, "error")
    } finally {
      setIsLoading(false)
    }
  }


  

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Success Card - Show when token is created */}
      {tokenCreated && (
        <div className="mb-8 bg-green-900/30 border border-green-700 rounded-xl p-6 animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="bg-green-500/20 rounded-full p-3">
              <CheckCircle2 size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Token Created Successfully!</h3>
              <p className="text-green-200 mb-4">Your token has been created on the Solana blockchain.</p>

              <div className="bg-black/30 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-400 mb-1">Token Mint Address:</div>
                <div className="font-mono text-green-300 break-all">{mintAddress}</div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mintAddress)
                  }}
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
                  onClick={() => {
                    window.open(
                      `https://explorer.solana.com/address/${mintAddress}?cluster=${currNetwork[network]}`,
                      "_blank",
                    )
                  }}
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
                    setTokenCreated(false)
                    setMintAddress("")
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
                  Create Another Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Token Creation Form */}
      {!tokenCreated && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
            <h1 className="text-3xl font-bold text-white text-center mb-2">🚀 Solana Token Launchpad</h1>
            <p className="text-blue-100 text-center text-sm">Create your own SPL token on the Solana blockchain</p>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Network Warning */}
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-6 flex items-start gap-3">
              <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-200 text-sm">
                You are creating a token on the Solana {wallet.network || "Devnet"} network. Make sure you have enough
                SOL to cover the transaction fees.
              </p>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="col-span-1">
                <label className="block text-white/90 font-semibold mb-2">
                  Token Name <span className="text-red-400">*</span>
                </label>
                <input
                  ref={nameRef}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                  type="text"
                  placeholder="Ex: Solana"
                  maxLength={32}
                />
                <p className="text-xs text-gray-500 mt-1">Max 32 characters</p>
              </div>

              {/* Symbol Field */}
              <div className="col-span-1">
                <label className="block text-white/90 font-semibold mb-2">
                  Token Symbol <span className="text-red-400">*</span>
                </label>
                <input
                  ref={symbolRef}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                  type="text"
                  placeholder="Ex: SOL"
                  maxLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Max 8 characters</p>
              </div>

              {/* Decimals Field */}
              <div className="col-span-1">
                <label className="block text-white/90 font-semibold mb-2">
                  Decimals <span className="text-red-400">*</span>
                </label>
                <input
                  ref={decimalRef}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                  type="number"
                  defaultValue={9}
                  min={0}
                  max={18}
                />
                <p className="text-xs text-gray-500 mt-1">Most tokens use 9 decimals (like SOL)</p>
              </div>

              {/* Supply Field */}
              <div className="col-span-1">
                <label className="block text-white/90 font-semibold mb-2">
                  Initial Supply <span className="text-red-400">*</span>
                </label>
                <input
                  ref={initialSupplyRef}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                  type="number"
                  defaultValue={1000000000}
                  min={1}
                />
                <p className="text-xs text-gray-500 mt-1">Common supply is 1 billion (1,000,000,000)</p>
              </div>

              {/* Description Field */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-white/90 font-semibold mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  ref={descriptionRef}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition h-24 resize-none"
                  placeholder="Ex: First community token on Solana..."
                  maxLength={500}
                  onChange={(e) => setDescriptionLength(e.target.value.length)}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">{descriptionLength}/500 characters</p>
              </div>

              {/* Image Upload */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-white/90 font-semibold mb-2">
                  Token Image <span className="text-red-400">*</span>
                </label>

                {!file ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <input type="file" accept="image/*" onChange={handleChange} id="fileInput" className="hidden" />
                    <label htmlFor="fileInput" className="flex flex-col items-center justify-center cursor-pointer">
                      <div className="bg-gray-800 rounded-full p-3 mb-3">
                        <Upload size={24} className="text-blue-400" />
                      </div>
                      <p className="text-white font-medium mb-1">Drag and drop or click to upload</p>
                      <p className="text-gray-400 text-sm">PNG, JPG or GIF (Recommended: 512x512px)</p>
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon size={18} className="text-blue-400" />
                        <span className="text-gray-300 text-sm font-medium">{fileName}</span>
                      </div>
                      <button onClick={clearImage} className="text-gray-400 hover:text-red-400 transition p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-600">
                        <img
                          src={file || "/placeholder.svg"}
                          alt="Token Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Create Token Button */}
            <button
              className={`mt-8 w-full px-6 py-4 rounded-lg shadow-lg transition duration-300 flex items-center justify-center gap-2 font-bold text-lg ${
                isLoading
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-blue-500/20"
              }`}
              onClick={createToken}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Token...
                </>
              ) : (
                <>
                  <Rocket size={20} />
                  Create Token
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
  )
}

