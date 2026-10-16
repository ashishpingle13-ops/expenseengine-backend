import express from "express";
import { getMonthlySummary } from "../controllers/reportsController.js";
import {protect} from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/monthly-summary', protect, getMonthlySummary);

export default router;
