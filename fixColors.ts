import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/pages/PrivacyPolicy.tsx',
  'src/pages/AboutUs.tsx',
  'src/pages/ContactUs.tsx',
  'src/pages/DMCA.tsx',
];

for (const relPath of files) {
  const file = path.resolve(relPath);
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-emerald-50/g, 'bg-slate-50');
  content = content.replace(/bg-emerald-950/g, 'bg-slate-950');
  content = content.replace(/text-emerald-950/g, 'text-slate-900');
  content = content.replace(/text-emerald-50\b"/g, 'text-slate-50"');
  content = content.replace(/text-emerald-50\b /g, 'text-slate-50 ');
  content = content.replace(/text-emerald-700/g, 'text-slate-600');
  content = content.replace(/text-emerald-300/g, 'text-slate-300');
  content = content.replace(/dark:bg-emerald-900/g, 'dark:bg-slate-900');
  content = content.replace(/text-emerald-900/g, 'text-slate-900');
  
  // Specific list texts
  content = content.replace(/text-emerald-800/g, 'text-slate-700');
  
  fs.writeFileSync(file, content);
}
console.log('Done mapping emerald to slate in pages.');
