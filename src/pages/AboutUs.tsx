import React from 'react';

export function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-8">About Us</h1>
      
      <div className="prose prose-emerald dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-emerald-200">
        <p className="text-lg">Welcome to <strong>Silencio</strong>, your number one source for fast, secure, and free audio editing tools.</p>
        
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-emerald-100 mt-8 mb-4">Our Mission</h2>
          <p>Our mission is to provide content creators, podcasters, students, and professionals with a powerful, easy-to-use tool to enhance their audio files. We believe that high-quality audio editing should be accessible to everyone, without the need for expensive software or complex tutorials.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-emerald-100 mt-8 mb-4">Why Choose Us?</h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>100% Privacy:</strong> Unlike other online tools, we process your audio entirely in your web browser. Your files are never uploaded to our servers, ensuring complete privacy and security.</li>
            <li><strong>Free to Use:</strong> We are committed to keeping our core features completely free for all users.</li>
            <li><strong>Lightning Fast:</strong> By utilizing your device's local processing power, we eliminate upload and download wait times.</li>
            <li><strong>Professional Quality:</strong> Our advanced algorithms ensure that your audio remains crisp and clear, with seamless crossfades between cuts.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-emerald-100 mt-8 mb-4">Who We Are</h2>
          <p>Silencio was built by a passionate team of developers and audio enthusiasts who saw a need for a simpler, more secure way to edit audio online. We are constantly working to improve our algorithms and add new features based on user feedback.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-emerald-100 mt-8 mb-4">Get in Touch</h2>
          <p>We hope you enjoy our tool as much as we enjoy offering it to you. If you have any questions or comments, please don't hesitate to contact us.</p>
          <p className="mt-4">
            Email: <a href="mailto:royalkrrishna@gmail.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">royalkrrishna@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
