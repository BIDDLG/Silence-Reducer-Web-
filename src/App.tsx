import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { get, set, del } from 'idb-keyval';
import { UploadBox } from './components/UploadBox';
import { AudioEditor } from './components/AudioEditor';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { DMCA } from './pages/DMCA';
import { Moon, Sun } from 'lucide-react';

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
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

  if (isLoadingFile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-green-100 dark:selection:bg-green-900 selection:text-green-900 dark:selection:text-green-100 transition-colors duration-300 overflow-x-hidden">
      <ScrollToTop />
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={handleReset}>
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">Silencio</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
              <Link to="/#features" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Features</Link>
              <Link to="/#how-it-works" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">How it Works</Link>
              <Link to="/#faq" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">FAQ</Link>
            </nav>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={
            !audioFile ? (
              <>
                <Hero />
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 mb-12">
                  <UploadBox onUpload={handleUpload} />
                </div>
                <div id="features"><Features /></div>
                <div id="how-it-works"><HowItWorks /></div>
                <div id="faq"><FAQ /></div>
              </>
            ) : (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AudioEditor file={audioFile} onReset={handleReset} />
              </div>
            )
          } />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/dmca" element={<DMCA />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
