import { Router } from "express";
import { verifyToken } from "../../helper/middlewares/auth.middleware.ts";
import {
  createBillReminder,
  getBillReminders,
  updateBillReminder,
  markBillAsPaid,
  deleteBillReminder,
} from "./bill-reminders.controller.ts";

const router = Router();

router.use(verifyToken);

router.post("/", createBillReminder);
router.get("/", getBillReminders);
router.put("/:id", updateBillReminder);
router.patch("/:id/toggle-paid", markBillAsPaid);
router.delete("/:id", deleteBillReminder);

export default router;
