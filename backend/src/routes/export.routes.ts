import { Router } from "express";
import { handleAccessExport } from "../controllers/export.controller.js";

const router = Router();

router.get("/exports/access", handleAccessExport);

export default router;
