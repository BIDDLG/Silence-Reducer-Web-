import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="font-semibold text-slate-200">Silencio</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/dmca" className="hover:text-white transition-colors">DMCA</Link>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-6 text-center text-sm border-t border-slate-800 pt-4">
          &copy; {new Date().getFullYear()} Silencio.
        </div>

      </div>
    </footer>
  );
}
