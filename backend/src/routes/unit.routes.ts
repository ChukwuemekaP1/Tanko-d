import { Router } from "express";
import { unitController } from "../controllers/unit.controller.js";
import { validate } from "../middleware/validate.js";
import {
  unitIdParamSchema,
  userIdParamSchema,
  unitQuerySchema,
  createUnitSchema,
  updateUnitSchema,
} from "../schemas/unit.schema.js";

const router = Router();

router.get("/units", validate(unitQuerySchema, "query"), unitController.getAll);

router.get(
  "/units/:id",
  validate(unitIdParamSchema, "params"),
  unitController.getById,
);
router.get(
  "/units/user/:userId",
  validate(userIdParamSchema, "params"),
  unitController.getByUserId,
);

router.post("/units", validate(createUnitSchema), unitController.create);

router.put(
  "/units/:id",
  validate(unitIdParamSchema, "params"),
  validate(updateUnitSchema),
  unitController.update,
);

router.delete(
  "/units/:id",
  validate(unitIdParamSchema, "params"),
  unitController.delete,
);

export default router;
