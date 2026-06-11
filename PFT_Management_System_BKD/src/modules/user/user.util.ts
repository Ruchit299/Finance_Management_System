import {User, type UserAttributes} from "./user.model.ts";
import bcrypt from "bcrypt";
import type{ FindOptions } from "sequelize";


const defaultUserAttributes: (keyof UserAttributes)[] = [
  "id",
  "name",
  "email",
  "contact",
  "isAdmin",
  "isFirstLogin",
  "status",
  "createdAt",
  "updatedAt",
];

const getAllActiveUsers = async (): Promise<UserAttributes[]> => {
  const options: FindOptions = {
    attributes: defaultUserAttributes,  
    where: { deleted: 0 },
  };

  return await User.findAll(options) as unknown as UserAttributes[];
};

const findUserById = async (id: number): Promise<UserAttributes | null> => {
  const options: FindOptions = {
    attributes: defaultUserAttributes,
    where: { id, deleted: 0 },
  };

  return await User.findOne(options) as unknown as UserAttributes | null;
};

export { getAllActiveUsers, findUserById };
