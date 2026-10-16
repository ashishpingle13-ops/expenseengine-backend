import express from "express";
import { getAttendanceByDate, saveAttendance } from "../controllers/attendanceController.js";
import { protect } from "../../middleware/authMiddleware.js";


const router = express.Router();

router.use(protect);

router.get("/:id", getAttendanceByDate);
router.post("/", saveAttendance);

export default router;