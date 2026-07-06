import { sequelize } from "../../config/dbConnect.ts";
import { DataTypes, Model } from "sequelize";
import { User } from "../user/user.model.ts";
import { Category } from "../category/category.model.ts";

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type BillReminderAttributes = {
  id: number;
  userId: number;
  name: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  categoryId: number;
  notes: string | null;
  isPaid: number;
  deleted: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type BillReminderCreationAttributes = Optional<
  BillReminderAttributes,
  "id" | "notes" | "isPaid" | "deleted" | "createdAt" | "updatedAt" | "deletedAt"
>;

class BillReminder
  extends Model<BillReminderAttributes, BillReminderCreationAttributes>
  implements BillReminderAttributes
{
  declare id: number;
  declare userId: number;
  declare name: string;
  declare amount: number;
  declare dueDate: string;
  declare categoryId: number;
  declare notes: string | null;
  declare isPaid: number;
  declare deleted: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

BillReminder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      references: { model: User, key: "id" },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "due_date",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "category_id",
      references: { model: Category, key: "id" },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isPaid: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: "is_paid",
    },
    deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "BillReminder",
    tableName: "bill_reminders",
    timestamps: true,
    underscored: true,
  }
);

User.hasMany(BillReminder, { foreignKey: "userId" });
BillReminder.belongsTo(User, { foreignKey: "userId" });
Category.hasMany(BillReminder, { foreignKey: "categoryId" });
BillReminder.belongsTo(Category, { foreignKey: "categoryId" });

export { BillReminder };
export type { BillReminderAttributes };
