// 1. Import all your installed packages
import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import workerRoutes from "./src/routes/workerRoutes.js";
import ledgerRoutes from "./src/routes/ledgerRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import reportRoutes from './src/routes/reportRoutes.js';

// 2. Initialize the Express application
const app = express();

// 3. Set up Middleware (This allows your app to receive JSON data and talk to your future frontend)
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use("/api/workers", workerRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

// 4. Connect to MongoDB using your secret URI
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("🔥 MongoDB Connected Successfully to ExpenseEngine!");
})
// Lesson no 1 :- In JavaScript, a semicolon acts like a period at the end of a sentence. It tells the computer, "I am completely done with this thought."
.catch((error) => {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
});

// 5. Define the Port and start listening
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});





