import type { NextFunction, Request, Response } from 'express';
import createHttpError, { type HttpError } from 'http-errors';
import z from 'zod';

export const notFoundHandler = (
	_req: Request,
	_res: Response,
	next: NextFunction
) => {
	next(createHttpError(404));
};

export const errorsHandler = (
	err: HttpError,
	_req: Request,
	res: Response,
	_next: NextFunction
) => {
	// handle zod error
	if (err instanceof z.ZodError) {
		return res.status(400).json({
			error: {
				message: 'Validasi gagal',
				details: err.issues.map((e) => ({
					path: e.path.join('.'),
					message: e.message
				}))
			}
		});
	}

	// handle http-errors with details
	if (err.status === 400 && err.details) {
		return res.status(400).json({
			error: {
				message: err.message,
				details: err.details
			}
		});
	}

	// handle other errors
	res.status(err.status || 500);
	res.json({
		error: {
			message: err.message
		}
	});
};
