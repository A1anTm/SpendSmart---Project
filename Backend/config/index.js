import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';

import userRoutes from '../routes/userRoutes.js';
import transactionRoutes from '../routes/transactionsRoutes.js';
import budgetRoutes from '../routes/budgetsRoutes.js';
import savingsGoalRoutes from '../routes/savingsGoalsRoutes.js';
import summaryRoutes from '../routes/summaryRoutes.js';
import categoryRoutes from '../routes/categoryRoutes.js';

import { seedCategories } from '../scripts/seedCategories.js'; 

config({ path: './Config/.env' });

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(cookieParser());

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

  // CORS: permitir el origen del cliente, credenciales y headers custom
    app.use(
    cors({
        origin: allowedOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-skip-token-modal', 'Accept', 'X-Requested-With'],
    })
);

    app.options('*', cors({
    origin: allowedOrigin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-skip-token-modal', 'Accept', 'X-Requested-With'],
    }));

    app.use('/api/users', userRoutes);
    app.use('/api/transactions', transactionRoutes);
    app.use('/api/budgets', budgetRoutes);
    app.use('/api/summary', summaryRoutes);
    app.use('/api/savings', savingsGoalRoutes);
    app.use('/api/categories', categoryRoutes);

    async function start() {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        });
        console.log('✅ Conectado a MongoDB');


        if (process.env.ENABLE_SEED === 'true') {
        console.log('🔁 ENABLE_SEED=true -> ejecutando seed de categorías (upsert forzado)');
        await seedCategories({ onlyIfEmpty: false });
        } else {
        console.log('🔎 Verificando si es necesario seedear categorías (soloIfEmpty: true)');
        await seedCategories({ onlyIfEmpty: true });
        }

        app.listen(port, () => console.log(`🚀 Servidor corriendo en el puerto ${port}`));
        console.log(`🌐 CORS habilitado para: ${allowedOrigin}`);
    } catch (err) {
        console.error('❌ Error arrancando la app:', err);
        process.exit(1);
    }
    }

    start();

    export default app;
