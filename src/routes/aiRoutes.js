import express from "express";
import { askLedgerAgent } from "../controllers/aiController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();
router.post("/ask", protect, askLedgerAgent);
export default router;