import { sequelize } from "../../config/dbConnect.ts";
import { DataTypes, Model } from "sequelize";
import { User } from "../user/user.model.ts";
import { Category } from "../category/category.model.ts";

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type InvestmentAttributes = {
  id: number;
  userId: number;
  name: string;
  amount: number;
  targetAmount: number;
  categoryId: number;
  paymentMethod: "Cash" | "UPI" | "Online";
  startDate: string;
  maturityDate: string;
  notes: string | null;
  status: "Active" | "Matured" | "Completed";
  deleted: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type InvestmentCreationAttributes = Optional<
  InvestmentAttributes,
  "id" | "notes" | "status" | "deleted" | "createdAt" | "updatedAt" | "deletedAt" | "paymentMethod"
>;

class Investment extends Model<InvestmentAttributes, InvestmentCreationAttributes> implements InvestmentAttributes {
  declare id: number;
  declare userId: number;
  declare name: string;
  declare amount: number;
  declare targetAmount: number;
  declare categoryId: number;
  declare paymentMethod: "Cash" | "UPI" | "Online";
  declare startDate: string;
  declare maturityDate: string;
  declare notes: string | null;
  declare status: "Active" | "Matured" | "Completed";
  declare deleted: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

Investment.init(
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
    targetAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "target_amount",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "category_id",
      references: { model: Category, key: "id" },
    },
    paymentMethod: {
      type: DataTypes.ENUM("Cash", "UPI", "Online"),
      allowNull: false,
      defaultValue: "Cash",
      field: "payment_method",
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "start_date",
    },
    maturityDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "maturity_date",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Active", "Matured", "Completed"),
      allowNull: false,
      defaultValue: "Active",
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
    modelName: "Investment",
    tableName: "investments",
    timestamps: true,
    underscored: true,
  }
);

User.hasMany(Investment, { foreignKey: "userId" });
Investment.belongsTo(User, { foreignKey: "userId" });
Category.hasMany(Investment, { foreignKey: "categoryId" });
Investment.belongsTo(Category, { foreignKey: "categoryId" });

export { Investment };
export type { InvestmentAttributes };
