
import { NoPage } from "./pages/Nopage";
import { Layout } from "./components/Layout";
import { Route, Routes } from "react-router-dom";
import { CreateLiquidity } from "./pages/CreateLiquidity";
import { CreateToken } from "./pages/CreateToken";
import Header from "./components/Header"
import { NetworkProvider, useNetwork } from "./contexts/NetworkContext"

import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';
import { SolanaFaucet } from "./pages/SolanaFaucet";



function App() {

  const { network } = useNetwork()
  //console.log(network)

  const endpoint = {
    "Testnet": "https://solana-testnet.g.alchemy.com/v2/-wgX0L1sP7MA475YuImcVvf6fB4ymZQx",
    "Devnet": "https://solana-devnet.g.alchemy.com/v2/-wgX0L1sP7MA475YuImcVvf6fB4ymZQx",
    "Mainnet": "https://solana-mainnet.g.alchemy.com/v2/-wgX0L1sP7MA475YuImcVvf6fB4ymZQx"
  }

  //console.log(endpoint[network])

  return (
    <>

      <ConnectionProvider endpoint={endpoint[network]}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>

        {/* we need to wrap all this route in Layout so that Layout will accept it as a child */}
            <Layout>
              <Routes>
                <Route path="/" element={<SolanaFaucet />} />
                <Route path="airdrop" element={<SolanaFaucet />} />
                <Route path="create-token" element={<CreateToken />} />
                <Route path="create-liquidity" element={<CreateLiquidity />} />
                <Route path="*" element={<NoPage />} />
              </Routes>
            </Layout>

          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>

    </>


  )
}

export default App
