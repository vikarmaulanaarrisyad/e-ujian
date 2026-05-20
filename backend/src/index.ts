import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Base route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Sistem Pengolahan Nilai Ujian Madrasah (MI) Grade 6 API',
    status: 'healthy',
  });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handling middleware
app.use(errorHandler);

// Start Server
app.listen(env.PORT, () => {
  console.log(`🚀 Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  console.log(`👉 Base URL: http://localhost:${env.PORT}`);
});
