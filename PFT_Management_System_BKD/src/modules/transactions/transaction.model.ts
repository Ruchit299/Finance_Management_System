import { sequelize } from "../../config/dbConnect.ts";
import { DataTypes, Model } from "sequelize";
import { User } from "../user/user.model.ts";
import { Category } from "../category/category.model.ts";

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type TransactionAttributes = {
  id: number;
  userId: number;
  amount: number;
  type: "income" | "expense";
  categoryId: number;
  paymentMethod: "Cash" | "UPI" | "Online";
  recurringTransactionId: number | null;
  investmentId: number | null;
  date: Date;
  notes: string | null;
  deleted: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type TransactionCreationAttributes = Optional<TransactionAttributes,
  "id" | "deleted" | "createdAt" | "updatedAt" | "deletedAt" | "notes" | "recurringTransactionId" | "paymentMethod" | "investmentId">;

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  declare id: number;
  declare userId: number;
  declare amount: number;
  declare type: "income" | "expense";
  declare categoryId: number;
  declare paymentMethod: "Cash" | "UPI" | "Online";
  declare recurringTransactionId: number | null;
  declare investmentId: number | null;
  declare date: Date;
  declare notes: string | null;
  declare deleted: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

Transaction.init(
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
      references: {
        model: User,
        key: "id",
      },
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
      references: {
        model: Category,
        key: "id",
      },
    },
    recurringTransactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "recurring_transaction_id",
    },
    investmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "investment_id",
      references: {
        model: "investments",
        key: "id"
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    modelName: "Transaction",
    tableName: "transactions",
    timestamps: true,
    underscored: true,
  }
);

// Associations
User.hasMany(Transaction, { foreignKey: "userId" });
Transaction.belongsTo(User, { foreignKey: "userId" });
Category.hasMany(Transaction, { foreignKey: "categoryId" });
Transaction.belongsTo(Category, { foreignKey: "categoryId" });

export { Transaction };
export type { TransactionAttributes };
