import express from "express";
import { 
    createWorker,
    getAllWorkers,
    getWorkerById,
    updateWorker,
    deleteWorker
 } from "../controllers/workerController.js";

 import { protect } from "../../middleware/authMiddleware.js";


const router = express.Router();

router.use(protect);

router.post("/", createWorker);
router.get("/", getAllWorkers);
router.get("/:id", getWorkerById);
router.put("/:id", updateWorker);
router.delete("/:id", deleteWorker);


export default router;