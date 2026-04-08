import React from 'react';

export function ContactUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-8">Contact Us</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-300">
        <p className="text-lg">We value your feedback and are here to help. Whether you have a question about our tool, need technical support, or want to discuss business opportunities, we'd love to hear from you.</p>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mt-8">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">Get in Touch</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">Email Support</h3>
              <p className="mt-1">For general inquiries, support, or feedback, please email us at:</p>
              <a href="mailto:royalkrrishna@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-lg mt-2 inline-block">
                royalkrrishna@gmail.com
              </a>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
              <h3 className="font-medium text-slate-900 dark:text-white">Response Time</h3>
              <p className="mt-1">We aim to respond to all inquiries within 24-48 business hours. Please include as much detail as possible in your email so we can assist you efficiently.</p>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Advertising & Partnerships</h2>
          <p>If you are interested in advertising on Silencio or exploring partnership opportunities, please use the email address above with the subject line "Partnership Inquiry".</p>
        </section>
      </div>
    </div>
  );
}
