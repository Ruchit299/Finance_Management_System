import { sequelize } from "../../config/dbConnect.ts";
import { DataTypes, Model } from "sequelize";
import { User } from "../user/user.model.ts";
import { Category } from "../category/category.model.ts";

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type BudgetAttributes = {
  id: number;
  userId: number;
  categoryId: number;
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
  declare categoryId: number;
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
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "category_id",
      references: {
        model: Category,
        key: "id",
      },
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
        fields: ["user_id", "category_id", "month", "deleted"],
      },
    ],
  }
);

// Associations
User.hasMany(Budget, { foreignKey: "userId" });
Budget.belongsTo(User, { foreignKey: "userId" });
Category.hasMany(Budget, { foreignKey: "categoryId" });
Budget.belongsTo(Category, { foreignKey: "categoryId" });

export { Budget };
export type { BudgetAttributes };
