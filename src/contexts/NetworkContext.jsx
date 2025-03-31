import { createContext, useContext, useState } from "react";

// Create Context
const NetworkContext = createContext();

// Provider Component
export const NetworkProvider = ({ children }) => {
    const [network, setNetwork] = useState("Devnet"); // Default to testnet

    return (
        <NetworkContext.Provider value={{ network, setNetwork }}>
            {children}
        </NetworkContext.Provider>
    );
};

// Custom Hook for Easy Access
export const useNetwork = () => useContext(NetworkContext);
