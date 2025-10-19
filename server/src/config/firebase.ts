import admin from 'firebase-admin';

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

if (!serviceAccountBase64) {
	throw new Error(
		'FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is not defined in environment variables'
	);
}

const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString(
	'ascii'
);

const serviceAccount = JSON.parse(serviceAccountJson);

if (admin.apps.length === 0) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount)
	});

	console.log('✅ Firebase admin initialized');
}

export default admin;
