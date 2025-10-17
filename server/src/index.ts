import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mainRoutes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// App configuration
app.use(express.json());
app.use(cors());

// Auto-load routes with versioning
app.use('/api', mainRoutes);

app.get('/', (req, res) => {
  res.send('Hello, Asia Cust Server!');
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});