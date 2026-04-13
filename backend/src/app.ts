import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

import homeInsuranceRoutes from './routes/homeInsurance.routes';

// Main entry
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/insurance/home', homeInsuranceRoutes);

// Basic Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

export default app;
