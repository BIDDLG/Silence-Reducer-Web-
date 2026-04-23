import * as fs from 'fs';
import * as path from 'path';

const file = path.resolve('src/components/AudioEditor.tsx');
let content = fs.readFileSync(file, 'utf8');

// Target structural structural backgrounds: 
// The cards/wrappers were changed to white / dark:bg-emerald-900 / dark:bg-emerald-950, etc.
// The borders were border-emerald-200 dark:border-emerald-800
// Text was text-emerald-900 dark:text-emerald-50.

content = content.replace(/bg-white dark:bg-emerald-900/g, 'bg-white dark:bg-slate-900');
content = content.replace(/bg-emerald-50 dark:bg-emerald-950/g, 'bg-slate-50 dark:bg-slate-950');
content = content.replace(/bg-emerald-50 dark:bg-emerald-900\/50/g, 'bg-slate-50 dark:bg-slate-800');
content = content.replace(/border-emerald-200 dark:border-emerald-800/g, 'border-slate-200 dark:border-slate-800');
content = content.replace(/border-emerald-100 dark:border-emerald-800/g, 'border-slate-100 dark:border-slate-800');
content = content.replace(/border-emerald-200 dark:border-emerald-700/g, 'border-slate-200 dark:border-slate-700');

// Header Text
content = content.replace(/text-emerald-900 dark:text-emerald-100/g, 'text-slate-900 dark:text-slate-100');
content = content.replace(/text-emerald-900 dark:text-emerald-50/g, 'text-slate-900 dark:text-slate-50');

// Let's replace button texts that are standard controls
content = content.replace(/text-emerald-700 dark:text-emerald-300 w-full/g, 'text-slate-700 dark:text-slate-300 w-full');

fs.writeFileSync(file, content);
console.log('Reverted structural emerald lines to slate in AudioEditor.');
