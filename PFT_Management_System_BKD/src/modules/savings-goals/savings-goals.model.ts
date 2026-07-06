import { sequelize } from "../../config/dbConnect.ts";
import { DataTypes, Model } from "sequelize";
import { User } from "../user/user.model.ts";

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type SavingsGoalAttributes = {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  targetAmount: number;
  savedAmount: number;
  targetDate: string; // YYYY-MM-DD
  deleted: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type SavingsGoalCreationAttributes = Optional<
  SavingsGoalAttributes,
  "id" | "savedAmount" | "description" | "deleted" | "createdAt" | "updatedAt" | "deletedAt"
>;

class SavingsGoal
  extends Model<SavingsGoalAttributes, SavingsGoalCreationAttributes>
  implements SavingsGoalAttributes
{
  declare id: number;
  declare userId: number;
  declare name: string;
  declare description: string | null;
  declare targetAmount: number;
  declare savedAmount: number;
  declare targetDate: string;
  declare deleted: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

SavingsGoal.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    targetAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "target_amount",
    },
    savedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "saved_amount",
    },
    targetDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "target_date",
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
    modelName: "SavingsGoal",
    tableName: "savings_goals",
    timestamps: true,
    underscored: true,
  }
);

// Associations
User.hasMany(SavingsGoal, { foreignKey: "userId" });
SavingsGoal.belongsTo(User, { foreignKey: "userId" });

export { SavingsGoal };
export type { SavingsGoalAttributes };
