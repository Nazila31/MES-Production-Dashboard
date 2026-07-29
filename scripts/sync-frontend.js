#!/usr/bin/env node
/**
 * Sync frontend/ → backend/public/ for production / php artisan serve.
 * Preserves Laravel files in public/ (index.php, .htaccess, etc.).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'frontend');
const DEST = path.join(ROOT, 'backend', 'public');

const PRESERVE = new Set([
    'index.php',
    '.htaccess',
    'robots.txt',
    'favicon.ico',
    'storage',
    'build',
    'hot',
    'fonts-manifest.dev.json',
]);

function copyRecursive(srcDir, destDir, relative = '') {
    if (!fs.existsSync(srcDir)) {
        console.error(`Source not found: ${srcDir}`);
        process.exit(1);
    }

    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const rel = relative ? `${relative}/${entry.name}` : entry.name;

        if (PRESERVE.has(entry.name) && relative === '') {
            continue;
        }

        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.name === 'node_modules' || entry.name === '.git') {
            continue;
        }

        if (relative === '' && ['package.json', 'package-lock.json', 'vite.config.js', 'README.md'].includes(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath, rel);
        } else if (entry.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function cleanSyncedFiles(destDir) {
    const entries = fs.readdirSync(destDir, { withFileTypes: true });

    for (const entry of entries) {
        if (PRESERVE.has(entry.name)) {
            continue;
        }

        const destPath = path.join(destDir, entry.name);
        const srcPath = path.join(SRC, entry.name);

        if (!fs.existsSync(srcPath)) {
            continue;
        }

        if (entry.isDirectory()) {
            fs.rmSync(destPath, { recursive: true, force: true });
        } else if (entry.isFile()) {
            fs.unlinkSync(destPath);
        }
    }
}

console.log('Syncing frontend → backend/public ...');
cleanSyncedFiles(DEST);
copyRecursive(SRC, DEST);
console.log('Done. Laravel public is ready for php artisan serve / Apache.');
