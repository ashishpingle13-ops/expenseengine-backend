import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import workerRoutes from "../src/routes/workerRoutes.js";
import ledgerRoutes from "../src/routes/ledgerRoutes.js";
import attendanceRoutes from "../src/routes/attendanceRoutes.js";
import userRoutes from "../src/routes/userRoutes.js";
import reportRoutes from '../src/routes/reportRoutes.js';

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Database connection cache for serverless environments
let cachedDb = null;
async function connectDB() {
    if (cachedDb && mongoose.connection.readyState === 1) return;
    cachedDb = await mongoose.connect(process.env.MONGODB_URI);
}

// Middleware to ensure DB is connected on every request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ message: "Database connection failed" });
    }
});

app.use("/api/workers", workerRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

export default app;