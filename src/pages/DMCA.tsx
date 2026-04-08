import React from 'react';

export function DMCA() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-8">DMCA Policy</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-300">
        <p>Last updated: April 08, 2026</p>
        
        <section>
          <p>Silencio respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at <a href="http://www.copyright.gov/legislation/dmca.pdf" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">http://www.copyright.gov/legislation/dmca.pdf</a>, we will respond expeditiously to claims of copyright infringement committed using the Silencio service.</p>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-lg mt-6 mb-6">
            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium m-0">
              <strong>Important Note:</strong> Silencio is a client-side application. We do not host, store, or distribute any audio files on our servers. All processing is done locally in the user's web browser. Therefore, we cannot remove specific files from our servers as they do not exist there.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">Filing a DMCA Notice</h2>
          <p>If you are a copyright owner, or are authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to our Designated Copyright Agent.</p>
          
          <p>Upon receipt of the Notice as described below, we will take whatever action, in our sole discretion, we deem appropriate, including removal of the challenged material from the Site (if applicable to hosted content).</p>
          
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-6 mb-3">DMCA Notice of Alleged Infringement ("Notice")</h3>
          <ol className="list-decimal pl-6 space-y-3">
            <li>Identify the copyrighted work that you claim has been infringed, or - if multiple copyrighted works are covered by this Notice - you may provide a representative list of the copyrighted works that you claim have been infringed.</li>
            <li>Identify the material that you claim is infringing (or to be the subject of infringing activity) and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material, including at a minimum, if applicable, the URL of the link shown on the Site where such material may be found.</li>
            <li>Provide your mailing address, telephone number, and, if available, email address.</li>
            <li>Include both of the following statements in the body of the Notice:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>"I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)."</li>
                <li>"I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed."</li>
              </ul>
            </li>
            <li>Provide your full legal name and your electronic or physical signature.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-8 mb-4">Contact Information</h2>
          <p>Deliver this Notice, with all items completed, to our Designated Copyright Agent:</p>
          <p className="mt-2 font-medium">
            Email: <a href="mailto:royalkrrishna@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">royalkrrishna@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
