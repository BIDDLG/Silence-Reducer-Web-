import React from 'react';

export function FAQ() {
  const faqs = [
    {
      q: "Is it really free?",
      a: "Yes, Silence Reducer Pro is completely free to use. There are no hidden fees, subscriptions, or watermarks."
    },
    {
      q: "Are my files uploaded to a server?",
      a: "No. All audio processing happens locally in your web browser using the Web Audio API. Your files never leave your device, ensuring 100% privacy and security."
    },
    {
      q: "What audio formats are supported?",
      a: "We support most common audio formats including MP3, WAV, M4A, AAC, OGG, and FLAC. You can export your processed audio as a high-quality MP3 or WAV file."
    },
    {
      q: "Is there a file size limit?",
      a: "Because processing happens in your browser's memory, we recommend keeping files under 500MB for optimal performance. Very large files might cause your browser to slow down."
    },
    {
      q: "How does the silence detection work?",
      a: "The tool analyzes the amplitude (volume) of the audio waveform. When the volume drops below your set 'Threshold' for longer than the 'Minimum Duration', it marks that section as silence to be removed."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
        </div>
 
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{faq.q}</h3>
              <p className="text-slate-600 dark:text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
