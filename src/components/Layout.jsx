

// import Header from "./Header"

// export function Layout({ children }) {
//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
//       <Header />
//       <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
//       <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-800">
//         <div className="container mx-auto">
//           <p>© {new Date().getFullYear()} Solfinity. All rights reserved.</p>
//         </div>
//       </footer>
//     </div>
//   )
// }




import Header from "./Header";
import { Github, Linkedin, Instagram } from "lucide-react";

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
            <a
              href="https://github.com/Raja6284"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors duration-300"
              aria-label="GitHub Profile"
            >
              <Github size={20} />
              <span>GitHub</span>
            </a>
            <a
              href="https://linkedin.com/in/raja-kumar-b1453826a"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors duration-300"
              aria-label="LinkedIn Profile"
            >
              <Linkedin size={20} />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://instagram.com/raja_r4j4"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors duration-300"
              aria-label="Instagram Profile"
            >
              <Instagram size={20} />
              <span>Instagram</span>
            </a>
          </div>
          <p>© {new Date().getFullYear()} Solfinity. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}