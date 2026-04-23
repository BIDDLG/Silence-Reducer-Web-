import React from 'react';

export function Hero() {
  return (
    <section className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 pt-12 pb-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1)_0%,rgba(0,0,0,0)_50%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,rgba(0,0,0,0)_50%)]"></div>
      </div>
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
          Remove silence from audio in <span className="text-emerald-500 dark:text-emerald-400">one click</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
          Automatically detect and remove silent pauses from your podcasts, lectures, voice notes, and interviews. 100% free, secure, and processed entirely in your browser.
        </p>
      </div>
    </section>
  );
}
