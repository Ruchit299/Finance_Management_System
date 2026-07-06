import type { Request, Response } from "express";
import messages from "../../helper/constants/messages.ts";
import bcrypt from "bcrypt";
import ResponseBuilder from "../../helper/responce-builder/responseBuilder.ts";
import { validateUserUpdate, validateUserPatch } from "./user.validation.ts";
import { getAllActiveUsers, findUserById } from "./user.util.ts";

// Extend Express Request to include req.user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    isAdmin: boolean;
  };
}

const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const users = await getAllActiveUsers();
    ResponseBuilder.success(res, 200, messages.SUCCESS.USER_RETRIEVED, { users });
  } catch (error) {
    if (error instanceof Error) {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, error.message);
    } else {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, String(error));
    }
  }
};

const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  const { id } = req.params;

  try {
    const user = await findUserById(Number(id));

    if (!user) {
      return ResponseBuilder.error(res, 404, messages.ERROR.USER_NOT_FOUND);
    }

    ResponseBuilder.success(res, 200, messages.SUCCESS.USER_RETRIEVED, { user });
  }  catch (error) {
    if (error instanceof Error) {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, error.message);
    } else {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, String(error));
    }
  }
};

const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  const { id } = req.params;
  const { error } = validateUserUpdate(req.body);

  if (error) {
    return ResponseBuilder.error(
      res,
      400,
      messages.ERROR.VALIDATION_ERROR,
      error.details[0].message
    );
  }

  const { name, email, contact, password } = req.body;

  try {
    const user: any = await findUserById(Number(id));

    if (!user) {
      return ResponseBuilder.error(res, 404, messages.ERROR.USER_NOT_FOUND);
    }

    const updateData: any = {
      name,
      email,
      contact: contact || null,
      updatedBy: req.user?.id,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);
    ResponseBuilder.success(res, 200, messages.SUCCESS.USER_UPDATED, { user });
  }  catch (error) {
    if (error instanceof Error) {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, error.message);
    } else {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, String(error));
    }
  }
};

const patchUser = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  const { id } = req.params;
  const { error } = validateUserPatch(req.body);

  if (error) {
    return ResponseBuilder.error(
      res,
      400,
      messages.ERROR.VALIDATION_ERROR,
      error.details[0].message
    );
  }

  // const { name, email, contact, password } = req.body;
  const { name, email, contact, password, status } = req.body;

  try {
    const user: any = await findUserById(Number(id));

    if (!user) {
      return ResponseBuilder.error(res, 404, messages.ERROR.USER_NOT_FOUND);
    }

    const updateData: any = { updatedBy: req.user?.id };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (contact !== undefined) updateData.contact = contact;
    if (password !== undefined) updateData.password = await bcrypt.hash(password, 10);
    //implemented for the front end
    if (status !== undefined) updateData.status = status;

    await user.update(updateData);
    ResponseBuilder.success(res, 200, messages.SUCCESS.USER_UPDATED, { user });
  }  catch (error) {
    if (error instanceof Error) {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, error.message);
    } else {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, String(error));
    }
  }
};

const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  const { id } = req.params;

  try {
    const user: any = await findUserById(Number(id));

    if (!user) {
      return ResponseBuilder.error(res, 404, messages.ERROR.USER_NOT_FOUND);
    }

    await user.update({
      deleted: 1,
      deletedAt: new Date(),
      deletedBy: req.user?.id,
    });

    ResponseBuilder.success(res, 200, messages.SUCCESS.USER_DELETED);
  }  catch (error) {
    if (error instanceof Error) {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, error.message);
    } else {
      return ResponseBuilder.error(res, 500, messages.ERROR.SERVER_ERROR, String(error));
    }
  }
};

export { getAllUsers, getUserById, updateUser, patchUser, deleteUser };
