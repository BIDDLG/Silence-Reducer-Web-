import React from 'react';
import { Scissors, Zap, Shield, Settings, Download, Mic } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: <Scissors className="w-6 h-6 text-green-600" />,
      title: "Smart Silence Detection",
      description: "Automatically identifies silent gaps based on amplitude and duration thresholds."
    },
    {
      icon: <Zap className="w-6 h-6 text-green-600" />,
      title: "Lightning Fast",
      description: "Processes audio directly in your browser using Web Audio API. No waiting for uploads."
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: "100% Private",
      description: "Your files never leave your device. Everything happens locally on your machine."
    },
    {
      icon: <Settings className="w-6 h-6 text-green-600" />,
      title: "Full Control",
      description: "Adjust threshold, minimum silence length, and padding to get the perfect natural sound."
    },
    {
      icon: <Download className="w-6 h-6 text-green-600 dark:text-green-400" />,
      title: "High Quality Export",
      description: "Export your processed audio instantly as a high-quality MP3 or WAV file without watermarks."
    },
    {
      icon: <Mic className="w-6 h-6 text-green-600 dark:text-green-400" />,
      title: "Perfect for Podcasts",
      description: "Save hours of manual editing. Ideal for podcasts, lectures, voice notes, and interviews."
    }
  ];

  return (
    <section id="features" className="py-12 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to clean up audio</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Silencio is built for speed and privacy. No complex software to install, just drag, drop, and export.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-green-100 dark:hover:border-green-900/50 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
