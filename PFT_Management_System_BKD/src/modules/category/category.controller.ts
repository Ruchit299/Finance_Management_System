import { Request, Response } from "express";
import { Category } from "./category.model.ts";
import { Op } from "sequelize";
import ResponseBuilder from "../../helper/responce-builder/responseBuilder.ts";

export const getCategories = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return ResponseBuilder.error(res, 401, "User is not authenticated");
    }

    const type = req.query.type ? String(req.query.type) : "transaction";
    if (type !== "transaction" && type !== "investment") {
      return ResponseBuilder.error(res, 400, "Validation error", "Invalid category type");
    }

    const categories = await Category.findAll({
      where: {
        deleted: 0,
        type,
        [Op.or]: [
          { userId: null },
          { userId: userId }
        ]
      },
      order: [
        ['userId', 'ASC'], // Default categories first (null)
        ['name', 'ASC']
      ]
    });

    return ResponseBuilder.success(res, 200, "Categories fetched successfully", { result: categories });
  } catch (error: any) {
    return ResponseBuilder.error(res, 500, "Server error", error.message || String(error));
  }
};

export const createCategory = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { name, type } = req.body;
    const userId = req.user?.id;

    if (!name || name.trim() === '') {
      return ResponseBuilder.error(res, 400, "Validation error", "Category name is required");
    }

    const categoryType = type || "transaction";
    if (categoryType !== "transaction" && categoryType !== "investment") {
      return ResponseBuilder.error(res, 400, "Validation error", "Invalid category type");
    }

    if (!userId) {
      return ResponseBuilder.error(res, 401, "User is not authenticated");
    }

    const existing = await Category.findOne({
      where: {
        name: name.trim(),
        type: categoryType,
        deleted: 0,
        [Op.or]: [
          { userId: null },
          { userId: userId }
        ]
      }
    });

    if (existing) {
      return ResponseBuilder.error(res, 400, "Validation error", "Category already exists");
    }

    const newCategory = await Category.create({
      name: name.trim(),
      type: categoryType,
      userId
    });

    return ResponseBuilder.success(res, 201, "Category created successfully", newCategory);
  } catch (error: any) {
    return ResponseBuilder.error(res, 500, "Server error", error.message || String(error));
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const categoryId = Number(req.params.id);
    const { name } = req.body;
    const userId = req.user?.id;

    if (isNaN(categoryId)) {
      return ResponseBuilder.error(res, 400, "Validation error", "Invalid category ID");
    }

    if (!name || name.trim() === '') {
      return ResponseBuilder.error(res, 400, "Validation error", "Category name is required");
    }

    if (!userId) {
      return ResponseBuilder.error(res, 401, "User is not authenticated");
    }

    const category = await Category.findOne({
      where: { id: categoryId, userId, deleted: 0 }
    });

    if (!category) {
      return ResponseBuilder.error(res, 404, "Category not found or you don't have permission to edit it");
    }

    const existing = await Category.findOne({
      where: {
        name: name.trim(),
        type: category.type,
        deleted: 0,
        id: { [Op.ne]: categoryId },
        [Op.or]: [{ userId: null }, { userId }]
      }
    });

    if (existing) {
      return ResponseBuilder.error(res, 400, "Validation error", "Category already exists");
    }

    await category.update({ name: name.trim() });
    return ResponseBuilder.success(res, 200, "Category updated successfully", category);
  } catch (error: any) {
    return ResponseBuilder.error(res, 500, "Server error", error.message || String(error));
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const categoryId = Number(req.params.id);
    const userId = req.user?.id;

    if (isNaN(categoryId)) {
      return ResponseBuilder.error(res, 400, "Validation error", "Invalid category ID");
    }

    if (!userId) {
      return ResponseBuilder.error(res, 401, "User is not authenticated");
    }

    const category = await Category.findOne({
      where: { id: categoryId, userId, deleted: 0 }
    });

    if (!category) {
      return ResponseBuilder.error(res, 404, "Category not found or you don't have permission to delete it");
    }

    await category.update({ deleted: 1, deletedAt: new Date() });
    return ResponseBuilder.success(res, 200, "Category deleted successfully");
  } catch (error: any) {
    return ResponseBuilder.error(res, 500, "Server error", error.message || String(error));
  }
};
