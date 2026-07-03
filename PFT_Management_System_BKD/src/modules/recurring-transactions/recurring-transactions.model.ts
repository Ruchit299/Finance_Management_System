import { sequelize } from "../../config/dbConnect.ts";
import { DataTypes, Model } from "sequelize";
import { User } from "../user/user.model.ts";
import { Category } from "../category/category.model.ts";

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type RecurringTransactionAttributes = {
  id: number;
  userId: number;
  amount: number;
  type: "income" | "expense";
  categoryId: number;
  paymentMethod: "Cash" | "UPI" | "Online";
  frequency: "Daily" | "Weekly" | "Monthly" | "Yearly";
  startDate: string;
  nextDueDate: string;
  notes: string | null;
  isActive: number;
  deleted: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type RecurringTransactionCreationAttributes = Optional<
  RecurringTransactionAttributes,
  "id" | "notes" | "isActive" | "deleted" | "createdAt" | "updatedAt" | "deletedAt" | "paymentMethod"
>;

class RecurringTransaction
  extends Model<RecurringTransactionAttributes, RecurringTransactionCreationAttributes>
  implements RecurringTransactionAttributes
{
  declare id: number;
  declare userId: number;
  declare amount: number;
  declare type: "income" | "expense";
  declare categoryId: number;
  declare paymentMethod: "Cash" | "UPI" | "Online";
  declare frequency: "Daily" | "Weekly" | "Monthly" | "Yearly";
  declare startDate: string;
  declare nextDueDate: string;
  declare notes: string | null;
  declare isActive: number;
  declare deleted: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

RecurringTransaction.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM("Cash", "UPI", "Online"),
      allowNull: false,
      defaultValue: "Cash",
      field: "payment_method",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "category_id",
      references: { model: Category, key: "id" },
    },
    frequency: {
      type: DataTypes.ENUM("Daily", "Weekly", "Monthly", "Yearly"),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "start_date",
    },
    nextDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "next_due_date",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      field: "is_active",
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
    modelName: "RecurringTransaction",
    tableName: "recurring_transactions",
    timestamps: true,
    underscored: true,
  }
);

User.hasMany(RecurringTransaction, { foreignKey: "userId" });
RecurringTransaction.belongsTo(User, { foreignKey: "userId" });
Category.hasMany(RecurringTransaction, { foreignKey: "categoryId" });
RecurringTransaction.belongsTo(Category, { foreignKey: "categoryId" });

export { RecurringTransaction };
export type { RecurringTransactionAttributes };
