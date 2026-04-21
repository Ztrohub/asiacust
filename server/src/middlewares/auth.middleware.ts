import type { USER_ROLE } from '@shared/types/user.js';
import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import admin from 'src/config/firebase.js';

export interface IFirebaseUser {
	uid: string;
	displayName: string;
	role: USER_ROLE;
}

declare global {
	namespace Express {
		export interface Request {
			user?: IFirebaseUser;
		}
	}
}

export const authMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const token = req.headers.authorization?.split('Bearer ')[1];

		if (!token) {
			return next(createHttpError(401, 'Authorization token required'));
		}

		const decodedToken = await admin.auth().verifyIdToken(token);

		if (!decodedToken || !decodedToken.uid) {
			return next(createHttpError(401, 'Invalid token'));
		}

		const userRole = decodedToken.role as USER_ROLE;

		if (!userRole) {
			return next(createHttpError(403, 'User role not found'));
		}

		req.user = {
			uid: decodedToken.uid,
			displayName: decodedToken.displayName,
			role: userRole
		};
		next();
	} catch (error: any) {
		if (error.code === 'auth/id-token-expired') {
			return next(createHttpError(401, 'Token expired'));
		}
		console.error('Auth Error:', error);
		return next(createHttpError(401, 'Invalid token'));
	}
};
