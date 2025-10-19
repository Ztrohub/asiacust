import cors from 'cors';
import express from 'express';
import { errorsHandler, notFoundHandler } from './handlers/errors.handler.js';
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
app.use(notFoundHandler);

// global error handler
app.use(errorsHandler);

export default app;
