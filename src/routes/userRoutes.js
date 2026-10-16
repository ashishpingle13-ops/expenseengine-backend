import express from "express";
import { getUserProfile, syncUser, updateUserProfile } from "../controllers/userController.js";
import { protect } from "../../middleware/authMiddleware.js";


const router = express.Router();

router.post("/sync", protect , syncUser);
router.put("/profile", protect, updateUserProfile);
router.get("/profile", protect, getUserProfile);
export default router;