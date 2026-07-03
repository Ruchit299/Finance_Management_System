import { Router } from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "./category.controller.ts";
import { verifyToken } from "../../helper/middlewares/auth.middleware.ts";

const router = Router();

router.use(verifyToken);

router.get("/get", getCategories);
router.post("/create", createCategory);
router.put("/update/:id", updateCategory);
router.delete("/delete/:id", deleteCategory);

export default router;
