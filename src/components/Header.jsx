
import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, ChevronDown } from "lucide-react"
import { useNetwork } from "../contexts/NetworkContext"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import "@solana/wallet-adapter-react-ui/styles.css"

const Header = () => {
  const { network, setNetwork } = useNetwork()
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [location])

  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 px-6 shadow-lg border-b border-gray-700">
      <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-purple-300 rounded-full w-8 h-8 overflow-hidden flex items-center justify-center">
              <img src="/solana_Logo.jpg" alt="Solana Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Solfinity
            </h1>
          </Link>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden focus:outline-none" aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex space-x-6">
            <Link
              to="/airdrop"
              className={`hover:text-blue-400 transition py-2 border-b-2 ${location.pathname === "/airdrop" ? "border-blue-500 text-blue-400" : "border-transparent"
                }`}
            >
              Request Airdrop
            </Link>
            <Link
              to="/create-token"
              className={`hover:text-blue-400 transition py-2 border-b-2 ${location.pathname === "/create-token" ? "border-blue-500 text-blue-400" : "border-transparent"
                }`}
            >
              Create Token
            </Link>
            <Link
              to="/create-liquidity"
              className={`hover:text-blue-400 transition py-2 border-b-2 ${location.pathname === "/create-liquidity" ? "border-blue-500 text-blue-400" : "border-transparent"
                }`}
            >
              Create Liquidity
            </Link>
          </nav>

          {/* Network Selector */}
          <div className="relative">
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-md border border-gray-700 outline-none appearance-none pr-10 focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="Devnet">Devnet</option>
              <option value="Testnet">Testnet</option>
              <option value="Mainnet">Mainnet</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Wallet Button */}
          <div className="wallet-adapter-button-trigger">
            <WalletMultiButton />
          </div>
        </div>
      </div>

      {/* Mobile Menu (Dropdown) */}
      {isOpen && (
        <div className="md:hidden mt-4 bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700 animate-fadeIn">
          <nav className="flex flex-col">
            <Link
              to="/airdrop"
              className={`px-4 py-3 hover:bg-gray-700 transition ${location.pathname === "/airdrop" ? "bg-gray-700 text-blue-400" : ""
                }`}
            >
              Request Airdrop
            </Link>
            <Link
              to="/create-token"
              className={`px-4 py-3 hover:bg-gray-700 transition ${location.pathname === "/create-token" ? "bg-gray-700 text-blue-400" : ""
                }`}
            >
              Create Token
            </Link>
            <Link
              to="/create-liquidity"
              className={`px-4 py-3 hover:bg-gray-700 transition ${location.pathname === "/create-liquidity" ? "bg-gray-700 text-blue-400" : ""
                }`}
            >
              Create Liquidity
            </Link>
          </nav>

          <div className="p-4 border-t border-gray-700 flex flex-col space-y-3">
            {/* Network Selector */}
            <div className="relative">
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 outline-none appearance-none pr-10"
              >
                <option value="Devnet">Devnet</option>
                <option value="Testnet">Testnet</option>
                <option value="Mainnet">Mainnet</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Wallet Button */}
            <div className="wallet-adapter-button-trigger">
              <WalletMultiButton className="w-full" />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header

