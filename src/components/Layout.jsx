

import Header from "./Header"

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-800">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} Solfinity. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

