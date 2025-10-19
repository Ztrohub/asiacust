import admin from 'firebase-admin';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountJson) {
	throw new Error(
		'FIREBASE_SERVICE_ACCOUNT_KEY is not defined in environment variables'
	);
}

const serviceAccount = JSON.parse(serviceAccountJson);

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});

export default admin;
