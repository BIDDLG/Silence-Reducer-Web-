import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { get, set, del } from 'idb-keyval';
import { UploadBox } from './components/UploadBox';
import { AudioEditor } from './components/AudioEditor';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { FAQ } from './components/FAQ';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { DMCA } from './pages/DMCA';
import { Moon, Sun, Menu, X, Home, Info, HelpCircle, Shield, List, Mail } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    }
    return false; // Default to Light Mode
  });

  useEffect(() => {
    // Load saved file on mount
    get('savedAudioFile').then((file) => {
      if (file instanceof File) {
        setAudioFile(file);
      }
      setIsLoadingFile(false);
    }).catch((err) => {
      console.error('Error loading saved file:', err);
      setIsLoadingFile(false);
    });
  }, []);

  const handleUpload = async (file: File) => {
    setAudioFile(file);
    try {
      await set('savedAudioFile', file);
    } catch (err) {
      console.error('Error saving file to IndexedDB:', err);
    }
  };

  const handleReset = async () => {
    setAudioFile(null);
    try {
      await del('savedAudioFile');
    } catch (err) {
      console.error('Error deleting file from IndexedDB:', err);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  if (isLoadingFile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'How It Works', path: '/how-it-works', icon: Info },
    { name: 'Features', path: '/features', icon: List },
    { name: 'FAQ', path: '/faq', icon: HelpCircle },
    { name: 'Privacy Policy', path: '/privacy', icon: Shield },
    { name: 'About Us', path: '/about', icon: Info },
    { name: 'Contact Us', path: '/contact', icon: Mail },
    { name: 'DMCA', path: '/dmca', icon: Shield },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-800 transition-colors duration-300">
      <ScrollToTop />
      
      {/* App Header */}
      <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white sticky top-0 z-40 transition-colors duration-300 shadow-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
            >
              <Menu className="w-6 h-6" />
            </motion.button>
            <Link to="/" className="flex items-center gap-2" onClick={handleReset}>
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">Silencio</span>
            </Link>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>
        </div>
      </header>

      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            ></motion.div>
            
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-lg text-slate-900 dark:text-slate-50">Menu</span>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                <nav className="flex flex-col px-2 space-y-1">
                  {menuItems.map((item) => (
                    <Link 
                      key={item.name}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                        location.pathname === item.path 
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <item.icon className="w-5 h-5 opacity-75" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-center text-slate-500 dark:text-slate-400">
                &copy; {new Date().getFullYear()} Silencio.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main App Content Area */}
      <main className="flex-1 flex flex-col relative w-full overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col w-full h-full"
              >
                {!audioFile ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[80vh]">
                    <div className="w-full max-w-lg mb-8 text-center delay-100">
                      <h1 className="text-3xl font-bold mb-3 tracking-tight">Silencio App</h1>
                      <p className="text-slate-500 dark:text-slate-400 mb-8">Upload your audio or video file to remove silence easily within seconds.</p>
                      <UploadBox onUpload={handleUpload} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-4xl mx-auto p-2 sm:p-6 pb-24">
                    <AudioEditor file={audioFile} onReset={handleReset} />
                  </div>
                )}
              </motion.div>
            } />
            
            {/* Info Pages */}
            <Route path="/features" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 max-w-4xl mx-auto w-full"><Features /></motion.div>} />
            <Route path="/how-it-works" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 max-w-4xl mx-auto w-full"><HowItWorks /></motion.div>} />
            <Route path="/faq" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 max-w-4xl mx-auto w-full"><FAQ /></motion.div>} />
            <Route path="/privacy" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 max-w-4xl mx-auto w-full"><PrivacyPolicy /></motion.div>} />
            <Route path="/about" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 max-w-4xl mx-auto w-full"><AboutUs /></motion.div>} />
            <Route path="/contact" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 max-w-4xl mx-auto w-full"><ContactUs /></motion.div>} />
            <Route path="/dmca" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 max-w-4xl mx-auto w-full"><DMCA /></motion.div>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
