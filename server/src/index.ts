import dotenv from 'dotenv';

dotenv.config();

import http from 'node:http';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
	// connect to database
	await connectDB();

	// set port
	app.set('port', PORT);

	// create server
	const server = http.createServer(app);

	// start listening
	server.listen(PORT, () => {
		console.log(`🚀 Server is running on http://localhost:${PORT}`);
	});

	server.on('error', (error: NodeJS.ErrnoException) => {
		console.error('❌ Server error:', error);
		process.exit(1);
	});
};

await start().catch((error) => {
	console.error('❌ Failed to start server:', error);
	process.exit(1);
});
