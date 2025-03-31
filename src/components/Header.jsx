
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useNetwork } from "../contexts/NetworkContext";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const Header = () => {
    const { network, setNetwork } = useNetwork();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="bg-gray-900 text-white p-4">
            <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between">
                {/* Logo - Centered in mobile */}
                <div className="text-center md:text-left mb-3 md:mb-0">
                    <h1 className="text-2xl font-bold">Solfinity</h1>
                </div>

                {/* Network Selector, Wallet Button, and Mobile Menu Button on the same row */}
                <div className="flex items-center justify-between md:justify-end space-x-4 w-full">
                    {/* Network Selector */}
                    <select
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        className="bg-gray-800 text-white px-3 py-1 rounded-md border border-gray-700 outline-none"
                    >
                        <option value="Devnet">Devnet</option>
                        <option value="Testnet">Testnet</option>
                        <option value="Mainnet">Mainnet</option>
                    </select>

                    {/* Wallet Button */}
                    <WalletMultiButton />

                    {/* Mobile Menu Button */}
                    <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex justify-center space-x-6 mt-3">
                <Link to="/airdrop" className="hover:text-blue-400 transition">Request Airdrop</Link>
                <Link to="/create-token" className="hover:text-blue-400 transition">Create Token</Link>
                <Link to="/create-liquidity" className="hover:text-blue-400 transition">Create Liquidity</Link>
            </nav>

            {/* Mobile Menu (Dropdown) */}
            {isOpen && (
                <nav className="md:hidden bg-gray-800 text-white p-4 space-y-4 mt-3 rounded-md">
                    <Link to="/airdrop" className="block hover:text-blue-400">Request Airdrop</Link>
                    <Link to="/create-token" className="block hover:text-blue-400">Create Token</Link>
                    <Link to="/create-liquidity" className="block hover:text-blue-400">Create Liquidity</Link>
                </nav>
            )}
        </header>
    );
};

export default Header;
