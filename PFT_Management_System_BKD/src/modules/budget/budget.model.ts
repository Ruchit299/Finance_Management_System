import { sequelize } from "../../config/dbConnect.ts";
import { DataTypes, Model } from "sequelize";
import { User } from "../user/user.model.ts";

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type BudgetAttributes = {
  id: number;
  userId: number;
  category: "Food" | "Transport" | "Rent" | "Shopping" | "Entertainment" | "Salary" | "Investment";
  amount: number;
  month: string; // Format: YYYY-MM
  deleted: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type BudgetCreationAttributes = Optional<BudgetAttributes,
  "id" | "deleted" | "createdAt" | "updatedAt" | "deletedAt">;

class Budget extends Model<BudgetAttributes, BudgetCreationAttributes> implements BudgetAttributes {
  declare id: number;
  declare userId: number;
  declare category: "Food" | "Transport" | "Rent" | "Shopping" | "Entertainment" | "Salary" | "Investment";
  declare amount: number;
  declare month: string;
  declare deleted: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

Budget.init(
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
    category: {
      type: DataTypes.ENUM("Food", "Transport", "Rent", "Shopping", "Entertainment", "Salary", "Investment"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    month: {
      type: DataTypes.STRING(7), // E.g., "2026-06"
      allowNull: false,
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
    modelName: "Budget",
    tableName: "budgets",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "category", "month", "deleted"],
      },
    ],
  }
);

// Associations
User.hasMany(Budget, { foreignKey: "userId" });
Budget.belongsTo(User, { foreignKey: "userId" });

export { Budget };
export type { BudgetAttributes };
