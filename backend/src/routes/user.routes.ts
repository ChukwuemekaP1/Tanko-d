import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  stellarParamSchema,
} from "../schemas/user.schema.js";
import { stellarPubKeySchema } from "../schemas/common.schema.js";
import { z } from "zod";

const router = Router();

router.get(
  "/users",
  validate(z.object({ role: z.string().optional() }), "query"),
  userController.getAll,
);

router.get(
  "/users/drivers",
  validate(z.object({ managerPubKey: stellarPubKeySchema }), "query"),
  userController.getDriversWithStats,
);

router.post(
  "/users/register-driver",
  validate(
    z.object({
      name: z.string().min(1).max(100),
      stellarPubKey: stellarPubKeySchema,
    }),
  ),
  userController.registerDriver,
);

router.get(
  "/users/:id",
  validate(userIdParamSchema, "params"),
  userController.getById,
);

router.get(
  "/users/stellar/:publicKey",
  validate(stellarParamSchema, "params"),
  userController.getByStellarPubKey,
);

router.post("/users", validate(createUserSchema), userController.create);

router.put(
  "/users/:id",
  validate(userIdParamSchema, "params"),
  validate(updateUserSchema),
  userController.update,
);

router.delete(
  "/users/:id",
  validate(userIdParamSchema, "params"),
  userController.delete,
);

export default router;
