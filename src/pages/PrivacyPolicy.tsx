import React from 'react';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-8">Privacy Policy</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-300">
        <p>Last updated: April 08, 2026</p>
        
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">1. Introduction</h2>
          <p>Welcome to Silencio. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">2. Data Processing (100% Client-Side)</h2>
          <p><strong>We do not upload, store, or process your audio files on our servers.</strong> All audio processing, including silence reduction and editing, happens entirely within your web browser on your local device. Your files remain 100% private and secure.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">3. Information We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of non-personally identifiable data about you which we have grouped together as follows:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
            <li><strong>Usage Data:</strong> includes information about how you use our website, products and services (e.g., via Google Analytics).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">4. Cookies and Web Beacons</h2>
          <p>Like any other website, Silencio uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
          <p>We use Google AdSense to serve ads. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet. Users may opt out of personalized advertising by visiting Ads Settings.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">5. Third-Party Privacy Policies</h2>
          <p>Silencio's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, You can contact us:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>By email: <a href="mailto:royalkrrishna@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">royalkrrishna@gmail.com</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
