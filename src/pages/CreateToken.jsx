
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useRef } from "react";
import {getMinimumBalanceForRentExemptMint,createInitializeMint2Instruction, MINT_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE, LENGTH_SIZE,ExtensionType, getMintLen , createInitializeMetadataPointerInstruction,createInitializeMintInstruction,getAssociatedTokenAddressSync,createAssociatedTokenAccountInstruction,createMintToInstruction} from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import axios from "axios"

export function CreateToken() {

    const {connection} = useConnection()
    const wallet = useWallet();
    const cloud_name = import.meta.env.VITE_CLOUD_NAME


    const nameRef = useRef(null)
    const symbolRef = useRef(null)
    const initalSupplyRef = useRef(null)
    const decimalRef = useRef(null)
    const descriptionRef = useRef(null)

    const [file, setFile] = useState(null);
    const[fileName,setfileName] = useState("No file Choosen")
    const [image,setImage] = useState(null)

    function handleChange(e) {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setImage(selectedFile)
            setFile(URL.createObjectURL(selectedFile));
            setfileName(selectedFile.name)
        }else{
            setfileName("No file Choosen")
        }
    }


     async function saveImage(){

    const data = new FormData()
        data.append("file",image)
        data.append("upload_preset","myCloud");
        data.append("cloud_name",cloud_name)

        try{
            if(image == null){
                console.log("Please upload file")
            }
            // const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,data)

            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS",
                data,
                {
                    headers:{
                        "Content-Type": "multipart/form-data",
                        pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
                        pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
                    },
                }
            )

            console.log(res.data)
            const cloudData = await res.data.IpfsHash
            console.log(cloudData)
            console.log(`https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`)
            return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`
        }catch(error){
            console.log(error)
        }
     }


    const uploadMetadataToIPFS = async (metadata) => {

        try {
            const response = await axios.post(
                "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                metadata,
                {
                    headers: {
                        "Content-Type": "application/json",
                        pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
                        pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
                    },
                }
            );
    
            console.log("Metadata uploaded:", response.data);
            return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
        } catch (error) {
            console.error("Error uploading metadata:", error);
            return null;
        }
    };


    async function createToken() {
        
       await saveImage();
       const metadata = {
        name: nameRef.current?.value,
        symbol: symbolRef.current?.value,
        description: descriptionRef.current?.value,
        image: await saveImage(),
         // Linking image on IPFS
        attributes: [
            { "trait_type": "Launch Date", "value": new Date().toISOString() }
        ]

    };
       const url = await uploadMetadataToIPFS(metadata)
       console.log("this is metadata url " + url )

        const mintKeypair = Keypair.generate()
  

        const metadata1 = {
            mint: mintKeypair.publicKey,
            name: nameRef.current?.value,
            symbol: symbolRef.current?.value,
            uri: url,
            additionalMetadata: [],

        };
        
        const mintLen = getMintLen([ExtensionType.MetadataPointer]);
        const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata1)?.length;
        
        //const lamports = await getMinimumBalanceForRentExemptMint(connection)     //when creating token without metadata
        const lamports = await connection.getMinimumBalanceForRentExemption(mintLen+metadataLen)


        const transaction = new Transaction()
        transaction.add(SystemProgram.createAccount({
            fromPubkey:wallet.publicKey,
            newAccountPubkey:mintKeypair.publicKey,
            space:mintLen, //MINT_SIZE when creting token without metadata
            lamports:lamports,
            programId:TOKEN_2022_PROGRAM_ID
        }),
        // createInitializeMint2Instruction(mintKeypair.publicKey,9,wallet.publicKey,wallet.publicKey,TOKEN_2022_PROGRAM_ID)

        createInitializeMetadataPointerInstruction(mintKeypair.publicKey,wallet.publicKey,mintKeypair.publicKey,TOKEN_2022_PROGRAM_ID),

        createInitializeMintInstruction(mintKeypair.publicKey, 9, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            mint: mintKeypair.publicKey,
            metadata: mintKeypair.publicKey,
            name: metadata1.name,
            symbol: metadata1.symbol,
            uri: metadata1.uri,
            mintAuthority: wallet.publicKey,
            updateAuthority: wallet.publicKey,
        })
    )

    transaction.feePayer = wallet.publicKey
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    transaction.partialSign(mintKeypair)



    await wallet.sendTransaction(transaction,connection)
    console.log(`Token mint created at ${mintKeypair.publicKey}`)

    }


    return (
        <div className="min-h-screen w-full flex justify-center items-center bg-black p-6">
          <div className="bg-gray-900 backdrop-blur-md shadow-xl rounded-2xl p-8 max-w-3xl w-full border border-white/20">
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-6 text-center">🚀 Solana Token Launchpad</h1>
      
            {/* Form Grid */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Name Field */}
              <div className="col-span-1">
                <label className="text-white/90 font-semibold">* Name</label>
                <input 
                  ref={nameRef} 
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 transition mt-2" 
                  type="text" 
                  placeholder="Ex: Solana"
                />
                <p className="text-xs text-gray-500 mt-1">Max 32 characters in your name</p>
              </div>
              
              {/* Symbol Field */}
              <div className="col-span-1">
                <label className="text-white/90 font-semibold">* Symbol</label>
                <input 
                  ref={symbolRef} 
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 transition mt-2" 
                  type="text" 
                  placeholder="Ex: SOL"
                />
                <p className="text-xs text-gray-500 mt-1">Max 8 characters in your symbol</p>
              </div>
      
              {/* Decimals Field */}
              <div className="col-span-1">
                <label className="text-white/90 font-semibold">* Decimals</label>
                <input 
                  ref={decimalRef} 
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 transition mt-2" 
                  type="number" 
                  defaultValue={6}
                />
                <p className="text-xs text-gray-500 mt-1">Most tokens use 6 decimals</p>
              </div>
      
              {/* Supply Field */}
              <div className="col-span-1">
                <label className="text-white/90 font-semibold">* Supply</label>
                <input 
                  ref={initalSupplyRef} 
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 transition mt-2" 
                  type="number" 
                  defaultValue={1}
                />
                <p className="text-xs text-gray-500 mt-1">Most tokens use 10B</p>
              </div>
      
              {/* Description Field */}
              <div className="col-span-1">
                <label className="text-white/90 font-semibold">* Description</label>
                <textarea 
                  ref={descriptionRef} 
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500 transition mt-2 h-24" 
                  placeholder="Ex: First community token on Solana..."
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">0/500</p>
              </div>
      
              {/* Image Upload */}
              <div className="col-span-1 flex flex-col">
                <label className="text-white/90 font-semibold">* Image</label>
                <div className="relative w-full h-16 border border-gray-600 rounded-lg flex flex-col items-center justify-center mt-2 cursor-pointer bg-gray-800 hover:bg-gray-700 transition">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleChange} 
                    id="fileInput" 
                    className="hidden"
                  />
                  <label htmlFor="fileInput" className="flex flex-col items-center text-gray-300 text-sm">
                    <div className="text-2xl">📤</div>
                    upload image
                  </label>
                </div>
                {/* Display File Name or Image Preview */}
                {file && (
                  <div className="flex flex-col items-center mt-2 bg-gray-800 p-2 rounded-lg border border-gray-600 w-full">
                    <p className="text-sm text-gray-400">{fileName}</p>
                    <img 
                      src={file} 
                      alt="Uploaded Preview" 
                      className="mt-2 w-[140px] h-[140px] rounded-lg shadow-lg border border-gray-500 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
      
            {/* Create Token Button */}
            <button 
              className="mt-6 w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white text-lg font-bold rounded-lg shadow-lg transition duration-300"
              onClick={createToken}
            >
              🚀 Create Token
            </button>
          </div>
        </div>
      );
      
    }      