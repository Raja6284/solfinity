

import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

export function NoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-9xl font-bold text-gray-700 mb-4">404</div>
      <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
      <p className="text-gray-400 max-w-md mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
      >
        <ArrowLeft size={18} />
        Back to Home
      </Link>
    </div>
  )
}

