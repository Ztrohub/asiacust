import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';

const mainRoutes = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileExtension = process.env.NODE_ENV === 'production' ? 'js' : 'ts';

fs.readdirSync(__dirname, { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.forEach(async (dirent) => {
		const version = dirent.name; // e.g., 'v1', 'v2', etc.
		const versionPath = path.join(__dirname, version, `index.${fileExtension}`);
		if (fs.existsSync(versionPath)) {
			const moduleURL = pathToFileURL(versionPath).href;
			const module = await import(moduleURL);
			mainRoutes.use(`/${version}`, module.default);
			console.log(`✅ Loaded routes for version: ${version}`);
		}
	});

export default mainRoutes;
