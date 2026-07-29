#!/usr/bin/env node
/**
 * Move legacy root frontend files to _archive/legacy-root-frontend/
 * Safe to run — only moves known legacy paths, never touches backend/ or frontend/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARCHIVE = path.join(ROOT, '_archive', 'legacy-root-frontend');

const LEGACY = [
    'index.html',
    'projects.html',
    'reports.html',
    'add-project.html',
    'edit-project.html',
    'detail-project.html',
    'assets',
    'pages',
    'composer-setup.php',
];

function moveItem(src, dest) {
    if (!fs.existsSync(src)) return false;

    fs.mkdirSync(path.dirname(dest), { recursive: true });

    if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
        fs.rmSync(src, { recursive: true, force: true });
    } else {
        fs.copyFileSync(src, dest);
        fs.unlinkSync(src);
    }
    return true;
}

fs.mkdirSync(ARCHIVE, { recursive: true });

let moved = 0;
for (const item of LEGACY) {
    const src = path.join(ROOT, item);
    const dest = path.join(ARCHIVE, item);
    if (fs.existsSync(src)) {
        if (fs.existsSync(dest)) {
            fs.rmSync(dest, { recursive: true, force: true });
        }
        moveItem(src, dest);
        console.log(`Archived: ${item}`);
        moved++;
    }
}

console.log(moved ? `Done. ${moved} item(s) archived.` : 'Nothing to archive — legacy files already removed.');
