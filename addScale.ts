import * as fs from 'fs';
import * as path from 'path';

const file = path.resolve('src/components/AudioEditor.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/className="([^"]*)bg-emerald-600([^"]*)"/g, (match, p1, p2) => {
    if (!p1.includes('active:scale-95') && !p2.includes('active:scale-95')) {
        return `className="${p1}bg-emerald-600${p2} active:scale-95"`;
    }
    return match;
});

// Animate quick tools
content = content.replace(/className="([^"]*)bg-slate-50 dark:bg-slate-800 hover:bg-emerald-100([^"]*)"/g, (match, p1, p2) => {
    if (!p1.includes('active:scale-95') && !p2.includes('active:scale-95')) {
        return `className="${p1}bg-slate-50 dark:bg-slate-800 hover:bg-emerald-100${p2} active:scale-95"`;
    }
    return match;
});

// Update the export button similarly
content = content.replace(/className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium/g, 'className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium active:scale-95');

fs.writeFileSync(file, content);
console.log('Added smooth tap effects.');
