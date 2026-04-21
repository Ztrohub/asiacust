import { USER_ROLE } from '@shared/types/user.js';
import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

export const teknisiMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (req.user && req.user.role === USER_ROLE.TEKNISI) {
		next();
	} else {
		next(createHttpError(403, 'Forbidden'));
	}
};
