import cors from 'cors';
import express, { type Request, type Response } from 'express';
import createHttpError, { type HttpError } from 'http-errors';
import mainRoutes from './routes/index.js';

const app = express();

// app config
app.use(express.json());
app.use(cors());

// auto load routes
app.use('/api', mainRoutes);

app.get('/', (_req, res) => {
	res.send('Hello, Asia Cust Server!');
});

// catch 404
app.use((_req, _res, next) => {
	next(createHttpError(404));
});

// global error handler
app.use((err: HttpError, _req: Request, res: Response) => {
	res.status(err.status || 500);
	res.json({
		error: {
			message: err.message
		}
	});
});

export default app;
