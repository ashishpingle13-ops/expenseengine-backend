import express from "express";
import {
    createLedgerEntry,
    getAllLedgerEntries,
    getLedgerEntryById,
    updateLedgerEntry,
    deleteLedgerEntry,
    getMonthlyLedgerSummary,
    getWorkerLedgerHistory
} from "../controllers/ledgerController.js";

import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();


router.use(protect);

router.get("/monthly-summary", getMonthlyLedgerSummary);
router.get("/worker/:id", getWorkerLedgerHistory);

router.post("/", createLedgerEntry);
router.get("/", getAllLedgerEntries);
router.get("/:id", getLedgerEntryById);
router.put("/:id", updateLedgerEntry);
router.delete("/:id", deleteLedgerEntry);



export default router;
