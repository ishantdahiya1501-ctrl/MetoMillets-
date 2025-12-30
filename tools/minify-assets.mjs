import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import CleanCSS from 'clean-css';
import { minify as terserMinify } from 'terser';

const ROOT = path.resolve(process.cwd());
const BACKUP_DIR = path.join(ROOT, 'tools', '.minify-backup');

const TARGET_DIRS = [
	path.join(ROOT, 'css'),
	path.join(ROOT, 'js'),
	path.join(ROOT, 'admin', 'js')
];

const SHOULD_SKIP_DIR = (dirPath) => {
	const normalized = dirPath.replace(/\\/g, '/');
	return normalized.includes('/backend/') || normalized.includes('/node_modules/') || normalized.includes('/.git/');
};

const isMinifiedName = (filePath) => filePath.endsWith('.min.css') || filePath.endsWith('.min.js');

async function exists(p) {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

async function walkFiles(startDir) {
	const out = [];
	if (!(await exists(startDir))) return out;

	const stack = [startDir];
	while (stack.length) {
		const dir = stack.pop();
		if (!dir || SHOULD_SKIP_DIR(dir)) continue;

		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				stack.push(full);
			} else if (entry.isFile()) {
				out.push(full);
			}
		}
	}
	return out;
}

function relToRoot(p) {
	return path.relative(ROOT, p).replace(/\\/g, '/');
}

async function ensureDirForFile(filePath) {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function backupFile(srcFile) {
	const rel = relToRoot(srcFile);
	const dest = path.join(BACKUP_DIR, rel);
	await ensureDirForFile(dest);
	if (!(await exists(dest))) {
		await fs.copyFile(srcFile, dest);
	}
}

async function restoreAll() {
	if (!(await exists(BACKUP_DIR))) {
		console.log('No backups found. Nothing to restore.');
		return;
	}

	const backups = await walkFiles(BACKUP_DIR);
	let restored = 0;
	for (const b of backups) {
		const rel = path.relative(BACKUP_DIR, b);
		const dest = path.join(ROOT, rel);
		await ensureDirForFile(dest);
		await fs.copyFile(b, dest);
		restored++;
	}
	console.log(`Restored ${restored} file(s) from ${path.relative(ROOT, BACKUP_DIR).replace(/\\/g, '/')}`);
}

async function minifyCss(filePath) {
	const input = await fs.readFile(filePath, 'utf8');
	const result = new CleanCSS({ level: 2 }).minify(input);
	if (result.errors?.length) {
		throw new Error(`CleanCSS errors:\n${result.errors.join('\n')}`);
	}
	return result.styles;
}

async function minifyJs(filePath) {
	const input = await fs.readFile(filePath, 'utf8');
	const result = await terserMinify(input, {
		compress: true,
		mangle: true,
		format: { comments: false }
	});
	if (result.error) throw result.error;
	return result.code ?? '';
}

function formatBytes(bytes) {
	const units = ['B', 'KB', 'MB', 'GB'];
	let v = bytes;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i++;
	}
	return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

async function main() {
	const args = new Set(process.argv.slice(2));
	if (args.has('--restore')) {
		await restoreAll();
		return;
	}

	const files = [];
	for (const dir of TARGET_DIRS) {
		const dirFiles = await walkFiles(dir);
		files.push(...dirFiles);
	}

	const targets = files.filter(f => (f.endsWith('.css') || f.endsWith('.js')) && !isMinifiedName(f));
	if (!targets.length) {
		console.log('No CSS/JS files found to minify.');
		return;
	}

	let totalBefore = 0;
	let totalAfter = 0;
	let changed = 0;

	for (const file of targets) {
		const rel = relToRoot(file);
		const stat = await fs.stat(file);
		totalBefore += stat.size;

		try {
			await backupFile(file);

			let out = '';
			if (file.endsWith('.css')) out = await minifyCss(file);
			else out = await minifyJs(file);

			await fs.writeFile(file, out, 'utf8');

			const statAfter = await fs.stat(file);
			totalAfter += statAfter.size;
			changed++;

			// Keep output compact (don’t spam logs)
			if (changed <= 8) {
				console.log(`${rel}: ${formatBytes(stat.size)} -> ${formatBytes(statAfter.size)}`);
			}
		} catch (err) {
			console.error(`Failed to minify ${rel}:`, err?.message || err);
			// Restore this file from backup immediately
			const backupPath = path.join(BACKUP_DIR, rel.replace(/\//g, path.sep));
			if (await exists(backupPath)) {
				await fs.copyFile(backupPath, file);
			}
			throw err;
		}
	}

	// If we only printed a few lines, still show totals.
	console.log(`Minified ${changed} file(s). Total: ${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)} (saved ${formatBytes(Math.max(0, totalBefore - totalAfter))}).`);
	console.log(`Backup stored in ${path.relative(ROOT, BACKUP_DIR).replace(/\\/g, '/')}. Use: npm run restore:assets`);
}

await main();
