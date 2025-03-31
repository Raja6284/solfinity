import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { NetworkProvider } from './contexts/NetworkContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <NetworkProvider>
    <App />
    </NetworkProvider>
    </BrowserRouter>
    
  </StrictMode>,
)
