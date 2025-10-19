import type { NextFunction, Request, Response } from 'express';
import type z from 'zod';

export const validateZod =
	(schema: z.ZodSchema) =>
	(req: Request, _res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.body);

		if (!result.success) {
			return next(result.error);
		}

		req.body = result.data;
		next();
	};
