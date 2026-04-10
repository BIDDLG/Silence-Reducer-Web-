import React from 'react';

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Upload Audio & Video",
      description: "Drag and drop your Audio & Video file. We support MP3, WAV, M4A, MP4, MKV and more."
    },
    {
      number: "02",
      title: "Adjust Settings",
      description: "Tweak the silence threshold and duration to match your recording's noise floor."
    },
    {
      number: "03",
      title: "Process & Export",
      description: "Click remove silence, preview the result, and download your cleaned audio."
    }
  ];

  return (
    <section id="how-it-works" className="py-12 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-lg text-slate-400">
            Three simple steps to professional-sounding audio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-800" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              <div className="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6 relative z-10 border-4 border-slate-900">
                <span className="text-3xl font-bold text-green-400">{step.number}</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
